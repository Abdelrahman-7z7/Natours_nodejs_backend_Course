const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs')

const userSchema = new mongoose.Schema({
    name:{
        type: String,
        required: true,
        unique: true,
        trim: true,
        required: [true, 'Please tell us your name']
    },
    email: {
        type: String, 
        required: [true, 'Please provide your email'],
        unique: true,
        lowercase: true,
        validate: [validator.isEmail]
    },
    password:{
        type: String, 
        required: [true, 'Please provide a password'],
        minlength: 8,
        select: false
    },
    passwordConfirm: {
        type: String,
        required: [true, 'A user must confirm their password'],
        //this only works on CREATE and SAVE()!!! NOT UPDATE NOT DELETION ONLY ON SAVE 
        validate: {
            validator: function(password){
                return password === this.password;
            },
            message: 'passwords do not match'
        }
    },
    passwordChangedAt: {
        type: Date,
        default: Date.now
    },
    photo: {
        type: String,
        default: 'default.jpg'
    },
    role:{
        type: String,
        enum: ['user', 'guide', 'lead-guide', 'admin'],
        default: 'user'
    }
})

// Middleware to hash password before saving
userSchema.pre('save', async function(next){
    //Only run this function if password was actually modified
    if(!this.isModified('password')) return next();
     
    // Hash the password with cost of 12 (CPU intensive) and replace the plain text password with the hashed one
    this.password = await bcrypt.hash(this.password, 12)
    // deleting the password confirm, we just needed for the validation above 
    this.passwordConfirm = undefined;
    next();
})

//Instance method
userSchema.methods.correctPassword = async function(candidatePassword, userPassword){
    //since we have the password selected as false we cannot use the word "this.password" to get it so we need to pass it as a parameter
    return await bcrypt.compare(candidatePassword, userPassword);
}

//instance method to check when did the token created and if the user changed the password after
userSchema.methods.changedPasswordAfter = function(JWTTimestamp){
    if(this.passwordChangedAt){
        //to be in seconds instead of milliseconds
        const changedTimestamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10);
        //for checking the existing of both
        // console.log(changedTimestamp, JWTTimestamp)
        return JWTTimestamp < changedTimestamp
    }

    //false means NOT Changed
    return false;
}

const User = mongoose.model('User', userSchema)

module.exports = User;