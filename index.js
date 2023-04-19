const express = require('express');
const swaggerJsDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const { searchCity } = require('./controllers/cityController');
const { searchFlights } = require('./controllers/flightController');
const {searchPrice} = require('./controllers/priceController');
const {createBooking} = require("./controllers/bookingController");
const {confirmBooking} = require("./controllers/confirmController");



///middleware constraints
const bodyParser = require("body-parser");
const cors = require("cors");

///app constraints
const app = express();
const allowedOrigins = ['http://localhost:3000', 'https://amadeus-api-6a8h.onrender.com', 'https://gotreep.netlify.app', 'http://localhost:5000'];
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
          url: 'https://amadeus-api-6a8h.onrender.com',
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
app.post('/price', searchPrice);
app.post('/booking', createBooking);
app.post('/confirm', confirmBooking);


// Start the server
app.listen(port, () => {
  console.log(`gpotreep API controller listening at http://localhost:${port}`);
});