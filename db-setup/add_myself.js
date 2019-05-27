var MongoClient = require('mongodb').MongoClient;
var url = "mongodb://localhost:27017/";

MongoClient.connect(url, { useNewUrlParser: true }, function(err, db) {
    if (err) throw err;
    
    const dbo = db.db("hobbies-db");
    
    const me = {uid: 'srad1292', first_name: 'Sam', last_name: 'Radford'}
    dbo.collection("users").insertOne(me, function(err, res) {
        if (err) throw err;
        console.log("User Inserted: srad1292");
        db.close();
    });
});