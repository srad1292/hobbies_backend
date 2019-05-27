const bcrypt = require('bcrypt');
const cors = require('cors');
const express = require('express');
const MongoClient = require('mongodb').MongoClient;
const request = require('request');

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
 * 2. Routes for CRUD for anime table
 * 3. Routes for CRUD for manga table
 * 4. Routes for CRUD for books table
 * 5. Routes for CRUD for movies table(if i add this)
 * 6. Maybe move routes outside of server file to use a more MVC type system
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

