const express = require('express')

//CONFIG USER CONTROLLER
const userController = require('../controller/userController')
const authController = require('../controller/authController')

//ROUTER
const router = express.Router();

router.post('/signup', authController.signup);
router.post('/login', authController.login);

router.post('/forgotPassword', authController.forgetPassword);
router.patch('/resetPassword/:token', authController.resetPassword);

router.patch('/updateMe', authController.protect, userController.updateMe)
router.delete('/deleteMe', authController.protect, userController.deleteMe)

//this route will only work for the logged in user and the protect middleware will put the user's info in the next parameter
router.patch('/updateMyPassword', authController.protect, authController.updatePassword);

router.route('/').get(userController.getAllUsers).post(userController.createNewUser);
router.route('/:id').get(userController.getUserById).patch(userController.updateUser).delete(userController.deleteUser);


module.exports = router;

