const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
const countriesList = require('countries-list');
const amadeus = require("../amadeusClient");

/**
 * @swagger
 * /price:
 *   post:
 *     summary: Get flight pricing
 *     description: Returns the pricing details of the provided flight offer(s)
 *     tags:
 *       - Flights
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               flightOffers:
 *                 type: array
 *                 items:
 *                   type: object
 *     responses:
 *       200:
 *         description: Flight pricing details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *       400:
 *         description: Invalid input
 *       500:
 *         description: Error getting flight pricing
 */


const getCountryName = (code) => {
  const country = countriesList.countries[code];
  return country ? country.name : code;
};



const searchPrice = async (req, res) => {
  const { flightOffers } = req.body;

  if (!flightOffers || flightOffers.length === 0) {
    res.status(400).json({ message: "Invalid input" });
    return;
  }

  try {
    const requestData = {
      data: {
        type: "flight-offers-pricing",
        flightOffers,
      },
    };

    const response = await amadeus.shopping.flightOffers.pricing.post(JSON.stringify(requestData));

    const data = JSON.parse(response.body);



    // Get airline logo
    const airlineCodes = Array.from(
      new Set(
        data.data.flightOffers.flatMap((offer) =>
          offer.itineraries.flatMap((itinerary) =>
            itinerary.segments.map((segment) => segment.carrierCode)
          )
        )
      )
    );

    // Get airline logo
    const airlineLogoUrls = await Promise.all(
      airlineCodes.map(async (code) => {
        const logoResponse = await fetch(
          `https://content.airhex.com/content/logos/airlines_${code}_50_50_s.png?apikey=${process.env.YOUR_API_KEY}`
        );
        return { code, logoUrl: logoResponse.url };
      })
    );

    data.data.flightOffers.forEach((flight) => {
      flight.itineraries.forEach((itinerary) => {
        itinerary.segments.forEach((segment) => {
          const logoObj = airlineLogoUrls.find(
            (logo) => logo.code === segment.carrierCode
          );
          segment.airlineLogo = logoObj ? logoObj.logoUrl : "";
        });
      });
    });

    // Replace location codes with city and country names
    Object.entries(data.dictionaries.locations).forEach(([code, location]) => {
      location.cityName = location.cityCode;
      location.countryName = getCountryName(location.countryCode);
    });

    data.data.flightOffers.forEach((flight) => {
      flight.itineraries.forEach((itinerary) => {
        itinerary.segments.forEach((segment) => {

          const departureIata = segment.departure.iataCode;
          const arrivalIata = segment.arrival.iataCode;
          segment.departure.countryName = data.dictionaries.locations[departureIata].countryName;
          segment.arrival.countryName = data.dictionaries.locations[arrivalIata].countryName;
        });
      });
    });

    res.status(200).json(data);
  } catch (err) {
    console.error("Error:", err);
    res.status(500).json({ message: "Error getting flight pricing", error: err.message });
  }
};




module.exports = {
  searchPrice,
};



