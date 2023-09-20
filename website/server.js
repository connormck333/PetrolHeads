const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const routes = require("./routes");

const app = express();
const port = 8000;


mongoose.connect('mongodb+srv://connormck333:IAteABat2020@cluster0.i5kvz.mongodb.net/whitelist?retryWrites=true&w=majority').then(() => {

  app.use(express.static('public'));
  app.use(bodyParser.json());
  app.use("/api", routes);

  app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '/index.html'));
  });

  app.get('/whitelist', (req, res) => {
    res.sendFile(path.join(__dirname, '/screens/whitelist.html'));
  });

  app.get('/mint', (req, res) => {
    res.sendFile(path.join(__dirname, '/screens/mint.html'));
  });

  // app.get('/checkwl', (req, res) => {
  //   const data = table.fetchData();
  //   console.log(data);
  //   res.sendFile(path.join(__dirname, '/screens/mint.html'));
  // });

  app.listen(port, () => {
    console.log('Listening on port:', port);
  });

}).catch(err => {
  console.log('Could not connect to database');
  console.log(err);
})
