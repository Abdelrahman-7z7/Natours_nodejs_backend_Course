const User = require('../models/userModel')
const catchAsync = require('../utils/catchAsync')

const filterObj = (obj, ...allowedFields) => {
    const newObj = {};

    Object.keys(obj).forEach(key => {
        if(allowedFields.includes(key)){
            newObj[key] = obj[key]
        }
    })

    return newObj;
}

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

    // ## filteredBody ==> will restrict the options that can be updated in the database FOR NOW it is ('name', 'email')
    const filteredBody = filterObj(req.body, 'name', 'email')

    // 2) update user document
    // ## options new: true ==> so it returns the new object instead of the old one
    // ## x ==> represents the elements that gonna be updated
    const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {new: true, runValidators: true})

    res.status(200).json({
        status: 'success',
        message: 'User updated successfully',
        data: {
            user: updatedUser
        }
    })
});

exports.deleteMe = catchAsync(async (req, res, next) => {
    await User.findByIdAndUpdate(req.user.id, {active: false})

    res.status(204).json({
        status: 'success',
        data: null
    })
});

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
