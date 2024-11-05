// review / rating / createdAt / ref to tour / ref to user 
const mongoose = require('mongoose')
const Tour = require('./tourModel')

const reviewSchema = new mongoose.Schema({
    review: {
        type: String,
        required: [true, 'Review cannot be empty']
    },
    rating: {
        type: Number,
        min: 1,
        max: 5
    },
    createdAt: {
        type: Date,
        default: Date.now()
    },
    tour: {
        type: mongoose.Schema.ObjectId,
        ref: 'Tour',
        required: [true, 'Review must belong to a tour']
    },
    user: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: [true, 'Review must belong to a user']
    },
},{
    toJSON: {virtuals: true},
    toObject: {virtuals: true}
})


//populate the find query
reviewSchema.pre(/^find/, function(next){
    // this.populate({
    //     path: 'tour',
    //     select: 'name'
    // })
    this.populate({
        path: 'user',
        // select: '-__v -passwordChangedAt -passwordResetExpires -passwordResetToken'
        select: 'name photo'
    })
    next();
})

//statics method: takes the tour id
reviewSchema.statics.calcAverageRatings = async function(tourId){
    //the aggregation return a promise, await is needed
    const stats = await this.aggregate([
        {
            $match: {tour: tourId}
        },
        {
            $group: {
                //mentioning the field to be grouped by and the name of it in the schema
                _id: '$tour',
                //for each tour that was found add 1
                nRating: {$sum: 1},
                avgRating: {$avg: '$rating'} 
            }
        }
    ])
    //checking if the stats were right?
    // console.log(stats)

    if(stats.length > 0){

        //find the current tour and update it
        await Tour.findByIdAndUpdate(tourId, {
            ratingsQuantity: stats[0].nRating,
            ratingsAverage: stats[0].avgRating
        })    
    }else {
        await Tour.findByIdAndUpdate(tourId, {
            ratingsQuantity: 0,
            ratingsAverage: 4.5
        }) 
    }

}  

//we will create the previous statics method after every creation of a review to be counted in the avg
//post save Middleware // post middleware has no access to next()
reviewSchema.post('save', function(){
    //this point to the current review document
    //this.tour will be passed through the tourId parameter
    
    //if we used the Review model before it is assigning that is not gonna work
    //another way to point to the model is to use "this.constructor"
    this.constructor.calcAverageRatings(this.tour);
})

//findByIdAndUpdate == findOneAndUpdate
//findByIdAndDelete
//we only have query middleware but we dont have the access to this line "this.constructor.calcAverageRatings(this.tour);"

reviewSchema.pre(/^findOneAnd/, async function(next){
    //this in here only access the current query
    // The .clone() method creates a copy of the query, allowing you to fetch the review document without modifying the original query state
    this.r = await this.clone().findOne();
    console.log(this.r)
    next();
})

//we will pass data from the pre middleware to the post middleware
reviewSchema.post(/^findOneAnd/, async function(){
    //await this.findOne(); DOES NOT work here, query has already executed
    await this.r.constructor.calcAverageRatings(this.r.tour)
})


const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;

