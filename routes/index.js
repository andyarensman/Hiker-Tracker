const express = require('express');
const router = express.Router();
const imgur = require('imgur');

const { ensureAuthenticated } = require('../config/auth');
const template = require('../public/js/template.js');
const { upload, uploadCSV } = require('../config/multer')

//controllers
const otherControllers = require('../controllers/otherControllers');
const dashboardController = require('../controllers/dashboardController');
const bulkController = require('../controllers/bulkController');
const detailsPageController = require('../controllers/detailsPageController');
const editPageController = require('../controllers/editPageController');
const settingsController = require('../controllers/settingsController');

//imgur setup - may not be needed
const clientId = process.env.CLIENT_ID;
imgur.setClientId(clientId);
imgur.setAPIUrl('https://api.imgur.com/3/');

//ROUTES
//Welcome Page
router.get('/', otherControllers.welcome_get);

//dashboard
router.get('/dashboard', ensureAuthenticated, dashboardController.dashboard_get);

//dashboard - add new hike
router.post('/dashboard', ensureAuthenticated, dashboardController.dashboard_add_hike);

// GET settings
router.get('/dashboard/settings', ensureAuthenticated, settingsController.settings_get);

// GET change password
router.get('/dashboard/settings/change_password', ensureAuthenticated, settingsController.change_password_get);

// GET change password
router.post('/dashboard/settings/change_password', ensureAuthenticated, settingsController.change_password_post);

// Get change email
router.get('/dashboard/settings/change_email', ensureAuthenticated, settingsController.change_email_get);

// Get change email
router.post('/dashboard/settings/change_email', ensureAuthenticated, settingsController.change_email_post);

// Get delete account
router.get('/dashboard/settings/delete_account', ensureAuthenticated, settingsController.delete_account_get);

// Delete Account
router.post('/dashboard/settings/delete_account', ensureAuthenticated, settingsController.delete_account);

//Bulk Upload - Page render
router.get('/dashboard/bulk_add', ensureAuthenticated, bulkController.bulk_index);

// Bulk Upload - Get CSV template
router.get('/template', template.get);

//Bulk Upload - Add multiple Hikes
router.post('/dashboard/bulk_add', ensureAuthenticated, uploadCSV.single('myCSV'), bulkController.bulk_add);

// Get Hike Details
router.get('/dashboard/hike_details/:hike', ensureAuthenticated, detailsPageController.details_get);

//POST Imgur DETAILS PAGE
router.post('/dashboard/hike_details/:hike', ensureAuthenticated, detailsPageController.details_image_post);

// GET render edit page
router.get('/dashboard/:hike', ensureAuthenticated, editPageController.edit_get);

// PUT edit the corresponding hike - need user ID and hike ID
router.put('/dashboard/:hike', ensureAuthenticated, upload, editPageController.edit_put);

//EDIT PAGE TO IMGUR
router.post('/dashboard/:hike', ensureAuthenticated, editPageController.edit_image_post);

//delete a hike
router.delete('/dashboard/:hike', ensureAuthenticated, editPageController.edit_delete);

module.exports = router;
