const catchAsync = require("../utils/catchAsync");
const appError = require('../utils/appError')
const APIFeatures = require('../utils/apiFeatures')

exports.deleteOne = Model => catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndDelete(req.params.id);

    if(!doc){
        return next(new appError('No document found with that ID', 404))
    }

    res.status(204).json({
        status: 'success',
        data: null
    })
})

exports.updateOne = Model => catchAsync(async (req, res, nest) => {
    //new: true ==> means that we want this method to return a new document 
    const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true
    })

    if(!doc){
        return next(new appError('No document found with that ID', 404))
    }

    res.status(200).json({
        status: "success",
        data: {
            data: doc
        }
    })
})


exports.createOne = Model => catchAsync( async(req, res, next) => {
    //In async/await logic we need to handle errors using try/catch
    //both next line can do the same thing but one is simpler than the other and both does return a promise
    // const newTour = new Tour({})
    // newTour.save()        
    
    const doc = await Model.create(req.body)
    
    res.status(201).json({
        status:'success',
        data: {
            data: doc
        }
    })
})

exports.getOne = (Model, popOptions) => catchAsync( async(req, res, next) => {
    //tour.findOne({_id: req.params.id })
    //adding the populate tour guide as a child referencing for the user-id
    //adding an object for implementing some options (populate)
    //moving to a middleware for a best practice where we have it before every find query
    // const tour = await Tour.findById(req.params.id).populate({
    //     path: 'guides',
    //     select: '-__v -passwordChangedAt -passwordResetExpires -passwordResetToken'
    // });
    
    let query = Model.findById(req.params.id);

    if(popOptions) query = query.populate(popOptions);

    const doc = await query;
    

    if(!doc){
        return next(new appError('No document found with that ID', 404))
    }
    
    res.status(200).json({
        status: 'success',
        data: {
            data: doc
        }
    })

})

exports.getAll = Model => catchAsync( async (req, res, next) => {
    //  ##TWO WAYS OF OBTAINING THE QUERYS 
        
    // const tours = await Tour.find({
    //     duration: 5,
    //     difficulty:'easy'
    // })
    
    // const tours = await Tour.find().where('duration').equals(5).where('difficulty').equals('easy')
    
    // ## EXECUTE QUERY

    //To allow for nested GET reviews on Tour (coming from the review controller)
    let filter = {}
    if(req.params.tourId) filter = {tour: req.params.tourId}

    const features = new APIFeatures(Model.find(filter), req.query).filter().sort().limitFields().pagination(); 

    //explain is used to watch out the read performance
    // const doc = await features.query.explain();
    const doc = await features.query;

    res.status(200).json({
        status: 'success',
        result: doc.length,
        data: {
            data: doc
        }
    })
})








