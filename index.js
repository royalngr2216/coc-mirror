const { Client } = require("discord.js-selfbot-v13");
const axios = require("axios");
const FormData = require("form-data");

const client = new Client();

const TOKEN = process.env.TOKEN;
const WEBHOOK = process.env.WEBHOOK;
const SOURCE_CHANNEL = process.env.SOURCE_CHANNEL;

client.on("ready", () => {
    console.log(`Logged in as ${client.user.username}`);
});

client.on("messageCreate", async (msg) => {

    if (msg.channel.id !== SOURCE_CHANNEL) return;

    try {

        const form = new FormData();

        form.append("content", msg.content || " ");

        if (msg.attachments.size > 0) {

            const attachment = msg.attachments.first();

            const response = await axios.get(
                attachment.url,
                { responseType: "arraybuffer" }
            );

            form.append(
                "file",
                response.data,
                attachment.name
            );
        }

        await axios.post(WEBHOOK, form, {
            headers: form.getHeaders()
        });

        console.log("Reposted");

    } catch (err) {
        console.log(err);
    }
});

client.login(TOKEN);
