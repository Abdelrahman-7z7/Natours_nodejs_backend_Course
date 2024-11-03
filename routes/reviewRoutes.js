const express = require('express')
const reviewController = require('../controller/reviewController')
const authController = require('../controller/authController')
//for accessing nested route add mergeParams: true
const router = express.Router({mergeParams: true})

router
    .route('/')
    .get(reviewController.getAllReviews)
    .post(authController.protect, authController.restrictTo('user') ,reviewController.createReview);

module.exports = router;