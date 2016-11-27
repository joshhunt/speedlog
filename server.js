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
app.use(bodyParser.json({limit: '5mb'}));

const RESULTS_COLLECTION = 'results';

// Create a database variable outside of the database connection callback to reuse the connection pool in your app.
let db;

function startApp() {
  // Initialize the app.
  const port = process.env.PORT || 8080;
  const server = app.listen(port, () => {
    const port = server.address().port;
    console.log('App now running on port', port);
  });
}

if (process.env.MONGODB_URI) {
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

    startApp();
  });
} else {
  console.log('MongoDB not available, starting without it');
  startApp();
}

app.get('/', (req, res) => {
  res.sendFile('./results.html', { root: './' });
});

app.post('/results', (req, res, next) => {
  const newRecord = req.body;

  db.collection(RESULTS_COLLECTION).insertOne(newRecord, (err, doc) => {
    if (err) { return next(err); }

    res.status(201).json(doc.ops[0]);
  });
});

app.get('/results', function(req, res) {
  db.collection(RESULTS_COLLECTION).find({}).toArray((err, results) => {
    if (err) { return next(err); }

    const markers = [
      {
        timestamp: '2016-11-26T12:11:11.831Z',
        label: 'Restarted router'
      }
    ];

    const firstResult = _.find(results, d => d._id.valueOf() === '583903393033b1001134f615');
    if (firstResult) {
      markers.push({
        timestamp: firstResult.timestamp,
        label: 'Speedlog created'
      });
    }

    res.status(200).json({
      results: _.sortBy(results, d => new Date(d.timestamp)),
      markers,
    });
  });
});

app.post('/health', (req, res) => {
  console.log(req.body);
  res.status(200).send('ok');
});