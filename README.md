# Hiker Data Tracker

This app is being built as a way to practice full stack development with Node, Express, MongoDB, Mongoose, EJS, and D3. It will allow the user to log in, input data they collect from hiking, then see a visualization of the data.

## Mongoose Schemas

For the schemas, I used the following setup:

    const hikeSessionSchema = new mongoose.Schema({
        hike_name: {type: String, required: true},
        hike_date: {type: String, required: true},
        mileage: {type: Number, required: true},
        time: {type: String, required: true},
        elevation_gain: {type: Number, required: true},
        min_elevation: Number,
        max_elevation: Number,
        average_pace: String,
        average_bpm: Number,
        max_bpm: Number,
        city: {type: String, required: true},
        location: {type: String, required: true},
        notes: String
      })

    const hikerSchema = new mongoose.Schema({
      username: {type: String, required: true},
      log: [hikeSessionSchema]
    })

*(Note: This will likely change before the app is complete.)*

# Challenges

## MongoDB to D3 via EJS

One of the biggest challenges I faced was getting the MongoDB data into D3. I originally had my D3 in a js file as a module and ran the module in a `GET` request. I couldn't get this to work because D3 wouldn't import correctly. I settled on putting the D3 function as a script in an EJS file. This allowed me to send the data from the `GET` request to the EJS file.

This is what it ended up as in the app.js file:

    app.get('/users/:id', (req, res) => {
      const id = req.params.id

      Hiker.findById(id, '-log._id')
      .then(result => {
        res.render('user', { data: result.log })
      })
      .catch(err => {
        console.log(err);
      })
    })

And this is the line I used to import the data into an EJS file:

    var data = [<%- data %>];

Originally I imported using an equals sign: `<%= data %>`. This messed up the formatting of the data, so I had to change it to the minus sign: `<%- data %>`.

## PUT Request with HTML Forms

I struggled to figure out how to do a `PUT` request with an HTML form. HTML only allow you to use `POST` and `GET` methods, so I had to install [method-override](http://expressjs.com/en/resources/middleware/method-override.html). Inside your form element you have to put this:

    <form method="POST" action="/path?_method=PUT">

Which for my use translated to this (I used EJS to get the `_id`s for the route):

    <form method="POST" action="/users/<%= user_id %>/<%= hikeId %>?_method=PUT">

To update the file, I used the following in my `PUT` method:

    app.put('/users/:id/:hike', (req, res) => {
      var id = req.params.id;
      var hikeId = req.params.hike;

      var updateObject = {};

      Object.keys(req.body).forEach(key => {
            if(req.body[key] != '') {
              updateObject['log.$.' + key] = req.body[key];
            }
          });

      Hiker.updateOne(
        { _id: id, 'log._id': hikeId },
        { $set: updateObject },
        (err, doc) => {
          if (err) {
            console.log(err)
          } else {
            res.redirect('/users/' + id + '/' + hikeId);
          }
        }
      )
    })

By turning `req.body` into an array of keys, I was able to make the `updateObject` contain only the fields the user entered and to put the keys in the correct format for the `updateOne` method.

# D3 Scatter Plot

This is [the same D3 scatter plot](https://github.com/andyarensman/d3-hike-data-scatter-plot) I used when first practicing D3. Here is an example of what it looks like:

![Example Image](https://i.imgur.com/zIaEz3Q.gif)

# Future Plans

After I get this version up and running, I want to incorporate React for the front end.
