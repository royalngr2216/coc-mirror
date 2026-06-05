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

    // TH14
    "1478369331376160928":
    "https://discord.com/api/webhooks/1512350198133817476/fRkeFqeM_bLqbGplFj1E6Oy59ewN0EHY0IeGgBKHEkPm3ELcRCp6AxRzpJv8Hwz9LkK9"

};

client.on("ready", () => {
    console.log(`Logged in as ${client.user.username}`);
});

client.on("messageCreate", async (msg) => {

    // Only ClashKing bot messages
    if (msg.author.id !== "824653933347209227") return;

    const webhook = WEBHOOKS[msg.channel.id];

    if (!webhook) return;

    try {

        let content = "";
        let files = [];

        // Extract embeds
        if (msg.embeds.length > 0) {

            for (const embed of msg.embeds) {

                // Title
                if (embed.title) {
                    content += `${embed.title}\n`;
                }

                // Description
                if (embed.description) {
                    content += `${embed.description}\n`;
                }

                // URL
                if (embed.url) {
                    content += `${embed.url}\n`;
                }

                // Fields
                if (embed.fields?.length > 0) {

                    for (const field of embed.fields) {

                        content += `${field.name}: ${field.value}\n`;

                    }

                }

                // Main embed image
                if (embed.image?.url) {

                    try {

                        const response = await axios.get(
                            embed.image.url,
                            {
                                responseType: "arraybuffer"
                            }
                        );

                        files.push({
                            value: response.data,
                            options: {
                                filename: "base.jpg"
                            }
                        });

                    } catch (e) {
                        console.log("Embed image failed");
                    }

                }

                // Thumbnail support
                if (embed.thumbnail?.url) {

                    try {

                        const response = await axios.get(
                            embed.thumbnail.url,
                            {
                                responseType: "arraybuffer"
                            }
                        );

                        files.push({
                            value: response.data,
                            options: {
                                filename: "thumb.jpg"
                            }
                        });

                    } catch (e) {
                        console.log("Thumbnail failed");
                    }

                }

            }

        }

        // Extract button links
        if (msg.components.length > 0) {

            for (const row of msg.components) {

                for (const component of row.components) {

                    if (component.url) {

                        content += `${component.label}: ${component.url}\n`;

                    }

                }

            }

        }

        // Normal attachments
        if (msg.attachments.size > 0) {

            for (const attachment of msg.attachments.values()) {

                try {

                    const response = await axios.get(
                        attachment.url,
                        {
                            responseType: "arraybuffer"
                        }
                    );

                    files.push({
                        value: response.data,
                        options: {
                            filename: attachment.name
                        }
                    });

                } catch (e) {
                    console.log("Attachment failed");
                }

            }

        }

        // Prevent empty messages
        if (!content.trim()) {
            content = "New Base";
        }

        const form = new FormData();

        form.append("content", content);

        // Add files
        files.forEach((file, index) => {

            form.append(
                `file${index}`,
                file.value,
                file.options
            );

        });

        await axios.post(webhook, form, {
            headers: form.getHeaders()
        });

        console.log("Copied ClashKing base");

    } catch (err) {

        console.log("ERROR:");
        console.log(err);

    }

});

client.login(TOKEN);
