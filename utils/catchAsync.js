//TODO: catchAsync which will replace the try/catch block for the async/await function 
//catchAsync will accept a function to be passed

//and next will be used in all async function since we need it to pass the err to the error handling middleware
module.exports = fn => {
    //this function will return a new anonymous function with the parameter included
    //return here will be the function that express call when it is ready to be executed
    return (req, res, next)=>{
        //in catch "err => next(err)" == "next", cuz this will be done automatically by the catch function 
        fn(req, res, next).catch(next);
    }
}

