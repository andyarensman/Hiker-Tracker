const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const imgur = require('imgur');
const { HikeSession, Hiker } = require('../models/hikeSchemas');

//Setting Get
const settings_get = (req, res) => {
  res.render('dashboard/settings/settings', {
    title: 'Settings'
  })
}

//Password Get
const change_password_get = (req, res) => {
  res.render('dashboard/settings/changePassword', {
    title: 'Settings'
  })
}

//Password Post
const change_password_post = (req, res) => {
  var id = req.user._id;
  var check_current_password = req.user.password;
  const { current_password, new_password, confirm_new } = req.body;

  //Check that passwords match
  if (new_password != confirm_new) {
    res.render('dashboard/settings/changePassword', {
      title: 'Settings',
      error_msg: 'New passwords do not match.'
    })
  } else if (new_password.length < 6) {
    res.render('dashboard/settings/changePassword', {
      title: 'Settings',
      error_msg: 'Password should be at least 6 characters.'
    })
  } else {
    //Check that password is correct
    bcrypt.compare(current_password, check_current_password, (err, isMatch) => {
      if (err) throw err;

      if(!isMatch) {
        res.render('dashboard/settings/changePassword', {
          title: 'Settings',
          error_msg: 'Current password is incorrect.'
        })
      } else {
        //Hash Password
        bcrypt.genSalt(10, (error, salt) =>
          bcrypt.hash(new_password, salt, (err, hash) => {
            if (err) throw err;

            //Set password to hashed
            Hiker.updateOne(
              { _id: id },
              { password: hash },
              (err, doc) => {
                if (err) {
                  console.log(err)
                } else {
                  req.flash('success_msg', 'Successfully updated password. Please log in.');
                  res.redirect('/users/login');
                }
              }
            )

        }))
      }
    });
  }
}

//Email Get
const change_email_get = (req, res) => {
  res.render('dashboard/settings/changeEmail', {
    title: 'Settings'
  })
}

//Email Post
const change_email_post = (req, res) => {
  var id = req.user._id;
  var current_password = req.user.password;
  const { email, password, password2 } = req.body;

  //Check that passwords match
  if (password != password2) {
    res.render('dashboard/settings/changeEmail', {
      title: 'Settings',
      error_msg: 'Passwords do not match.'
    })
  } else {
    //Check that password is correct
    bcrypt.compare(password, current_password, (err, isMatch) => {
      if (err) throw err;

      if(!isMatch) {
        res.render('dashboard/settings/changeEmail', {
          title: 'Settings',
          error_msg: 'Incorrect password.'
        })
      } else {
        //update MongoDB
        Hiker.updateOne(
          { _id: id },
          { email: email },
          (err, doc) => {
            if (err) {
              console.log(err)
            } else {
              req.flash('success_msg', 'Successfully updated email to: ' + email + '. Please log in.');
              res.redirect('/users/login');
            }
          }
        )
      }
    });
  }
}

//Delete Get
const delete_account_get = (req, res) => {
  res.render('dashboard/settings/deleteAccount', {
    title: 'Settings',
    warning_msg: 'WARNING! You are about to permanently delete your account! All hike data and photos will be lost!'
  })
}

//Delete Account
const delete_account = (req, res) => {
  var id = req.user._id;
  var current_password = req.user.password;
  const { email, password, password2 } = req.body;
  var errors = [];

  //Check if email matches
  if (email != req.user.email) {
    errors.push({ msg: 'Incorrect email.' });
  }

  //check if passwords matches
  if (password != password2) {
    errors.push({ msg: 'Passwords do not match.' });
  }

  //check if box is check_current_password
  if (!req.body.hasOwnProperty('delete-checkbox')) {
    errors.push({ msg: 'Box is not checked.' });
  }

  if (errors.length > 0 ){
    res.render('dashboard/settings/deleteAccount', {
      errors,
      title: 'Settings',
      warning_msg: 'WARNING! You are about to permanently delete your account! All hike data and photos will be lost!'
    })
  } else {
    //check if password is Incorrect
    bcrypt.compare(password, current_password, (err, isMatch) => {
      if (err) throw err;

      if(!isMatch) {
        res.render('dashboard/settings/deleteAccount', {
          title: 'Settings',
          error_msg: 'Incorrect password.',
          warning_msg: 'WARNING! You are about to permanently delete your account! All hike data and photos will be lost!'
        })
      } else {
        //get all images
        var hikes_to_delete = [];
        var hike_array = [...req.user.log]
        hike_array.forEach(hikeObj => {
          if (hikeObj.image_url) {
            if (hikeObj.image_url != '') {
              hikes_to_delete.push(hikeObj.image_url.deletehash)
            }
          }
        })

        //delete all images from IMGUR (seems to be working)
        for (var i = 0; i < hikes_to_delete.length; i++) {
            imgur
            .deleteImage(hikes_to_delete[i])
            .then((status) => {
              console.log(status)
            })
            .catch((err) => {
              console.error(err.message);
            });
        }

        //delete from mongodb
        Hiker.deleteOne({ _id: id })
          .then(result => {
            req.logout();
            req.flash('dashboard_success_msg', 'Account Deleted');
            res.redirect('/');
          })
      }
    });
  }
}

module.exports = {
  settings_get,
  change_password_get,
  change_password_post,
  change_email_get,
  change_email_post,
  delete_account_get,
  delete_account
}
