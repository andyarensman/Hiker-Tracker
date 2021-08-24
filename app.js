const express = require('express');
require('dotenv').config();
const mongo = require('mongodb');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');

const hikeSchemas = require('./models/hikeSchemas');
const HikeSession = hikeSchemas.HikeSession;
const Hiker = hikeSchemas.Hiker;
const { d3ScatterPlot } = require('./graph.js');

//express app
const app = express();

//connect to mongodb
const uri = process.env['MONGO_URI']
mongoose.connect(uri, {useNewUrlParser: true, useUnifiedTopology: true})
  .then((result) => app.listen(process.env.PORT || 3000))
  .catch((err) => console.log(err));

//not sure where to put this or if I need it
mongoose.set('useFindAndModify', false);

//middleware and static files
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true })); //allows you to use req.body


//routes
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

app.get('/:id', (req, res) => {
  //practice id = '61252905f2362a1348516b85'
  const id = req.params.id

  Hiker.findById(id)
  .then(result => {
    console.log(result.log)
    d3ScatterPlot(result.log)
  })
  .catch(err => {
    console.log('invalid user ID');
  })
})



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
    duration: req.body.duration,
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
