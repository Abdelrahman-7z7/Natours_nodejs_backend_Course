const Review = require('../models/reviewModel')
const catchAsync = require('../utils/catchAsync');
const appError = require('../utils/appError');

exports.getAllReviews = catchAsync(async(req, res, next) => {
    const reviews = await Review.find();

    res.status(200).json({
        status:'success',
        result: reviews.length,
        data: {
            reviews
        }
    })
})

exports.createReview = catchAsync(async (req, res, next) => {

    //Allow nested routes
    if(!req.body.tour) req.body.tour = req.params.tourId;
    //from the protect middleware
    if(!req.body.user) req.body.user = req.user.id;

    const newReview = await Review.create(req.body);
    res.status(201).json({
        status:'success',
        data: {
            review: newReview
        }
    }) 
})