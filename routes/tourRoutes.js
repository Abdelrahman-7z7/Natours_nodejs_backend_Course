const express = require('express')

//MIDDLEWARE TO PROTECT THE ROUTE 
const authController = require('../controller/authController')

//CONFIG THE CONTROLLER
const tourController = require('../controller/tourController')

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

router.route('/top-5-cheap').get(tourController.aliasTopTours, tourController.getAllTours)

router.route('/tour-stats').get(tourController.getTourStats)
router.route('/monthly-plan/:year').get(tourController.getMonthlyPlan)

// app.get('/api/v1/tours', getAllTours);
//if we want to make a parameter optional we can id ? after /tours/:id/:name? NOW NAME IS OPTIONAL
// app.post('/api/v1/tours', createTour);
// a better way to make one route holds two type of http method

//adding a middleware Checkbody to the post request
router.route('/')
.get(authController.protect, tourController.getAllTours)
.post(tourController.createTour);
//using the tourController checkBody middleware
// router.route('/').get(tourController.getAllTours).post(tourController.checkBody, tourController.createTour);

// app.get('/api/v1/tours/:id', getTourById);
// app.patch('/api/v1/tours/:id', updateTour);
// app.delete('/api/v1/tours/:id', deleteTour);

router.route('/:id')
.get(tourController.getTourById)
.patch(tourController.updateTour)
.delete(authController.protect, authController.restrictTo('admin', 'lead-guide'),tourController.deleteTour);


module.exports = router;