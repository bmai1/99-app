require('dotenv').config();

// const { MongoClient, ServerApiVersion } = require('mongodb');
const mongoose = require('mongoose');
const User = require('./models/accounts');
const Leaderboard = require('./models/leaderboard');

// login session w/ cookies
const jwt = require('jsonwebtoken');
const { generateToken } = require('./jwtUtils');
const cookieParser = require('cookie-parser');

const bodyParser = require('body-parser');

const path = require('path');
const express = require('express');

const app = express();

// Serve static files from the 'public' folder
app.use(express.static(path.join(__dirname, 'public')));
// body parser middleware
app.use(bodyParser.urlencoded({ extended: true })); 
app.use(bodyParser.json());

// cookie handler middleware
app.use(cookieParser());

// Middleware to authenticate requests
app.use((req, res, next) => {
  const token = req.cookies.jwtToken; // Get the token from the cookie

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
      req.user = decoded; // Store the decoded user data in the request object
    } catch (error) {
      console.log('Invalid token:', error.message);
    }
  }
  next(); // move to the next middleware or route handler
});

// protected route that requires authentication
app.get('/profile', (req, res) => {
  if (req.user) {
    // The user is authenticated, so you can access req.user to get their data
    res.render('profile', { user: req.user });
  } else {
    res.redirect('/login'); // Redirect to the login page if not authenticated
  }
});

app.get('/99', (req, res) => {
  if (req.user) {
    // The user is authenticated, so you can access req.user to get their data
    res.render('99', { user: req.user });
  } else {
    res.redirect('/login'); // Redirect to the login page if not authenticated
  }
});

app.get('/leaderboard', (req, res) => {
  if (req.user) {
    res.render('leaderboard', { user: req.user });
  } else {
    res.redirect('/login'); 
  }
});


// Set up view engine and views directory
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

const mguser = process.env.MG_USERNAME;
const mgpass = process.env.MG_PASSWORD;
const uri = `mongodb+srv://${mguser}:${mgpass}@cluster0.uwijlbo.mongodb.net/?retryWrites=true&w=majority`; // MongoDB server URL

// wrapper for mongoDB
mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true } )
  .then(() => console.log('Connected to MongoDB'))
  .catch(error => console.error('Error connecting to MongoDB:', error));

// Serve the HTML views
app.get('/', (req, res) => {
  if (req.cookies.jwtToken) {
    res.redirect('/99');
  }
  else {
    res.render('login', { message: '' });
  }
});

app.get('/login', (req, res) => {
  const token = req.cookies.jwtToken;
  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
      res.redirect('/99');
      return; // Exit the function after redirection
    } catch (error) {
      console.log('Invalid token:', error.message);
    }
  }

  res.render('login', { message: '' }); 
});

app.get('/register', (req, res) => {
  res.render('register', { message: '' });
});

app.get('/logout', (req, res) => {
  res.clearCookie('jwtToken');
  res.redirect('/login');
});


// Handle register
app.post('/register', async (req, res) => {
  const username = req.body.username;
  const password = req.body.password;

  try {
      await saveUser(username, password);
      res.render('register', { message: 'Registration successful! You may now login.' });
  } catch (error) {
      res.render('register', { message: 'Registration error: ' + error.message });
  }
});

// Handle login
app.post('/login', async (req, res) => {
  const username = req.body.username;
  const password = req.body.password;

  try {
      await loginUser(username, password, res);
      res.redirect('/99');
      // res.render('homepage');
  } catch (error) {
      res.render('login', { message: 'Username or password is incorrect.' });
  }
});

// handle leaderboard
app.post('/save-score', async (req, res) => {
  try {
      console.log('Received data:', req.body);
      const { username, elapsedTime } = req.body;

      // Find the existing user in the leaderboard
      const existingUser = await Leaderboard.findOne({ username });

      if (!existingUser || elapsedTime < existingUser.bestTime16) {
          if (existingUser) {
              // Update the score if it's better
              existingUser.bestTime16 = elapsedTime;
              await existingUser.save();
          } else {
              // Create a new user entry if not found
              await Leaderboard.create({
                  username: username,
                  bestTime16: elapsedTime,
              });
          }
          res.status(200).json({ message: 'Score saved successfully' });
      } else {
          res.status(200).json({ message: 'Score not updated' });
      }
  } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ error: 'An error occurred' });
  }
});

// Start the Express.js server
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT} @ http://localhost:3000/`);
});

async function saveUser(username, password) {
  try {

    const existingUser = await User.findOne({ username });

    if (existingUser) {
      throw new Error("Username already exists.");
    }

    let newUser = new User({ 
      username: username, 
      password: password 
    });

    const savedUser = await newUser.save();
    console.log('User saved successfully:', savedUser);
    
  } catch (error) {
      console.log('Error saving user:', error.message);
      throw error;
  }
}

async function loginUser(username, password, res) {
  try {
    const matchUser = await User.findOne({ username, password });
    if (matchUser == null) {
      throw new Error("Incorrect login");
    }

    const token = generateToken({ username: username, password: password });
    res.cookie('jwtToken', token, { httpOnly: true, maxAge: 3600000 }); // Set the cookie in the response

  } catch (error) {
    console.log('Error finding user:', error.message);
    throw error;
  }
}


