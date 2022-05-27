const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

const port = process.env.PORT || 5000;
const app = express();


//? middle were 
app.use(cors());
app.use(express.json());

//? database connection
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@hard-tools.9fuogyz.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

//? database stablish
const server = async () => {
    try {
        client.connect();
        const database = client.db('hard_tools');
        const productCollection = database.collection('products');
        const reviewCollection = database.collection('reviews');
        const orderCollection = database.collection('orders');
        const userCollection = database.collection('users');

        //? get all product
        app.get('/products', async (req, res) => {
            const query = {};
            const cursor = productCollection.find(query);
            const result = await cursor.toArray();
            res.send(result)
        })

        //? get single product by id
        app.get('/products/:id', async (req, res) => {
            const { id } = req.params;
            const query = { _id: ObjectId(id) };
            const result = await productCollection.findOne(query);
            res.send(result)
        })

        //? get all review
        app.get('/reviews', async (req, res) => {
            const query = {};
            const cursor = reviewCollection.find(query);
            const result = await cursor.toArray();
            res.send(result)
        })

        //? place a order
        app.post('/orders', async (req, res) => {
            const orderDetail = req.body;
            const result = await orderCollection.insertOne(orderDetail);
            res.send(result)
        })

        //? get a order by used email
        app.get('/orders/:email', async (req, res) => {
            const email = req.params.email;
            const query = {email: email};
            const cursor = orderCollection.find(query);
            const result = await cursor.toArray();
            res.send(result)
        })

        //? delete a order
        app.delete('/orders/:id', async (req, res) => {
            const id = req.params.id;
            const query = {_id: ObjectId(id)};
            const result = await orderCollection.deleteOne(query);
            res.send(result)
        })


        //? register a user
        app.put('/user/:email', async (req, res) => {
            const email = req.params.email;
            const user = req.body;
            const filter = { email: email };
            const option = { upsert: true };
            const updateDoc = {
                $set: user
            };
            const result = await userCollection.updateOne(filter, updateDoc, option);
            const token = jwt.sign({email: email}, process.env.ACCESS_TOKEN, {expiresIn: "1d"});
            res.send({result, token: token})
        })
    }

    finally {
        //// client.close()
    }
}

server().catch(console.dir)

app.use('/', (req, res) => {
    res.send('server is running')
})

app.listen(port, () => {
    console.log('listening to port', port)
})