const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
// const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;

// middleware
app.use(cors());
app.use(express.json());


const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.4cizlao.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

function verifyJWT(req, res, next) {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.status(401).send({ message: 'Unauthorized access' });
    }
    const token = authHeader.split(' ')[1];

    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function (err, decoded) {
        if (err) {
            return res.status(403).send({ message: 'Forbidden access' });
        }
        req.decoded = decoded;
        next();
    })
}
async function run() {
    try {
        const tasksCollection = client.db('manageYourTasks').collection('tasks');

        app.post('/jwt', (req, res) => {
            const user = req.body;
            const token = jwt.sign(user, process.env.ACCESS_TOKEN, { expiresIn: '1d' });
            res.send({ token });
        })
        // Tasks get api
        app.get('/tasks', async (req, res) => {
            const query = {};
            const task = await tasksCollection.find(query).toArray();
            res.send(task);
        })
        app.get('/tasks/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: ObjectId(id) };
            const result = await tasksCollection.findOne(filter);
            res.send(result);
        })
        app.get('/myTasks', async (req, res) => {
            let query = {};
            if (req.query.email) {
                query = {
                    email: req.query.email
                }
            }
            const cursor = tasksCollection.find(query);
            const tasks = await cursor.toArray();
            res.send(tasks);
        })
        // Tasks post api
        app.post('/tasks', async (req, res) => {
            const tasks = req.body;
            const result = await tasksCollection.insertOne(tasks);
            res.send(result);

        });
        app.post('/tasksComment', async (req, res) => {
            const tasks = req.body;
            const result = await tasksCollection.insertOne(tasks);
            res.send(result);

        });

        // Completed tasks api
        app.put('/tasks/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: ObjectId(id) };
            const options = { upsert: true };
            const updatedDoc = {
                $set: {
                    condition: 'completed'
                }
            }
            const result = await tasksCollection.updateOne(filter, updatedDoc, options);
            res.send(result)
        })
        // Updated tasks api
        app.patch('/updateTask/:id', async (req, res) => {
            const id = req.params.id;
            const task = req.body;
            console.log(task)
            const filter = { _id: ObjectId(id) };
            const options = { upsert: true };
            const updatedDoc = {
                $set : {
                    title: task.title,
                    time: task.time
                }
            }
            const result = await tasksCollection.updateOne(filter, updatedDoc, options);
            res.send(result)
        })
      
        // delete task
        app.delete('/tasks/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await tasksCollection.deleteOne(query);
            // console.log(result);
            res.send(result);
        })
    }
    finally {

    }
}
run().catch(err => console.error(err));

app.get('/', (req, res) => {
    res.send('Manage Your Task app is running now on port 5000');
});

app.listen(port, () => {
    console.log(`Manage Your Task app is running on the ${port}`);
})