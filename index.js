// 'use strict';
// const compression = require('compression')
const express = require('express')
const bodyParser = require('body-parser')
const PORT = process.env.PORT || 3001
const app = express()

// DATABASE
const MONGODB_URI = process.env.MONGO_URI || 'mongodb://localhost/paparanni'
// const db = require('./models')
const mongoose = require('mongoose')
mongoose.set('useNewUrlParser', true)
mongoose.set('useFindAndModify', false)
mongoose.set('useCreateIndex', true)


// Use gzip compression for serving files (where available/supported)
// app.use(compression())

// app.use(session({
//   secret: 'sekret',
//   resave: true,
//   saveUninitialized: false,
//   store: new MongoStore({
//     mongooseConnection: db
//   })
// }));

// make user ID available in templates
// app.use(function (req, res, next) {
//   res.locals.currentUser = req.session.userId;
//   next();
// });

// parse incoming requests
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

// serve static files from /public
app.use(express.static(__dirname + '/public'));

// view engine setup
app.set('view engine', 'pug');
app.set('views', __dirname + '/views');

// include routes
require('./routes')(app)

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  const err = new Error('File Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: err
  });
});

mongoose.connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })

app.listen(PORT, () => {
  console.log(`Express app listening on port ${PORT}`);
});
