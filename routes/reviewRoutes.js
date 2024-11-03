const express = require('express')
const reviewController = require('../controller/reviewController')
const authController = require('../controller/authController')
//for accessing nested route add mergeParams: true
const router = express.Router({mergeParams: true})

router
    .route('/')
    .get(reviewController.getAllReviews)
    .post(
        authController.protect,
        authController.restrictTo('user'),
        //calling our middleware first
        reviewController.setTourUserIds,
        reviewController.createReview);

router
    .route('/:id')
    .get(reviewController.getReviewsById)
    .patch(reviewController.updateReview)
    .delete(reviewController.deleteReview)


module.exports = router;