const fs = require('fs');
const Tour = require('../models/tourModel')
const APIFeatures = require('../utils/apiFeatures')
const catchAsync = require('../utils/catchAsync');
const appError = require('../utils/appError');

//Middleware
exports.aliasTopTours = (req, res, next) => {
    //we are prefilling the query string even if the user did not specify it but hit the /top-5-cheap route
    req.query.limit = '5';
    req.query.sort = '-ratingAverage,price';
    req.query.fields = 'name,price,ratingAverage,summary,difficulty'
    next();
}




//TODO: 2) TOURS ROUTES HANDLER
exports.getAllTours = catchAsync(async (req, res, next) =>{

    //  ##TWO WAYS OF OBTAINING THE QUERYS 
    
    // const tours = await Tour.find({
    //     duration: 5,
    //     difficulty:'easy'
    // })
    
    // const tours = await Tour.find().where('duration').equals(5).where('difficulty').equals('easy')
    
    // ## EXECUTE QUERY
    const features = new APIFeatures(Tour.find(), req.query).filter().sort().limitFields().pagination(); 

    const tours = await features.query;

    res.status(200).json({
        status: 'success',
        result: tours.length,
        data: {
            tours
        }
    })

    // try{
        
    // } catch (err){
    //     res.status(400).json({
    //         status: 'fail',
    //         message: err.message
    //     })
    // }
});

exports.getTourById = catchAsync( async (req,res,next) =>{
    //tour.findOne({_id: req.params.id })
    //adding the populate tour guide as a child referencing for the user-id
    //adding an object for implementing some options (populate)
    //moving to a middleware for a best practice where we have it before every find query
    // const tour = await Tour.findById(req.params.id).populate({
    //     path: 'guides',
    //     select: '-__v -passwordChangedAt -passwordResetExpires -passwordResetToken'
    // });

    const tour = await Tour.findById(req.params.id)

    if(!tour){
        return next(new appError('No tour found with that ID', 404))
    }

    res.status(200).json({
        status: 'success',
        data: {
            tour
        }
    })
    // try{
    // }catch (err){
    //     res.status(404).json({
    //         status: 'fail',
    //         message: `No tour found with id ${req.params.id}`
    //     })
    // }
});

exports.createTour = catchAsync(async (req,res,next)=>{
    //In async/await logic we need to handle errors using try/catch
    //both next line can do the same thing but one is simpler than the other and both does return a promise
    // const newTour = new Tour({})
    // newTour.save()        

    const newTour = await Tour.create(req.body)

    res.status(201).json({
        status:'success',
        data: {
            tour: newTour
        }
    })

    // try{
    // }catch (err) {
    //     res.status(400).json({
    //         status: 'fail',
    //         message: err.message
    //     })
    // }
});

exports.updateTour = catchAsync(async (req,res,next)=>{
    //new: true ==> means that we want this method to return a new document 
    const tour = await Tour.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true
    })

    if(!tour){
        return next(new appError('No tour found with that ID', 404))
    }

    res.status(200).json({
        status: "success",
        data: {
            tour
        }
    })
    // try{
    // }catch (err){
    //     res.status(400).json({
    //         status: 'fail',
    //         message: err.message
    //     })
    // }
});

exports.deleteTour = catchAsync(async (req,res,next)=>{
    const tour = await Tour.findByIdAndDelete(req.params.id);

    if(!tour){
        return next(new appError('No tour found with that ID', 404))
    }

    res.status(204).json({
        status: 'success',
        data: null
    })
    // try{
    // }catch (err){
    //     res.status(400).json({
    //         status: 'fail',
    //         message: err.message
    //     })
    // }
});

//aggregation pipeline (get tour statistic)
exports.getTourStats = catchAsync(async (req, res,next) => {
    //_id: 'difficulty' ==> means group by difficulty attribute statistics for 'easy', 'medium', and 'difficult' ==> 3 groups obtained 
    const stats = await Tour.aggregate([
        {
            $match: {ratingAverage: {$gte: 4.5}}
        },
        {
            $group: {
                _id: {$toUpper: '$difficulty'},
                numTour: {$sum: 1},
                numRating: {$sum: '$ratingQuantity'},
                avgRating: {$avg: '$ratingAverage'},
                avgPrice: {$avg: '$price'},
                minPrice: {$min: '$price'},
                maxPrice: {$max: '$price'},

            }
        },
        {
            $sort: {avgPrice: 1}
        },
        //proof that we can repeat the aggregation method
        // {
        //     $match: {
        //         _id: { $ne: 'EASY'}
        //     }
        // }
    ])

    res.status(200).json({
        status:'success',
        data: {
            stats
        }
    })
    // try{
    // } catch (err){
    //     res.status(500).json({
    //         status: 'fail',
    //         message: err.message
    //     })
    // }
});


exports.getMonthlyPlan = catchAsync(async (req,res,next) => {
    const year = req.params.year * 1;

    const plan = await Tour.aggregate([
        //$unwind will be used to gather all the data that has in startDates the year of :year params as we request
        {
            $unwind: '$startDates'
        },
        //$match is used to select document
        {
            $match: {
                startDates: {
                    $gte: new Date(`${year}-01-01`),
                    $lte: new Date(`${year}-12-31`)
                }
            }
        },
        {
            $group:{
                _id: { $month: '$startDates'},
                //we want to figure out how many tours start in that month
                numToursStarts: {$sum: 1},
                tours: {$push: '$name'}
            }
        },
        {
            $addFields: {month: '$_id'}
        },
        {
            $project:{
                //that means that the _id will no longer shows up
                _id: 0
            }
        },
        {
            // 1 for ascending and -1 for descending 
            $sort: {numToursStarts: -1}
        }
    ])

    res.status(200).json({
        status: 'success',
        //we can notice hear the increase in the list we have that is because the pipeline above create a new document for each new data which means we could have "The forest hiker {startDates: [2021-04-12, 2021-07-01]}" new object for every year in the array 

        result: plan.length,
        data:{
            plan
        }
    })
    // try{
    // }catch(err){
    //     res.status(500).json({
    //         status: 'fail',
    //         message: err.message
    //     })
    // }
})



// ###### THE CONTROLLER USING JSON FILE (NOT DATABASE) #######

// const fs = require('fs');
// const Tour = require('../models/tourModel')

// //ROUTER HANDLER
// //defining the root URL
// // app.get('/', (req, res)=>{
// //     res.status(200).json(
// //         {message: 'Hello from the server-side!', 
// //         app: '4-natours'})
// // });

// // app.post('/', (req,res)=>{
// //     res.send('You can post to this endpoint....')
// // })

// //IMPORTANT: THIS WAS FOR TESTING PURPOSES
// const tours = JSON.parse(
//     fs.readFileSync(`..\\starter\\dev-data\\data\\tours-simple.json`)
// );

// //TODO: 2) TOURS ROUTES HANDLER

// //Using a Middleware to check out the id //now go ahead and remove all the check id from the controller
// exports.checkID = ((req, res, next, val)=>{
//     console.log(`Tour id is: ${val}`)
//     if(req.params.id * 1 > tours.length){
//         return res.status(404).json({
//             status: 'fail',
//             message: 'Invalid ID'
//         })
//     }
//     next();
// })

// exports.checkBody = ((req, res, next)=>{
//     if(!req.body.name || !req.body.price){
//         return res.status(400).json({
//             status: 'fail',
//             message: 'Missing name or price in body'
//         })
//     }
//     next();
// })

// exports.getAllTours = (req,res) =>{
//     res.status(200).json({
//         status: 'success',
//         requestedAt: req.requestTime,
//         result: tours.length,
//         data: {
//             tours
//         }
//     })
// };

// exports.getTourById = (req,res) =>{
//     console.log(req.params)
//     //converting a string (req.params) to number
//     const id = req.params.id * 1;
//     const tour = tours.find(el => el.id === id)

//     //find method will return the object in an array where it matches the req.params id
//     res.status(200).json({
//         status: 'success',
//         data: {
//             tour
//         }
//     })
// };

// exports.createTour = (req,res)=>{
//     // console.log(req.body)

//     const newId = tours[tours.length - 1].id + 1;

//     //helps in adding a new key to the json and complete the rest of it as it is 
//     const newTour = Object.assign({id: newId}, req.body);

//     tours.push(newTour)
//     //since we are inside a callback then we cannot use the writeFileSync in order to not block the eventloop so it is a async method which will run in the background 
//     fs.writeFile(`..\\starter\\dev-data\\data\\tours-simple.json`, JSON.stringify(tours), err => {
//         // we want to show the pushed data after the finishing of the operation
//         res.status(201).json({
//             status:'success',
//             data: {
//                 tour: newTour
//             }
//         })
//     })

// };

// exports.updateTour = (req,res)=>{
//     const id = req.params.id * 1;
//     const tour = tours.find(el => el.id === id)
    
//     //update the properties of the tour 
//     // { "name": "The huge coast see"} this will be sent throughout the json raw and that will be applied in the tour found
//     Object.assign(tour, req.body)
//     console.log(req.body)
    
//     //rewrite the json file // we cannot use the Sync version cuz it will block the event_loop where a callback works
//     fs.writeFile(`..\\starter\\dev-data\\data\\tours-simple.json`, JSON.stringify(tours), err => {
//         res.status(200).json({
//             status:'success',
//             data: {
//                 tour
//             }
//         })
//     })
// };

// exports.deleteTour = (req,res)=>{
//     const id = req.params.id * 1;
//     const tour = tours.find(el => el.id === id)

//     // if(!tour){
//     //     return res.status(404).json({
//     //         status: 'fail',
//     //         message: 'Invalid Id'
//     //     })
//     // }

//     //remove tour
//     const index = tours.indexOf(tour)
//     tours.splice(index, 1)

//     //rewrite the json file
//     fs.writeFile(`..\\starter\\dev-data\\data\\tours-simple.json`, JSON.stringify(tours), err => {
//         res.status(200).json({
//             status:'success',
//             data: null
//         })
//     })
// };



