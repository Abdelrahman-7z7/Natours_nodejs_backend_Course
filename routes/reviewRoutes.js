const express = require('express')
const reviewController = require('../controller/reviewController')
const authController = require('../controller/authController')
//for accessing nested route add mergeParams: true
const router = express.Router({mergeParams: true})

//Protect all the review's routes
router.use(authController.protect);

router
    .route('/')
    .get(reviewController.getAllReviews)
    .post(
        authController.restrictTo('user'),
        //calling our middleware first
        reviewController.setTourUserIds,
        reviewController.createReview
    );

router
    .route('/:id')
    .get(reviewController.getReviewsById)
    .patch(authController.restrictTo('user', 'admin'), reviewController.updateReview)
    .delete(authController.restrictTo('user', 'admin'), reviewController.deleteReview)


module.exports = router;