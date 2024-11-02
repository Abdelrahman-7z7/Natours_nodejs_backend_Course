const fs = require('fs')
const Tour = require('./models/tourModel')
const mongoose = require('mongoose')
const dotenv = require('dotenv')

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

//IMPORTING data into database 
const importData = async () =>{
     try{
          await Tour.create(tours)
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


