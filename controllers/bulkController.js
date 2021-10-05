const fs = require('fs');
const csv = require('fast-csv');
const mongoose = require('mongoose');

const { HikeSession, Hiker } = require('../models/hikeSchemas');

// Bulk Index
const bulk_index = (req, res) => {
  res.render('bulkUpload', { title: 'Bulk Upload' });
}

//Bulk Add
const bulk_add = (req, res) => {
  const id = req.user._id;

  //delete file locally function
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
}

module.exports = {
  bulk_index,
  bulk_add
}
