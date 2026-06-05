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

// SOURCE CHANNEL : DEST CHANNEL
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

        // DESCRIPTION
        let description =
            msg.content || "";

        // FILES / IMAGES
        let files = [];

        msg.attachments.forEach(a => {

            files.push(a.url);

        });

        // GET REAL BASE LINK
        let realLink = null;

        const raw =
            JSON.stringify(msg);

        const match =
            raw.match(
                /https:\/\/link\.clashofclans\.com[^\s"]+/g
            );

        if (
            match &&
            match[0]
        ) {

            realLink =
                match[0];

        }

        // SEND IMAGE + TEXT
        await targetChannel.send({

            content: description,
            files: files

        });

        // SEND REAL LINK AFTER 1 SECOND
        if (realLink) {

            await new Promise(resolve =>
                setTimeout(resolve, 1000)
            );

            await targetChannel.send(
                realLink
            );

        }

        console.log(
            `Successfully copied ClashKing base`
        );

    } catch (err) {

        console.log("ERROR:");
        console.log(err);

    }

});

client.login(TOKEN);
