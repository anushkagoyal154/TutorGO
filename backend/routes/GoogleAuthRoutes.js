
const express = require("express");
const crypto = require("crypto");
const { google } = require("googleapis");

const router = express.Router();

const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
);

const oauthStates = new Map();

router.get("/auth", (req, res) => {
    const state = crypto.randomBytes(32).toString("hex");

    oauthStates.set(state, Date.now());

    const authUrl = oauth2Client.generateAuthUrl({
        access_type: "offline",
        prompt: "consent",
        scope: [
            "https://www.googleapis.com/auth/calendar.events"
        ],
        state
    });

    res.redirect(authUrl);
});

router.get("/callback", async (req, res) => {
    try {
        const { code, state, error } = req.query;

        if (error) {
            return res.status(400).send(error);
        }

        const createdAt = oauthStates.get(state);

        if (
            !state ||
            !createdAt ||
            Date.now() - createdAt > 10 * 60 * 1000
        ) {
            return res.status(400).send(
                "Invalid or expired OAuth state."
            );
        }

        oauthStates.delete(state);

        const { tokens } = await oauth2Client.getToken(code);

        if (!tokens.refresh_token) {
            return res.status(400).send(
                "Refresh token not received. Try revoking previous access and authorizing again."
            );
        }

        console.log(
            "GOOGLE REFRESH TOKEN:",
            tokens.refresh_token
        );

        res.send(`
            <h2>TutorGo Google Calendar Connected!</h2>
            <p>Copy the refresh token from your backend terminal.</p>
            <p>Add it to your backend .env file.</p>
        `);

    } catch (error) {
        console.error("GOOGLE OAUTH ERROR:", error);

        res.status(500).send(
            "Google authorization failed."
        );
    }
});

module.exports = router;
