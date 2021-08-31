const express = require('express');
require('dotenv').config();
const mongo = require('mongodb');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const methodOverride = require('method-override')

const hikeSchemas = require('./models/hikeSchemas');
const HikeSession = hikeSchemas.HikeSession;
const Hiker = hikeSchemas.Hiker;

//express app
const app = express();

//connect to mongodb
const uri = process.env['MONGO_URI']
mongoose.connect(uri, {useNewUrlParser: true, useUnifiedTopology: true})
  .then((result) => app.listen(process.env.PORT || 3000))
  .catch((err) => console.log(err));

//register viwe engine
app.set('view engine', 'ejs');

//not sure where to put this or if I need it
mongoose.set('useFindAndModify', false);

//middleware and static files
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true })); //allows you to use req.body
app.use(methodOverride('_method')); //allows you to use PUT with a form

//routes
app.get('/', (req, res) => {
  res.render('index')
});

app.get('/users/:id', (req, res) => {
  const id = req.params.id

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

    var userId = result._id.toString()


    res.render('user', { data: newHikesArray, username: result.username, userId:userId })
  })
  .catch(err => {
    console.log(err);
  })
})

app.post('/users/:id', (req, res) => {
  const id = req.params.id

  console.log(req.body)

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
        res.redirect('/users/' + id) //what's the better way to do this?
      }
    }

  )
})

// GET render edit page
app.get('/users/:id/:hike', (req, res) => {
  var id = req.params.id;
  var hikeId = req.params.hike;

  Hiker.findById(id, (err, hiker) => {
    const hikeData = hiker.log.id(hikeId)
    var hike = (({ hike_name, hike_date, mileage, time, elevation_gain, min_elevation, max_elevation, average_pace, average_bpm, max_bpm, city, location, notes }) => ({ hike_name, hike_date, mileage, time, elevation_gain, min_elevation, max_elevation, average_pace, average_bpm, max_bpm, city, location, notes }))(hikeData);

    var idStr = hikeData._id.toString()

    hike.id = idStr;

    res.render('editHike', { data: hike, user_id: id, hikeId: hikeId })
  })

})

// PUT edit the corresponding hike - need user ID and hike ID
app.put('/users/:id/:hike', (req, res) => {
  var id = req.params.id;
  var hikeId = req.params.hike;

  var updateObject = {};
  //adding key/values into object from form
  Object.keys(req.body).forEach(key => {
        if(req.body[key] != '') {
          updateObject['log.$.' + key] = req.body[key];
        }
      });
  //add logic if user doesn't enter anything//
  console.log(updateObject)


  Hiker.updateOne(
    { _id: id, 'log._id': hikeId },
    { $set: updateObject},
    // { $set: {'log.$.hike_name': req.body.hike_name }},
    (err, doc) => {
      if (err) {
        console.log(err)
      } else {
        res.redirect('/users/' + id + '/' + hikeId);
      }

    }
  )
})



/////////////////////Gunna get rid of stuff below eventually///////////////////////////////

//updated but I want to stay on same page
app.post('/api/users', bodyParser.urlencoded({ extended: false }), (req, res) => {
  var newHiker = new Hiker({username: req.body.username})
  newHiker.save((error, savedHiker) => {
    if (!error) {
      var responseObject = {};
      responseObject['username'] = savedHiker.username
      responseObject['_id'] = savedHiker.id
      res.json(responseObject)
    }
  })
})

//This returns all the data if I go to '/api/users'
app.get('/api/users', (req, res) => {
  Hiker.find({}, (error, arrayOfUsers) => {
    if (!error) {
      res.json(arrayOfUsers)
    }
  })
})

//updated
app.post('/api/users/:_id/exercises', bodyParser.urlencoded({ extended: false }), (req, res) => {
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
    req.params._id,
    {$push : {log: newHike}},
    {new: true},
    (error, updatedUser) => {
      if(!error) {
        var responseObject = {}
        responseObject['_id'] = updatedUser.id
        responseObject['username'] = updatedUser.username
        responseObject['duration'] = newHike.duration
        responseObject['hike_name'] = newHike.hike_name
        res.json(responseObject)
      }
    }
  )
})


//This shows data for specific user, but isn't updated yet
app.get('/api/users/:_id/logs', (req, res) => {
  console.log(req.params)
  console.log(req.query.from)

  Hiker.findById(req.params._id, (error, result) => {
    if(!error) {
      var responseObject = result

      if (req.query.from || req.query.to) {

        var fromDate = new Date(0)
        var toDate = new Date()

        if (req.query.from) {
          fromDate = new Date(req.query.from)
        }

        if (req.query.to) {
          toDate = new Date(req.query.to)
        }

        fromDate = fromDate.getTime()
        toDate = toDate.getTime()

        responseObject.log = responseObject.log.filter((session) => {
          var sessionDate = new Date(session.date).getTime()

          return sessionDate >= fromDate && sessionDate <= toDate
        })
      }

      if (req.query.limit) {
        responseObject.log = responseObject.log.slice(0, req.query.limit)
      }


      responseObject = responseObject.toJSON()
      responseObject['count'] = result.log.length
      res.json(responseObject)
    }
  })
  //res.json({})
})
