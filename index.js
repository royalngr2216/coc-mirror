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

// SOURCE : DEST
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

        // FIND DEST
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

        // WAIT
        await new Promise(resolve =>
            setTimeout(resolve, 5000)
        );

        // REFETCH
        msg =
        await msg.channel.messages.fetch(
            msg.id
        );

        // TEXT
        let content =
            msg.content || "";

        // IMAGE FILES
        let files = [];

        msg.attachments.forEach(a => {

            files.push(a.url);

        });

        // REAL BASE LINK
        let realLink = null;

        // TRY BUTTONS
        if (msg.components?.length) {

            for (
                const row
                of msg.components
            ) {

                for (
                    const component
                    of row.components
                ) {

                    if (
                        component.url &&
                        component.url.includes(
                            "OpenLayout"
                        )
                    ) {

                        realLink =
                            component.url;

                    }

                }

            }

        }

        // TRY INTERACTION METADATA
        if (
            !realLink &&
            msg.interaction
        ) {

            try {

                const raw =
                JSON.stringify(
                    msg.interaction
                );

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

            } catch {}

        }

        // TRY EMBEDS
        if (
            !realLink &&
            msg.embeds?.length
        ) {

            for (
                const embed
                of msg.embeds
            ) {

                const raw =
                JSON.stringify(embed);

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

                    break;

                }

            }

        }

        // FINAL MESSAGE
        let finalText =
            content;

        if (realLink) {

            finalText +=
`\n\n🔗 Base Link:\n${realLink}`;

        }

        // SEND
        await targetChannel.send({

            content: finalText,
            files: files

        });

        console.log(
            `Copied real ClashKing base`
        );

    } catch (err) {

        console.log("ERROR:");
        console.log(err);

    }

});

client.login(TOKEN);
