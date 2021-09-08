# Hiker Data Tracker

This web app is being built as a way to practice full stack development with Node, Express, MongoDB, Mongoose, EJS, and D3. It will allow the user to log in, input data they collect from hiking, then see a visualization of the data.

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
      name_first: {type: String, required: true},
      name_last: {type: String, required: true},
      email: {type: String, required: true},
      password: {type: String, required: true},
      date: {type: Date, default: Date.now},
      log: [hikeSessionSchema]
    })

*(Note: This will likely change before the app is complete.)*

# Challenges

## Login Systems with Passport

It took awhile to find a way to get a login system working with my set up. I found a lot of tutorials on using Passport without MongoDB and/or Mongoose, but very few with both. I ended up finding [this tutorial](https://www.youtube.com/watch?v=6FOq4cUdH8k&ab_channel=TraversyMedia) by [Traversy Media](https://www.youtube.com/channel/UC29ju8bIPH5as8OGnQzwJyA), which suited all my needs.

After Passport is set up following the tutorial above, I could access all the user's info using `req.user` in my app methods. I use `req.user._id` a lot to `findById`, `findByIdAndUpdate`, etc. to update, delete, and add data to MongoDB.

*(Note: The login system was one of the last main features I added.)*

## MongoDB to D3 via EJS

One of the biggest challenges I faced was getting the MongoDB data into D3. I originally had my D3 in a js file as a module and ran the module in a `GET` request. I couldn't get this to work because D3 wouldn't import correctly. I settled on putting the D3 function as a script in an EJS file. This allowed me to send the data from the `GET` request to the EJS file.

This is what it ended up as in the index.js file in the routes folder:

    app.get('/dashboard', (req, res) => {
      const id = req.user._id

      Hiker.findById(id, '-log._id')
      .then(result => {
        res.render('dashboard', { data: result.log })
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

    <form method="POST" action="/<path>?_method=PUT">

Which for my use translated to this (I used EJS to get the `_id`s for the route):

    <form method="POST" action="/dashboard/<%= hikeId %>?_method=PUT">

To update the file, I used the following in my `PUT` method:

    app.put('/dashboard/:hike', (req, res) => {
      var id = req.user._id;
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
            res.redirect('/dashboard/' + hikeId);
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

# Helpful Resources

- Sunlight StyleGuide DataViz by Amy Cesal: [[github]](https://github.com/amycesal/dataviz-style-guide/blob/master/Sunlight-StyleGuide-DataViz.pdf)
- FreeCodeCamp Data Visualization: [[freeCodeCamp certification]](https://www.freecodecamp.org/learn/data-visualization/)
- Node.js Crash Course Tutorial by [The Net Ninja](https://www.youtube.com/c/TheNetNinja): [[videos]](https://www.youtube.com/playlist?list=PL4cUxeGkcC9jsz4LDYc6kv3ymONOKxwBU)
- Node.js With Passport Authentication | Full Project by [Traversy Media](https://www.youtube.com/channel/UC29ju8bIPH5as8OGnQzwJyA): [[video]](https://www.youtube.com/watch?v=6FOq4cUdH8k&ab_channel=TraversyMedia) [[github]](https://github.com/bradtraversy/node_passport_login)
