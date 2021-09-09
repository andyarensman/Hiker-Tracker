const express = require('express');
const router = express.Router();
const { ensureAuthenticated } = require('../config/auth');

const hikeSchemas = require('../models/hikeSchemas');
const HikeSession = hikeSchemas.HikeSession;
const Hiker = hikeSchemas.Hiker;

//Welcome Page
router.get('/', (req, res) => {
  res.render('welcome')
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

    res.render('dashboard', { data: newHikesArray, username: result.name_first, user_id: userId })
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
        res.redirect('/dashboard')
      }
    }

  )
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

    res.render('editHike', { data: hike, user_id: id, hikeId: hikeId })
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

  var updateObject = {};
  //adding key/values into object from form
  Object.keys(req.body).forEach(key => {
        if(req.body[key] != '') {
          updateObject['log.$.' + key] = req.body[key];
        }
      });
  //add logic if user doesn't enter anything//

  Hiker.updateOne(
    { _id: id, 'log._id': hikeId },
    { $set: updateObject },
    (err, doc) => {
      if (err) {
        console.log(err)
      } else {
        res.redirect('/dashboard/' + hikeId);
      }
    }
  )
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
      res.json({ redirect: '/dashboard' })
    })

})

module.exports = router;
