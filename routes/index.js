const express = require('express');
const router = express.Router();
const imgur = require('imgur');

const { ensureAuthenticated } = require('../config/auth');
const template = require('../public/template.js');
const { upload, uploadCSV } = require('../config/multer')

//controllers
const otherControllers = require('../controllers/otherControllers');
const dashboardController = require('../controllers/dashboardController');
const bulkController = require('../controllers/bulkController');
const detailsPageController = require('../controllers/detailsPageController');
const editPageController = require('../controllers/editPageController');

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
