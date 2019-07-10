const bcrypt = require('bcrypt');
const cors = require('cors');
const express = require('express');
const MongoClient = require('mongodb').MongoClient;
const {ObjectId} = require('mongodb');
const request = require('request');
var xtjParseString = require('xml2js').parseString;
const apiKeys = require('./api_keys');

const url = "mongodb://localhost:27017/";
const salt_rounds = 10;

let dbh;

MongoClient.connect(url, { useNewUrlParser: true }, function(err, db) {
    if (err) throw err;
    
    dbh = db.db("hobbies-db");
});

const app = express();

const corsOptions = {
  origin: 'http://localhost:4200',
  optionsSuccessStatus: 200  
}

app.use(cors(corsOptions));
app.use(express.json());

app.listen(8000, () => {
    console.log('Server started!');
});


/**
 * To-do
 * 1. Routes for updating/deleting user
 * X. Routes for CRUD for anime table
 * X. Routes for CRUD for manga table
 * 4. Routes for CRUD for books table
 * 5. Routes for CRUD for movies table(if i add this)
 * 6. Update return key to specify message or mongoMessage depending on error source
 * 7. Maybe move routes outside of server file to use a more MVC type system
 */

//Anime Routes

/**
 * Hit api to retrieve details on an anime for a given id
 * 
 * @param {id: string} - myanimelist id for anime
 * 
 * Success -
 * @returns {anime: object} - Anime data for provided id on success
 * Error -
 * @returns {error: Object} - HTTP Error object with reason for failure
 */
app.route('/anime/:id').get((req, res) => {
  const animeId = req.params['id'];

  //Probably need to do error handling to make sure id is a simple integer
  
  request.get(
    {
      url: `https://api.jikan.moe/v3/anime/${animeId}`,
      json: true
    },
    function(error, response, body) {
      if(error) {
        return res.status(error.status).send({
            message: error.error
        });
      }
      else {
        return res.send({anime: body});
      }
    }
  )
});

/**
 * Retrieve an anime rating document based on a given
 * username and anime id
 * 
 * @param {id: string} - MAL anime ID
 * @param {user: string} - Username for who we want the rating for
 * 
 * Success -
 * @returns {rating: object} - The anime_rating document
 * Error -
 * @returns {error: Object} - HTTP Error object with reason for failure
 */
app.route('/anime/rating/:id/for/:user').get((req, res) => {
  const animeId = parseInt(req.params['id'], 10);
  const userName = req.params['user'];
  dbh.collection("anime_ratings").findOne({malId: animeId, userName:userName}, function(err, findRes) {
    if (err) {
      return res.status(500).send({
        message: err
      });
    }
    else {
      //No rating found for that anime/user combo
      if(!findRes) {
        return res.send({message: 'No error, but no data found'});
      }

      return res.send({rating: findRes});
    }
  });
});

/**
 * Creates a new document in the anime_rating table for a user
 * 
 * @param {rating: object} - A anime_rating object to insert
 * 
 * Success -
 * @returns {rating: object} - A message and the id for the new document
 * Error -
 * @returns {error: Object} - HTTP Error object with reason for failure
 */
app.route('/anime/rating/').post((req, res) => {
  const newRating = req.body['rating'];

  //Handle cases where user data isn't as expected just to be safe 

  dbh.collection("anime_ratings").insertOne(newRating, function(err, insertRes) {
    if (err){
      return res.status(500).send({
        message: err
      });
    }
    if(insertRes && insertRes.insertedId) {
      return res.send({ message: 'ok', recordId: insertRes.insertedId });  
    }
    else{
      return res.send({message: 'No error, but no data found'});
    }
  });

});

/**
 * Updates a document in the anime_rating table for a user
 * 
 * @param {rating: object} - The updated anime_rating object
 * 
 * Success -
 * @returns {rating: object} - A success message
 * Error -
 * @returns {error: Object} - HTTP Error object with reason for failure
 */
app.route('/anime/rating/').put((req, res) => {
  const requestBody = req.body['rating'];
  const updateQuery = { $set: requestBody}; 

  const ratingQuery = {_id: requestBody['_id']};
  dbh.collection("anime_ratings").updateOne(ratingQuery, updateQuery, function(err, updateRes) {
    if (err){
      return res.status(500).send({
        message: err
      });
    }
    return res.send({ message: 'ok' });
  });
});

/**
 * Removes an anime_rating document from the table
 * 
 * @param {id: string} - The _id for the document to be deleted
 * 
 * Success -
 * @returns {rating: object} - A success message
 * Error -
 * @returns {error: Object} - HTTP Error object with reason for failure
 */
app.route('/anime/rating/:id/').delete((req, res) => {
  const id = ObjectId(req.params['id']);
  const ratingQuery = {_id: id};
  dbh.collection("anime_ratings").deleteOne(ratingQuery, function(err, deleteRes) {
    if (err){
      return res.status(500).send({
        message: err
      });
    }
    if(deleteRes && deleteRes.deletedCount && deleteRes.deletedCount == 1) {
      return res.send({ message: 'ok' });
    }
    else {
      return res.send({ message: 'No errors, but nothing deleted' });
    }
  });
});


/**
 * Retrieve all anime ratings for a given user
 * 
 * @param {user: string} - Username for who we want the rating for
 * 
 * Success -
 * @returns {rating: object} - The anime_rating document
 * Error -
 * @returns {error: Object} - HTTP Error object with reason for failure
 */
app.route('/anime/ratings/:user').get((req, res) => {
  const userName = req.params['user'];
  dbh.collection("anime_ratings").find({userName:userName}).toArray(function(err, findRes) {
    if (err) {
      return res.status(500).send({
        message: err
      });
    }
    else {
      //No rating found for that anime/user combo
      if(!findRes) {
        return res.send({message: 'No error, but no data found'});
      }
      return res.send({ratings: findRes});
    }
  });
});






//Manga Routes

/**
 * Hit api to retrieve details on an manga for a given id
 * 
 * @param {id: string} - myanimelist id for manga
 * 
 * Success -
 * @returns {manga: object} - Manga data for provided id on success
 * Error -
 * @returns {error: Object} - HTTP Error object with reason for failure
 */
app.route('/manga/:id').get((req, res) => {
  const mangaId = req.params['id'];

  //Probably need to do error handling to make sure id is a simple integer
  
  request.get(
    {
      url: `https://api.jikan.moe/v3/manga/${mangaId}`,
      json: true
    },
    function(error, response, body) {
      if(error) {
        return res.status(error.status).send({
            message: error.error
        });
      }
      if(body && body.related && body.related['Alternative version']) {
        body.related.alternative_version = delete body.related['Alternative version'];
      }
      if(body && body.related && body.related['Side story']) {
        body.related.side_story = delete body.related['Side story'];
      }

      else {
        return res.send({manga: body});
      }
    }
  )
});


// *************************

/**
 * Retrieve all manga ratings for a given user
 * 
 * @param {user: string} - Username for who we want the rating for
 * 
 * Success -
 * @returns {rating: object} - The manga_rating document
 * Error -
 * @returns {error: Object} - HTTP Error object with reason for failure
 */
app.route('/manga/ratings/:user').get((req, res) => {
  const userName = req.params['user'];
  dbh.collection("manga_ratings").find({userName:userName}).toArray(function(err, findRes) {
    if (err) {
      return res.status(500).send({
        message: err
      });
    }
    else {
      //No rating found for that manga/user combo
      if(!findRes) {
        return res.send({message: 'No error, but no data found'});
      }
      return res.send({ratings: findRes});
    }
  });
});

/**
 * Retrieve an manga rating document based on a given
 * username and manga id
 * 
 * @param {id: string} - MAL manga ID
 * @param {user: string} - Username for who we want the rating for
 * 
 * Success -
 * @returns {rating: object} - The manga_rating document
 * Error -
 * @returns {error: Object} - HTTP Error object with reason for failure
 */
app.route('/manga/rating/:id/for/:user').get((req, res) => {
  const mangaId = parseInt(req.params['id'], 10);
  const userName = req.params['user'];
  dbh.collection("manga_ratings").findOne({malId: mangaId, userName:userName}, function(err, findRes) {
    if (err) {
      return res.status(500).send({
        message: err
      });
    }
    else {
      //No rating found for that manga/user combo
      if(!findRes) {
        return res.send({message: 'No error, but no data found'});
      }

      return res.send({rating: findRes});
    }
  });
});

/**
 * Creates a new document in the manga_rating table for a user
 * 
 * @param {rating: object} - A manga_rating object to insert
 * 
 * Success -
 * @returns {rating: object} - A message and the id for the new document
 * Error -
 * @returns {error: Object} - HTTP Error object with reason for failure
 */
app.route('/manga/rating/').post((req, res) => {
  const newRating = req.body['rating'];

  //Handle cases where user data isn't as expected just to be safe 

  dbh.collection("manga_ratings").insertOne(newRating, function(err, insertRes) {
    if (err){
      return res.status(500).send({
        message: err
      });
    }
    if(insertRes && insertRes.insertedId) {
      return res.send({ message: 'ok', recordId: insertRes.insertedId });  
    }
    else{
      return res.send({message: 'No error, but no data found'});
    }
  });

});

/**
 * Updates a document in the manga_rating table for a user
 * 
 * @param {rating: object} - The updated manga_rating object
 * 
 * Success -
 * @returns {rating: object} - A success message
 * Error -
 * @returns {error: Object} - HTTP Error object with reason for failure
 */
app.route('/manga/rating/').put((req, res) => {
  const requestBody = req.body['rating'];
  const ratingQuery = {_id: ObjectId(requestBody['_id'])};
  delete requestBody['_id'];
  const updateQuery = { $set: requestBody}; 

  dbh.collection("manga_ratings").updateOne(ratingQuery, updateQuery, function(err, updateRes) {
    if (err){
      return res.status(500).send({
        message: err
      });
    }
    if( updateRes && updateRes['modifiedCount']) {
      return res.send({ message: 'ok' });
    }
    return res.status(500).send({
      message: 'Failed to update'
    });
  });
});

/**
 * Removes an manga_rating document from the table
 * 
 * @param {id: string} - The _id for the document to be deleted
 * 
 * Success -
 * @returns {rating: object} - A success message
 * Error -
 * @returns {error: Object} - HTTP Error object with reason for failure
 */
app.route('/manga/rating/:id/').delete((req, res) => {
  const id = ObjectId(req.params['id']);
  const ratingQuery = {_id: id};
  dbh.collection("manga_ratings").deleteOne(ratingQuery, function(err, deleteRes) {
    if (err){
      return res.status(500).send({
        message: err
      });
    }
    if(deleteRes && deleteRes.deletedCount && deleteRes.deletedCount == 1) {
      return res.send({ message: 'ok' });
    }
    else {
      return res.send({ message: 'No errors, but nothing deleted' });
    }
  });
});

//**************************

//Book Routes

/**
 * Hit api to retrieve details on an book for a given id
 * 
 * @param {id: string} - isbn for book
 * 
 * Success -
 * @returns {book: object} - Book data for provided id on success
 * Error -
 * @returns {error: Object} - HTTP Error object with reason for failure
 */
app.route('/book/:id').get((req, res) => {
  const isbn = req.params['id'];


  //Handle input errors
  const params = {format: 'xml', key: apiKeys.goodReadsKey, id: isbn};

  request.get(
    {
      url: `https://www.goodreads.com/book/show`,
      qs: params,
      
    },
    function(error, response, body) {
      if(error) {
        return res.status(error.status).send({
            message: error.error
        });
      }
      else {
        xtjParseString(body, function (err, result) {
          if(err) {
            return res.status(err.status).send({
                message: err.error
            });
          }
          const parsedResult = (result && 'GoodreadsResponse' in result && 'book' in result.GoodreadsResponse) ? parseGoodReadsDetails(result.GoodreadsResponse.book) : {};
          return res.send({book: parsedResult});
          
        });
          
      }
    }
  )
});

function parseGoodReadsDetails(bookAsArray) {
  const book = bookAsArray[0] || {};

  let authorsList = parseAuthors(book);
  let similarBooks = parseSimilarBooks(book);

  return {
    id: (book.id || []).join(""),
    title: (book.title || []).join(""),
    isbn: (book.isbn || []).join(""),
    image_url: (book.image_url || []).join(""),
    small_image_url: (book.small_image_url || []).join(""),
    publication_year: (book.publication_year || []).join(""),
    publication_month: (book.publication_month || []).join(""),
    publication_day: (book.publication_day || []).join(""),
    publisher: (book.publisher || []).join(", "),
    description: (book.description || []).join("").replace(/(\.<([^>]+)>)/ig,".  ").replace(/(<([^>]+)>)/ig,""),
    average_rating: (book.average_rating || []).join(""),
    ratings_count: (book.ratings_count || []).join(""),
    num_pages: (book.num_pages || []).join(""),
    url: (book.url || []).join(""),
    authors: authorsList,
    similar_books: similarBooks,
  }
}

function parseAuthors(book) {
  return ('authors' in book && book.authors.length > 0 && 'author' in book.authors[0]) ? 
    book.authors[0].author.map(author => {
      return {
        name: ('name' in author && author.name.length > 0) ? author.name[0] : '',
        role: ('role' in author && author.role.length > 0) ? author.role[0] : '',
      }
    }) : [];
}

function parseSimilarBooks(book) {
  let similarBooks = ('similar_books' in book && book.similar_books.length > 0 && 'book' in book.similar_books[0]) ? book.similar_books[0].book : [];

  return similarBooks.map(simBook => {
    return {
      authors: parseAuthors(simBook),
      average_rating: (simBook.average_rating || []).join(""),
      isbn: (simBook.isbn || []).join(""),
      id: (simBook.id || []).join(""),
      num_pages: (simBook.num_pages || []).join(""),
      title: (simBook.title || []).join(""),
      publication_year: (simBook.publication_year || []).join(""),
    }
  });

}

/**
 * Retrieve all book ratings for a given user
 * 
 * @param {user: string} - Username for who we want the rating for
 * 
 * Success -
 * @returns {rating: object} - The book_rating document
 * Error -
 * @returns {error: Object} - HTTP Error object with reason for failure
 */
app.route('/book/ratings/:user').get((req, res) => {
  const userName = req.params['user'];
  dbh.collection("book_ratings").find({userName:userName}).toArray(function(err, findRes) {
    if (err) {
      return res.status(500).send({
        message: err
      });
    }
    else {
      //No rating found for that book/user combo
      if(!findRes) {
        return res.send({message: 'No error, but no data found'});
      }
      return res.send({ratings: findRes});
    }
  });
});

/**
 * Retrieve an book rating document based on a given
 * username and book id
 * 
 * @param {id: string} - MAL book ID
 * @param {user: string} - Username for who we want the rating for
 * 
 * Success -
 * @returns {rating: object} - The book_rating document
 * Error -
 * @returns {error: Object} - HTTP Error object with reason for failure
 */
app.route('/book/rating/:id/for/:user').get((req, res) => {
  const bookId = req.params['id'];
  const userName = req.params['user'];
  dbh.collection("book_ratings").findOne({goodreadsId: bookId, userName:userName}, function(err, findRes) {
    if (err) {
      return res.status(500).send({
        message: err
      });
    }
    else {
      //No rating found for that book/user combo
      if(!findRes) {
        return res.send({message: 'No error, but no data found'});
      }

      return res.send({rating: findRes});
    }
  });
});

/**
 * Creates a new document in the book_rating table for a user
 * 
 * @param {rating: object} - A book_rating object to insert
 * 
 * Success -
 * @returns {rating: object} - A message and the id for the new document
 * Error -
 * @returns {error: Object} - HTTP Error object with reason for failure
 */
app.route('/book/rating/').post((req, res) => {
  const newRating = req.body['rating'];

  //Handle cases where user data isn't as expected just to be safe 

  dbh.collection("book_ratings").insertOne(newRating, function(err, insertRes) {
    if (err){
      return res.status(500).send({
        message: err
      });
    }
    if(insertRes && insertRes.insertedId) {
      return res.send({ message: 'ok', recordId: insertRes.insertedId });  
    }
    else{
      return res.send({message: 'No error, but no data found'});
    }
  });

});

/**
 * Updates a document in the book_rating table for a user
 * 
 * @param {rating: object} - The updated book_rating object
 * 
 * Success -
 * @returns {rating: object} - A success message
 * Error -
 * @returns {error: Object} - HTTP Error object with reason for failure
 */
app.route('/book/rating/').put((req, res) => {
  const requestBody = req.body['rating'];
  const ratingQuery = {_id: ObjectId(requestBody['_id'])};
  delete requestBody['_id'];
  const updateQuery = { $set: requestBody}; 

  dbh.collection("book_ratings").updateOne(ratingQuery, updateQuery, function(err, updateRes) {
    if (err){
      return res.status(500).send({
        message: err
      });
    }
    if( updateRes && updateRes['modifiedCount']) {
      return res.send({ message: 'ok' });
    }
    return res.status(500).send({
      message: 'Failed to update'
    });
  });
});

/**
 * Removes an book_rating document from the table
 * 
 * @param {id: string} - The _id for the document to be deleted
 * 
 * Success -
 * @returns {rating: object} - A success message
 * Error -
 * @returns {error: Object} - HTTP Error object with reason for failure
 */
app.route('/book/rating/:id/').delete((req, res) => {
  const id = ObjectId(req.params['id']);
  const ratingQuery = {_id: id};
  dbh.collection("book_ratings").deleteOne(ratingQuery, function(err, deleteRes) {
    if (err){
      return res.status(500).send({
        message: err
      });
    }
    if(deleteRes && deleteRes.deletedCount && deleteRes.deletedCount == 1) {
      return res.send({ message: 'ok' });
    }
    else {
      return res.send({ message: 'No errors, but nothing deleted' });
    }
  });
});


//**************************

//Movie Routes

/**
 * Hit api to retrieve details on an movie for a given id
 * 
 * @param {id: string} - isbn for movie
 * 
 * Success -
 * @returns {movie: object} - Movie data for provided id on success
 * Error -
 * @returns {error: Object} - HTTP Error object with reason for failure
 */
app.route('/movie/:id').get((req, res) => {
  const id = req.params['id'];
  const apiKey = apiKeys.theMovieDBKey;

  //Handle input errors
  request.get(
    {
      url: `https://api.themoviedb.org/3/movie/${id}?api_key=${apiKey}`,      
    },
    function(error, response, body) {
        if(error) {
            return res.status(error.status).send({
                message: error.error
            });
        }
        else {
            return res.send({movie: (body  || '{}') });
        }
    }
  )
});


/**
 * Retrieve all movie ratings for a given user
 * 
 * @param {user: string} - Username for who we want the rating for
 * 
 * Success -
 * @returns {rating: object} - The movie_rating document
 * Error -
 * @returns {error: Object} - HTTP Error object with reason for failure
 */
app.route('/movie/ratings/:user').get((req, res) => {
  const userName = req.params['user'];
  dbh.collection("movie_ratings").find({userName:userName}).toArray(function(err, findRes) {
    if (err) {
      return res.status(500).send({
        message: err
      });
    }
    else {
      //No rating found for that movie/user combo
      if(!findRes) {
        return res.send({message: 'No error, but no data found'});
      }
      return res.send({ratings: findRes});
    }
  });
});

/**
 * Retrieve an movie rating document based on a given
 * username and movie id
 * 
 * @param {id: string} - MAL movie ID
 * @param {user: string} - Username for who we want the rating for
 * 
 * Success -
 * @returns {rating: object} - The movie_rating document
 * Error -
 * @returns {error: Object} - HTTP Error object with reason for failure
 */
app.route('/movie/rating/:id/for/:user').get((req, res) => {
  const movieId = parseInt(req.params['id'], 10);
  const userName = req.params['user'];
  
  dbh.collection("movie_ratings").findOne({id: movieId, userName:userName}, function(err, findRes) {
    if (err) {
      return res.status(500).send({
        message: err
      });
    }
    else {
      //No rating found for that movie/user combo
      if(!findRes) {
        return res.send({message: 'No error, but no data found'});
      }

      return res.send({rating: findRes});
    }
  });
});

/**
 * Creates a new document in the movie_rating table for a user
 * 
 * @param {rating: object} - A movie_rating object to insert
 * 
 * Success -
 * @returns {rating: object} - A message and the id for the new document
 * Error -
 * @returns {error: Object} - HTTP Error object with reason for failure
 */
app.route('/movie/rating/').post((req, res) => {
  const newRating = req.body['rating'];

  //Handle cases where user data isn't as expected just to be safe 

  dbh.collection("movie_ratings").insertOne(newRating, function(err, insertRes) {
    if (err){
      return res.status(500).send({
        message: err
      });
    }
    if(insertRes && insertRes.insertedId) {
      return res.send({ message: 'ok', recordId: insertRes.insertedId });  
    }
    else{
      return res.send({message: 'No error, but no data found'});
    }
  });

});

/**
 * Updates a document in the movie_rating table for a user
 * 
 * @param {rating: object} - The updated movie_rating object
 * 
 * Success -
 * @returns {rating: object} - A success message
 * Error -
 * @returns {error: Object} - HTTP Error object with reason for failure
 */
app.route('/movie/rating/').put((req, res) => {
  const requestBody = req.body['rating'];
  const ratingQuery = {_id: ObjectId(requestBody['_id'])};
  delete requestBody['_id'];
  const updateQuery = { $set: requestBody}; 

  dbh.collection("movie_ratings").updateOne(ratingQuery, updateQuery, function(err, updateRes) {
    if (err){
      return res.status(500).send({
        message: err
      });
    }
    if( updateRes && updateRes['modifiedCount']) {
      return res.send({ message: 'ok' });
    }
    return res.status(500).send({
      message: 'Failed to update'
    });
  });
});

/**
 * Removes an movie_rating document from the table
 * 
 * @param {id: string} - The _id for the document to be deleted
 * 
 * Success -
 * @returns {rating: object} - A success message
 * Error -
 * @returns {error: Object} - HTTP Error object with reason for failure
 */
app.route('/movie/rating/:id/').delete((req, res) => {
  const id = ObjectId(req.params['id']);
  const ratingQuery = {_id: id};
  dbh.collection("movie_ratings").deleteOne(ratingQuery, function(err, deleteRes) {
    if (err){
      return res.status(500).send({
        message: err
      });
    }
    if(deleteRes && deleteRes.deletedCount && deleteRes.deletedCount == 1) {
      return res.send({ message: 'ok' });
    }
    else {
      return res.send({ message: 'No errors, but nothing deleted' });
    }
  });
});

//User Routes

/**
 * Retrieve A User Document Based On The Given Username
 * 
 * @param {uid: string} - Username to lookup user data for
 * 
 * Success -
 * @returns {user: object} - User data for provided name on success
 * Error -
 * @returns {error: Object} - HTTP Error object with reason for failure
 */
app.route('/user/:uid').get((req, res) => {
    const requestedUserId = req.params['uid'];

    //Switch to getting from db
    res.send({
      user: {uid: 'srad1292', first_name: 'Sam', last_name: 'Radford', token: 'fake-jwt-token'}
    });
});

/**
 * Checks to make sure a given username does not exist and
 * if not, adds a new user document to users table to 
 * register user with application
 * 
 * @param {user: Object} - User object containing registration details
 * 
 * Success -
 * @returns {user: object} - User data for provided details on success
 * Error -
 * @returns {error: Object} - HTTP Error object with reason for failure
 */
app.route('/user/register').post((req, res) => {
  const newUser = req.body['user'];

  //Handle cases where user data isn't as expected just to be safe 

  dbh.collection("users").findOne({uid:newUser['first_name']}, function(err, findRes) {
    if (err) {
      return res.status(500).send({
        message: err
      });
    }
    else {
      //If a user already exists with this username, cannot create another
      if(findRes) {
        return res.status(400).send({
          message: 'A user already exists with this username'
        });
      }

      bcrypt.hash(newUser['password'], salt_rounds, function(err, hash) {
        if(err) {
          return res.status(500).send({
            message: err
          });
        }
        newUser['password'] = hash;
        dbh.collection("users").insertOne(newUser, function(err, insertRes) {
          if (err){
            return res.status(500).send({
              message: err
            });
          }
          
          return res.send({ message: 'ok' });  
        });
      });
    }
  });


});

/**
 * Given a username and password, check to make sure that a user exists
 * with that combination, and if so return the user data.
 * 
 * @param {uid: string} - Username for login attempt
 * @param {password: string} - Password for login attempt
 * 
 * Success -
 * @returns {user: object} - User data for provided name on success
 * Error -
 * @returns {error: Object} - HTTP Error object with reason for failure
 */
app.route('/user/authenticate').post((req, res) => {

    const username = req.body.username;
    const password = req.body.password;

    dbh.collection("users").findOne({uid:username}, { projection: { _id: 0 } }, function(err, findRes) {
      if (err) {
        return res.status(500).send({
          message: err
        });
      }
      else {
        if(!findRes) {
          return res.status(404).send({
            message: 'No user found with this username'
          });
        }
        else {
          bcrypt.compare(password, findRes['password'], function(err, compRes) {
            if (err) {
              return res.status(500).send({
                message: err
              });
            }
            if(compRes) {
              // Passwords match
              findRes['token'] = 'fake-jwt-token';
              delete findRes['password'];
              return res.send( findRes );
            } else {
              // Passwords don't match
              return res.status(404).send({
                message: 'Incorrect Password'
              });
            } 
          });
          
        }
        
      }
    });
});


//Search Routes

/**
 * Hit api to retrieve details for anime matching search value
 * 
 * @param {title: string} - text you want to search anime titles for
 * 
 * Success -
 * @returns {anime: array<object>} - Anime data for provided title on success
 * Error -
 * @returns {error: Object} - HTTP Error object with reason for failure
 */
app.route('/search/anime/:title').get((req, res) => {
  const title = req.params['title'];

  //Handle input errors
  //Search string must be at least 3 chars, will handle client side as well
  
  request.get(
    {
      url: `https://api.jikan.moe/v3/search/anime?q=${title}&page=1`,
      json: true
    },
    function(error, response, body) {
      if(error) {
        return res.status(error.status).send({
            message: error.error
        });
      }
      else {
        return res.send(body.results);
      }
    }
  )
});

/**
 * Hit api to retrieve details for book matching search value
 * 
 * @param {title: string} - text you want to search book titles for
 * 
 * Success -
 * @returns {book: array<object>} - Book data for provided title on success
 * Error -
 * @returns {error: Object} - HTTP Error object with reason for failure
 */
app.route('/search/books/:title').get((req, res) => {
  const title = req.params['title'];

  //Handle input errors
  const params = {'q': title, 'key': apiKeys.goodReadsKey, "search[field]": 'title'};
  
  request.get(
    {
      url: `https://www.goodreads.com/search/index.xml`,
      qs: params,
      json: true
    },
    function(error, response, body) {
      if(error) {
        return res.status(error.status).send({
            message: error.error
        });
      }
      else {
        xtjParseString(body, function (err, result) {
          if(err) {
            return res.status(err.status).send({
                message: err.error
            });
          }
          const searchResults = ((((((result || {}).GoodreadsResponse || {}).search || [{}])[0] || {}).results || [{}])[0] || {}).work || [];
          const cleanedUpResults = parseGoodReadsSearch(searchResults);
          return res.send(cleanedUpResults);
          
        });
      }
    }
  )
});




function parseGoodReadsSearch(results) {
  //Good reads API is an abomination
  return results.map(result => {
      return {
        author: ((((((result || {}).best_book || [{}])[0] || {}).author || [{}])[0] || {}).name || [''])[0] || '',
        average_rating: ((result || {}).average_rating || [''])[0] || '',
        book_id: (((((result || {}).best_book || [{}])[0] || {}).id || [{}])[0] || {})['_'] || '',
        image_url: ((((result || {}).best_book || [{}])[0] || {}).image_url || [''])[0] || '',
        pub_day: (((result || {}).original_publication_day || [{}])[0] || {})['_'] || '',
        pub_month: (((result || {}).original_publication_month || [{}])[0] || {})['_'] || '',
        pub_year: (((result || {}).original_publication_year || [{}])[0] || {})['_'] || '',
        small_image_url: ((((result || {}).best_book || [{}])[0] || {}).small_image_url || [''])[0] || '',
        title: ((((result || {}).best_book || [{}])[0] || {}).title || [''])[0] || '',
        ratings: (((result || {}).ratings_count || [{}])[0] || {})['_'] || '',
        result_id: (((result || {}).id || [{}])[0] || {})['_'] || '' 
      }
  });
}


/**
 * Hit api to retrieve details for manga matching search value
 * 
 * @param {title: string} - text you want to search manga titles for
 * 
 * Success -
 * @returns {manga: array<object>} - Manga data for provided title on success
 * Error -
 * @returns {error: Object} - HTTP Error object with reason for failure
 */
app.route('/search/manga/:title').get((req, res) => {
  const title = req.params['title'];

  //Handle input errors
  //Search string must be at least 3 chars, will handle client side as well
  
  request.get(
    {
      url: `https://api.jikan.moe/v3/search/manga?q=${title}&page=1`,
      json: true
    },
    function(error, response, body) {
      if(error) {
        return res.status(error.status).send({
            message: error.error
        });
      }
      else {
        return res.send(body.results);
      }
    }
  )
});


/**
 * Hit api to retrieve details for movie matching search value
 * 
 * @param {title: string} - text you want to search movie titles for
 * 
 * Success -
 * @returns {movie: array<object>} - Movie data for provided title on success
 * Error -
 * @returns {error: Object} - HTTP Error object with reason for failure
 */
app.route('/search/movie/:title').get((req, res) => {
  const title = req.params['title'];
  const apiKey = apiKeys.theMovieDBKey;
  //Handle input errors
  
  request.get(
    {
      url: `https://api.themoviedb.org/3/search/movie?api_key=${apiKey}&query=${title}&page=1&include_adult=false`,
      json: true
    },
    function(error, response, body) {
      if(error) {
        return res.status(error.status).send({
            message: error.error
        });
      }
      else {
        if('success' in body && body.success === false) {
          return res.status(400).send({
            message: body.status_message || 'Invalid Request'
          });
        }
        else {
          return res.send(body.results);
        }
      }
    }
  )
});
