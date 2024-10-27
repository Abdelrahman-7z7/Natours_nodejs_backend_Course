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
