const amadeus = require("../amadeusClient");

/**
 * @swagger
 * /cities:
 *   get:
 *     summary: Search for a city
 *     description: Returns a list of cities that match the search keyword
 *     tags:
 *       - Cities
 *     parameters:
 *       - in: query
 *         name: keyword
 *         schema:
 *           type: string
 *         required: true
 *         description: Keyword to search for a city
 *     responses:
 *       200:
 *         description: A list of cities
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   name:
 *                     type: string
 *                   countryCode:
 *                     type: string
 *                   timeZone:
 *                     type: string
 *       500:
 *         description: Error searching for city
 */


const searchCity = async (req, res) => {
    const { query } = req;
  
    console.log("Query:", query);
  
    try {
      const response = await amadeus.referenceData.locations.get({
        keyword: query.keyword,
        subType: "CITY,AIRPORT",
      });
  
      res.status(200).json(response.result);
    } catch (error) {
      console.error("Amadeus API error:", error);
      res
        .status(500)
        .json({ message: "Error searching for city", error: error.message });
    }
  };
  
  
  module.exports = {
    searchCity,
  };
