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




const createBooking = async (req, res) => {
  const { email, flightOffer } = req.body;

  if (!email || !flightOffer) {
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
      success_url: "https://gotreep.netlify.app/checkout-page?session_id={CHECKOUT_SESSION_ID}",
      cancel_url: "https://gotreep.netlify.app/checkout-page?cancel",
    });

    res.status(200).json({ checkoutUrl: session.url });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ message: "Error creating booking", error: error.message });
  }
};

/**
 * @swagger
 * /estbooking:
 *   post:
 *     summary: Create an establishment booking
 *     description: Creates an establishment booking by charging the customer and confirming the payment
 *     tags:
 *       - EstBooking
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
 *               netTotal:
 *                 type: number
 *                 required: true
 *                 description: Net total for the establishment booking
 *     responses:
 *       200:
 *         description: Payment successful, booking confirmed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 checkoutUrl:
 *                   type: string
 *                   example: <Stripe checkout url>
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

const createEstBooking = async (req, res) => {
  const { email, netTotal } = req.body;

  if (!email || !netTotal) {
    res.status(400).json({ message: "Invalid input" });
    return;
  }

  const totalPrice = parseFloat(netTotal) * 100;

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",  // Assuming the currency is USD, please replace this with actual currency if needed
            product_data: {
              name: "Establishment Booking",
            },
            unit_amount: Math.round(totalPrice),
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: "https://gotreep.netlify.app/confirm-payment?session_id={CHECKOUT_SESSION_ID}",
      cancel_url: "https://gotreep.netlify.app/checkout-page?cancel",
    });

    res.status(200).json({ checkoutUrl: session.url });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ message: "Error creating booking", error: error.message });
  }
};


module.exports = {
  createBooking,createEstBooking
};

