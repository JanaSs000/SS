const { MongoClient } = require("mongodb");
mongodb+srv://srbakoskaj_db_user:<db_password>@m0.gyjrp7p.mongodb.net/?appName=M0

const uri = process.env.MONGODB_URI;
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
