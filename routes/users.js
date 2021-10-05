const express = require('express');
const router = express.Router();

const usersController = require('../controllers/usersController');

//Login Page
router.get('/login', usersController.user_login_get);

//Register Page
router.get('/register', usersController.user_register_get);

//Register Handle
router.post('/register', usersController.register_handle);

//Login Handle
router.post('/login', usersController.login_handle);

//Logout Handle
router.get('/logout', usersController.logout_handle);

//Forgot Password Page
router.get('/forgot', usersController.forgot_page);

//Forgot Handle
router.post('/forgot', usersController.forgot_handle);

//Reset get
router.get('/reset/:token', usersController.reset_get);

//Reset post
router.post('/reset/:token', usersController.reset_post);

//Example user
router.get('/example', usersController.example_user_get);


module.exports = router;
