const express = require("express");
const app = express();

app.get("/", (req, res) => {
    res.send("Bot Alive");
});

app.listen(3000, () => {
    console.log("Web server running");
});

const { Client } = require("discord.js-selfbot-v13");

const client = new Client();

const TOKEN = process.env.TOKEN;

// SOURCE CHANNEL ID : DESTINATION CHANNEL ID
const CHANNELS = {

    // TH11
    "SOURCE_TH11_ID": "DEST_TH11_ID",

    // TH12
    "SOURCE_TH12_ID": "DEST_TH12_ID",

    // TH13
    "SOURCE_TH13_ID": "DEST_TH13_ID",

    // TH14
    "1478369331376160928": "1512350167209082981",

    // TH15
    "1478369429380137222": "1512350167209082981",

    // TH16
    "SOURCE_TH16_ID": "DEST_TH16_ID",

    // TH17
    "SOURCE_TH17_ID": "DEST_TH17_ID",

    // TH18
    "SOURCE_TH18_ID": "DEST_TH18_ID"

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

        // FETCH TARGET CHANNEL
        const targetChannel =
            await client.channels.fetch(
                targetChannelId
            );

        if (!targetChannel)
            return;

        // WAIT 5 SECONDS
        await new Promise(resolve =>
            setTimeout(resolve, 5000)
        );

        // REFETCH MESSAGE
        msg = await msg.channel.messages.fetch(
            msg.id
        );

        // MESSAGE TEXT
        let content =
            msg.content || "";

        // GET BASE LINK
        let baseLink = null;

        if (msg.components?.length) {

            for (const row of msg.components) {

                for (
                    const component
                    of row.components
                ) {

                    if (component.url) {

                        baseLink =
                            component.url;

                    }

                }

            }

        }

        // GET FILES
        let files = [];

        msg.attachments.forEach(a => {

            files.push(a.url);

        });

        // FINAL TEXT
        let finalMessage = content;

        if (baseLink) {

            finalMessage +=
`\n\n🔗 Base Link:\n${baseLink}`;

        }

        // SEND MESSAGE
        await targetChannel.send({

            content:
                finalMessage || null,

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
