const {promisify} = require('util')
const jwt = require('jsonwebtoken')
const User = require('../models/userModel')
const catchAsync = require('../utils/catchAsync')
const AppError = require('../utils/appError')

const signToken = id => {
    return jwt.sign({id}, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN
    });
}


exports.signup = catchAsync(async(req, res, next) => {
    const newUser = await User.create({
        name: req.body.name,
        email: req.body.email,
        password: req.body.password,
        passwordConfirm: req.body.passwordConfirm,
        passwordChangedAt: req.body.passwordChangedAt,
        role: req.body.role
    });

    const token = signToken(newUser._id);

    res.status(201).json({
        status: 'success',
        token, 
        data: {
            user: newUser
        }
    })
})

exports.login = catchAsync(async(req,res,next) => {
    const {email, password} = req.body;

    // 1) check if email and password exist
    if(!email || !password){
        return next(new AppError('Please provide a valid email and password!!', 400))
    }
    // 2) check if the user exits $$ password is correct
    const user = await User.findOne({email}).select('+password')

    //this method is coming for the model where we created an "instance method"
    //password is coming from the body
    //user.password is coming from selecting the user from the database and getting its hashed password
    if(!user || !(await user.correctPassword(password, user.password))){
        return next(new AppError('Incorrect email or password', 401))
    }

    // 3) if everything is ok, send token to client 
    const token = signToken(user._id);

    res.status(200).json({
        status:'success',
        token
    })
})


//MIDDLEWARE function to protect our tours from being exposed when the jwt is not available (meaning no user is login)
exports.protect = catchAsync( async(req, res, next)=>{
    // 1) Getting token and check if it is there
    let token;
    //authorization('Bearer jwtToken)
    if(req.headers.authorization && req.headers.authorization.startsWith('Bearer')){
        //split by space and get the second element
        token = req.headers.authorization.split(' ')[1];
    }
    //checking if the token is there
    // console.log(token)

    if(!token){
        return next(new AppError('You are not logged in! Please login to get access!!', 401))
    }


    // 2) verification token

    //we do not want to break the concept of promises so we will use promisify from util library
    //promisify() we made the function and then () called it at the same line 
    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET)
    console.log(decoded);

    // 3) check if the user still exists
    //this is why we have the id in the payload
    const currentUser = await User.findById(decoded.id)
    if(!currentUser){
        return next(new AppError('The user belonging to this token does no longer exists.', 401))
    }
    // 4) check if user changed the password after token was issued
    
    //creating an instance method for it in the user model 
    if(currentUser.changedPasswordAfter(decoded.iat)){
        return next(new AppError('User Recently changed password! please login again...', 401))
    }


    // GRANT ACCESS TO PROTECTED ROUTE
    //where we travel data from one middleware to another
    req.user = currentUser;
    next();
})

//MIDDLEWARE FOR RESTRICTING DELETION OF TOUR TO A SPECIFIC USER
//belongs to => delete tour route
//this is the way of passing a parameters to the middleware where it is actually not allowed to be passed with the req, res, next parameters
exports.restrictTo = (...roles) => {
    return (req, res, next) => {
        //roles: ['admin', 'lead-guide']. role: 'user'
        if(!roles.includes(req.user.role)){
            return next(new AppError('You do not have permission to perform this action', 403))
        }

        next()
    }
}


/**
 * 200: OK
201: Created
204: No Content
400: Bad Request
401: Unauthorized
403: Forbidden
404: Not Found
409: Conflict
422: Unprocessable Entity
500: Internal Server Error
503: Service Unavailable
 */