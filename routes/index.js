'use strict';
const express = require('express');
const router = express.Router();
const User = require('../models/user');
const Photo = require('../models/photo');
const mid = require('../middleware');
const fs = require('fs');
const childProcess = require('child_process');
const multer = require('multer');
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './public/images/uploads/')
  },
  filename: function (req, file, cb) {
    // Limit the filename to 4 characters of the original name plus the date string
    var toPeriod = file.originalname.lastIndexOf('.')
    if(toPeriod >= 4) {
      cb(null, file.originalname.substring(0,4) + '-' + Date.now() + file.originalname.substring(toPeriod))
    } else {
      cb(null, file.originalname.substring(0,toPeriod) + '-' + Date.now() + file.originalname.substring(toPeriod))
    }
  }
})
// Image filtering function for the multer file upload
// limits docs uploaded to the following image filetypes
var imageFilter = function (req, file, cb) {
  if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
      return cb(new Error('Only image files are allowed!'), false);
  }
  cb(null, true);
};
// Sets the storage prop to the above-defined name and directory settings
// Sets the upload config to handle one file at a time with a form field 'name' = 'upl' 
var upload = multer({ 
  storage: storage,
  fileFilter: imageFilter
}).single('upl');

// GET /profile
router.get('/profile', mid.requiresLogin, function(req, res, next) {
  User.findById(req.session.userId)
      .exec(function (error, user) {
        if (error) {
          return next(error);
        } else {
          return res.render('profile', { title: 'Profile', name: user.name });
        }
      });
});

// GET /logout
router.get('/logout', function(req, res, next) {
  if (req.session) {
    // delete session object
    req.session.destroy(function(err) {
      if(err) {
        return next(err);
      } else {
        // Since there is only one user, when they log out, remove ALL sessions
        // db.sessions.deleteMany({});
        return res.redirect('/');
      }
    });
  }
});

// GET /login
router.get('/login', mid.loggedOut, function(req, res, next) {
  return res.render('login', { title: 'Log In'});
});

// POST /login
router.post('/login', function(req, res, next) {
  if (req.body.email && req.body.password) {
    User.authenticate(req.body.email, req.body.password, function (error, user) {
      if (error || !user) {
        var err = new Error('Wrong email or password.');
        err.status = 401;
        return next(err);
      }  else {
        req.session.userId = user._id;
        return res.redirect('/profile');
      }
    });
  } else {
    var err = new Error('Email and password are required.');
    err.status = 401;
    return next(err);
  }
});

// GET /upload
router.get('/upload', mid.requiresLogin, function(req, res, next) {
  if (req.session) {
    return res.render('upload', { title: 'Upload'});
  } else {
    return res.redirect('/');
  }
});

// POST /upload new photo, add to directory
router.post('/upload', mid.requiresLogin, upload, function(req, res, next) {
  if(req.file) {
    var tagArray = [],
        msg = '';
    // tag array is optional
    if(req.body.tags) {
      // Split by commas and one or more whitespace
      tagArray = req.body.tags.split(/[ ,]+/).filter(Boolean);
    }
    // Prepare document for the databse
    var db_photo_data = {
      filename: req.file.filename,
      originalname: req.file.originalname,
      tags: tagArray || []
    };
    // Save document to the database 
    Photo.create(db_photo_data, function(error, photo) {
      if(error) {
        return next(error);
      } else {
        // After original file is uploaded, create thumbnail image
        // pwd => paparanni-web-server/
        // mogrify -resize 510 -quality 100 -path public/images/uploads/thumbs/ public/images/uploads/*.jpg
        const fil = `mogrify -resize 510 -quality 100 -path public/images/uploads/thumbs/ public/images/uploads/${req.file.filename}`;
        console.log('Thumbnail creator:',fil);
        childProcess.exec(fil, function(error, stdout, stderr) {
          if(error) {
            var err = new Error('Failure to create thumbnails!');
            err.status = 500;
            return next(err);
          } else {
            msg = 'Sucessfully Uploaded: '+req.file.originalname+'! With tags: '+tagArray || '(none)';
            return res.render('upload',  { title: 'Upload', msg: msg } );
          }
        })
      }
    })
  } else { // there was no req.file submitted
      var err = new Error( 'You forgot to select a file.' );
      err.status = 400;
      return next(err);
  }
});

// GET /delete photos
router.get('/delete', mid.requiresLogin, function(req, res, next) {
  // Get all photos from the db to display for deletion selection
  Photo.find(function(err, photos) {
    if (err) {
      err.message = 'Server Error locating images.';
      return next(err);
    }
    if (!photos) {
      var err = new Error('No photos in the set.');
      err.status = 404;
      return next(err);
    }
    return res.render('delete', { title: 'Delete Pics', photos: photos });
  })
});

// POST /delete - deletes a specified image from the db and directory
router.post('/delete', mid.requiresLogin, function(req, res, next) {
  if(req.body.photoId && req.body.filename) {
    Photo.findByIdAndRemove(req.body.photoId, function(err, photo) {
      if (err) {
          err.message = 'Server Error locating image.'
          return next(err);
        }
        if (!photo) {
          var err = new Error('Image not found!');
          err.status = 404;
          return next(err);
        }
        // Successfully removed file from the database...
        // Delete from folder the original and thumbnail images
        var photoPath = './public/images/uploads/'+req.body.filename;
        var thumbPath = './public/images/uploads/thumbs/'+req.body.filename;
        fs.unlink(photoPath, function(err, result) {
          if(err) {
            return next(err);
          } else {
            fs.unlink(thumbPath, function(err, result) {
              if(err) {
                return next(err);
              } else {
                return res.redirect('/delete');
              }
            })
          }
        })
    });
  } else {
    var err = new Error('You must select a photo to delete it.');
    err.status = 404;
    res.next(err);
  }
});

// GET /about 
router.get('/about', function(req, res, next) {
  return res.render('about', { title: 'About' });  
});

// REST API returns JSON data or error
router.get('/api', function(req, res, next) {
  Photo.find(function(err, photos) {
    if (err) {
      err.message = 'Server Error locating images.';
      return next(err);
    }
    if (!photos) {
      var err = new Error('No photos in the set.');
      err.status = 404;
      return next(err);
    }
    var allTags = [];
    for(let i=0; i<photos.length; i++) {
      if(photos[i].tags) {
        photos[i].tags.forEach(function(tag) {
          allTags.push(tag);
        })
      }
    }
    // Remove empty taglists
    allTags = allTags.join().split(/[ ,]+/).filter(Boolean);
    var uniqueTags = Array.from(new Set(allTags));

    return res.json({
      title: "API",
      photos: "photos",
      tags: "uniqueTags"
    });
  });
});

// POST /
// Filters photos with tags specified from tagList POST request
router.post('/', function(req, res, next) {
  if(req.body.tagList) {
    var tagArray = req.body.tagList.split(/[ ,]+/).filter(Boolean);
    Photo.find({ tags: {$in: tagArray} 
    }, (err, photos) => {
      if(err) {
        err.message = 'Server error finding image tags.';
        return next(err);
      }
      if(!photos) {
        var err = new Error('No images have those tags.');
        err.status = 404;
        return next(err);
      }
      // Remove empty taglists
      tagArray = tagArray.join().split(/[ ,]+/).filter(Boolean);
      var uniqueTags = Array.from(new Set(tagArray));
      return res.render('index', { title: 'Home', photos: photos, tags: uniqueTags });
    });
  } else {
    return res.redirect('/');
  }
});

// GET / 
router.get('/', function(req, res, next) {
  Photo.find(function(err, photos) {
    if (err) {
      err.message = 'Server Error locating images.';
      return next(err);
    }
    if (!photos) {
      var err = new Error('No photos in the set.');
      err.status = 404;
      return next(err);
    }
    var allTags = [];
    for(let i=0; i<photos.length; i++) {
      if(photos[i].tags) {
        photos[i].tags.forEach(function(tag) {
          allTags.push(tag);
        })
      }
    }
    // Remove empty taglists
    allTags = allTags.join().split(/[ ,]+/).filter(Boolean);
    var uniqueTags = Array.from(new Set(allTags));
    return res.render('index', { title: 'Home', photos: photos, tags: uniqueTags });
  });
});

module.exports = router;
