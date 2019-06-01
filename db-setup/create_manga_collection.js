var MongoClient = require('mongodb').MongoClient;
var url = "mongodb://localhost:27017/";

MongoClient.connect(url, { useNewUrlParser: true }, function(err, db) {
    if (err) throw err;
    
    const dbo = db.db("hobbies-db");
    
    dbo.createCollection("manga_ratings", function(err, res) {
        if (err) throw err;
        console.log("Collection Created: book_ratings");
        db.close();
    });
});