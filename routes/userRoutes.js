const express = require('express')

//CONFIG USER CONTROLLER
const userController = require('../controller/userController')
const authController = require('../controller/authController')

//ROUTER
const router = express.Router();

router.post('/signup', authController.signup);
router.post('/login', authController.login);

router.route('/').get(userController.getAllUsers).post(userController.createNewUser);
router.route('/:id').get(userController.getUserById).patch(userController.updateUser).delete(userController.deleteUser);


module.exports = router;