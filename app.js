const createError = require('http-errors');
const express  = require('express');
const { json, urlencoded } = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const cors = require('cors');
dotenv.config();

require('./donation-model');

const app = express();

// Litmit access request from the same IP
const limiter = rateLimit({
  max: 1000,
  windowMs: 60 * 60 * 1000,
  message: 'Too many request from this IP, please try again in an hour!'
});

// CORS configuration
// const corsOptions = {
//   origin: 'http://localhost:3000', // Allow requests from this origin
//   methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
//   allowedHeaders: ['Content-Type', 'Authorization'],
//   credentials: true // Allow cookies to be sent with requests
// };

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

// DO NOT DELETE THESE TWO LINES
app.use(urlencoded({ extended: false }));
app.use( json({ verify: (req, res, buf) => { req.rawBody = buf; },}));

// GLOBAL MIDDLEWARES
app.use(express.json());
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/api', limiter); 
app.use(helmet());        
app.use(mongoSanitize());
app.use(cors());
app.use(cors({
  origin: ['http://localhost:8081', 'http://127.0.0.1:8081']
}));

// ROUTES
const stripeRoutes = require('./stripeRoutes');

app.use('/api/payments',  stripeRoutes);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

//
mongoose
  .connect(process.env.DB_URL)
  .then(() => console.log("Database connected"));

const port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log(`Server is running on PORT: ${port}`);
});

module.exports = app;