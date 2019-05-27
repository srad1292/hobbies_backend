const MongoClient = require('mongodb').MongoClient;
const url = "mongodb://localhost:27017/hobbies-db";

MongoClient.connect(url, { useNewUrlParser: true }, function(err, db) {
    if (err) throw err;
    console.log("Database created!");    
    db.close();
});