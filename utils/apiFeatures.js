class APIFeatures{
    constructor(query, queryString){
        this.query = query;
        this.queryString = queryString;
    }

    filter(){
        // ## BUILDING QUERY
        //      1) Filtering
        // ex: 127.0.0.1:8000/api/v1/tours?difficulty=easy&page=2
        //since we might have some filter that is not in the document we have to filter it out before sending it
        //the three dots in here will basically take all the fields out of the object, and {} creates a new Object
        const queryObj = {...this.queryString}
        const excludeFields = ['page','sort','limit','fields']
        excludeFields.forEach(el => delete queryObj[el])
        
        //      2) Advanced Filtering
        // ex: 127.0.0.1:8000/api/v1/tours?difficulty=easy&duration[gte]=5&price[lt]=1500
        // gte (greater than or equal), gt, lte (less than or equal), lt

        //filter obj {difficulty: 'difficult, duration: { $gte: 5} } ==> which means >= than 5 ==> In mongoDB
        //filter obj {difficulty: 'difficult, duration: { gte: 5} } ==> which means >= than 5 ==> coming from the req.query
        let queryStr = JSON.stringify(queryObj);
        //g represent that it will occur many times
        queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, match => `$${match}`);
        // console.log(JSON.parse(queryStr))

        //we can see the difference between the req.query and the queryObj after excluding some features 
        // console.log(req.query, queryObj)

        //find() method is used to get all the data inside the DB and return it as an array 
        // const tours = await Tour.find(queryObj);

        //got later implementation of the sort, predict and limit etc we will need to save the query away from th tours till we filter it and then we give it to the tours document
        // let query = Tour.find(JSON.parse(queryStr));
        this.query = this.query.find(JSON.parse(queryStr))

        //returning the entire object
        return this;
    }

    sort(){
        // 3) sorting 

        //127.0.0.1:8000/api/v1/tours?sort=price (ascending order)
        //127.0.0.1:8000/api/v1/tours?sort=-price (descending order)
        //sorting based on two criteria  sort('price ratingAverage')
        // 127.0.0.1:8000/api/v1/tours?sort=-price,-ratingAverage
        if(this.queryString.sort){
            const sortBy = this.queryString.sort.split(',').join(' ')
            console.log(sortBy)
            this.query = this.query.sort(sortBy);
        }else{
            //default
            this.query = this.query.sort('-createdAt')
        }
        
        return this;
    }

    limitFields(){
        // 3) field limiting
        //ex: 127.0.0.1:8000/api/v1/tours?fields=name,price,duration
        if(this.queryString.fields){
            const fields = this.queryString.fields.split(',').join(' ');
            this.query = this.query.select(fields);
        }else{
            //default
            //we are removing the __v default mongoDB field with the "-" which means eliminate
            this.query = this.query.select('-__v')
        }

        return this;
    }

    pagination(){
        // 4) pagination 
        ///127.0.0.1:8000/api/v1/tours?page=1&limit=3
        // * 1 ==> converting string to number, || 1 ==> or page 1 which is the default page
        const page = this.queryString.page * 1 || 1;
        const limit = this.queryString.limit * 1 || 100;
        const skip = (page - 1) * limit;

        //page=3&limit=10, 1-10 page 1, 11-20 page 2, 21-30 page 3...
        this.query = this.query.skip(skip).limit(limit)

        // if(this.queryString.page){
        //     const numTours = await this.query.countDocuments();
        //     if(skip >= numTours) throw new Error("This page does not exists!!")
        // }

        return this;
    }
}


module.exports = APIFeatures;