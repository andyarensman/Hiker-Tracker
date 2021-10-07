const mongoose = require('mongoose');
const imgur = require('imgur');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const { upload } = require('../config/multer')
const { HikeSession, Hiker } = require('../models/hikeSchemas');

//Detail Get
const details_get = (req, res) => {
  var hikeId = req.params.hike;
  var hikeObject = req.user.log.find(obj => {
    return obj._id == hikeId
  });

  //getting rid of _id
  var hike = (({ hike_name, hike_date, mileage, time, elevation_gain, min_elevation, max_elevation, average_pace, average_bpm, max_bpm, city, location, notes, image_url }) => ({ hike_name, hike_date, mileage, time, elevation_gain, min_elevation, max_elevation, average_pace, average_bpm, max_bpm, city, location, notes, image_url }))(hikeObject.toJSON());

  var newDate = new Date(hike.hike_date.replace(/-/g, '\/'))
  hike['real_date'] = newDate;
  hike['hike_date'] = newDate.toLocaleDateString('en-US');  //Converts to MM/DD/YYYY

  //Checking if there's an image || Object.keys(hikeObject.image_url
  var image_link = '';
  var image_orientation = "class=\"orientation_none\"";
  if (hike.image_url != undefined) {
    if (Object.keys(hike.image_url).length != 0) {
      image_link = 'src=' + hike.image_url.link;
      if (hike.image_url.width > hike.image_url.height){
        image_orientation = "class=\"landscape\"";
      } else {
        image_orientation = "class=\"portrait\"";
      }
    }
  }
  res.render('dashboard/hikeDetails', {
    title: 'Hike Details',
    hikeObject: hike,
    hikeId: hikeId,
    image_link: image_link,
    image_orientation: image_orientation
  })
}

//Details Image Post
const details_image_post = (req, res) => {
  var hikeId = req.params.hike;
  const id = req.user._id;

  upload(req, res, (err) => {
    if (err) {
      console.log(err)
    } else {
      if (req.file == undefined) {
        console.log('Error: No File Selected')
        req.flash('dashboard_error_msg', 'No File Selected');
        res.redirect('/dashboard/hike_details/' + hikeId);
      } else {
        console.log('File Uploading');

        imgur
          .uploadFile(`./public/uploads/${req.file.filename}`)
          .then((json) => {

            //Add image link to mongodb
            Hiker.updateOne(
              { _id: id, 'log._id': hikeId },
              { $set: { 'log.$.image_url': json } },
              (err, doc) => {
                if (err) {
                  console.log(err)
                } else {
                  req.flash('dashboard_success_msg', 'Successfully Added Image');
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
}

module.exports = {
  details_get,
  details_image_post
}
