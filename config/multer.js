const multer = require('multer');
const path = require('path');
const fs = require('fs');

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
  limits:{fileSize: 20000000},
  fileFilter: function(req, file, cb){
    checkFileType(file, cb);
  }
}).single('myImage');

// Check File Type  ///////////////May need to change this for the bulk upload
function checkFileType(file, cb){
  // Allowed ext
  const filetypes = /jpeg|jpg|png|gif|csv/;
  // Check ext
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  // Check mime
  const mimetype = filetypes.test(file.mimetype);

  if(mimetype && extname){
    return cb(null,true);
  } else {
    cb('Error: Incorrect File Type!'); ///////////May need to change this
  }
}

const uploadCSV = multer({ dest: 'tmp/csv/' });

module.exports = {
  upload,
  uploadCSV
}
