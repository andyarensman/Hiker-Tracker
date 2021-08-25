const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const hikeSessionSchema = new mongoose.Schema({
    hike_name: {type: String, required: true},
    hike_date: {type: String, required: true},
    mileage: {type: Number, required: true},
    duration: {type: String, required: true},
    elevation_gain: {type: Number, required: true},
    min_elevation: Number,
    max_elevation: Number,
    average_pace: String,
    average_bpm: Number,
    max_bpm: Number,
    city: {type: String, required: true},
    location: {type: String, required: true},
    notes: String
  })

const hikerSchema = new mongoose.Schema({
  username: {type: String, required: true},
  log: [hikeSessionSchema]
})

const HikeSession = mongoose.model('HikeSession', hikeSessionSchema)
const Hiker = mongoose.model('Hiker', hikerSchema)

module.exports = {
  HikeSession,
  Hiker
}
