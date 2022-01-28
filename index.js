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
    const reviewCollection = database.collection("reviews");
    const usersCollection = database.collection("users");
    console.log('connected successfully');

    // add service data to database
    app.post('/addBlogs', async (req, res) => {
        const doc = req.body;
        const result = await blogCollection.insertOne(doc);
        res.send(result);
    })

    // get services from database
    app.get('/blogs', async (req, res) => {
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

    // add review data to database
    app.post('/addReview', async (req, res) => {
        const doc = req.body;
        const result = await reviewCollection.insertOne(doc);
        res.send(result);
    })

    // get review data from database
    app.get('/reviews', async (req, res) => {
        const cursor = reviewCollection.find({});
        const result = await cursor.toArray();
        res.send(result);
    })

    //get all blogs
    app.get('/allBlogs', async (req, res) => {
        const allblogs = blogCollection.find({});
        const result = await allblogs.toArray();
        res.send(result);
    })

    //delete a blog
    app.delete('/deleteBlog/:id', async (req, res) => {
        const id = req.params.id;
        const query = { _id: ObjectId(id) };
        const result = await blogCollection.deleteOne(query);
        res.send(result);
    })

    // update a blog
    app.get('/updateBlog/:id', async (req, res) => {
        const id = req.params.id;
        const query = { _id: ObjectId(id) };
        const result = await blogCollection.findOne(query);
        res.send(result);
    })
    app.put('/updateBlog/:id', async (req, res) => {
        const id = req.params.id;
        const updatePd = req.body;
        console.log(id, updatePd);
        const filter = { _id: ObjectId(id) };
        const options = { upsert: true };
        const updateDoc = {
            $set: {
                location: updatePd.location,
                photo: updatePd.photo,
                price: updatePd.price,
                description: updatePd.description,
                rating: updatePd.rating,
                date: updatePd.date,
            },
        };
        const result = await blogCollection.updateOne(filter, updateDoc, options);
        res.send(result);
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