const express = require("express");
const app = express();

app.get("/", (req, res) => {
    res.send("Bot Alive");
});

app.listen(3000, () => {
    console.log("Web server running");
});

const { Client } =
require("discord.js-selfbot-v13");

const client = new Client();

const TOKEN = process.env.TOKEN;

// SOURCE CHANNEL : DESTINATION CHANNEL
const CHANNELS = {

    // TH14
    "1478369331376160928":
    "1512350167209082981",

    // TH15
    "1478369429380137222":
    "1512350167209082981"

};

client.on("ready", () => {

    console.log(
        `Logged in as ${client.user.username}`
    );

});

client.on("messageCreate", async (msg) => {

    try {

        // ONLY CLASHKING
        if (
            msg.author.id !==
            "824653933347209227"
        ) return;

        // FIND TARGET CHANNEL
        const targetChannelId =
            CHANNELS[msg.channel.id];

        if (!targetChannelId)
            return;

        // GET TARGET CHANNEL
        const targetChannel =
            await client.channels.fetch(
                targetChannelId
            );

        if (!targetChannel)
            return;

        // MESSAGE TEXT
        let content =
            msg.content || "";

        // GET BASE LINK
        let baseLink = null;

        if (
            msg.components &&
            msg.components.length > 0
        ) {

            for (const row of msg.components) {

                for (
                    const component
                    of row.components
                ) {

                    if (
                        component.url
                    ) {

                        baseLink =
                            component.url;

                    }

                }

            }

        }

        // IMAGE FILES
        let files = [];

        msg.attachments.forEach(a => {

            files.push(a.url);

        });

        // FINAL MESSAGE
        let finalMessage =
            content;

        if (baseLink) {

            finalMessage +=
`\n\n🔗 Base Link:
${baseLink}`;

        }

        // SEND MESSAGE
        await targetChannel.send({

            content: finalMessage,

            files: files

        });

        console.log(
            `Copied base from ${msg.channel.name}`
        );

    } catch (err) {

        console.log("ERROR:");
        console.log(err);

    }

});

client.login(TOKEN);
