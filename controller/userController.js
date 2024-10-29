const User = require('../models/userModel')
const catchAsync = require('../utils/catchAsync')

//ROUTER HANDLER
exports.getAllUsers = catchAsync( async(req, res)=>{
    const users = await User.find()

    //SEND RESPONSE
    res.status(200).json({
        status: 'success',
        results: users.length,
        data: {
            users
        }
    })
});

//currant User update its own data
exports.updateMe = catchAsync(async (req, res, next) => {
    // 1) Create error if user POSTs(update) password data
    if(req.body.password || req.body.passwordConfirm){
        return next(new AppError('This route is not for password update, Please use /updateMyPassword', 400))
    }

    // 2) update user document

    res.status(200).json({
        status: 'success',
        message: 'User updated successfully',
        data: {
            user: req.user
        }
    })
})

exports.createNewUser = (req, res)=>{
    res.status(500).json({
        status: 'fail',
        message: 'Server Error - this route is not yet defined (create)'
    })
}
exports.getUserById = (req, res)=>{
    res.status(500).json({
        status: 'fail',
        message: 'Server Error - this route is not yet defined (getById)'
    })
}
exports.updateUser = (req, res)=>{
    res.status(500).json({
        status: 'fail',
        message: 'Server Error - this route is not yet defined (update)'
    })
}
exports.deleteUser = (req, res)=>{
    res.status(500).json({
        status: 'fail',
        message: 'Server Error - this route is not yet defined (delete)'
    })
}
