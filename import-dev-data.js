const fs = require('fs')
const mongoose = require('mongoose')
const dotenv = require('dotenv')
const Tour = require('./models/tourModel')
const User = require('./models/userModel')
const Review = require('./models/reviewModel')

dotenv.config({ path: './config.env' });

const DB = process.env.DATABASE.replace('<PASSWORD>', process.env.DATABASE_PASSWORD);

mongoose.connect(DB).then(
     // con
     () => {
     // console.log(con.connection);
     console.log("DB connection guaranteed")
});

//READ the file 
const tours = JSON.parse(fs.readFileSync('../starter/dev-data/data/tours.json', 'utf-8'));
const users = JSON.parse(fs.readFileSync('../starter/dev-data/data/users.json', 'utf-8'));
const reviews = JSON.parse(fs.readFileSync('../starter/dev-data/data/reviews.json', 'utf-8'));

//IMPORTING data into database 
const importData = async () =>{
     try{
          await Tour.create(tours)
          await User.create(users, {validateBeforeSave: false})
          await Review.create(reviews)
          console.log('Data successfully loaded!')
     }catch(err){
          console.log(err)
     }
     process.exit();
}

//Deleting all data from database
const deleteData = async () => {
     try{
          await Tour.deleteMany();
          console.log("data successfully deleted!!")
     }catch(err){
          console.log(err)
     }
     process.exit();
}

//we will try to run these functions through the terminal 
if(process.argv[2] === '--import'){
     importData();
}else if(process.argv[2] === '--delete'){
     deleteData();
}
//node import-dev-data.json --delete
//node import-dev-data.json --import
console.log(process.argv)


