# Hiker Data Tracker

This web app was built as a way to practice full stack development with Node, Express, MongoDB, Mongoose, EJS, and D3. It allows the user to log in, input data they collect from hiking, then see a visualization of the data as well as upload images. I organized it using an MVC approach.

[Check out the app here](https://hiking-data-logger.herokuapp.com/) *(mobile browser version not available yet - coming soon)*

Heroku is removing the free tier, so I will need to change the hosting location soon.

## Table of Contents
<ul>
  <li><a href="#mongoose-schemas">Mongoose Schemas</a></li>
  <li><a href="#challenges">Challenges</a></li>
  <ul>
    <li><a href="#login">Login Systems with Passport</a></li>
    <li><a href="#reset">Password Reset</a></li>
    <li><a href="#d3">MongoDB to D3 via EJS</a></li>
    <li><a href="#put">PUT Request with HTML Forms</a></li>
    <li><a href="#bulk">Bulk Upload with a CSV File</a></li>
    <li><a href="#imgur">Uploading Photos with Imgur API</a></li>
    <li><a href="#footer">Always on the Bottom Footer</a></li>
    <li><a href="#graph">D3 Scatter Plot</a></li>
  </ul>
  <li><a href="#future">Future Plans</a></li>
  <li><a href="#helpful">Helpful Resources</a></li>
</ul>

<a id="mongoose-schemas"></a>
### Mongoose Schemas

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
        notes: String,
        image_url: Schema.Types.Mixed
      });

    const hikerSchema = new mongoose.Schema({
      name_first: {type: String, required: true},
      name_last: {type: String, required: true},
      email: {type: String, required: true},
      password: {type: String, required: true},
      date: {type: Date, default: Date.now},
      resetPasswordToken: String,
      resetPasswordExpires: Date,
      log: [hikeSessionSchema]
    });

<a id="challenges"></a>
## Challenges

<a id="login"></a>
### Login Systems with Passport

It took awhile to find a way to get a login system working with my set up. I found a lot of tutorials on using Passport without MongoDB and/or Mongoose, but very few with both. I ended up finding [this tutorial](https://www.youtube.com/watch?v=6FOq4cUdH8k&ab_channel=TraversyMedia) by [Traversy Media](https://www.youtube.com/channel/UC29ju8bIPH5as8OGnQzwJyA), which suited all my needs.

After Passport is set up following the tutorial above, I could access all the user's info using `req.user` in my app methods. I use `req.user._id` a lot to `findById`, `findByIdAndUpdate`, etc. to update, delete, and add data to MongoDB.

<a id="reset"></a>
### Password Reset

To allow the user to reset their password if they forgot it, I used [this tutorial](http://sahatyalkabov.com/how-to-implement-password-reset-in-nodejs/) by Sahat Yalkabov. The tutorial is a little outdated (2014), so I had to change a few things. To get `nodemailer` to work, remove the `'SMTP'` argument from the `createTransport` methods. To get `SendGrid` working, you need to make an account, then go under settings => api keys and create a key. Back in the `createTransport` method, `auth.user` will always be `apikey` and `auth.pass` will be the api key you created on `SendGrid`. You will likely want to use `.env` with your api key.

Sahat also left out encrypting the new password, so I had to do that using `bcrypt` like I did for creating a new user.

<a id="d3"></a>
### MongoDB to D3 via EJS

One of the first challenges I faced was getting the MongoDB data into D3. I originally had my D3 in a js file as a module and ran the module in a `GET` request. I couldn't get this to work because D3 wouldn't import correctly. I settled on putting the D3 function as a script in an EJS file. This allowed me to send the data from the `GET` request to the EJS file.

This is the basic form of the `GET` request I ended up with:

    app.get('/dashboard', (req, res) => {
      const id = req.user._id

      Hiker.findById(id)
      .then(result => {
        res.render('dashboard', { data: result.log });
      })
      .catch(err => {
        console.log(err);
      });
    });

And this is the line I used to import the data into an EJS file:

    var data = [<%- JSON.stringify(data) %>];

Originally I imported using an equals sign: `<%=`. This messed up the formatting of the data, so I had to change it to the minus sign: `<%-`.

<a id="put"></a>
### PUT Request with HTML Forms

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
    });

By turning `req.body` into an array of keys, I was able to make the `updateObject` contain only the fields the user entered and to put the keys in the correct format for the `updateOne` method.

<a id="bulk"></a>
### Bulk Upload with a CSV File

I wanted to include an option for the user to add multiple hikes at once via a spreadsheet. I ended up finding this tutorial by Jamie Munro: [Bulk Import a CSV File Into MongoDB Using Mongoose With Node.js](https://code.tutsplus.com/articles/bulk-import-a-csv-file-into-mongodb-using-mongoose-with-nodejs--cms-29574).

*Important Note: If you want to follow this same tutorial, make sure you install version 2.4.1 of `fast-csv`. Newer versions did not work with this tutorial.*

There were a few things I had to alter from the guide. In Jamie's version, he only had one Mongoose schema, not a schema in a schema. For the photo upload section of my code, I had to use `multer` which clashes with `express-fileupload`, so I had to use multer here, too, which Jaime did not use. Here's what the first version looked like:


    const multer = require('multer');
    const path = require('path');
    const fs = require('fs');

    router.post('/dashboard/bulk_add', uploadCSV.single('myCSV'), (req, res) => { //'myCSV' comes from the form
      const id = req.user._id;

      if (!req.file) {
        return res.status(400).send('No files were uploaded.');
      }

      var hikesFile = \`./tmp/csv/${req.file.filename}\`;
      var updateObjectArray = [];

      csv.fromPath(hikesFile, { //needs to be fromPath for Multer
          headers: true,
          ignoreEmpty: true
        })
        .on('data', (data) => {
          data['_id'] = new mongoose.Types.ObjectId();
          updateObjectArray.push(data);
        })
        .on('end', () => {
          //Different Code Here
          Hiker.findByIdAndUpdate(
            id,
            {$push : {log: { $each: updateObjectArray } } },
            {new: true},
            (error, updatedUser) => {
              if(!error) {
                res.redirect('/dashboard')
              }
            }
          )
        })
        //delete file locally
        fs.unlink(\`./tmp/csv/${req.file.filename}\`, (err) => {
          if (err) {
            console.error(err)
            return
          }
          console.log('file deleted')
          })
      });

  In order to add multiple subdocuments at once, you need the line `{$push : {log: { $each: updateObjectArray } } }` within `findByIdAndUpdate` - `log` is the array of subdocuments, `$push` allows you to add to it, and `$each` allows you to add multiple.

  This is what my basic form looks like:

    <form method="POST" encType="multipart/form-data">
      <input type="file" name="myCSV" accept="*.csv"/>
      <input type="submit" value="Submit"/>
    </form>

  For the csv template, I had to change a few lines from Jamie's as well. This is what worked for me:

    const json2csv = require('json2csv').parse;

    exports.get = function(req, res) {

        var csv = json2csv({
          hike_name: '',
          hike_date: 'YYYY-MM-DD',
          mileage: '0.00',
          time: '00:00:00',
          elevation_gain: '0',
          min_elevation: '0',
          max_elevation: '0',
          average_pace: '00:00',
          average_bpm: '0',
          max_bpm: '0',
          city: '',
          location: '',
          notes: ''
        });

        res.set("Content-Disposition", "attachment;filename=hikes_template.csv");
        res.set("Content-Type", "application/octet-stream");

        res.send(csv);

    };


Later I ended up adding a review page in between the csv file being uploaded and the data being sent to MongoDB. This page allows the user to review their spreadsheet before submitting it and make sure the data is in the correct format.

<a id="imgur"></a>
### Uploading Photos with Imgur

I wanted to have a way for users to include a photo with each of their hikes, but as I understand it, MongoDB doesn't really allow you to store photos. So I decided to use Imgur to store the image and then put a link to the image in the `hikeSession` schema in MongoDB. The upload time doesn't seem to be very fast compared with other image upload websites, but it is fine for this application.

To get this system to work, I needed to use `multer` and `imgur` version 1.0.2 (there is a version 2 in the works, but I had trouble with it). The user uploads the photo via multer to a folder in my server, then my server sends it to Imgur, Imgur sends back an object with a link to the image, my server updates MongoDB, and then deletes the image from the server folder.

    const mongoose = require('mongoose');
    const imgur = require('imgur');
    const multer = require('multer');
    const path = require('path');
    const fs = require('fs');
    const { HikeSession, Hiker } = require('../models/hikeSchemas');

    // Set The Storage Engine
    const storage = multer.diskStorage({
      destination: './public/uploads/',
      filename: function(req, file, cb){
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
      }
    });

    // Init Upload Multer
    const upload = multer({
      storage: storage,
      limits:{fileSize: 20000000}
    }).single('myImage');

    app.post('/dashboard/hike_details/:hike', (req, res) => {
      var hikeId = req.params.hike;
      const id = req.user._id;

      upload(req, res, (err) => {
        if (err) {
          console.log(err)
        } else {
          if (req.file == undefined) {
            console.log('Error: No File Selected')
            req.flash('dashboard_error_msg', 'No File Selected');
            res.redirect('/dashboard/hike_details/' + hikeId);
          } else {
            console.log('File Uploading');

            //Send to imgur
            imgur
              .uploadFile(`./public/uploads/${req.file.filename}`)
              .then((json) => {

                //Add image link and information to mongodb
                Hiker.updateOne(
                  { _id: id, 'log._id': hikeId },
                  { $set: { 'log.$.image_url': json } },
                  (err, doc) => {
                    if (err) {
                      console.log(err)
                    } else {
                      req.flash('dashboard_success_msg', 'Successfully Added Image');
                      res.redirect('/dashboard/hike_details/' + hikeId);
                    }
                    //Delete file locally
                    fs.unlink(`./public/uploads/${req.file.filename}`, (err) => {
                      if (err) {
                        console.error(err)
                        return
                      }
                      console.log('file deleted')
                    })
                  }
                )
              })
              .catch((err) => {
                console.error(err.message);
              });
          }
        }
      });
    });

After the photo is uploaded, I wanted to make sure that the user could delete not only the image link from my database but also the image off of Imgur. Luckily, the json object that Imgur sends you after uploading your image includes a delete hash that can be sent back to remove the image.

    imgur
      .deleteImage(deletehash)
      .then((status) => {
        console.log(status);
      })
      .catch((err) => {
        console.error(err.message);
      });

I tried to implement the image uploader on my edit page, but ran into some problems. For some reason Imgur would not except the image when it was in the edit form I made earlier. I kept getting an error that read: `EPERM: operation not permitted, stat '(path to the file)'`. I wasn't able to figure out why this was happening, so as a work around I made a separate form and `POST` and that seemed to work fine.

Another weird thing was that according to the Imgur API docs, you need a client ID to be able to work with them. I went through the steps to set that up, but with `npm imgur` installed, it didn't seem like I actually needed the client ID to make it work. It's possible I misunderstood this step though.

<a id="footer"></a>
### Always on the Bottom Footer

There are quite a few Stack Overflow questions about how to get your footer to always be at the bottom of the page, but people mean different things when they ask this. Some people want the footer to be sticky - always at the bottom of the view window no matter how far you scroll. I wanted my footer to always be the last thing on the page, at the bottom of the view window, but not visible if you can scroll on the page.

After much trial and error, I ended up finding [this CodePen](https://codepen.io/cbracco/pen/zekgx) by Chris Bracco which did the trick.

HTML:

    <html>
      <body>
        <PAGE CONTENT>
        <FOOTER>
      </body>
    </html>

CSS:

    html {
      height: 100%;
      box-sizing: border-box;
    }

    *,
    *:before,
    *:after {
      box-sizing: inherit;
    }

    body {
      position: relative;
      margin: 0;
      padding-bottom: 6rem;
      min-height: 100%;
    }

    footer {
      position: absolute;
      right: 0;
      bottom: 0;
      left: 0;
    }

<a id="graph"></a>
### D3 Scatter Plot

This is [the same D3 scatter plot](https://github.com/andyarensman/d3-hike-data-scatter-plot) I used when first practicing D3. Here is an example of what it looks like:

![Example Image](https://i.imgur.com/zIaEz3Q.gif)

<a id="future"></a>
## Future Plans

There are a few features I may try to add and a few minor things I may try to fix at some point in the near future:

- Allow users to select a date range of their data, or have tabs to jump between different years.
- Allow users to share their profiles either as a series of images or their entire profiles.
- Incorporate settings that allow for some customization like hiding fields the user doesn't use (BPM, notes, etc.)
- Allow users to upload pictures from their home page.
- Show the users' notes on the home page somehow, rather than having to click on the hike in the table.
- When the user hovers over a hike in their home page table, a pop up of their hike's image shows (if they have one).
- Upload multiple images per hike (but still keep it limited).
- In the home page table, highlight top stats.
- When users click on a point in the graph, it jumps down to that hike in the table.
- Add a new page like the details page, but it shows all hikes (or selected range).
- Make it work on a mobile browser.
- Improve the CSS.

<a id="helpful"></a>
## Helpful Resources

- Sunlight StyleGuide DataViz by Amy Cesal: [[github]](https://github.com/amycesal/dataviz-style-guide/blob/master/Sunlight-StyleGuide-DataViz.pdf)
- FreeCodeCamp Data Visualization: [[freeCodeCamp certification]](https://www.freecodecamp.org/learn/data-visualization/)
- Node.js Crash Course Tutorial by [The Net Ninja](https://www.youtube.com/c/TheNetNinja): [[videos]](https://www.youtube.com/playlist?list=PL4cUxeGkcC9jsz4LDYc6kv3ymONOKxwBU)
- Node.js With Passport Authentication | Full Project by [Traversy Media](https://www.youtube.com/channel/UC29ju8bIPH5as8OGnQzwJyA): [[video]](https://www.youtube.com/watch?v=6FOq4cUdH8k&ab_channel=TraversyMedia) [[github]](https://github.com/bradtraversy/node_passport_login)
- Bulk Import a CSV File Into MongoDB Using Mongoose With Node.js by Jamie Munro: [[article]](https://code.tutsplus.com/articles/bulk-import-a-csv-file-into-mongodb-using-mongoose-with-nodejs--cms-29574)
- Error, Success, Warning, and Info Messages with CSS by Isabel Castillo: [[article]](https://isabelcastillo.com/error-info-messages-css)
- CSS "Always on the Bottom" Footer by Chris Bracco: [[CodePen]](https://codepen.io/cbracco/pen/zekgx)
- How To Implement Password Reset In Node.js by Sahat Yalkabov: [[article]](http://sahatyalkabov.com/how-to-implement-password-reset-in-nodejs/)
- Node.js Image Uploading With Multer by [Traversy Media](https://www.youtube.com/channel/UC29ju8bIPH5as8OGnQzwJyA): [[video]](https://www.youtube.com/watch?v=9Qzmri1WaaE)
