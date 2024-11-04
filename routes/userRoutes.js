const express = require('express')

//CONFIG USER CONTROLLER
const userController = require('../controller/userController')
const authController = require('../controller/authController')

//ROUTER
const router = express.Router();


// these routes should be available to everyone to use
router.post('/signup', authController.signup);
router.post('/login', authController.login);
router.post('/forgotPassword', authController.forgetPassword);
router.patch('/resetPassword/:token', authController.resetPassword);


//adding a protect authentication for all the next routes by only using a middleware
//Any route comes after this middleware will be added to it as a protection function
router.use(authController.protect);


router.get('/me', userController.getMe, userController.getUserById)
router.patch('/updateMe', userController.updateMe)
router.delete('/deleteMe', userController.deleteMe)
//this route will only work for the logged in user and the protect middleware will put the user's info in the next parameter
router.patch('/updateMyPassword', authController.updatePassword);

//Middleware for restricting to following routes to the 'admin' role only
router.use(authController.restrictTo('admin'))

router
    .route('/')
    .get(userController.getAllUsers)
    .post(userController.createNewUser);

router
    .route('/:id')
    .get(userController.getUserById)
    .patch(userController.updateUser)
    .delete(userController.deleteUser);

module.exports = router;

