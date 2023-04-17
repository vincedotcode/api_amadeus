const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const { v4: uuidv4 } = require("uuid");
const amadeus = require("../amadeusClient");


// ...
/**
 * @swagger
 * /booking:
 *   post:
 *     summary: Create a booking
 *     description: Creates a booking by charging the customer and confirming the payment
 *     tags:
 *       - Booking
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 required: true
 *                 description: Customer's email address
 *               flightOffer:
 *                 type: object
 *                 required: true
 *                 description: Flight offer object containing price information
 *               cardDetails:
 *                 type: object
 *                 required: true
 *                 description: Credit card information
 *               travelers:
 *                 type: array
 *                 required: true
 *                 description: Array of traveler objects
 *                 items:
 *                   type: object
 *               contacts:
 *                 type: array
 *                 required: true
 *                 description: Array of contacts objects
 *                 items:
 *                   type: object
 *     responses:
 *       200:
 *         description: Payment successful, booking confirmed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Payment successful, booking confirmed
 *       400:
 *         description: Invalid input
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Invalid input
 *       500:
 *         description: Error creating booking or payment failed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Error creating booking
 *                 error:
 *                   type: string
 *                   example: <error message>
 */

// ...

async function confirmBooking(flightOffer, travelers, contacts) {
  try {
    const response = await amadeus.booking.flightOrders.post(
      JSON.stringify({
        data: {
          type: "flight-order",
          flightOffers: [flightOffer],
          travelers: travelers,
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
      })
    );
    return response;
  } catch (error) {
    console.error("Error confirming booking:", error);
    throw error;
  }
}



const createBooking = async (req, res) => {
  const { email, flightOffer, travelers, contacts } = req.body;

  if (!email || !flightOffer || !travelers || !contacts) {
    res.status(400).json({ message: "Invalid input" });
    return;
  }

  const totalPrice = parseFloat(flightOffer.price.total) * 100;

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: flightOffer.price.currency,
            product_data: {
              name: "Flight Booking",
            },
            unit_amount: Math.round(totalPrice),
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: "http://localhost:3000/checkout-page/success?session_id={CHECKOUT_SESSION_ID}",
      cancel_url: "https://your-domain.com/cancel",
    });

    res.status(200).json({ checkoutUrl: session.url });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ message: "Error creating booking", error: error.message });
  }
};


module.exports = {
  createBooking,
};
