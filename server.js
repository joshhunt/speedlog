const path = require('path');

const express = require('express');
const bodyParser = require('body-parser');
const mongodb = require('mongodb');
const ObjectID = mongodb.ObjectID;

const app = express();
app.use(express.static(__dirname + '/public'));
app.use(bodyParser.json());

// Create a database variable outside of the database connection callback to reuse the connection pool in your app.
let db;

// Connect to the database before starting the application server.
mongodb.MongoClient.connect(process.env.MONGODB_URI, function (err, database) {
  if (err) {
    console.log('Unable to connect to MongoDB')
    console.log(err);
    process.exit(1);
  }

  // Save database object from the callback for reuse.
  db = database;
  console.log('Database connection ready');

  // Initialize the app.
  const port = process.env.PORT || 8080;
  const server = app.listen(port, () => {
    const port = server.address().port;
    console.log('App now running on port', port);
  });
});

app.get('/', (req, res) => {
  res.send('cool');
});