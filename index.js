const express = require("express");
const fs = require("fs");
const axios = require("axios");
const { Client } = require("discord.js-selfbot-v13");

const app = express();

app.get("/", (req, res) => {
    res.send("Alive");
});

app.listen(3000, () => {
    console.log("Web server running");
});

const client = new Client();

const TOKEN = process.env.TOKEN;

// SOURCE -> TARGET
const CHANNELS = {

    "1478369331376160928":
    "1512350167209082981"

};

function wait(ms) {

    return new Promise(resolve =>
        setTimeout(resolve, ms)
    );

}

// DUPLICATE PREVENTION
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

        // WAIT FOR EMBEDS
        await wait(12000);

        // REFETCH FULL MESSAGE
        message =
        await message.channel.messages.fetch(
            message.id
        );

        // TARGET CHANNEL
        const target =
        await client.channels.fetch(
            targetChannelId
        );

        let description =
            message.content || "";

        let imageUrl = null;

        // IMAGE FROM ATTACHMENTS
        if (
            message.attachments.size > 0
        ) {

            const first =
            message.attachments.first();

            imageUrl = first.url;

        }

        // IMAGE FROM EMBED
        if (
            !imageUrl &&
            message.embeds.length > 0
        ) {

            const embed =
            message.embeds[0];

            if (
                embed.image?.url
            ) {

                imageUrl =
                embed.image.url;

            }

        }

        // ===== FIND REAL LINK =====

        let baseLink = null;

        const raw =
        JSON.stringify(
            message,
            null,
            2
        );

        console.log(raw);

        const matches =
        raw.match(
/https:\/\/link\.clashofclans\.com\/en\?action=OpenLayout&id=[A-Za-z0-9%:_\-]+/g
        );

        if (
            matches &&
            matches.length > 0
        ) {

            baseLink =
            matches[0]
                .replace(
                    /\\u0026/g,
                    "&"
                )
                .replace(
                    /\\/g,
                    ""
                );

        }

        console.log(
            "FOUND BASE LINK:"
        );

        console.log(baseLink);

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

        // SEND LINK
        if (baseLink) {

            await target.send(
                baseLink
            );

        }

        console.log(
            "Forwarded Successfully"
        );

    }

    catch (err) {

        console.log(
            "ERROR:"
        );

        console.log(err);

    }

});

client.login(TOKEN);
