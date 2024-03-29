
const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');


const tourRouter = require('./routes/tourRoutes');
const globalErrorHandler =  require('./controllers/errorController');
const userRouter = require('./routes/userRoutes');
const AppError = require('./utils/appError'); 
const { mongo } = require('mongoose');
const reviewRouter = require('./routes/reviewRoutes');
const app = express();

//1)middleware
//set security HTTP headers
app.use(helmet())

//Development login
if(process.env.NODE_ENV === 'development'){
    app.use(morgan('dev'));
}

//Limit request from same API
const limiter = rateLimit({
    max: 100,
    window: 60*60*1000,
    message: 'Too many requests from this IP, please try again in an hour'
});

app.use('/api',limiter);


//Body parser, reading data from body into req.body
app.use(express.json({limit: '10kb'}));

//Data sanitization against NoSql query injection
app.use(mongoSanitize());

//Data sanitization against XSS
app.use(xss());

//Prevent parameter pollution
app.use(hpp({
    whitelist: ['duration' ,
     'ratingsQuantity',
     'ratingAverage',
     'maxGroupSize',
     'difficulty',
     'price'
    ]
}));

//Serving static files
app.use(express.static(`${__dirname}/public`));


//3)Routes
//use is for middleware
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews' , reviewRouter);
app.all('*' , (req, res , next) =>{
    next(new AppError(`Can't find ${req.originalUrl} on this server`, 404));
});

app.use(globalErrorHandler);

//4)Server

module.exports = app;