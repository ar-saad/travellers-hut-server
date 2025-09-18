const express = require("express");
const cors = require("cors");
const { MongoClient } = require("mongodb");
const ObjectId = require("mongodb").ObjectId;
require("dotenv").config();

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.ncv5znt.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function run() {
  try {
    await client.connect();
    const database = client.db("travellers_hut");
    const blogsCollection = database.collection("blogs");
    const usersCollection = database.collection("users");

    /* GET */

    // Get all the blogs
    app.get("/manageBlogs", async (req, res) => {
      const cursor = blogsCollection.find({});
      const blogs = await cursor.toArray();
      res.json(blogs);
    });

    // Get all the approved blogs with pagination function
    app.get("/blogs", async (req, res) => {
      const query = { status: "approved" };
      const cursor = blogsCollection.find(query);
      const page = req.query.page;
      const size = parseInt(req.query.size);
      let blogs;
      const count = await cursor.count();
      if (page) {
        blogs = await cursor
          .skip(page * size)
          .limit(size)
          .toArray();
      } else {
        blogs = await cursor.toArray();
      }
      res.send({ count, blogs });
    });

    // Get the pending blogs
    app.get("/pendingBlogs", async (req, res) => {
      const query = { status: "pending" };
      const cursor = blogsCollection.find(query);
      const pendingBlogs = await cursor.toArray();
      res.json(pendingBlogs);
    });

    // Get a single blog
    app.get("/blogs/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const blog = await blogsCollection.findOne(query);
      res.json(blog);
    });

    // Check if the user is admin or not
    app.get("/users/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email: email };
      const user = await usersCollection.findOne(query);
      let isAdmin = false;
      if (user?.role === "admin") {
        isAdmin = true;
      }
      res.json({ admin: isAdmin });
    });

    /* POST */

    // add new user from registration form
    app.post("/users", async (req, res) => {
      const user = req.body;
      const result = await usersCollection.insertOne(user);
      res.json(result);
    });

    // Add a new blog in the database
    app.post("/blogs", async (req, res) => {
      const blog = req.body;
      const result = await blogsCollection.insertOne(blog);
      res.json(result);
    });

    /* PUT OR UPDATE */

    // add new or old user from google login system
    app.put("/users", async (req, res) => {
      const user = req.body;
      const filter = { email: user.email };
      const options = { upsert: true };
      const updateDoc = { $set: user };
      const result = await usersCollection.updateOne(
        filter,
        updateDoc,
        options
      );
      res.json(result);
    });

    // Add a new user as admin
    app.put("/users/admin", async (req, res) => {
      console.log("API hit");
      const userEmail = req.body.email;
      const filter = { email: userEmail };
      const updateDoc = { $set: { role: "admin" } };
      const result = await usersCollection.updateOne(filter, updateDoc);
      res.json(result);
    });

    // Update a blog
    app.put("/blogs/:id", async (req, res) => {
      console.log("api hit");
      const id = req.params.id;
      const updatedBlog = req.body;
      const query = { _id: ObjectId(id) };
      const options = { upsert: true };
      const updateDoc = {
        $set: {
          status: updatedBlog.status,
          blogTitle: updatedBlog.blogTitle,
          blogImg: updatedBlog.blogImg,
          traveller: updatedBlog.traveller,
          cost: updatedBlog.cost,
          category: updatedBlog.category,
          location: updatedBlog.location,
          description: updatedBlog.description,
        },
      };
      const result = await blogsCollection.updateOne(query, updateDoc, options);
      res.json(result);
    });

    // Approve a pending blog
    app.put("/blogs/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: ObjectId(id) };
      const options = { upsert: true };
      const updateDoc = { $set: { status: "approved" } };
      const result = await blogsCollection.updateOne(
        filter,
        updateDoc,
        options
      );
      res.json(result);
    });

    /* DELETE */

    // Delete a blog based on Id
    app.delete("/blogs/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await blogsCollection.deleteOne(query);
      res.json(result);
    });
  } finally {
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Travellers Hut server is running");
});

app.listen(port, () => {
  console.log("Travellers Hut server is running on:", port);
});
