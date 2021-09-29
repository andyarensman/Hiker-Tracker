const express = require('express');
const router = express.Router();
const { ensureAuthenticated } = require('../config/auth');
const template = require('../public/template.js');
var csv = require('fast-csv');
var mongoose = require('mongoose');
const imgur = require('imgur');

const hikeSchemas = require('../models/hikeSchemas');
const HikeSession = hikeSchemas.HikeSession;
const Hiker = hikeSchemas.Hiker;

//////////////////////////////////////////////

//Multer
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Set The Storage Engine
const storage = multer.diskStorage({
  destination: './public/uploads/',
  filename: function(req, file, cb){
    cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
  }
});

// Init Upload Multer
const upload = multer({
  storage: storage,
  limits:{fileSize: 20000000},
  fileFilter: function(req, file, cb){
    checkFileType(file, cb);
  }
}).single('myImage');

// Check File Type  ///////////////May need to change this for the bulk upload
function checkFileType(file, cb){
  // Allowed ext
  const filetypes = /jpeg|jpg|png|gif|csv/;
  // Check ext
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  // Check mime
  const mimetype = filetypes.test(file.mimetype);

  if(mimetype && extname){
    return cb(null,true);
  } else {
    cb('Error: Incorrect File Type!'); ///////////May need to change this
  }
}

const uploadCSV = multer({ dest: 'tmp/csv/' });
//////////////////////////////////////////////

//imgur setup
const clientId = process.env.CLIENT_ID;
imgur.setClientId(clientId);
imgur.setAPIUrl('https://api.imgur.com/3/');

//Welcome Page
router.get('/', (req, res) => {
  const email = 'andrew.arensman@gmail.com'

  Hiker.findOne({ email: email })
  .then(result => {
    //duplicating the logs to avoid the error with _id
    var hikesArray = result.log;
    var newHikesArray = []

    hikesArray.forEach(hikeObj => {
      var hike = (({ hike_name, hike_date, mileage, time, elevation_gain, min_elevation, max_elevation, average_pace, average_bpm, max_bpm, city, location, notes }) => ({ hike_name, hike_date, mileage, time, elevation_gain, min_elevation, max_elevation, average_pace, average_bpm, max_bpm, city, location, notes }))(hikeObj);

      var idStr = hikeObj._id.toString()
      hike.id = idStr;

      newHikesArray.push(hike)
    })

    // Adding Date and Fixing Format of hike_date
    newHikesArray.forEach(i => {
      var newDate = new Date(i.hike_date.replace(/-/g, '\/'))
      i['real_date'] = newDate;
      i['hike_date'] = newDate.toLocaleDateString('en-US');  //Converts to MM/DD/YYYY
    })

    // Sorting Hikes by date
    newHikesArray.sort((a, b) => a.real_date - b.real_date)

    var userId = result._id.toString()

    res.render('welcome', { data: newHikesArray, username: 'Andy', user_id: userId, title: 'Welcome', isExample: 'Yes', new_user: 'No' })
  })
  .catch(err => {
    console.log(err);
    res.status(404).render('404');
  })
})

//dashboard
router.get('/dashboard', ensureAuthenticated, (req, res) => {

  const id = req.user._id

  Hiker.findById(id)
  .then(result => {
    //duplicating the logs to avoid the error with _id
    var hikesArray = result.log;
    var newHikesArray = []

    hikesArray.forEach(hikeObj => {
      var hike = (({ hike_name, hike_date, mileage, time, elevation_gain, min_elevation, max_elevation, average_pace, average_bpm, max_bpm, city, location, notes }) => ({ hike_name, hike_date, mileage, time, elevation_gain, min_elevation, max_elevation, average_pace, average_bpm, max_bpm, city, location, notes }))(hikeObj);

      var idStr = hikeObj._id.toString()
      hike.id = idStr;

      newHikesArray.push(hike)
    })

    // Adding Date and Fixing Format of hike_date
    newHikesArray.forEach(i => {
      var newDate = new Date(i.hike_date.replace(/-/g, '\/'))
      i['real_date'] = newDate;
      i['hike_date'] = newDate.toLocaleDateString('en-US');  //Converts to MM/DD/YYYY
    })

    // Sorting Hikes by date
    newHikesArray.sort((a, b) => a.real_date - b.real_date)

    var userId = result._id.toString()

    var newUser = "No"
    if (newHikesArray.length == 0) {
      newUser = "Yes"
    }

    res.render('dashboard', { data: newHikesArray, username: result.name_first, user_id: userId, title: 'Home', isExample: 'No', new_user: newUser })
  })
  .catch(err => {
    console.log(err);
    res.status(404).render('404');
  })

})

//Add new Hike
router.post('/dashboard', ensureAuthenticated, (req, res) => {
  const id = req.user._id;

  var newHike = new HikeSession({
    hike_name: req.body.hike_name,
    hike_date: req.body.hike_date,
    mileage: parseFloat(req.body.mileage),
    time: req.body.time,
    elevation_gain: parseInt(req.body.elevation_gain),
    min_elevation: parseInt(req.body.min_elevation) || '',
    max_elevation: parseInt(req.body.max_elevation) || '',
    average_pace: req.body.average_pace || '',
    average_bpm: parseInt(req.body.average_bpm) || '',
    max_bpm: parseInt(req.body.max_bpm) || '',
    city: req.body.city,
    location: req.body.location,
    notes: req.body.notes || '',
    image_url: ''
  })

  Hiker.findByIdAndUpdate(
    id,
    {$push : {log: newHike}},
    {new: true},
    (error, updatedUser) => {
      if(!error) {
        req.flash('dashboard_success_msg', 'New Hike Added!');
        res.redirect('/dashboard')
      }
    }
  )
})

//Get CSV template
router.get('/template', template.get);

//Bulk Upload Page render
router.get('/dashboard/bulk_add', ensureAuthenticated, (req, res) => {

  res.render('bulkUpload', { title: 'Bulk Upload' })
})


//Add multiple Hikes
router.post('/dashboard/bulk_add', ensureAuthenticated, uploadCSV.single('myCSV'), (req, res) => {
  const id = req.user._id;

  console.log(req.file)

  //delete file locally
  const deleteFile = () => {
    fs.unlink(`./tmp/csv/${req.file.filename}`, (err) => {
      if (err) {
        console.error(err)
        return
      }
      console.log('file deleted')
      })
  }

  if (!req.file) {
    req.flash('error_msg', 'No File Selected');
    res.redirect('/dashboard/bulk_add');
  } else if (/(\.csv)$/.test(req.file.originalname) != true) {
    deleteFile();
    req.flash('error_msg', 'File name must end in .csv');
    res.redirect('/dashboard/bulk_add');
  } else {
    var hikesFile = `./tmp/csv/${req.file.filename}`;
    var updateObjectArray = [];

    csv.fromPath(hikesFile, {
        headers: true,
        ignoreEmpty: true
      })
      .on('data', (data) => {
        data['_id'] = new mongoose.Types.ObjectId();
        updateObjectArray.push(data);

      })
      .on('end', () => {

        var date_regex = /^(0[1-9]|1[0-2]|[1-9])\/(0[1-9]|1\d|2\d|3[01]|[1-9])\/\d{2}$/

        if (date_regex.test(updateObjectArray[0].hike_date) === true) {
          updateObjectArray.forEach((e, i) => {

            var dateArray = e.hike_date.split('/');
            var mm = dateArray[0];
            var dd = dateArray[1];
            var yyyy = '20' + dateArray[2];

            if (mm.length == 1) {
              mm = '0' + mm;
            }
            if (dd.length == 1) {
              dd = '0' + dd;
            }

            var newDateFormat = yyyy + '-' + mm + '-' + dd;

            updateObjectArray[i].hike_date = newDateFormat;
          })
        }

        Hiker.findByIdAndUpdate(
          id,
          {$push : {log: { $each: updateObjectArray } } },
          {new: true},
          (error, updatedUser) => {
            if(!error) {
              req.flash('dashboard_success_msg', 'Multiple Hikes Successfully Added!');
              res.redirect('/dashboard')
            }
          }
        )
      })
    deleteFile();
  }
})

// Get Hike Details
router.get('/dashboard/hike_details/:hike', ensureAuthenticated, (req, res) => {
  var hikeId = req.params.hike;
  var hikeObject = req.user.log.find(obj => {
    return obj._id == hikeId
  });

  // console.log(hikeObject.toJSON())



  //getting rid of _id
  var hike = (({ hike_name, hike_date, mileage, time, elevation_gain, min_elevation, max_elevation, average_pace, average_bpm, max_bpm, city, location, notes, image_url }) => ({ hike_name, hike_date, mileage, time, elevation_gain, min_elevation, max_elevation, average_pace, average_bpm, max_bpm, city, location, notes, image_url }))(hikeObject.toJSON());

  var newDate = new Date(hike.hike_date.replace(/-/g, '\/'))
  hike['real_date'] = newDate;
  hike['hike_date'] = newDate.toLocaleDateString('en-US');  //Converts to MM/DD/YYYY

  console.log(hike)
  //Checking if there's an image || Object.keys(hikeObject.image_url
  var image_link = '';
  var image_orientation = "class=\"orientation_none\"";
  if (hike.image_url != undefined) {
    console.log('is in')
    if (Object.keys(hike.image_url).length != 0) {
      image_link = 'src=' + hike.image_url.link;
      if (hike.image_url.width > hike.image_url.height){
        console.log('image is in landscape');
        image_orientation = "class=\"landscape\"";
      } else {
        console.log('image is in portrait');
        image_orientation = "class=\"portrait\"";
      }
    }
  }
  console.log(image_link)

  res.render('hikeDetails', { title: 'Hike Details', hikeObject: hike, hikeId: hikeId, image_link: image_link, image_orientation: image_orientation })
})

//POST Imgur
router.post('/dashboard/hike_details/:hike', async (req, res) => {
  var hikeId = req.params.hike;
  const id = req.user._id;

  upload(req, res, (err) => {
    if (err) {
      console.log(err)  //CHANGE TO FLASH
    } else {
      if (req.file == undefined) {
        console.log('Error: No File Selected') //CHANGE TO FLASH
      } else {
        console.log('File Uploading') //CHANGE TO FLASH

        //Upload to imgur (file path is `uploads/${req.file.filename}`)
        imgur
          .uploadFile(`./public/uploads/${req.file.filename}`)
          .then((json) => {
            console.log(json);

            //Add image link to mongodb
            Hiker.updateOne(
              { _id: id, 'log._id': hikeId },
              { $set: { 'log.$.image_url': json } },
              (err, doc) => {
                if (err) {
                  console.log(err)
                } else {
                  req.flash('success_msg', 'Successfully Added Image');
                  res.redirect('/dashboard/hike_details/' + hikeId);
                }
                //Delete file locally
                fs.unlink(`./public/uploads/${req.file.filename}`, (err) => {
                  if (err) {
                    console.error(err)
                    return
                  }
                  console.log('file deleted')
                })
              }
            )

          })
          .catch((err) => {
            console.error(err.message);
          });
      }
    }
  });
})

// GET render edit page
router.get('/dashboard/:hike', ensureAuthenticated, (req, res) => {
  const id = req.user._id;
  var hikeId = req.params.hike;

  Hiker.findById(id)
  .then(hiker => {
    const hikeData = hiker.log.id(hikeId)
    var hike = (({ hike_name, hike_date, mileage, time, elevation_gain, min_elevation, max_elevation, average_pace, average_bpm, max_bpm, city, location, notes }) => ({ hike_name, hike_date, mileage, time, elevation_gain, min_elevation, max_elevation, average_pace, average_bpm, max_bpm, city, location, notes }))(hikeData);

    var idStr = hikeData._id.toString()

    hike.id = idStr;

    //Converts to MM/DD/YYYY
    var newDate = new Date(hike.hike_date.replace(/-/g, '\/'))
    hike['hike_date'] = newDate.toLocaleDateString('en-US');


    res.render('editHike', { data: hike, user_id: id, hikeId: hikeId, title: 'Edit' })
  })
  .catch(err => {
    console.log(err);
    res.status(404).render('404');
  })

})

// PUT edit the corresponding hike - need user ID and hike ID
router.put('/dashboard/:hike', ensureAuthenticated, (req, res) => {
  var id = req.user._id;
  var hikeId = req.params.hike;

  var namesObject = { hike_name: 'Hike Name', hike_date: 'Date', mileage: "Distance", time: 'Duration', elevation_gain: 'Elev Gain', min_elevation: 'Min Elev', max_elevation: 'Max Elev', average_pace: 'Avg Pace', average_bpm: 'Avg BPM', max_bpm: 'Max BPM', city: 'City', location: 'Location', notes: 'Notes'}

  var updateObject = {};
  var updateArray = [];

  //adding key/values into object from form
  Object.keys(req.body).forEach(key => {
        if(req.body[key] != '') {
          updateObject['log.$.' + key] = req.body[key];
          updateArray.push(namesObject[key])
        }
      });

  //logic if user doesn't enter anything
  if (Object.keys(updateObject).length === 0) {
    req.flash('error_msg', 'Please fill out at least one field');
    res.redirect('/dashboard/' + hikeId);
  } else {
    Hiker.updateOne(
      { _id: id, 'log._id': hikeId },
      { $set: updateObject },
      (err, doc) => {
        if (err) {
          console.log(err)
        } else {
          req.flash('success_msg', 'Successfully Updated: ' + updateArray.join(', '));
          res.redirect('/dashboard/' + hikeId);
        }
      }
    )
  }


})

//delete a hike
router.delete('/dashboard/:hike', ensureAuthenticated, (req, res) => {
  var id = req.user._id;
  var hikeId = req.params.hike;

  Hiker.updateOne(
    { _id: id },
    { $pull: { log: { _id: hikeId } } },
    function (error, result) {
      if (error) {
        console.log(error)
      }
    })
    .then(result => {
      req.flash('dashboard_info_msg', 'Hike Successfully Deleted!');
      res.json({ redirect: '/dashboard' })
    })

})

module.exports = router;
