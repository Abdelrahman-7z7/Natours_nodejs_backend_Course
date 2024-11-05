const mongoose = require('mongoose')
const slugify = require('slugify')
const validator = require('validator')
const User = require('./userModel')

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
    ratingsAverage: {
         type: Number,
         default: 4.5,
         min: [1, 'Rating must be above 1.0'],
         max: [5, 'Rating must be below 5.0'],
         set: val => Math.round(val * 10) / 10 // 4.666667 * 10 => 46.6666, 47 / 10 => 4.7
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
    },
    //embedded / de-normalized database
    startLocation: {
        type: {
            type: String,
            default: 'Point',
            //specifying the possible options that this field can take
            enum: ['Point']
        },
        coordinates: [Number],
        address: String,
        description: String
    },
    locations: [
        {
            type:{
                type: String,
                default: 'Point',
                enum: ['Point'],
            },
            coordinates: [Number],
            address: String,
            description: String,
            day: Number
        }
    ],
    //embedding by pre save
    // guides: Array
    
    // referencing
    guides: [
        {
            //no need for the userModel to be imported in this situation of referencing
            type: mongoose.Schema.ObjectId,
            ref: 'User'
        }
    ]
}, {
    //we define our options 
    //virtual to be part of the document
    toJSON: {virtuals: true}, 
    toObject: {virtuals: true}, 
});

//improving the read performance
//1 => ascending / -1 => descending  
// tourSchema.index({price: 1})
tourSchema.index({price: 1, ratingsAverage: -1})
tourSchema.index({slug: 1})

//we need to attribute an index to the field where the geo-spatial data that is being searched for
tourSchema.index({startLocation: '2dsphere' })  // 2-dimension sphere 

//we used function() NOT ()=> "arrow function" because arrow function does not have the "this" keyword 
tourSchema.virtual('durationWeeks').get(function(){
    return this.duration/7;
})

//TODO: virtual populate
tourSchema.virtual('reviews', {
    //name of the model
    ref: 'Review',
    //the name of the foreign fields which stored in the review model
    foreignField: 'tour',
    //where the local id stored in the tour model
    localField: '_id'    
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

//retrieving the user as an embedded database before saving the document
// it is not a good idea to use embedded data for the limiting of mongoDB document size

// tourSchema.pre('save', async function(next){
//     //map is used to create an array
//     //since we used async function that means we are returning a bunch of promises
//     const guidesPromises = this.guides.map(async id => await User.findById(id));
//     //Promise.all will wait for all promises to resolve
//     this.guides = await Promise.all(guidesPromises);
//     next();
// })



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

//adding the populate tour guide as a child referencing for the user-id
//adding an object for implementing some options (populate)
//moving to a middleware for a best practice where we have it before every find query
tourSchema.pre(/^find/, function(next){
    this.populate({
        path: 'guides',
        select: '-__v -passwordChangedAt -passwordResetExpires -passwordResetToken'
    })
    next();
})

//TODO: AGGREGATION MIDDLEWARE
//"this" in here is actual  NOT HOLDING THE QUERY NEITHER DOCUMENT is actually holding aggregation method
// tourSchema.pre('aggregate', function(next){
//     this.pipeline().unshift({
//         $match: {secretTour: {$ne: true}}
//     })
//     // console.log(this)
//     next()
// })

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