const mongoose = require('mongoose');
const { HikeSession, Hiker } = require('../models/hikeSchemas');

//Dashboard Get
const dashboard_get = (req, res) => {
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

    res.render('dashboard', {
      data: newHikesArray,
      username: result.name_first,
      user_id: userId,
      title: 'Home',
      isExample: 'No',
      new_user: newUser
    })
  })
  .catch(err => {
    console.log(err);
    res.status(404).render('404');
  })
}

//Dashboard Add Hike
const dashboard_add_hike = (req, res) => {
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
}

module.exports = {
  dashboard_get,
  dashboard_add_hike
}
