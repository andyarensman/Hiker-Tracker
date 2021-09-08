const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const passport = require('passport');

const hikeSchemas = require('../models/hikeSchemas');
const Hiker = hikeSchemas.Hiker;

//Login Page
router.get('/login', (req, res) => {
  res.render('login')
})

//Register Page
router.get('/register', (req, res) => {
  res.render('register')
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
      errors, name_first, name_last, email, password, password2
    })
  } else {
    // Validation Pass
    Hiker.findOne({ email: email })
      .then(user => {
        if(user) {
          //User Exists
          errors.push({ msg: 'Email is already registered' })
          res.render('register', {
            errors, name_first, name_last, email, password, password2
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
                  req.flash('success_msg', 'You are now registered and can log in. ');
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

module.exports = router;
