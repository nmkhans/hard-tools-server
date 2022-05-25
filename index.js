const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const { MongoClient, ServerApiVersion } = require('mongodb');

const port = process.env.PORT || 5000;
const app = express();


//? middle were 
app.use(cors());
app.use(express.json());

//? database connection
const uri = `mongodb+srv://MoinKhan:100504248668420123.@hard-tools.9fuogyz.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

//? database stablish
const server = async () => {
    try {
        client.connect();
        const database = client.db('hard_tools');
        const productCollection = database.collection('products');
        console.log('databse connected')
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