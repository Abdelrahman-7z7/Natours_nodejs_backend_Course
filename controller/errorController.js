const AppError = require('../utils/appError')

//since it is receiving an error then this is the standard way of creating a function for it 
//err.path and err.value  and err.name ==> can be know from casing an error in the controller that uses the _id parameter 
const handleCastErrorDB = err => {
    const message = `Invalid ${err.path}: ${err.value}.`
    return new AppError(message, 400)
}

//from this error that we got back in the start:dev mode we can identify the handling function
// "code": 11000,
// "errmsg": "E11000 duplicate key error collection: natours.tours index: name_1 dup key: { name: \"The Forest Hiker\" }",
const handleDuplicateFieldsDB = err => {
    
    //obtained for stackOverFlow
    const value = err.errmsg.match(/(["'])(\\?.)*?\1/)[0];
    console.log(value);
    const message = `Duplicate field value: ${value}. Please use another value!`
    return new AppError(message, 400)
}

const handlingValidationErrorDB = err => {
    const errors = Object.values(err.errors).map(el => el.message)
    const message = `Invalid input data. ${errors.join('. ')}`
    return new AppError(message, 400)
}

const handlingJWTError = () => {
    const message = 'Invalid token, please login again...'
    return (new AppError(message, 401))
}

const handlingJWTExpiredError = () => {
    const message = 'Your token has expired, please login again...'
    return (new AppError(message, 401))
}


const sendErrorDev = (err, res) =>{
    res.status(err.statusCode).json({
        status: err.status,
        error: err,
        message: err.message,
        stack: err.stack
    })
}

const sendErrorProd = (err, res) => {
    //we only want to send the error when it is operational for the user but not programming error or unknown error
    //so we need to use the isOperational in the appError class at this point 
    console.log(err.isOperational)

    if(err.isOperational){
        res.status(err.statusCode).json({
            status: err.status,
            message: err.message,
        })
    } else{
        // 1) log error to the console
        console.log('ERROR 💥', err )
        // 2) Send generic message
        res.status(500).json({
            status: 'error',
            message: 'something went wrong!!'
        })
    }
}




module.exports = (err, req, res, next)=>{
    // console.log(err.stack);
    // console.log(process.env.NODE_ENV)
    //errors might come from our code or from another place in node.js then sometimes it comes with no status
    //500 == internal server error
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';

    //we want to distinguish the error when we are in the production mode or in the development mode
    //in development mode we need as much information as we could to find the problem
    //in contrast, in production mode we only need to leak a small information about the error for the user
    if(process.env.NODE_ENV.trim() === 'development'){
        sendErrorDev(err, res)

    } else if (process.env.NODE_ENV.trim() === 'production'){
        //we hard copy because it is not a good practice to change the passed argument 
        let error = { ...err };


        error.name = err.name; // Manually copy the name property
        error.message = err.message; // Manually copy the message property
        if(error.name === 'CastError') error = handleCastErrorDB(error);

        //handling duplicated fields
        error.errmsg = err.errmsg;
        if(error.code === 11000 ) error = handleDuplicateFieldsDB(error);

        //handling the validation error 
        if(error.name === 'ValidationError') error = handlingValidationErrorDB(error);

        //Invalid signature handling error
        if(error.name === 'JsonWebTokenError') error = handlingJWTError(); 

        //Expired token
        if(error.name === 'TokenExpiredError') error = handlingJWTExpiredError();

        sendErrorProd(error, res)
    }    
}


