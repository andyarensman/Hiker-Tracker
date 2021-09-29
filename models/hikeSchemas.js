const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const hikeSessionSchema = new mongoose.Schema({
    hike_name: {type: String, required: true},
    hike_date: {type: String, required: true},
    mileage: {type: Number, required: true},
    time: {type: String, required: true},
    elevation_gain: {type: Number, required: true},
    min_elevation: Number,
    max_elevation: Number,
    average_pace: String,
    average_bpm: Number,
    max_bpm: Number,
    city: {type: String, required: true},
    location: {type: String, required: true},
    notes: String,
    image_url: Schema.Types.Mixed,
  })

const hikerSchema = new mongoose.Schema({
  name_first: {type: String, required: true},
  name_last: {type: String, required: true},
  email: {type: String, required: true},
  password: {type: String, required: true},
  date: {type: Date, default: Date.now},
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  log: [hikeSessionSchema]
})

const HikeSession = mongoose.model('HikeSession', hikeSessionSchema)
const Hiker = mongoose.model('Hiker', hikerSchema)

module.exports = {
  HikeSession,
  Hiker
}
