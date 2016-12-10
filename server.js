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
  const nr = req.body;

  if (!nr.download && !nr.upload && !nr.timestamp) {
    res.status(500).json({
      error: 'invalid',
    });
  }

  db.collection(RESULTS_COLLECTION).insertOne(nr, (err, doc) => {
    if (err) { return next(err); }

    res.status(201).json(doc.ops[0]);
  });
});

const findResult = (results, id) => {
  return results.find(d => d._id.toString() === id) || {};
}

function makeMarker(timestamp, label) {
  return {
    timestamp: timestamp.timestamp || timestamp,
    label,
  }
}

function view(req, res) {
  db.collection(RESULTS_COLLECTION).find({}).toArray((err, rawResults) => {
    if (err) { return next(err); }

    console.log({query: req.query, params: req.params, parsedDays: parseInt(req.query.days)})

    const daysLimit = parseInt(req.params.days) || 2;
    const limit = new Date();
    limit.setDate(limit.getDate() - daysLimit);

    const results = _(rawResults)
      .filter(r => r.download && r.upload && r.timestamp)
      .sortBy(r => new Date(r.timestamp))
      .filter(r => new Date(r.timestamp) > limit)
      .each(r => delete r.server)
      // .pick(['_id', 'download', 'upload', 'timestamp', 'ping'])
      .value();

    const markers = [
      makeMarker(findResult(results, '583903393033b1001134f615'), 'Speedlog created'),
      // makeMarker('2016-11-26T12:11:11.831Z', 'Restarted router'),
      makeMarker(findResult(results, '583acb0c5621b50011e2bcfa'), 'Every 10 mins'),
      makeMarker('2016-12-05T02:03:00.000Z', 'Called Exetel'),
      makeMarker('2016-12-06T04:29:00.000Z', 'Sent diags email'),
      makeMarker('2016-12-07T08:39:00.000Z', 'Email reply'),
      makeMarker(findResult(results, '584bbc807cd63a0011c91c0e'), 'Every 30 mins'),
    ];

    res.status(200).json({ results, markers });
  });
}

app.get('/results', view);
app.get('/results/:days', view);

app.post('/health', (req, res) => {
  console.log(req.body);
  res.status(200).send('ok');
});