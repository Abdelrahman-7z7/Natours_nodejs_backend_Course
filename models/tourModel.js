const mongoose = require('mongoose')
const slugify = require('slugify')
const validator = require('validator')

//Mongoose SChema
const tourSchema = new mongoose.Schema({
    name: {
         type: String,
         required: [true, "A tour must have a name"],
         unique: true,
         trim: true,
         maxlength: [40, 'A tour name must have less or equal then 40 characters'],
         minlength: [10, 'A tour name must have more or equal then 10 characters']
        //  validate: [validator.isAlpha, 'Tour name must only contain characters']
    },
    //the slugify will be used to the URL "Test Tour 3" => "test-tour-3"
    slug: String,
    duration: {
        type: Number, 
        required: [true, "A tour must have a duration"]
    },
    maxGroupSize:{
        type: Number,
        required: [true, "A tour must have a group size"]
    },
    difficulty:{
        type: String,
        required: [true, "A tour must have a difficulty"],
        enum: {
            values: ['easy', 'medium', 'difficult'],
            message: 'Difficulty is either: easy, medium, difficult'
        }
    }, 
    ratingAverage: {
         type: Number,
         default: 4.5,
         min: [1, 'Rating must be above 1.0'],
         max: [5, 'Rating must be below 5.0']
    },
    ratingsQuantity:{
        type: Number,
        default: 0
    },
    price: {
         type: Number,
         required: [true, "A tour must have a price"] 
    },
    priceDiscount: {
        type: Number,
        //custom validator if only returns either true or false 
        validate: {
            //this will hold the current document but in UPDATE method that won't work
            validator: function(val){
                return val < this.price; 
            },
            message: 'Price discount ({VALUE}) should be less than price'
        }
    },
    summary:{
        type: String,
        trim: true,
        required: [true, "A tour must have a summary"]
    },
    description: {
        type: String,
        trim: true,
        required: [true, "A tour must have a description"]
    },
    imageCover: {
        type: String,
        required: [true, "A tour must have a cover image"]
    },
    images: [String],
    createdAt: {
        type: Date,
        default: Date.now(),
        select: false
    },
    startDates: [Date],
    secretTour:{
        type: Boolean,
        default: false
    }
}, {
    //we define our options 
    //virtual to be part of the document
    toJSON: {virtuals: true}, 
    toObject: {virtuals: true}, 
});

//we used function() NOT ()=> "arrow function" because arrow function does not have the "this" keyword 
tourSchema.virtual('durationWeeks').get(function(){
    return this.duration/7;
})

//TODO:Document Middleware: runs before .save() and .create()
//every function in the middleware in mangoose has access to next()
tourSchema.pre('save', function(next){
    //we can see the document that is being processed
    // console.log(this)
    this.slug = slugify(this.name, {lower: true})
    next();
})

//NOTE: we can have multiple middleware for the same hook which is the event
tourSchema.pre('save', function(next){
    console.log('Will save the document...');
    next();
}) 

tourSchema.post('save', function(doc, next){
    // console.log(doc);
    next();
})

//TODO: QUERY MIDDLEWARE:
//IMPORTANT: the difference is now the "this" keyword will be pointing at the current query NOT THE CURRENT DOCUMENT
//Since using only find for our event won't be applied for findOne and findById then we can use this "/^find/" which means any event that starts will find
//at the same time the secretTour will be visible in aggregation method

tourSchema.pre(/^find/, function(next){
    this.find({secretTour: {$ne: true}})
    this.start = Date.now();
    next()
})

tourSchema.post(/^find/, function(docs, next){
    console.log(`Query took ${Date.now() - this.start} milliseconds`)
    // console.log(docs);
    next();
})

// ## AGGREGATION MIDDLEWARE
//"this" in here is actual  NOT HOLDING THE QUERY NEITHER DOCUMENT is actually holding aggregation method
tourSchema.pre('aggregate', function(next){
    this.pipeline().unshift({
        $match: {secretTour: {$ne: true}}
    })
    // console.log(this)
    next()
})

// A MODAL FOR THE MONGOOSE SCHEMA
const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;

//Mongoose Middleware

/**
 * // Middleware in mongoose called pre or post hooks
 * ## pre('event', function) ==> pre middleware
 * ## post('event', function) ==> post middleware
 * 
 * 
 * we can use it to make something happen between two events
 * ex: each time a new document is saved to the database we can tun a function between the save command is issued the actual saving of the document, or also after the actual savings 
 * 
 * //types of middleware in Mongoose:
 * 1- document
 * 2- aggregate
 * 3- query
 * 4- model middleware
 */