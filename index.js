const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const stripe = require('stripe')(process.env.STRIPE_KEY)


const port = process.env.PORT || 5000;
const app = express();

//? middle were 
app.use(cors());
app.use(express.json());
const verifyToken = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).send({ message: 'Unauthorized Access!' });
    }
    const token = authHeader.split(' ')[1];
    jwt.verify(token, process.env.ACCESS_TOKEN, (error, decoded) => {
        if (error) {
            return res.status(403).send({ message: "Access Forbidden!" })
        }
        req.decoded = decoded;
        next();
    })
}

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

        //? get single product for checkout
        app.get('/checkout/:id', async (req, res) => {
            const { id } = req.params;
            const query = { productId: id };
            const result = await orderCollection.findOne(query);
            res.send(result)
        })

        //? get all review
        app.get('/reviews', async (req, res) => {
            const query = {};
            const cursor = reviewCollection.find(query);
            const result = await cursor.toArray();
            res.send(result)
        })

        //? post a review
        app.post('/reviews', async (req, res) => {
            const review = req.body;
            const result = await reviewCollection.insertOne(review);
            res.send(result);
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
            const query = { email: email };
            const cursor = orderCollection.find(query);
            const result = await cursor.toArray();
            res.send(result)
        })

        //? delete a order
        app.delete('/orders/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await orderCollection.deleteOne(query);
            res.send(result)
        })

        //? update a order
        app.put('/orders/:id', async (req, res) => {
            const id = req.params.id;
            const payment = req.body;
            const transactionId = payment.transactionId;
            const filter = { productId: id };
            const option = { upsert: true };
            const updateDoc = {
                $set: {
                    status: true,
                    transactionId: transactionId,
                }
            }
            const result = await orderCollection.updateOne(filter, updateDoc, option)
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
            const token = jwt.sign({ email: email }, process.env.ACCESS_TOKEN, { expiresIn: "1d" });
            res.send({ result, token: token })
        })

        //? get all users
        app.get('/users', async (req, res) => {
            const query = {};
            const cursor = userCollection.find(query);
            const result = await cursor.toArray();
            res.send(result)
        })

        //? get a user
        app.get('/user/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email: email };
            const result = await userCollection.findOne(query);
            res.send(result);
        })

        //? update a user
        app.patch('/user/:email', async (req, res) => {
            const email = req.params.email;
            const detail = req.body;
            const phone = detail.phone;
            const address = detail.address;
            const facebook = detail.facebook;
            const linkedin = detail.linkedin;
            const filter = {email: email};
            const updateDoc = {
                $set: {
                    phone: phone,
                    address: address,
                    facebookId: facebook,
                    linkedId: linkedin,
                }
            }
            const result = await userCollection.updateOne(filter, updateDoc)
            res.send(result)
        })

        //? make a user admin
        app.put('/user/admin/:email', async (req, res) => {
            const email = req.params.email;
            const requester = req.body.requester;
            const requesterDetail = await userCollection.findOne({email: requester})
            if(requesterDetail.role === "admin") {
                const filter = {email: email};
                const option = {upsert: true};
                const updateDoc = {
                    $set: {
                        role: "admin"
                    }
                };
                const result = await userCollection.updateOne(filter, updateDoc, option)
                res.send(result);
            }
            
        } )

        //? get payment by stripe
        app.post("/create-payment-intent", async (req, res) => {
            const service = req.body;
            const price = service.totalPrice;
            const amount = price * 100;
            const paymentIntent = await stripe.paymentIntents.create({
                amount: amount,
                currency: "usd",
                payment_method_types: ['card']
            })
            res.send({
                clientSecret: paymentIntent.client_secret,
            })
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