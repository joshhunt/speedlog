const path = require('path');

const express = require('express');
const bodyParser = require('body-parser');
const mongodb = require('mongodb');
const cors = require('cors');
const _ = require('lodash');


const ObjectID = mongodb.ObjectID;

const app = express();

app.use(cors());
app.use(express.static(__dirname + '/public'));
app.use(bodyParser.json());

const RESULTS_COLLECTION = 'results';

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

app.post('/results', (req, res, next) => {
  const newRecord = req.body;

  db.collection(RESULTS_COLLECTION).insertOne(newRecord, (err, doc) => {
    if (err) { return next(err); }

    res.status(201).json(doc.ops[0]);
  });
});

app.get('/results', function(req, res) {
  db.collection(RESULTS_COLLECTION).find({}).toArray((err, docs) => {
    if (err) { return next(err); }

    const sorted = _.sortBy(docs, d => new Date(d.timestamp));

    res.status(200).json(sorted);
  });
});