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
    "1478369331376160928": "https://discord.com/api/webhooks/1512350198133817476/fRkeFqeM_bLqbGplFj1E6Oy59ewN0EHY0IeGgBKHEkPm3ELcRCp6AxRzpJv8Hwz9LkK9",

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

    const webhook = WEBHOOKS[msg.channel.id];

    if (!webhook) return;

    try {

        let content = msg.content || "";

        // Extract embed content
        if (msg.embeds.length > 0) {

            for (const embed of msg.embeds) {

                if (embed.title) {
                    content += `\n${embed.title}`;
                }

                if (embed.description) {
                    content += `\n${embed.description}`;
                }

                if (embed.url) {
                    content += `\n${embed.url}`;
                }

                if (embed.fields?.length > 0) {

                    for (const field of embed.fields) {

                        content += `\n${field.name}: ${field.value}`;

                    }

                }

            }

        }

        // Extract button links
        if (msg.components.length > 0) {

            for (const row of msg.components) {

                for (const component of row.components) {

                    if (component.url) {

                        content += `\n${component.label}: ${component.url}`;

                    }

                }

            }

        }

        const form = new FormData();

        form.append("content", content || " ");

        // Multiple attachment support
        if (msg.attachments.size > 0) {

            let index = 0;

            for (const attachment of msg.attachments.values()) {

                const response = await axios.get(
                    attachment.url,
                    {
                        responseType: "arraybuffer"
                    }
                );

                form.append(
                    `file${index}`,
                    response.data,
                    attachment.name
                );

                index++;
            }

        }

        await axios.post(webhook, form, {
            headers: form.getHeaders()
        });

        console.log(`Copied from ${msg.channel.name}`);

    } catch (err) {

        console.log("ERROR:");
        console.log(err);

    }

});

client.login(TOKEN);
