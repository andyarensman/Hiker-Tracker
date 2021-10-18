const fs = require('fs');
const csv = require('fast-csv');
const mongoose = require('mongoose');

const { HikeSession, Hiker } = require('../models/hikeSchemas');

// Bulk Index
const bulk_index = (req, res) => {
  res.render('dashboard/bulkUpload', { title: 'Bulk Upload' });
}

//Bulk Add POST
const bulk_add = (req, res) => {
  const id = req.user._id;

  //delete file locally function
  const deleteFile = () => {
    fs.unlink(`./tmp/csv/${req.file.filename}`, (err) => {
      if (err) {
        console.error(err)
        return
      }
      // console.log('file deleted')
      })
  }

  //check if file has correct headers function
  const correctHeaders = (hikes) => {
    var a = Object.keys(hikes[0]);
    var b = ['hike_name', 'hike_date', 'mileage', 'time', 'elevation_gain', 'min_elevation', 'max_elevation', 'average_pace', 'average_bpm', 'max_bpm', 'city', 'location', 'notes'];

    if (a === b) return true;
    if (a == null || b == null) return false;
    if (a.length !== b.length) return false;

    for (var i = 0; i < a.length; ++i) {
      if (a[i] !== b[i]) return false;
    }
    return true;
  }

  //errors
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
        // data['_id'] = new mongoose.Types.ObjectId(); //might not need this?
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
        if (correctHeaders(updateObjectArray) == false) {
          req.flash('error_msg', 'Incorrect headers in file. Please follow the template.');
          res.redirect('/dashboard/bulk_add');
        } else {
          res.render('dashboard/bulkUploadCheck', {
            title: 'Bulk Upload',
            data: updateObjectArray
          })
        }
      })
    deleteFile();
  }
}

//Bulk Submit
const bulk_submit = (req, res) => {
  const id = req.user._id;
  var updateObjectArray = [];
  //console.log(req.body);
  var formKeys = Object.keys(req.body);
  var lastEntry = formKeys[formKeys.length - 1]

  var matches = lastEntry.match(/\d+$/);
  var rowAmountStr = matches[0];
  var rowAmountNum = parseInt(matches[0], 10);

  for (var i = 1; i <= rowAmountNum; i++) {
    var obj = {};
    for (var j = 0; j < formKeys.length; j++) {
      var rowNumber = formKeys[j].match(/\d+$/);
      if (rowNumber[0] === i.toString()) {
        var value = req.body[formKeys[j]];
        var key = formKeys[j].replace(rowNumber[0], '');
        obj[key] = value;
      }
    }
    updateObjectArray.push(obj);
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
}

module.exports = {
  bulk_index,
  bulk_add,
  bulk_submit
}
