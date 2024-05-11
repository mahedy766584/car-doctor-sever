const express = require('express');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
require('dotenv').config();
const app = express();
const port =  process.env.PORT || 5000;

app.use(express.json());
app.use(cookieParser())
app.use(cors( 
    // {
    //     origin: ['http://localhost:5173', 'http://localhost:5174'],
    //     credentials: true
    // }
    {
        origin: ['http://localhost:5173'],
        credentials: true,
    }
));

// ${process.env.DB_USER}:${process.env.DB_PASSWORD}

const uri = `mongodb://${process.env.DB_USER}:${process.env.DB_PASSWORD}@ac-dczafpo-shard-00-00.ylujpzf.mongodb.net:27017,ac-dczafpo-shard-00-01.ylujpzf.mongodb.net:27017,ac-dczafpo-shard-00-02.ylujpzf.mongodb.net:27017/?ssl=true&replicaSet=atlas-ul1323-shard-0&authSource=admin&retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

    //middleware
    // const logger = (req, res, next) =>{
    //     console.log('called', req.host, req.originalUrl)
    //     next()
    // }

    // const verifyToken = (req, res, next) =>{
    //     const token = req.cookies?.token;
    //     console.log('value of token in middleware', token)
    //     if(!token){
    //         return res.status(401).send({message: 'not authorized'})
    //     }

    //     jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) =>{
    //         if(err){
    //             console.log(err)
    //             return res.status(401).send({message: 'unAuthorized access'})
    //         }
    //         console.log('value in the token', decoded)
    //         req.user = decoded
    //         next();
    //     })
    //     // next();
    // }

    //middleware
    const logger = (req, res, next) =>{
        console.log('logger check',req.method, req.url);

        next();
    }

    const verifyToken = (req, res, next) =>{
        const token = req?.cookies?.token;
        // console.log('token in the middleware', token);
        if(!token){
            return res.status(401).send({message: 'unauthorized access'})
        }
        jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) =>{
            if(err){
                return res.status(401).send({message: 'unauthorized access'})
            }
            req.user = decoded;
            next();
        })
    }


async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        await client.connect();

        // const serviceCollection = client.db("carsDoctor").collection("services");
        const database = client.db("carsDoctor");
        const serviceCollection = database.collection("services");

        //auth related API
        // app.post('/jwt', async(req, res) =>{
        //     const user = req.body;
        //     console.log(user)
        //     const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        //         expiresIn: '1h'
        //     })

        //     res
        //     .cookie('token', token, {
        //         httpOnly: true,
        //         secure: false,
        //     })
        //     .send({success: true})
        // })
        app.post('/jwt', logger, async(req, res) =>{
            const user = req.body;
            console.log('user for token', user)
            const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
                expiresIn: '1h'
            })
            res
            .cookie('token', token, {
                httpOnly: true,
                secure: false,
                // sameSite: 'none'
            })
            .send({success: true})
        })

        app.post('/logout', async(req, res) =>{
            const user = req.body;
            console.log('logout user', user)
            res
            .clearCookie('token', {maxAge: 0})
            .send({success: true})
        })

        //services related API 
        app.get('/services',  async(req, res) =>{
            const cursor = serviceCollection.find();
            const result = await cursor.toArray();
            res.send(result)
        })

        app.get('/services/:id',  async(req, res) =>{
            const id = req.params.id;
            const query = {_id: new ObjectId(id)}
            const options = {
                // Include only the `title` and `imdb` fields in the returned document
                projection: { title: 1, imdb: 1, price: 1, service_id: 1, title: 1, img: 1 },
            };
            const result = await serviceCollection.findOne(query, options)
            res.send(result);
        })


        //bookings collection
        const bookingsCollection = client.db("carsDoctor").collection("bookings")

        app.get('/bookings', logger, verifyToken, async(req, res) =>{
            console.log(req.query.email)
            console.log('token owner info' ,req.user)
            if(req.user.email !== req.query.email){
                return res.status(403).send({message: 'forbidden access'})
            }
            if(req.query.email !== req.query.email){
                return res.status(403).send({message: 'forbidden access'})
            }

            let query = {}
            if(req.query?.email){
                query = {email: req.query.email}
            }
            const result = await bookingsCollection.find(query).toArray();
            res.send(result)
        })

        // app.post('/bookings', async(req, res) =>{
        //     const booking = req.body;
        //     console.log(booking)
        //     const result = await bookingsCollection.insertOne(booking);
        //     res.send(result)
        // })

        //practice wit conceptual session
        app.post('/bookings', async(req, res) =>{
            try{
                const booking = req.body;
                const result = await bookingsCollection.insertOne(booking)
                res.send(result)
            }catch(error) {
                console.log(error)
            }
        })

        app.delete('/bookings/:id', async(req, res) =>{
            const id = req.params.id;
            const query = {_id: new ObjectId(id)}
            const result = await bookingsCollection.deleteOne(query);
            res.send(result);
        })

        app.patch('/bookings/:id', async(req, res) =>{
            const id = req.params.id;
            const filter = {_id: new ObjectId(id)}
            const updateBooking = req.body;
            // const options = {upsert: true}
            console.log(updateBooking);
            const updateDoc = {
                $set:{
                    status: updateBooking.status,
                }
            }
            const result = await bookingsCollection.updateOne(filter, updateDoc);
            res.send(result)
        })


        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);


app.get('/', (req, res) =>{
    res.send("MY CAR DOCTOR SERVER RUNNING ON PORT")
})

app.listen(port, (req, res) =>{
    console.log(`My car doctor server running on port: ${port}`)
})