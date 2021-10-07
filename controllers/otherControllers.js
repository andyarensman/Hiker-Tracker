const { HikeSession, Hiker } = require('../models/hikeSchemas');

//Welcome Get
const welcome_get = (req, res) => {

    const email = 'andrew.arensman@gmail.com'

    Hiker.findOne({ email: email })
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

      res.render('users/welcome', {
        data: newHikesArray,
        username: 'Andy',
        user_id: userId,
        title: 'Welcome',
        isExample: 'Yes',
        new_user: 'No'
      })
    })
    .catch(err => {
      console.log(err);
      res.status(404).render('404');
    })
}

module.exports = {
  welcome_get
}
