const Review = require('../models/reviewModel')
// const catchAsync = require('../utils/catchAsync');
// const appError = require('../utils/appError');
const factory = require('./handlerFactory')


//middleware for setting the user and tour id
exports.setTourUserIds = (req, res, next) => {
    //allow nested routes
    if(!req.body.tour) req.body.tour = req.params.tourId;
    //from the protect middleware
    if(!req.body.user) req.body.user = req.user.id;
    next();
}


exports.getAllReviews = factory.getAll(Review)
exports.getReviewsById = factory.getOne(Review);
exports.createReview = factory.createOne(Review);
exports.deleteReview = factory.deleteOne(Review);
exports.updateReview = factory.updateOne(Review);


//### before adding the handler factory ###
// exports.getAllReviews = catchAsync(async(req, res, next) => {
//     //getting all reviews that belongs to one tourID
//     let filter = {}
//     if(req.params.tourId) filter = {tour: req.params.tourId}


//     const reviews = await Review.find(filter);

//     res.status(200).json({
//         status:'success',
//         result: reviews.length,
//         data: {
//             reviews
//         }
//     })
// })