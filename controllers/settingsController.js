const { HikeSession, Hiker } = require('../models/hikeSchemas');

const settings_get = (req, res) => {
  res.render('dashboard/settings/settings', {
    title: 'Settings'
  })
}

const change_password_get = (req, res) => {
  res.render('dashboard/settings/changePassword', {
    title: 'Settings'
  })
}

const change_email_get = (req, res) => {
  res.render('dashboard/settings/changeEmail', {
    title: 'Settings'
  })
}

const delete_account_get = (req, res) => {
  res.render('dashboard/settings/deleteAccount', {
    title: 'Settings',
    warning_msg: 'WARNING! You are about to permanently delete your account! All hike data and photos will be lost!'
  })
}

module.exports = {
  settings_get,
  change_password_get,
  change_email_get,
  delete_account_get
}
