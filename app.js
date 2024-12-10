const path = require('path');
const express = require('express');
const morgan = require('morgan')
//security imports
const rateLimit = require('express-rate-limit')
const helmet = require('helmet')
const mongoSanitize = require('express-mongo-sanitize')
const xss = require('xss-clean')
const hpp = require('hpp')

//error handling
const gloablErrorHandler = require('./controller/errorController')
const AppError = require('./utils/appError')

//CONFIG THE ROUTES
const tourRouter = require('./routes/tourRoutes')
const userRouter = require('./routes/userRoutes')
const reviewRouter = require('./routes/reviewRoutes')

//enable cors
const app = express();

// setting Pug template //defined a new engine
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'))


// Serving static files
//accessing the overview.html and that can be done with the next line but in the URL we dont use the /public (express will sit it to the root "/" url) instead we use
// 127.0.0.1:3000/overview.html
app.use(express.static(path.join(__dirname, 'public')))

//1) GLOBAL MIDDLEWARES

//set security http headers
app.use(helmet())

//development logging 
//check whether we are running in the development or in production 
if(process.env.NODE_ENV.trim() === 'development'){
    app.use(morgan('dev'))
}


/**For my coming application:
 * // High-frequency limit for general browsing (e.g., viewing posts)
const generalLimiter = rateLimit({
    max: 500, // allow 500 requests per hour per IP
    windowMs: 60 * 60 * 1000, // 1 hour
    message: "Too many requests from this IP, please try again later."
    });
    
    // Stricter limit for write actions (e.g., creating comments or posts)
    const writeLimiter = rateLimit({
        max: 20, // allow 20 requests per hour per IP
        windowMs: 60 * 60 * 1000, // 1 hour
        message: "Too many requests for posting actions. Please wait an hour."
        });
        */
       
//Implementing a global middle ware for rate limiting (counting the requests coming from one id and when it cross the limit we will block it )
// preventing denial-of-service from brutal attack
// ## 1) create limiter
const limiter = rateLimit({
    //adjust the limit here to suit your applications requests and the time as well 
    max: 100, // down to 3 for testing  // 429 TOO MANY REQUEST
    windowMs: 60 * 60 * 1000, // 1 hour 
    message: "Too many request from this IP, please try again in an hour!"
})

//this will basically apply the changes for any request coming from a route that starts with "/api" 
app.use('/api', limiter);


// Middleware: a function that runs before the handler function. // so we need this for the request in the body 
//Body parser, reading data from body into req.body
//set a limit for not accepting a body that exceed 10kb
app.use(express.json({limit: '10kb'}));
 
// ## using the next to package after fetching the data in req.body by the express.json

// Data sanitization against NoSQL query injection
app.use(mongoSanitize());

// Data sanitization against XSS (cross-site scripting attack)
//preventing from malicious HTML code with some JS code attached to it
app.use(xss())

//preventing parameter pollution
//clean up the query string ==> {{URL}}api/v1/tours?sort=duration&sort=price // we cant have a duplicated parameter  
//we can add whitelist for some parameter
app.use(hpp({
    whitelist: [
        'duration',
        'ratingsAverage',
        'ratingsQuantity',
        'maxGroupSize',
        'difficulty',
        'price',
    ]
}));



app.use((err, req, res, next) => {
    if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
        return res.status(400).json({
            status: 'fail',
            message: 'Invalid JSON'
        });
    }
    next();
});


//a middleware 
// ##since we didnt specify any route that will be applied to all routes after this middleware (the place change a lot)
// app.use((req,res,next)=>{
//     console.log('Hello from the middleware ✌️')
//     //without calling the next function it will stuck here since we are not sending any respond back
//     next();
// })

//test middleware 
//adding a middleware to know when the request has happened and this will be applied to the next routes only no the one create before this middleware got created
app.use((req,res,next)=>{
    req.requestTime = new Date().toISOString();
    //this is how we know if the token where sent to the headers along with the URL
    // console.log(req.headers)
    next();
})



//TODO: 2) USER ROUTE HANDLER ==> moved to routes folder 


// 3) ROUTES>
app.get('/', (req, res) => {
    res.status(200).render('base', {
        tour: 'The Forest Hiker',
        user: 'Jonson',
        
    });
})

app.get('/overview', (req, res) => {
    res.status(200).render('overview', {
        title: 'All Tours'
    })
})

app.get('/tour', (req, res) => {
    res.status(200).render('overview', {
        title: 'All Tours'
    })
})



app.use('/api/v1/tours', tourRouter)
app.use('/api/v1/users', userRouter)
app.use('/api/v1/reviews', reviewRouter)

//HANDLES THAT NOT FOUND ROUTE ##MIDDLEWARE
// all() == get, post, put etc...
// * ==> stands for anything
// why we use it in end of the file? because if we reached this point then all the urls above are not caught by any req
app.all('*', (req,res,next)=>{
    // res.status(404).json({
    //     status: 'fail',
    //     message: `Can't find ${req.originalUrl} on this server.`
    // })

    // const err = new Error(`Can't find ${req.originalUrl} on this server.`);
    // err.status = 'fail';
    // err.statusCode = 404;

    //if next() received an argument express will always knows that there was an error and NOTHING ELSE BUT ERROR
    //if we used the next and passed an argument all the middlewares in the between will be skipped and express will jump to the error handling middleware
    next(new AppError(`Can't find ${req.originalUrl} on this server.`, 404) )    
})

//ERROR HANDLING MIDDLEWARE: by defining 4 parameters express knows that this is an error handling middleware
app.use(gloablErrorHandler) 

// 4) START THE SERVER
module.exports = app;


//API: Application Programming Interface: a piece of software that can be used by another piece of software, in order to allow applications to talk to each other.

// But 'application' can be other things:
/**
 * 1- Node.js fs or http APIs("node APIs")
 * 2- Browser's DOM Javascript API
 * 3- wit object oriented programming, when exposing methods to the public, we are creating an API
 * 
 * ## REST (Representational States Transfer) architecture:
 * is basically a way of building web APIs in a logical way, making them easy to consume 
 * 
 * the steps to be followed:
 * 1- Separate API into logical resources:
 * 
 *  ## Resource: Object or representation of something, which has data 
 *      associated to it. Any information that can be named can be a resource
 *  ## ex: tours, users, reviews
 * 
 * 
 * 2- expose structured, resource-based URLs:
 *      ## ex: http://www.natours.com/addNewTour
 *      ## and this called an API endpoint (/addNewTour)
 *      ## endpoint: should contain only resources (nouns), and use HTTP methods for actions.
 * 
 * 3- use (http) methods (verbs): the API should use the right http method not the URL:
 * 
 *  1. /getTour ==> must be sent to the get http method and named as (/tours) only.
 *  2. /addNewTour ==> must be sent to the post (used to create a new resource) http method and named as (/tours/id) only
 *  3. /updateTour ==> must be sent to the put/patch (update an existing resource) http method and named as (/tours/id) only.
 *                      put: the user must send the whole updated object
 *                      patch: the user can send only the part that has been changed
 *  4. /deleteTour ===> must be sent to the delete (delete an existing resource) http method and named as (/tours/id) only.
 *  5. /getToursByUser ===> must be sent to the get http method and named as (/users/3/tours)
 *  6. /deleteTourByUser ===> must be sent to the delete http method and named as (/users/3/tours/9)
 * 
 * 4- send the data as JSON (usually)
 *      ## we might use JSend instead and it structured as this:
 *       { "status": "success",
 *          "data": { "
*               "id": "5"
 *               "name": "Eiffel Tower",
 *               "duration": 30,
 *               "price": 1000
 *      }              
 * 
 * 5- must be stateless RESTful APIs:
 *      All states is handled on the client. this means that each request must contain all the information necessary to process 
 *      a certain request.
 *      The server should not have to remember the previous requests.
 *      ex: loggedIn, currentPage.
 * 
 * 
 * 
 * NOTE: CRUD operations, is the term that used to define the basic operations that user
 *       can perform on the server (Create, Read, Update, Delete)
 */

/**
 * ERROR HANDLING IN EXPRESS: overview
 * 
 * Types of error:
 * 
 * 1- operational error:
 *      # problems that we can predict will happen at some point, so we just need to handle them in advanced
 * 
 *      1- invalid path accessed
 *      2- invalid user input(validator error from mongoose)
 *      3- failed to connect to server
 *      4- failed to connect to the database
 *      5- request timeout
 *      6- etc...
 *  
 * 1- Programming error:
 *      # bugs that we developers introduce into our code. Difficult to find and handle
 * 
 *      1- reading properties on undefined
 *      2- passing a number when an object is expected
 *      3- using await without sync
 *      4- using req.query instead of req.body
 *      5- etc... 
 */
