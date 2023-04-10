const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
const countriesList = require('countries-list');
const amadeus = require("../amadeusClient");


/**
 * @swagger
 * /flights:
 *   get:
 *     summary: Search for flights
 *     description: Returns a list of flights matching the search criteria
 *     tags:
 *       - Flights
 *     parameters:
 *       - in: query
 *         name: departure
 *         schema:
 *           type: string
 *         required: true
 *         description: Departure date (YYYY-MM-DD)
 *       - in: query
 *         name: return
 *         schema:
 *           type: string
 *         required: false
 *         description: Return date (YYYY-MM-DD)
 *       - in: query
 *         name: locationDeparture
 *         schema:
 *           type: string
 *         required: true
 *         description: Departure location code
 *       - in: query
 *         name: locationArrival
 *         schema:
 *           type: string
 *         required: true
 *         description: Arrival location code
 *       - in: query
 *         name: adults
 *         schema:
 *           type: integer
 *         required: true
 *         description: Number of adults
 *       - in: query
 *         name: nonStop
 *         schema:
 *           type: boolean
 *         required: false
 *         description: Whether the flight should be non-stop
 *     responses:
 *       200:
 *         description: A list of flights
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *       500:
 *         description: Error searching for flights
 */

const getCountryName = (code) => {
  const country = countriesList.countries[code];
  return country ? country.name : code;
};

const searchFlights = async (req, res) => {
  const { query } = req;

  console.log("Query:", query);
  // Convert the date string to the required format
  const departureDate = new Date(query.departure).toISOString().substring(0, 10);
  const returnDate = query.return ? new Date(query.return).toISOString().substring(0, 10) : null;
  try {
    const response = await amadeus.shopping.flightOffersSearch.get({
      originLocationCode: query.locationDeparture,
      destinationLocationCode: query.locationArrival,
      departureDate: departureDate,
      returnDate: returnDate !== null ? returnDate : undefined,
      adults: query.adults,
      nonStop: query.nonStop,
    });

    const data = JSON.parse(response.body);

    let cheapestFlight = data.data[0];
    let fastestFlight = data.data[0];

    data.data.forEach((flight) => {
      if (parseFloat(flight.price.total) < parseFloat(cheapestFlight.price.total)) {
        cheapestFlight = flight;
      }

      const flightDuration = flight.itineraries[0].duration;
      const fastestFlightDuration = fastestFlight.itineraries[0].duration;

      if (flightDuration < fastestFlightDuration) {
        fastestFlight = flight;
      }
    });

    // Add offer-type to each flight offer
    data.data.forEach((flight) => {
      if (flight === cheapestFlight) {
        flight["offer-type"] = "Cheapest";
      } else if (flight === fastestFlight) {
        flight["offer-type"] = "Fastest";
      } else {
        flight["offer-type"] = "normal";
      }
    });
    const airlineCodes = Array.from(
      new Set(
        data.data.flatMap((offer) =>
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

    data.data.forEach((flight) => {
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

    data.data.forEach((flight) => {
      flight.itineraries.forEach((itinerary) => {
        itinerary.segments.forEach((segment) => {
          // Check if properties exist before accessing them
          if (segment.aircraft && segment.aircraft.code) {
            const aircraftCode = segment.aircraft.code;
            segment.aircraft.name = data.dictionaries.aircraft[aircraftCode] || aircraftCode;
          }

          if (segment.carrierCode) {
            const carrierCode = segment.carrierCode;
            segment.carrierName = data.dictionaries.carriers[carrierCode] || carrierCode;
          }

          if (segment.operating && segment.operating.carrierCode) {
            const operatingCarrierCode = segment.operating.carrierCode;
            segment.operating.carrierName = data.dictionaries.carriers[operatingCarrierCode] || operatingCarrierCode;
          }

          // Add departure and arrival country names
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
    res.status(500).json({ message: "Error searching for flights", error: err.message });
  }
};

module.exports = {
  searchFlights,
};


