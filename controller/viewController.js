const Tour = require('../models/tourModel')
const catchAsync = require('../utils/catchAsync')


exports.getOverview = catchAsync(async (req, res, next) => {
    //1) get tour data from collection
    const tours = await Tour.find()
    
    // 2) Build template 
    // 3) render that template using form 1)
    res.status(200).render('overview', {
        title: 'All Tours',
        tours
    })
})

exports.getTour = (req, res) => {
    res.status(200).render('tour', {
        title: 'The Forest Hiker'
    })
}

// exports.getOverview = catchAsync(async (req, res, next) => {
//         res.status(200).render('base', {
//             tour: 'The Forest Hiker',
//             user: 'Jonson',
//             title: 'Exciting tours for adventurous people'
//         });
//     }
// )