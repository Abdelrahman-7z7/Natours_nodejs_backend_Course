const express = require('express')

//MIDDLEWARE TO PROTECT THE ROUTE 
const authController = require('../controller/authController')

//CONFIG THE CONTROLLER
const tourController = require('../controller/tourController')
// const reviewController = require('../controller/reviewController')
const reviewRouter = require('./reviewRoutes')

//ROUTER
const router = express.Router();

//PARAM MIDDLEWARE
// router.param('id', tourController.checkID)
//## this param works for the route that has /:id in it 
// ex:
// router.param('id', (req, res, next, val)=>{
//     console.log(`Tour id is ${val}`)
//     next();
// })

//TODO: nested route
// POST: /tour/tourID"4abd6464ds"/reviews and the user will come from the current logged in user info 
// GET: /tour/tourID"4abd6464ds"/reviews
// GET: /tour/tourID"4abd6464ds"/reviews/reviewId"4as2546fd"

// router
//     .route("/:tourId/reviews")
//     .post(
//         authController.protect,
//         authController.restrictTo('user'),
//         reviewController.createReview
//     )
//from here heading to reviewController to fetch the current user and tour's id 
router.use('/:tourId/reviews', reviewRouter)


router.route('/top-5-cheap').get(tourController.aliasTopTours, tourController.getAllTours)

router.route('/tour-stats').get(tourController.getTourStats)
router
    .route('/monthly-plan/:year')
    .get(
        authController.protect,
        authController.restrictTo('admin', 'lead-guide', 'guide'),
        tourController.getMonthlyPlan
    )

// app.get('/api/v1/tours', getAllTours);
//if we want to make a parameter optional we can id ? after /tours/:id/:name? NOW NAME IS OPTIONAL
// app.post('/api/v1/tours', createTour);
// a better way to make one route holds two type of http method

//finding tour within a radius throughout geo-spatial
router.route('/tours-within/:distance/center/:latlng/unit/:unit').get(tourController.getToursWithin)

//finding distances throughout geo-spatial aggregation
router.route('/distances/:latlng/unit/:unit').get(tourController.getDistances);

//using query
// /tours-within?distance=233&center=40,45&unit=mi
//instead we are gonna use it like this
// /tours-within/233/center/-40,45/unit/mi


//adding a middleware Checkbody to the post request
router.route('/')
    .get(
        //we want to expose this API for everyone
        // authController.protect,
        tourController.getAllTours
    )
    .post(
        authController.protect,
        authController.restrictTo('admin', 'lead-guide'),
        tourController.createTour
    );
//using the tourController checkBody middleware
// router.route('/').get(tourController.getAllTours).post(tourController.checkBody, tourController.createTour);

// app.get('/api/v1/tours/:id', getTourById);
// app.patch('/api/v1/tours/:id', updateTour);
// app.delete('/api/v1/tours/:id', deleteTour);

router.route('/:id')
    .get(tourController.getTourById)
    .patch(
        authController.protect,
        authController.restrictTo('admin', 'lead-guide'),
        tourController.updateTour)
    .delete(
        authController.protect,
        authController.restrictTo('admin', 'lead-guide'),
        tourController.deleteTour
    );




module.exports = router;