require('dotenv').config({ silent: true });
const path = require('path');
const opn = require('opn');
const express = require('express');
const http = require('http');
const bodyParser = require('body-parser');
const { launchES } = require('./service_es');

//Logs
const log4js = require('log4js');
log4js.configure('./config/log4js.json');
const { logger } = require('./service_logger');



/**Express***/
const app = express();
const server = http.createServer(app);


//Middle ware for Express
app.use(express.static(path.join(__dirname, '/public')));
app.use(bodyParser.json({ limit: process.env.EXPRESS_REQUEST_SIZE })); // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({ extended: true, limit: process.env.EXPRESS_REQUEST_SIZE })); // to support URL-encoded bodies
app.use(log4js.connectLogger(log4js.getLogger("http"))); //record http requests: GET, POST, PUT, DELETE


//Service
server.listen(9999, function listening() {
  var infoString = 'Intelligent Essay Writer Engine is Listening on ' + server.address().port;
  console.log(infoString);
  logger.mark(infoString);
  // opn('http://localhost:9999/');
});

//Launch ElasticSearch Engine
// launchES((stdout) => {
//   console.log('The Search Engine is up and running!', stdout);
// });


//Routers
require('./service_conversion').services(app);
require('./service_es_ingestion').services(app);
require('./service_suggest').services(app);
require('./service_swagger')(app);
require('./service_token')(app);
