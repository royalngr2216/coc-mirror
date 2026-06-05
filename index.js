const express = require("express");
const fs = require("fs");
const axios = require("axios");
const { Client } = require("discord.js-selfbot-v13");

const app = express();

app.get("/", (req, res) => {
    res.send("Bot Alive");
});

app.listen(3000, () => {
    console.log("Web server running");
});

const client = new Client();

const TOKEN = process.env.TOKEN;

// SOURCE -> TARGET
const CHANNELS = {

    // TH14
    "1478369331376160928":
    "1512350167209082981"

};

function wait(ms) {

    return new Promise(resolve =>
        setTimeout(resolve, ms)
    );

}

// PREVENT DUPLICATES
const processed = new Set();

client.on("ready", () => {

    console.log(
        `Logged in as ${client.user.username}`
    );

});

client.on(
"messageCreate",
async (message) => {

    try {

        // ONLY CLASHKING
        if (
            message.author.id !==
            "824653933347209227"
        ) return;

        // SOURCE CHANNEL ONLY
        const targetChannelId =
            CHANNELS[message.channel.id];

        if (!targetChannelId)
            return;

        // PREVENT DUPLICATES
        if (
            processed.has(message.id)
        ) return;

        processed.add(message.id);

        // WAIT FOR FULL MESSAGE
        await wait(12000);

        // REFETCH
        message =
        await message.channel.messages.fetch(
            message.id
        );

        // TARGET CHANNEL
        const target =
        await client.channels.fetch(
            targetChannelId
        );

        // DESCRIPTION
        let description =
            message.content || "";

        // IMAGE
        let imageUrl = null;

        // ATTACHMENTS
        if (
            message.attachments.size > 0
        ) {

            const first =
            message.attachments.first();

            imageUrl = first.url;

        }

        // REAL BASE LINK
        let baseLink = null;

        // SEARCH EVERYWHERE
        const raw =
            JSON.stringify(message);

        const match =
        raw.match(
        /https:\/\/link\.clashofclans\.com\/en\?action=OpenLayout[^"\\ ]+/i
        );

        if (
            match &&
            match[0]
        ) {

            baseLink = match[0]
                .replace(/\\u0026/g, "&")
                .replace(/\\/g, "");

        }

        console.log(
            "FOUND LINK:",
            baseLink
        );

        // DOWNLOAD IMAGE
        let tempFile = null;

        if (imageUrl) {

            const response =
            await axios({

                url: imageUrl,
                method: "GET",
                responseType: "stream"

            });

            tempFile =
            `temp_${Date.now()}.jpg`;

            const writer =
            fs.createWriteStream(
                tempFile
            );

            response.data.pipe(writer);

            await new Promise(
                (resolve, reject) => {

                    writer.on(
                        "finish",
                        resolve
                    );

                    writer.on(
                        "error",
                        reject
                    );

                }
            );

        }

        // SEND IMAGE FIRST
        if (tempFile) {

            await target.send({

                content:
                    description || "",

                files:
                    [tempFile]

            });

            fs.unlinkSync(tempFile);

        }

        // WAIT
        await wait(1500);

        // SEND LINK SEPARATELY
        if (baseLink) {

            await target.send(
                baseLink
            );

        }

        console.log(
            "Successfully copied base"
        );

    }

    catch (err) {

        console.log("ERROR:");
        console.log(err);

    }

});

client.login(TOKEN);
