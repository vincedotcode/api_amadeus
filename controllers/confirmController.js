const amadeus = require("../amadeusClient");
const nodemailer = require("nodemailer");
const smtpTransport = require("nodemailer-smtp-transport");
const fs = require("fs");
const ejs = require("ejs");
const path = require("path");
const { Console } = require("console");


/**
 * @swagger
 * /confirm:
 *   post:
 *     summary: Book a flight
 *     description: Create an order for the provided flight offer and traveler information
 *     tags:
 *       - Flights
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               flightOffer:
 *                 type: object
 *               travelerInfo:
 *                 type: array
 *                 items:
 *                   type: object
 *               contacts:
 *                 type: array
 *                 items:
 *                   type: object
 *     responses:
 *       200:
 *         description: Flight booking details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *       400:
 *         description: Invalid input
 *       500:
 *         description: Error booking flight
 */

// Set up email transporter
const transporter = nodemailer.createTransport(smtpTransport({
  host: "mail.smtp2go.com",
  port: 587,
  secure: false, // Use TLS
  auth: {
    user: "zapadmin",
    pass: "AbrL6d5BBnHprJyY",
  },
}));
const sendBookingEmail = async (contact, bookingDetails) => {
  const templatePath = './email/flight_confirm.html';
  const templateFile = fs.readFileSync(templatePath, 'utf-8');
  // Compile the template with EJS
  const emailContent = ejs.render(templateFile, { bookingDetails });

  console.log(bookingDetails)



  const mailOptions = {
    from: "poorundev@zapproach.com",
    to: contact.emailAddress,
    subject: "Booking Confirmation - GoTreep",
    html: emailContent,
  };


  console.log(contact.emailAddress)
  try {
    await transporter.sendMail(mailOptions);
    console.log("Email sent to", contact.emailAddress);
  } catch (error) {
    console.error("Error sending email:", error);
  }
};

const confirmBooking = async (req, res) => {
  const { flightOffer, travelerInfo, contacts } = req.body;

  if (!flightOffer || !travelerInfo || !contacts) {
    res.status(400).json({ message: "Invalid input" });
    return;
  }

  try {
    const requestData = {
      data: {
        type: "flight-order",
        flightOffers: [flightOffer],
        travelers: travelerInfo,
        remarks: {
          general: [
            {
              subType: "GENERAL_MISCELLANEOUS",
              text: "ONLINE BOOKING FROM INCREIBLE VIAJES",
            },
          ],
        },
        ticketingAgreement: {
          option: "DELAY_TO_CANCEL",
          delay: "6D",
        },
        contacts: contacts,
      },
    };

    const response = await amadeus.booking.flightOrders.post(JSON.stringify(requestData));
    const data = JSON.parse(response.body);


    await sendBookingEmail(contacts[0], data);

    res.status(200).json(data);
  } catch (err) {
    console.error("Error:", err);
    res.status(500).json({ message: "Error booking flight", error: err.message });
  }
};

module.exports = {
  confirmBooking,
};
