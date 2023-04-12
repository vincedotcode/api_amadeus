const express = require('express');
const swaggerJsDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const { searchCity } = require('./controllers/cityController');
const { searchFlights } = require('./controllers/flightController');
const bodyParser = require("body-parser");
const cors = require("cors");


const app = express();
const allowedOrigins = ['http://localhost:3000', 'https://amadeus-api-6a8h.onrender.com', 'https://gotreep.netlify.app'];
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'The CORS policy for this site does not allow access from the specified origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  }
}));
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json());
const port = process.env.PORT || 5000;

// Swagger setup
const swaggerOptions = {
    definition: {
      openapi: '3.0.0',
      info: {
        title: 'Gotreep Flight Controller',
        version: '1.0.0',
        description: 'This is the Gotreep API controller made in node js, fully functional',
      },
      servers: [
        {
          url: 'http://localhost:5000',
        },
      ],
    },
    apis: ['./controllers/*.js'],
  };

const swaggerDocs = swaggerJsDoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// Routes
app.get('/cities', searchCity);
app.get('/flights', searchFlights);


// Start the server
app.listen(port, () => {
  console.log(`gpotreep API controller listening at http://localhost:${port}`);
});