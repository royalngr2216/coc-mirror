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

client.on(
"messageCreate",
async (msg) => {

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

        const targetChannel =
            await client.channels.fetch(
                targetChannelId
            );

        if (!targetChannel)
            return;

        // WAIT FOR MESSAGE TO FULLY LOAD
        await new Promise(resolve =>
            setTimeout(resolve, 5000)
        );

        // REFETCH MESSAGE
        msg =
        await msg.channel.messages.fetch(
            msg.id
        );

        // IMAGE FILES
        let files = [];

        msg.attachments.forEach(a => {

            files.push(a.url);

        });

        // SEND IMAGE ONLY
        if (files.length > 0) {

            await targetChannel.send({

                files: files

            });

        }

        // EXTRA WAIT
        await new Promise(resolve =>
            setTimeout(resolve, 1000)
        );

        // GET REAL LINK
        let raw = "";

        raw += JSON.stringify(msg);
        raw += JSON.stringify(msg.embeds);
        raw += JSON.stringify(msg.components);
        raw += JSON.stringify(msg.interaction);

        const match =
        raw.match(
        /https:\/\/link\.clashofclans\.com\/en\?action=OpenLayout[^\s"]+/g
        );

        let realLink = null;

        if (
            match &&
            match[0]
        ) {

            realLink = match[0];

        }

        // SEND REAL LINK
        if (realLink) {

            await targetChannel.send(
                realLink
            );

            console.log(
                "Real base link sent"
            );

        } else {

            console.log(
                "No real link found"
            );

        }

    } catch (err) {

        console.log("ERROR:");
        console.log(err);

    }

});

client.login(TOKEN);
