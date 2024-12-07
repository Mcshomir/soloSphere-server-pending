const express = require("express");
const cors = require("cors");
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

const port = process.env.PORT || 8000;
const app = express();

app.use(cors({
    origin: process.env.NODE_ENV === 'production' ? "https://your-production-site.com" : "http://localhost:5173",
    credentials: true,
}));

app.use(express.json());

if (!process.env.DB_USER || !process.env.DB_PASSWORD) {
    throw new Error("Missing environment variables: DB_USER or DB_PASSWORD");
}

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@childrestartproject.4tzc0.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        const jobsCollection = client.db("soloSphere").collection("jobs");
        const bidCollection = client.db("soloSphere").collection("bid");

        app.get('/jobs', async (req, res) => {
            try {
                const result = await jobsCollection.find().toArray();
                res.send(result);
            } catch (error) {
                console.error("Error fetching jobs:", error);
                res.status(500).send({ error: "Internal server error" });
            }
        });

        app.get('/jobs/:id', async (req, res) => {
            try {
                const id = req.params.id;

                if (!ObjectId.isValid(id)) {
                    return res.status(400).json({ error: 'Invalid ID format' });
                }

                const query = { _id: new ObjectId(id) };
                const result = await jobsCollection.findOne(query);

                if (!result) {
                    return res.status(404).json({ error: "Job not found" });
                }

                res.send(result);
            } catch (error) {
                console.error("Error fetching job:", error);
                res.status(500).send({ error: "Internal server error" });
            }
        });

        app.post('/bids', async (req, res) => {
            try {
                const bisData = req.body;
                const result = await bidCollection.insertOne(bisData);
                res.send(result);
            } catch (error) {
                console.error("Error creating bid:", error);
                res.status(500).send({ error: "Internal server error" });
            }
        });

        app.post('/addJobs', async (req, res) => {
            try {
                const addData = req.body;
                const result = await jobsCollection.insertOne(addData);
                res.send(result);
            } catch (error) {
                console.error("Error adding job:", error);
                res.status(500).send({ error: "Internal server error" });
            }
        });

        // app.get('/jobs/:email', async (req, res) => {
        //     try {
        //         const email = req.params.email;
        //         const query = { "buyer.email": email };
        //         const result = await jobsCollection.find(query).toArray();
        //         res.send(result);
        //     } catch (error) {
        //         console.error("Error fetching jobs by email:", error);
        //         res.status(500).send({ error: "Internal server error" });
        //     }
        // });
        app.get('/jobs/:email', async (req, res) => {
            try {
                const email = req.params.email;
                console.log("Fetching jobs for email:", email); // Log email
                const query = { "buyer.email": email };
                console.log("Query:", query); // Log query
                const result = await jobsCollection.find(query).toArray();
                res.send(result);
            } catch (error) {
                console.error("Error fetching jobs by email:", error);
                res.status(500).send({ error: "Internal server error" });
            }
        });

        app.delete("/jobs/:id", async (req, res) => {
            const id = req.params.id
            const query = { _id: new ObjectId(id) }
            const result = await jobsCollection.deleteOne(query)
            res.send(result);
        })

        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");

        process.on('SIGINT', async () => {
            await client.close();
            console.log("MongoDB client closed");
            process.exit(0);
        });

    } finally {
        // Uncomment this to close the connection on shutdown
        // await client.close();
    }
}

run().catch(console.dir);

app.get('/', (req, res) => {
    res.send("Hello from soloSphere server...");
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
