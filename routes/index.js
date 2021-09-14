const express = require('express');
const router = express.Router();
const { ensureAuthenticated } = require('../config/auth');
const template = require('../public/template.js');
var csv = require('fast-csv');
var mongoose = require('mongoose');

const hikeSchemas = require('../models/hikeSchemas');
const HikeSession = hikeSchemas.HikeSession;
const Hiker = hikeSchemas.Hiker;

//Welcome Page
router.get('/', (req, res) => {
  res.render('welcome', { title: 'Welcome' })
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

    res.render('dashboard', { data: newHikesArray, username: result.name_first, user_id: userId, title: 'Home' })
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
    notes: req.body.notes || ''
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
  const id = req.user._id;

  res.render('bulkUpload', { user_id: id, title: 'Bulk Upload' })
})


//Add multiple Hikes
router.post('/dashboard/bulk_add', ensureAuthenticated, (req, res) => {
  const id = req.user._id;


  if (!req.files) {
    req.flash('error_msg', 'No File Selected');
    res.redirect('/dashboard/bulk_add');
  } else if (/(\.csv)$/.test(req.files.file.name) != true) {
    req.flash('error_msg', 'File name must end in .csv');
    res.redirect('/dashboard/bulk_add');
  } else {
    var hikesFile = req.files.file;
    var updateObjectArray = [];

    csv.fromString(hikesFile.data.toString('utf8'), {
        headers: true,
        ignoreEmpty: true
      })
      .on("data", (data) => {
        data['_id'] = new mongoose.Types.ObjectId();

        updateObjectArray.push(data);
      })
      .on('end', () => {
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
  }


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
