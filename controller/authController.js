const {promisify} = require('util')
const jwt = require('jsonwebtoken')
const User = require('../models/userModel')
const catchAsync = require('../utils/catchAsync')
const AppError = require('../utils/appError')

const sendEmail = require('../utils/email')
const crypto = require('crypto')

const signToken = id => {
    return jwt.sign({id}, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN
    });
}

const createSendToken = (user, statusCode, res) => {
    const token = signToken(user._id);

    res.status(statusCode).json({
        status: 'success',
        token, 
        data: {
            user
        }
    })
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
    createSendToken(newUser, 201, res);
    // const token = signToken(newUser._id);

    // res.status(201).json({
    //     status: 'success',
    //     token, 
    //     data: {
    //         user: newUser
    //     }
    // })
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
    createSendToken(user, 200, res);
})


//MIDDLEWARE function to protect our tours from being exposed when the jwt is not available (meaning no user is login)
exports.protect = catchAsync( async(req, res, next)=>{
    // 1) Getting token and check if it is there
    console.log('I am in ')
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



//resetting password where the user send a request to a post http request and then this will create a reset token that will be sent through email, (just a random token NOT a WebJsonToken) 

exports.forgetPassword = catchAsync(async(req, res, next) => {
    // 1) Get user based on POSTed email
    const user = await User.findOne({email: req.body.email})
    // ## verify if the user does exist
    if(!user){
        return next(new AppError('There is no user with this email address', 404))
    }

    // 2) Generate the random reset token 
    //## using an instance method for these lines since we will have a lot of work to be done so we need to follow the clean-code principle 
    const resetToken = user.createPasswordResetToken();
    //in the instance method we just modified the password but we did not save it
    //we use this validateBeforeSave: false, so all the validator in our schema will be sit to false where we can only send the email to the schema
    await user.save({validateBeforeSave: false});

    // 3) send it to the user's email
    const resetURL = `${req.protocol}://${req.get('host')}/api/v1/users/resetPassword/${resetToken}`;

    const message = `Forgot Your Password? Submit a patch request with your new password and password confirm to: ${resetURL}.\nIf you didn't forgot your password, please ignore this email`;

    try{

        await sendEmail({
            email: req.body.email,
            subject: 'Your password reset token (valid for 10 mint)',
            //message: message ==> is basically message
            message
        })
    
        res.status(200).json({
            status: 'success',
            message: 'Token Sent to Email'
        })
    }catch(err){
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        await user.save({validateBeforeSave: false});

        return next(new AppError('There was an error sending the email. Try again later!', 500))
    }
})

exports.resetPassword =catchAsync(async(req, res, next) =>{
    // 1) Get user based on the token
    const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex')

    // ## we are finding the user by the token and checking the time expiration for it at the same time
    const user = await User.findOne({
        passwordResetToken: hashedToken, 
        passwordResetExpires: {$gt: Date.now()}
    });

    // 2) if token has not expired, and there is user, set the new password
    // ## since if either the token is not true, or the password has expired then the schema won't return any user
    if(!user){
        return next(new AppError('Token is invalid or has expired', 400))
    }
    // ##if we passed the condition above then we indeed have the user's password and we can re-assign it 
    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;
    // ##let's delete the reset token and the expiry data
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    // ## save the modification
    await user.save();


    // 3) Update changedPasswordAt property for the user

    // 4) Log the user in, send JWT
    createSendToken(user, 200, res);

})

//updating the logged in user's password without needing to forget it in the first place
exports.updatePassword = catchAsync(async(req, res, next) => {
    // 1) Get user from collection
    //this is coming from the protect middleware
    console.log('we are checking the current password: step 1')

    const user = await User.findById(req.user.id).select('+password');

    // 2) Check if POSTed current password is correct
    if(!(await user.correctPassword(req.body.passwordCurrent, user.password))){
        return next(new AppError('Your current password is wrong, please try again!!', 401))
    }

    console.log('we are checking the current password: step 2')
    
    // 3) if so, update user
    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;
    await user.save();
    
    console.log('we are checking the current password: step 3')
    // 4) Log user in, send JWT
    createSendToken(user, 200, res);
});


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