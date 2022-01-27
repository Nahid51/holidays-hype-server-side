const express = require('express');
const cors = require('cors');
const ObjectId = require('mongodb').ObjectId;
require('dotenv').config();
const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const { MongoClient } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.bsutc.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

client.connect(err => {
    const database = client.db("HolidaysHype");
    const blogCollection = database.collection("services");
    const usersCollection = database.collection("users");
    console.log('connected successfully');

    // add service data to database
    app.post('/addBlogs', async (req, res) => {
        const doc = req.body;
        console.log(doc);
        const result = await blogCollection.insertOne(doc);
        res.send(result);
    })
    // get services from database
    app.get('/blogs', async (req, res) => {
        console.log(req.query);
        const cursor = blogCollection.find({});
        const page = req.query.page;
        const size = parseInt(req.query.size);
        let result;
        const count = await cursor.count();
        if (page) {
            result = await cursor.skip(page * size).limit(size).toArray();
        }
        else {
            result = await cursor.toArray();
        }
        res.send({
            count,
            result
        });
    })

    // add new users (by registration) to database
    app.post('/users', async (req, res) => {
        const user = req.body;
        const result = await usersCollection.insertOne(user);
        res.send(result);
    })
    // add users (by google login) to database
    app.put('/users', async (req, res) => {
        const user = req.body;
        const filter = { email: user.email };
        const options = { upsert: true };
        const updateDoc = { $set: user };
        const result = await usersCollection.updateOne(filter, updateDoc, options);
        res.send(result);
    })
    // make admin 
    app.put('/users/admin', async (req, res) => {
        const email = req.body.admin;
        const requester = req.body.user;
        if (requester) {
            const requesterAccount = await usersCollection.findOne({ email: requester });
            if (requesterAccount.role === 'admin') {
                const filter = { email: email };
                const updateDoc = { $set: { role: 'admin' } };
                const result = await usersCollection.updateOne(filter, updateDoc);
                res.send(result);
            }
        }
        else { res.status(403).send({ message: 'Access Denied' }) }
    })
    // get admin from database
    app.get('/users/:email', async (req, res) => {
        const email = req.params.email;
        console.log('admin:', email);
        const query = { email: email };
        console.log('adminemail:', query);
        const user = await usersCollection.findOne(query);
        let isAdmin = false;
        if (user?.role === 'admin') {
            isAdmin = true;
        }
        console.log({ admin: isAdmin });
        res.send({ admin: isAdmin });
    })
});

app.get('/', (req, res) => {
    res.send('Hello Node JS!')
})

app.listen(port, () => {
    console.log('Running server at port:', port)
})