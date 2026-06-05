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

// SOURCE CHANNEL : DESTINATION CHANNEL
const CHANNELS = {

    // TH14
    "1478369331376160928": "1512350167209082981",

    // TH15
    "1478369429380137222": "1512350167209082981"

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

        // TARGET CHANNEL
        const targetChannelId =
            CHANNELS[msg.channel.id];

        if (!targetChannelId)
            return;

        // GET CHANNEL
        const targetChannel =
            client.channels.cache.get(
                targetChannelId
            );

        if (!targetChannel)
            return;

        // FORWARD ORIGINAL MESSAGE
        await msg.forward(targetChannel);

        console.log(
            `Forwarded from ${msg.channel.name}`
        );

    } catch (err) {

        console.log("ERROR:");
        console.log(err);

    }

});

client.login(TOKEN);
