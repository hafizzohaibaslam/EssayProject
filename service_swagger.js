require('dotenv').config({ silent: true });

// Swagger definition
// You can set every attribute except paths and swagger
// https://github.com/swagger-api/swagger-spec/blob/master/versions/2.0.md
var swaggerDefinition = {
    info: {
        title: process.env.SWAGGER_TITLE,
        version: process.env.SWAGGER_VER,
        description: process.env.SWAGGER_DESCRIPTION
    },
    // host: 'localhost:9090', 
    basePath: '/', // Base path (optional)
};


// Options for the swagger docs
var options = {
    // Import swaggerDefinitions
    swaggerDefinition: swaggerDefinition,
    // Path to the API docs
    apis: [`${__dirname}/service_*.js`, `${__dirname}/api/parameters.yaml`],
};

var swaggerJSDoc = require('./api/swaggerJSDoc');
// Initialize swagger-jsdoc -> returns validated swagger spec in json format
var swaggerSpec = swaggerJSDoc(options);
module.exports = function (app) {
    // Serve swagger docs the way you like (Recommendation: swagger-tools)
    app.get('/api-docs.json', function (req, res) {
        res.setHeader('Content-Type', 'application/json');
        res.send(swaggerSpec);
    });
}

