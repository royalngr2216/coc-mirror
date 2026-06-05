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
    "SOURCE_TH15_ID": "DEST_TH15_ID",

    // TH16
    "SOURCE_TH16_ID": "DEST_TH16_ID",

    // TH17
    "SOURCE_TH17_ID": "DEST_TH17_ID",

    // TH18
    "SOURCE_TH18_ID": "DEST_TH18_ID"

};

client.on("ready", () => {

    console.log(`Logged in as ${client.user.username}`);

});

client.on("messageCreate", async (msg) => {

    try {

        // ONLY CLASHKING
        if (msg.author.id !== "824653933347209227")
            return;

        // MUST HAVE EMBED / IMAGE
        if (
            msg.embeds.length === 0 &&
            msg.attachments.size === 0
        ) return;

        // FIND TARGET CHANNEL
        const targetChannelId =
            CHANNELS[msg.channel.id];

        if (!targetChannelId)
            return;

        const targetChannel =
            client.channels.cache.get(
                targetChannelId
            );

        if (!targetChannel)
            return;

        // FORWARD MESSAGE
        await msg.forward(targetChannel);

        console.log(
            `Forwarded ClashKing base from ${msg.channel.name}`
        );

    } catch (err) {

        console.log("ERROR:");
        console.log(err);

    }

});

client.login(TOKEN);
