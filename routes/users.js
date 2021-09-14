const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const passport = require('passport');

const hikeSchemas = require('../models/hikeSchemas');
const Hiker = hikeSchemas.Hiker;

//Login Page
router.get('/login', (req, res) => {
  res.render('login', { title: 'Login' })
})

//Register Page
router.get('/register', (req, res) => {
  res.render('register', { title: 'Register' })
})

//Register Handle
router.post('/register', (req, res) => {
  const { name_first, name_last, email, password, password2 } = req.body;

  var errors = [];

  //Check required fields
  if (!name_first || !name_last || !email || !password || !password2) {
    errors.push({ msg: 'Please fill in all fields.' });
  }

  //Check passwords match
  if (password != password2) {
    errors.push({ msg: 'Passwords do not match.' });
  }

  //Check pass length
  if (password.length < 6) {
    errors.push({ msg: 'Password should be at least 6 characters.' });
  }

  if (errors.length > 0 ){
    res.render('register', {
      errors, name_first, name_last, email, password, password2, title: 'Register'
    })
  } else {
    // Validation Pass
    Hiker.findOne({ email: email })
      .then(user => {
        if(user) {
          //User Exists
          errors.push({ msg: 'Email is already registered' })
          res.render('register', {
            errors, name_first, name_last, email, password, password2, title: 'Register'
          });
        } else {
          const newHiker = new Hiker({
            name_first,
            name_last,
            email,
            password
          });
          //Hash Password
          bcrypt.genSalt(10, (error, salt) =>
            bcrypt.hash(newHiker.password, salt, (err, hash) => {
              if (err) throw err;

              //Set password to hased
              newHiker.password = hash;
              newHiker.save()
                .then(user => {
                  req.flash('success_msg', 'You are registered and can log in. ');
                  res.redirect('/users/login')
                })
                .catch(err => console.log(err))
          }))
        }
      })
  }
});

// Login Handle
router.post('/login', (req, res, next) => {
  passport.authenticate('local', {
    successRedirect: '/dashboard',
    failureRedirect: '/users/login',
    failureFlash: true
  })(req, res, next);
})

//Logout Handle
router.get('/logout', (req, res) => {
  req.logout();
  req.flash('success_msg', 'You are logged out');
  res.redirect('/users/login');
});

//example user
router.get('/example', (req, res) => {
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

    res.render('exampleUser', { data: newHikesArray, username: 'Andy', user_id: userId, title: 'Example', isExample: 'Yes' })
  })
  .catch(err => {
    console.log(err);
    res.status(404).render('404');
  })
})


module.exports = router;
