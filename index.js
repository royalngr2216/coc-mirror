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

const client = new Client();

const TOKEN = process.env.TOKEN;

// SOURCE CHANNEL ID : WEBHOOK URL
const WEBHOOKS = {

    // TH11
    "1397976773773492345":
    "https://discord.com/api/webhooks/1512371730029744159/MQmLBlpg4C6HMQ-TPSAmf6zvvImo3gdINwLh911lMwgjt_DqKHg44-d-0sMxKRM1thMO",

    // TH12
    "1397976994209333278":
    "https://discord.com/api/webhooks/1512371917149966346/N1JwN7f1-wMzK4WsFL9PrwIAIWC6E8-RJED8UzWNuCz2siyGS1gg0Ns3Vhj30R00BDqT",

    // TH13
    "1397977231862665387":
    "https://discord.com/api/webhooks/1512372070225285121/bHdz3_sliItJrkh97iY8p10jMHxjquxwyIloQK-ukcsSOMVXUEcKiFPn4D3kgOH2hZSr",

    // TH14
    "1478369331376160928":
    "https://discord.com/api/webhooks/1512350198133817476/fRkeFqeM_bLqbGplFj1E6Oy59ewN0EHY0IeGgBKHEkPm3ELcRCp6AxRzpJv8Hwz9LkK9",

    // TH15
    "1397977306009571489":
    "https://discord.com/api/webhooks/1512372204879347722/FU_1n_I-DtuzwwVtOmRDcHcv-wOs1_fqp2eRpt_bFH8uzmeGDN__1vcspZa0ejsseD42",

    // TH16
    "1397977323227185284":
    "https://discord.com/api/webhooks/1512372370042654752/93llRhknMdmlaEz6DI6aC6GFjy_2wOsKLc5r7CLHd_d-DrurxqczmSVsiRAU3WC4sw8M",

    // TH17
    "1397977380022386789":
    "https://discord.com/api/webhooks/1512372504625152040/TB4yW3MJ6yZ8cm1QZbfl77JyEhIuaXPu1xYwSaE6bWOXZys6xq3LTBVtn7S3E4Q6uzeA",

    // TH18
    "1440934909043544185":
    "https://discord.com/api/webhooks/1512372669562224801/aQ63Nqnhh1wBptJ0lZDp1bPU0RkwirVP5qwCrLk2rvLDIIdbw61WIERBvKdi-59Mj-81"

};

client.on("ready", () => {

    console.log(`Logged in as ${client.user.username}`);

});

client.on("messageCreate", async (msg) => {

    // Only ClashKing bot
    if (msg.author.id !== "824653933347209227") return;

    // Find webhook
    const webhook = WEBHOOKS[msg.channel.id];

    if (!webhook) return;

    try {

        const messageLink =
            `https://discord.com/channels/` +
            `${msg.guild.id}/` +
            `${msg.channel.id}/` +
            `${msg.id}`;

        await axios.post(webhook, {

            content: messageLink

        });

        console.log("Forwarded ClashKing message");

    } catch (err) {

        console.log("ERROR:");
        console.log(err);

    }

});

client.login(TOKEN);
