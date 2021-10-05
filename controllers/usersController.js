const bcrypt = require('bcryptjs');
const passport = require('passport');
const nodemailer = require('nodemailer');
const async = require('async');
const crypto = require('crypto');

const { HikeSession, Hiker } = require('../models/hikeSchemas');

//Login Page
const user_login_get = (req, res) => {
  res.render('login', { title: 'Login' })
}

//Register Page
const user_register_get = (req, res) => {
  res.render('register', { title: 'Register' })
}

//Register Handle
const register_handle = (req, res) => {
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

              //Set password to hashed
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
}

// Login Handle
const login_handle = (req, res, next) => {
  passport.authenticate('local', {
    successRedirect: '/dashboard',
    failureRedirect: '/users/login',
    failureFlash: true
  })(req, res, next);
}

// Logout Handle
const logout_handle = (req, res) => {
  req.logout();
  req.flash('success_msg', 'You are logged out');
  res.redirect('/users/login');
}

// Forgot Page
const forgot_page = (req, res) => {
  res.render('forgot', { title: 'Forgot Password' })
}

// Forgot Handle
const forgot_handle = (req, res, next) => {
  async.waterfall([
    function(done) {
      crypto.randomBytes(20, function(err, buf) {
        var token = buf.toString('hex');
        done(err, token);
      });
    },
    function(token, done) {
      Hiker.findOne({ email: req.body.email }, function(err, user) {
        if (!user) {
          req.flash('error', 'No account with that email address exists.');
          return res.redirect('/users/forgot');
        }

        user.resetPasswordToken = token;
        user.resetPasswordExpires = Date.now() + 3600000; // 1 hour

        user.save(function(err) {
          done(err, token, user);
        });
      });
    },
    function(token, user, done) {
      var smtpTransport = nodemailer.createTransport({
        service: 'SendGrid',
        auth: {
          user: 'apikey',
          pass: process.env.SENDGRID_SECRET
        }
      });
      var mailOptions = {
        to: user.email,
        from: 'andrew.arensman@gmail.com',
        subject: 'Hike Data Password Reset',
        text: 'You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n' +
          'Please click on the following link, or paste this into your browser to complete the process:\n\n' +
          'http://' + req.headers.host + '/users/reset/' + token + '\n\n' +
          'If you did not request this, please ignore this email and your password will remain unchanged.\n'
      };
      smtpTransport.sendMail(mailOptions, function(err) {
        req.flash('info', 'An e-mail has been sent to ' + user.email + ' with further instructions.');
        done(err, 'done');
      });
    }
  ], function(err) {
    if (err) return next(err);
    res.redirect('/users/forgot');
  });
}

// Reset Get
const reset_get = (req, res) => {
  Hiker.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, (err, user) => {
    if (!user) {
      req.flash('error', 'Password reset token is invalid or has expired.');
      return res.redirect('/users/forgot');
    }
    res.render('reset', {
      user: req.user,
      title: 'Reset'
    });
  });
}

// Reset Post
const reset_post = (req, res) => {
  const { password, password2 } = req.body;
  var errors = [];

  //Check required fields
  if (!password || !password2) {
    errors.push({ msg: 'Please fill in all fields.' });
  }

  //Check passwords match
  if (password != password2) {
    errors.push({ msg: 'Passwords do not match' })
  }

  //Check pass length
  if (password.length < 6) {
    errors.push({ msg: 'Password should be at least 6 characters.' });
  }

  if (errors.length > 0) {
    res.render('reset', {errors, title: 'Reset'})
  } else {
    async.waterfall([
      function(done) {
        Hiker.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, (err, user) => {
          if (!user) {
            req.flash('error', 'Password reset token is invalid or has expired.');
            return res.redirect('back');
          }

          user.password = req.body.password;
          user.resetPasswordToken = undefined;
          user.resetPasswordExpires = undefined;

          bcrypt.genSalt(10, (error, salt) =>
            bcrypt.hash(user.password, salt, (err, hash) => {
              if (err) throw err;

              //Set password to hashed
              user.password = hash;
              user.save(err => {
                done(err, user);
              })
          }))
        });
      },
      function(user, done) {
        var smtpTransport = nodemailer.createTransport({
          service: 'SendGrid',
          auth: {
            user: 'apikey',
            pass: process.env.SENDGRID_SECRET
          }
        });
        var mailOptions = {
          to: user.email,
          from: 'andrew.arensman@gmail.com',
          subject: 'Your password has been changed',
          text: 'Hello,\n\n' +
            'This is a confirmation that the password for your account ' + user.email + ' has just been changed.\n'
        };
        smtpTransport.sendMail(mailOptions, function(err) {
          done(err);
        });
      }
    ], function(err) {
      req.flash('success_msg', 'Success! Your password has been changed.');
      res.redirect('/users/login');
    });
  }
}

// Get Example User
const example_user_get = (req, res) => {
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

    res.render('exampleUser', {
      data: newHikesArray,
      username: 'Andy',
      user_id: userId,
      title: 'Example',
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
  user_login_get,
  user_register_get,
  register_handle,
  login_handle,
  logout_handle,
  forgot_page,
  forgot_handle,
  reset_get,
  reset_post,
  example_user_get
}
