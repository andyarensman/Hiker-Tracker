const express = require('express');
require('dotenv').config();
const mongo = require('mongodb');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const methodOverride = require('method-override')
const flash = require('connect-flash');
const session = require('express-session');
const passport = require('passport');
const cookieParser = require('cookie-parser');


const hikeSchemas = require('./models/hikeSchemas');
const HikeSession = hikeSchemas.HikeSession;
const Hiker = hikeSchemas.Hiker;

//Passport config
require('./config/passport')(passport);

//express app
const app = express();

//connect to mongodb
const uri = process.env['MONGO_URI']
mongoose.connect(uri, {useNewUrlParser: true, useUnifiedTopology: true})
  .then((result) => app.listen(process.env.PORT || 3000))
  .catch((err) => console.log(err));
mongoose.set('useFindAndModify', false);

//register view engine
app.set('view engine', 'ejs');

//middleware and static files
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true })); //allows you to use req.body
app.use(methodOverride('_method')); //allows you to use PUT with a form

app.use(cookieParser());
//Express Session Middleware
app.use(session({
  secret: 'secret',
  resave: true,
  saveUninitialized: true
}))

//Passport Middleware
app.use(passport.initialize());
app.use(passport.session());

//Connect flash
app.use(flash());

//Global Vars
app.use((req, res, next) => {
  res.locals.success_msg = req.flash('success_msg');
  res.locals.error_msg = req.flash('error_msg');
  res.locals.error = req.flash('error');
  res.locals.info = req.flash('info');
  res.locals.dashboard_success_msg = req.flash('dashboard_success_msg');
  res.locals.dashboard_info_msg = req.flash('dashboard_info_msg');
  res.locals.dashboard_error_msg = req.flash('dashboard_error_msg');
  next();
});

// Routes
app.use('/', require('./routes/index'))
app.use('/users', require('./routes/users'))

// 404 - must be at bottom
app.use((req, res) => {
  res.status(404).render('404', { title: '404'})
})
