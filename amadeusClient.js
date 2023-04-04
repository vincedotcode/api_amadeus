const Amadeus = require("amadeus");
const config = require("./config");

const amadeus = new Amadeus({
  clientId: config.amadeus.clientId,
  clientSecret: config.amadeus.clientSecret,
  hostname: "test", // Use "production" for the production environment
});

module.exports = amadeus;
