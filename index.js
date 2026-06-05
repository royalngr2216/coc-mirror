const express = require("express");
const app = express();

app.get("/", (req, res) => {
    res.send("Bot alive");
});

app.listen(3000, () => {
    console.log("Web server running");
});

const { Client } = require("discord.js-selfbot-v13");
const axios = require("axios");
const FormData = require("form-data");

const client = new Client();

const TOKEN = process.env.TOKEN;

const WEBHOOKS = {

    // TH11
    "SOURCE_CHANNEL_ID_TH11": "WEBHOOK_URL_TH11",

    // TH12
    "SOURCE_CHANNEL_ID_TH12": "WEBHOOK_URL_TH12",

    // TH13
    "SOURCE_CHANNEL_ID_TH13": "WEBHOOK_URL_TH13",

    // TH14
    "1397977246781800578": "https://discord.com/api/webhooks/1512350198133817476/fRkeFqeM_bLqbGplFj1E6Oy59ewN0EHY0IeGgBKHEkPm3ELcRCp6AxRzpJv8Hwz9LkK9",

    // TH15
    "SOURCE_CHANNEL_ID_TH15": "WEBHOOK_URL_TH15",

    // TH16
    "SOURCE_CHANNEL_ID_TH16": "WEBHOOK_URL_TH16",

    // TH17
    "SOURCE_CHANNEL_ID_TH17": "WEBHOOK_URL_TH17",

    // TH18
    "SOURCE_CHANNEL_ID_TH18": "WEBHOOK_URL_TH18"

};

client.on("ready", () => {
    console.log(`Logged in as ${client.user.username}`);
});

client.on("messageCreate", async (msg) => {

    // Check if message channel is in mapping
    const webhook = WEBHOOKS[msg.channel.id];

    if (!webhook) return;

    try {

        const form = new FormData();

        // Message text
        form.append("content", msg.content || " ");

        // Attachments/images
        if (msg.attachments.size > 0) {

            const attachment = msg.attachments.first();

            const response = await axios.get(
                attachment.url,
                {
                    responseType: "arraybuffer"
                }
            );

            form.append(
                "file",
                response.data,
                attachment.name
            );
        }

        // Send to your webhook
        await axios.post(webhook, form, {
            headers: form.getHeaders()
        });

        console.log(`Copied message from ${msg.channel.name}`);

    } catch (err) {

        console.log("Error:");
        console.log(err);

    }

});

client.login(TOKEN);
