const express = require("express");
const app = express();

app.get("/", (req, res) => {
    res.send("Bot Alive");
});

app.listen(3000, () => {
    console.log("Web server running");
});

const {
    Client
} = require("discord.js-selfbot-v13");

const client = new Client();

const TOKEN = process.env.TOKEN;

// SOURCE : DESTINATION
const CHANNELS = {

    // TH14
    "1478369331376160928":
    "1512350167209082981",

    // TH15
    "1478369429380137222":
    "1512350167209082981"

};

// PREVENT DUPLICATES
const done = new Set();

client.on("ready", () => {

    console.log(
        `Logged in as ${client.user.username}`
    );

});

async function processMessage(msg) {

    try {

        // ONLY CLASHKING
        if (
            msg.author.id !==
            "824653933347209227"
        ) return;

        // AVOID DUPLICATES
        if (done.has(msg.id))
            return;

        // MUST BE SOURCE CHANNEL
        const targetChannelId =
            CHANNELS[msg.channel.id];

        if (!targetChannelId)
            return;

        // WAIT FOR FULL MESSAGE
        await new Promise(r =>
            setTimeout(r, 12000)
        );

        // REFETCH
        msg =
        await msg.channel.messages.fetch(
            msg.id
        );

        // RAW DATA
        const raw =
            JSON.stringify(msg);

        // FIND REAL BASE LINK
        const linkMatch =
        raw.match(
        /https:\/\/link\.clashofclans\.com\/en\?action=OpenLayout[^"\s\\]+/g
        );

        let realLink = null;

        if (
            linkMatch &&
            linkMatch[0]
        ) {

            realLink = linkMatch[0]
                .replace(/\\u0026/g, "&")
                .replace(/\\/g, "");

        }

        // IMAGE FILES
        let files = [];

        msg.attachments.forEach(a => {

            if (
                a.contentType &&
                a.contentType.startsWith(
                    "image"
                )
            ) {

                files.push(a.url);

            }

        });

        // NO IMAGE + NO LINK
        if (
            files.length === 0 &&
            !realLink
        ) return;

        const targetChannel =
        await client.channels.fetch(
            targetChannelId
        );

        // MARK DONE
        done.add(msg.id);

        // SEND IMAGE FIRST
        if (files.length > 0) {

            await targetChannel.send({

                files: files

            });

        }

        // WAIT 1 SECOND
        await new Promise(r =>
            setTimeout(r, 1000)
        );

        // SEND REAL LINK
        if (realLink) {

            await targetChannel.send(
                realLink
            );

            console.log(
                "Sent real link"
            );

        } else {

            console.log(
                "No real link found"
            );

        }

    } catch (err) {

        console.log(err);

    }

}

// NEW MESSAGE
client.on(
    "messageCreate",
    async (msg) => {

        processMessage(msg);

    }
);

// EDITED MESSAGE
client.on(
    "messageUpdate",
    async (oldMsg, newMsg) => {

        processMessage(newMsg);

    }
);

client.login(TOKEN);
