const { MongoClient } = require("mongodb");

const uri = process.env.MONGODB_URI;

if (!uri) {
    throw new Error("MONGODB_URI is not set");
}

const client = new MongoClient(uri);
let db;

async function connectDB() {
    if (!db) {
        await client.connect();
        db = client.db("sparkleStyle");
    }
    return db;
}

module.exports = { connectDB };
