const mongoose = require('mongoose');
const imgur = require('imgur');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const { upload } = require('../config/multer')
const { HikeSession, Hiker } = require('../models/hikeSchemas');

//Edit Get
const edit_get = (req, res) => {
  const id = req.user._id;
  var hikeId = req.params.hike;

  Hiker.findById(id)
  .then(hiker => {
    const hikeData = hiker.log.id(hikeId)
    var hike = (({ hike_name, hike_date, mileage, time, elevation_gain, min_elevation, max_elevation, average_pace, average_bpm, max_bpm, city, location, notes }) => ({ hike_name, hike_date, mileage, time, elevation_gain, min_elevation, max_elevation, average_pace, average_bpm, max_bpm, city, location, notes }))(hikeData.toJSON());

    var idStr = hikeData._id.toString()

    hike.id = idStr;

    //Converts to MM/DD/YYYY
    var newDate = new Date(hike.hike_date.replace(/-/g, '\/'))
    hike['hike_date'] = newDate.toLocaleDateString('en-US');

    //Checking if there's an image
    var image_link = 'None';
    if (hikeData.image_url != undefined) {
      if (Object.keys(hikeData.image_url).length != 0) {
        image_link = '<a style="cursor: pointer" href=' + hikeData.image_url.link  + ' target="_blank"><img src="/assets/images/imageicon.svg\" alt="image icon" style="height: 24"></a>'
      }
    }
    res.render('dashboard/editHike', {
      data: hike,
      user_id: id,
      hikeId: hikeId,
      title: 'Edit',
      image_link: image_link
    })
  })
  .catch(err => {
    console.log(err);
    res.status(404).render('404', {title: '404'});
  })
}

//Edit Put
const edit_put = (req, res) => {
  var id = req.user._id;
  var hikeId = req.params.hike;
  var currentHikeObj = req.user.log.find(obj => obj._id == hikeId);

  var namesObject = { hike_name: 'Hike Name', hike_date: 'Date', mileage: "Distance", time: 'Duration', elevation_gain: 'Elev Gain', min_elevation: 'Min Elev', max_elevation: 'Max Elev', average_pace: 'Avg Pace', average_bpm: 'Avg BPM', max_bpm: 'Max BPM', city: 'City', location: 'Location', notes: 'Notes', 'delete-image': 'Old Image Deleted' }

  var updateObject = {};
  var updateArray = [];

  //adding key/values into object from form
  Object.keys(req.body).forEach(key => {
        if(req.body[key] != '' && key != 'delete-image') {
          updateObject['log.$.' + key] = req.body[key];
          updateArray.push(namesObject[key])
        } else if (key == 'delete-image' && currentHikeObj.image_url != undefined) {
          //Delete image if box is checked and there's an image to delete
          updateArray.push(namesObject[key]);

          var deleteHash = currentHikeObj.image_url.deletehash;

          Hiker.updateOne(
            { _id: id, 'log._id': hikeId },
            { $unset: { 'log.$.image_url': 1 } },
            (err, doc) => {
              if (err) {
                console.log(err)
              } else {
                imgur
                  .deleteImage(deleteHash)
                  .then((status) => {
                    console.log('Image deleted from imgur: ' + status);
                  })
                  .catch((err) => {
                    console.error(err.message);
                  });
              }
            }
          )
        }
      });

  //logic if user doesn't enter anything
  if (updateArray.length === 0) {
    req.flash('dashboard_error_msg', 'Please fill out at least one field');
    res.redirect('/dashboard/' + hikeId);
  } else {
    Hiker.updateOne(
      { _id: id, 'log._id': hikeId },
      { $set: updateObject },
      (err, doc) => {
        if (err) {
          console.log(err)
        } else {
          req.flash('dashboard_success_msg', 'Successfully Updated: ' + updateArray.join(', '));
          res.redirect('/dashboard/' + hikeId);
        }
      }
    )
  }
}

//Edit Post Image
const edit_image_post = (req, res) => {
  var hikeId = req.params.hike;
  const id = req.user._id;
  var currentHikeObj = req.user.log.find(obj => obj._id == hikeId);

  upload(req, res, (err) => {
    if (err) {
      console.log(err)
    } else {
      if (req.file == undefined) {
        console.log('Error: No File Selected')
        req.flash('dashboard_error_msg', 'No File Selected');
        res.redirect('/dashboard/' + hikeId);
      } else {
        console.log('File Uploading');

        imgur
          .uploadFile(`./public/uploads/${req.file.filename}`)
          .then((json) => {

            //If there's already an image
            if (currentHikeObj.image_url != undefined) {
              var deleteHash = currentHikeObj.image_url.deletehash;
              imgur
                .deleteImage(deleteHash)
                .then((status) => {
                  console.log('Image deleted from imgur: ' + status);
                })
                .catch((err) => {
                  console.error(err.message);
                });
            }

            //Add image link to mongodb
            Hiker.updateOne(
              { _id: id, 'log._id': hikeId },
              { $set: { 'log.$.image_url': json } },
              (err, doc) => {
                if (err) {
                  console.log(err)
                } else {
                  req.flash('dashboard_success_msg', 'Successfully Added Image');
                  res.redirect('/dashboard/' + hikeId);
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
            console.error(err.message); //does this need to change?
          });
      }
    }
  });
}

//Edit Delete
const edit_delete = (req, res) => {
  var id = req.user._id;
  var hikeId = req.params.hike;
  var currentHikeObj = req.user.log.find(obj => obj._id == hikeId);

  //If there's an image
  if (currentHikeObj.image_url != undefined) {
    var deleteHash = currentHikeObj.image_url.deletehash;
    imgur
      .deleteImage(deleteHash)
      .then((status) => {
        console.log('Image deleted from imgur: ' + status);
      })
      .catch((err) => {
        console.error(err.message);
      });
    }

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
}

module.exports = {
  edit_get,
  edit_put,
  edit_image_post,
  edit_delete
}
