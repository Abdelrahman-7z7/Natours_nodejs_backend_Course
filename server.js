const mongoose = require('mongoose')
const dotenv = require('dotenv')

//TODO: handling uncaught exception
//ex: having a console.log(x) for unknown variable
process.on('uncaughtException', err => {
     console.log('Uncaught Exception!! 💥 Shutting down...')
     console.log(err.name, err.message)
     process.exit(1)
})

dotenv.config({ path: './config.env' });
const app = require('./app')


const DB = process.env.DATABASE.replace('<PASSWORD>', process.env.DATABASE_PASSWORD);

mongoose.connect(DB).then(
     // con
     () => {
     // console.log(con.connection);
     console.log("DB connection guaranteed")
});


//A new document to be created out of the model that we built
// ## instance of the tour model
// const testTour = new Tour({
//      name: "The Forest Hiker",
//      rating: 4.7,
//      price: 497
// })


// testTour.save().then(doc => {
//      console.log(doc)
// }).catch(err => {
//      console.log(err)
// })


//environment variable are global variable that are used to define the environment in which a node app is running
// it is a variable that's kind of a convention which should define whether we are in the development or on production mode
// console.log(app.get('env'))
// console.log(process.env)
const port = process.env.PORT || 3000;
const server = app.listen(port, ()=>{
     console.log(`app running on ${port}`)
});
//anything that is not related to express will be implemented outside the app


//TODO: handling unhandled promise rejection globally (Using event listener)
//ex: having a wrong password for accessing mongoDB
process.on('unhandledRejection', err => {
     console.log('Unhandled Rejection!! 💥 Shutting down...')
     console.log(err.name, err.message)
     //when we have such an error it is best to shutdown the whole server
     //0 stands for success
     //1 stands for uncaught exception
     // we need to close the server gracefully where we first close the server and then shut it down
     server.close(()=> {
          process.exit(1)
     })
})




// mongoDB intro:
/**
 * Key mongoDB features:
 * 1- Document based: MongoDB stores data in documents (field-value pair data structure, noSQL)
 * 2- Scalable: vary easy to distribute data across multiple machines as your users and amount of data grows.
 * 3- Flexible: no document data schema required, so each document can have different number of type of fields.
 * 
 * BSON: data format MongoDB users for data storage. Like JSON, but typed (has a data type for each field).
 * 
 * Embedding / de_normalizing: including related data into a single document. This allows for quicker access and easier 
 * data models (it is not always the best solution though).
 * 
 * {
 * "id": ObjectID('516568),
 * "title": "Rockets, car and MongoDB",
 * "Author": "Elon Musk",
 * "length": 3200,
 * "published": true,
 * "tags": ['mongoDB', 'space', 'ev'],
 * "comments": [
 *        //embedded document...
 *        {"author": "jonas", "text": "Interesting stuff!" },
 *        {"author": "jonas", "text": "Interesting stuff!" },
 *        {"author": "jonas", "text": "Interesting stuff!" },
 *   ]
 * } 
 * 
 * 
 * ## MONGOOSE:
 * 1- mongoose is an object data modeling (ODM) library for mongodb and node.js, a higher level of abstraction
 * 2- mongoose allows for rapid and simple development of mongoDB database interactions
 * 3- Features: schemas to model data and relationships, easy data validation, simple query API, middleware ,etc
 * 4- mongoose schema: where we model our data, by describing the structure of the data, default values and validations.
 * 5- mongoose model: a wrapper for the schema, providing an interface to the database for CRUD operations
 * 
 * ## Query String:
 * 127.0.0.1:8000/tours?duration=5&difficulty=easy
 */
