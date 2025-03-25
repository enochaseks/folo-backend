const express = require("express");
const router = express.Router();
const { body, validationResult } = require("express-validator");
const nodemailer = require("nodemailer");
const db = require("../models");
const Subscriber = db.Subscriber;

// Debug: Verify model is properly loaded
console.log("[DEBUG] Available models:", Object.keys(db));
console.log("[DEBUG] Subscriber model exists:", !!Subscriber);

// Email transporter configuration
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || "smtp-relay.brevo.com",
  port: process.env.EMAIL_PORT || 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER || "88d3b8002@smtp-brevo.com",
    pass: process.env.EMAIL_PASS || "B6TL5UZ7mdtSHG4h"
  },
  tls: {
    rejectUnauthorized: process.env.NODE_ENV !== "production"
  }
});

// Enhanced subscribe endpoint
router.post(
  "/subscribe",
  [
    body("email").isEmail().withMessage("Must be a valid email").normalizeEmail(),
    body("name").optional().trim().escape()
  ],
  async (req, res) => {
    // Validate input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log("[VALIDATION ERROR]", errors.array());
      return res.status(400).json({ 
        success: false,
        errors: errors.array() 
      });
    }

    const { email, name } = req.body;
    console.log("[SUBSCRIBE] New request for:", email);

    try {
      // 1. Check for existing subscriber
      const existing = await Subscriber.findOne({ 
        where: { email },
        raw: true
      });
      
      if (existing) {
        console.log("[DUPLICATE] Already exists:", email);
        return res.status(409).json({ 
          success: false,
          message: "This email is already subscribed"
        });
      }

      // 2. Create new subscriber
      const subscriber = await Subscriber.create({ 
        email, 
        name: name || null,
        confirmed: false
      });
      
      console.log("[NEW SUBSCRIBER] Created ID:", subscriber.id);

      // 3. Send confirmation email
      const confirmationToken = require('crypto').randomBytes(32).toString('hex');
      // In your newsletter subscription route:
const confirmationLink = `${process.env.FRONTEND_URL}/confirm-subscription/${confirmationToken}`;
      
      await subscriber.update({ confirmationToken });

      const mailResult = await transporter.sendMail({
        from: `"Folo Team" <${process.env.EMAIL_FROM || "no-reply@foloapp.co.uk"}>`,
        to: email,
        subject: "Confirm Your Subscription",
        html: buildConfirmationEmail(confirmationLink),
        text: `Please confirm your subscription by visiting: ${confirmationLink}`
      });

      console.log("[EMAIL SENT] Message ID:", mailResult.messageId);

      // 4. Return success response
      return res.status(200).json({ 
        success: true,
        message: "Subscription successful. Please check your email.",
        data: {
          email: subscriber.email,
          id: subscriber.id
        }
      });

    } catch (error) {
      console.error("[FATAL ERROR]", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
        error: process.env.NODE_ENV === "development" ? error.message : undefined,
        stack: process.env.NODE_ENV === "development" ? error.stack : undefined
      });
    }
  }
);

// Enhanced confirmation endpoint
router.get("/confirm", async (req, res) => {
  const { token } = req.query;
  console.log("[CONFIRMATION] Received token:", token);

  if (!token) {
    return res.redirect(`${process.env.FRONTEND_URL}/?error=invalid_token`);
  }

  try {
    // 1. Find subscriber by token
    const subscriber = await Subscriber.findOne({ 
      where: { confirmationToken: token }
    });

    if (!subscriber) {
      console.log("[INVALID TOKEN]", token);
      return res.redirect(`${process.env.FRONTEND_URL}/?error=invalid_token`);
    }

    // 2. Check if already confirmed
    if (subscriber.confirmed) {
      return res.redirect(`${process.env.FRONTEND_URL}/?message=already_confirmed`);
    }

    // 3. Update subscriber record
    await subscriber.update({
      confirmed: true,
      confirmedAt: new Date(),
      confirmationToken: null
    });

    console.log("[CONFIRMED] Subscriber ID:", subscriber.id);

    // 4. Send welcome email
    await transporter.sendMail({
      from: `"Folo Team" <${process.env.EMAIL_FROM}>`,
      to: subscriber.email,
      subject: "Welcome to Folo!",
      html: buildWelcomeEmail()
    });

    // 5. Redirect to success page
    return res.redirect(`${process.env.FRONTEND_URL}/?message=subscription_confirmed`);

  } catch (error) {
    console.error("[CONFIRMATION ERROR]", error);
    return res.redirect(`${process.env.FRONTEND_URL}/?error=confirmation_failed`);
  }
});

// Email template builders
function buildConfirmationEmail(link) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #ff6f61;">Welcome to Folo!</h1>
      <p>Thank you for subscribing to our newsletter.</p>
      <p>Please confirm your email by clicking below:</p>
      <a href="${link}" 
         style="background: #ff6f61; color: white; padding: 12px 24px; 
                display: inline-block; border-radius: 5px; text-decoration: none;">
        Confirm Email
      </a>
      <p style="margin-top: 20px; color: #666;">
        If you didn't request this, please ignore this email.
      </p>
    </div>
  `;
}

function buildWelcomeEmail() {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #ff6f61;">You're Confirmed!</h1>
      <p>Thank you for joining Folo's community.</p>
      <p>You'll now receive:</p>
      <ul>
        <li>Exclusive early access</li>
        <li>Special member discounts</li>
        <li>Updates on Black-owned businesses</li>
      </ul>
      <p>We're excited to have you with us!</p>
    </div>
  `;
}

module.exports = router;