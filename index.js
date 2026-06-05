 const { Client } = require('discord.js-selfbot-v13');
const express = require('express');

// --- CONFIGURATION ---
const ADMIN_ID = '1287545546231255092'; // Your verified main account ID

const CHANNEL_MAP = {
    '1397976773773492345': '1512370311071531162', // TH11
    '1397976994209333278': '1512370360824107018', // TH12
    '1397977231862665387': '1512370396320501861', // TH13
    '1397977246781800578': '1512350167209082981', // TH14
    '1397977306009571489': '1512370432190451843', // TH15
    '1397977323227185284': '1512370468718641162', // TH16
    '1397977380022386789': '1512370507893440602', // TH17
    '1440934909043544185': '1512370543477784656'  // TH18
};

const CLASHKING_BOT_ID = '824653933347209227';
const processedMessages = new Set();
const client = new Client({ checkUpdate: false });

// --- EXPRESS SERVER (UPTIMEROBOT) ---
const app = express();
app.get('/', (req, res) => res.send('Automation Bot Is Online'));
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`[Express] Keep-alive active on port ${PORT}`));

client.on('ready', () => console.log(`[Discord] Authenticated successfully as: ${client.user.tag}`));

// --- CORE PIPELINE ---
async function handleClashKingMessage(message, isManual = false) {
    if (processedMessages.has(message.id)) return false;
    if (message.author.id !== CLASHKING_BOT_ID) return false;
    if (!CHANNEL_MAP[message.channelId]) return false;

    if (!isManual) {
        const messageAge = Date.now() - message.createdTimestamp;
        if (messageAge > 120000) return false; 
    }

    let linkButton = null;
    if (message.components) {
        for (const row of message.components) {
            linkButton = row.components.find(comp => comp.type === 'BUTTON');
            if (linkButton) break;
        }
    }

    if (!linkButton) return false;

    processedMessages.add(message.id);
    setTimeout(() => processedMessages.delete(message.id), 5 * 60 * 1000);

    console.log(`[+] Processing base layout (${message.id})...`);

    let description = message.content || "No description provided.";
    let imageUrl = null;
    if (message.attachments.size > 0) {
        imageUrl = message.attachments.first().url;
    } else if (message.embeds.length > 0 && message.embeds[0].image) {
        imageUrl = message.embeds[0].image.url;
    }

    try {
        const ephemeralPromise = new Promise((resolve) => {
            const timeout = setTimeout(() => resolve(null), 15000);
            const linkCatcher = (msg) => {
                if (msg.author.id === CLASHKING_BOT_ID && msg.content.includes('link.clashofclans.com')) {
                    const match = msg.content.match(/https:\/\/link\.clashofclans\.com\/\S+/);
                    if (match) {
                        clearTimeout(timeout);
                        client.off('messageCreate', linkCatcher);
                        resolve(match[0]); 
                    }
                }
            };
            client.on('messageCreate', linkCatcher);
        });

        await message.clickButton(linkButton.customId);
        const realClashLink = await ephemeralPromise;
        
        if (realClashLink) {
            await forwardToTarget(message.channelId, description, realClashLink, imageUrl);
            return true;
        }
    } catch (err) {
        console.error(`[!] Automation error on message ${message.id}:`, err.message);
    }
    return false;
}

// --- HELPER SEND FUNCTION (FORMATTING UPDATED HERE) ---
async function forwardToTarget(sourceChannelId, description, link, imageUrl) {
    try {
        const targetChannelId = CHANNEL_MAP[sourceChannelId];
        const targetChannel = await client.channels.fetch(targetChannelId);
        if (!targetChannel) return;

        // Clean, separated UI for the target channel
        let outputMessage = 
            `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
            `🐉 **NEW CLASH LAYOUT** 🐉\n` +
            `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
            `**📝 Description:**\n` +
            `${description}\n\n` +
            `**🔗 Layout Link:**\n` +
            `<${link}>\n\n` +
            `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;
        
        if (imageUrl) {
            await targetChannel.send({ content: outputMessage, files: [imageUrl] });
        } else {
            await targetChannel.send({ content: outputMessage });
        }
        console.log(`[+] Successfully mirrored to target channel.`);
    } catch (err) {
        console.error(`[!] Error sending payload down the line:`, err.message);
    }
}

// --- EVENT LISTENERS ---
client.on('messageCreate', async (message) => {
    // 1. Direct Message Handler
    if (!message.guild && message.author.id !== client.user.id) {
        
        // Security Gate
        if (message.author.id !== ADMIN_ID) {
            console.log(`[Security] Blocked unauthorized DM request from ${message.author.tag}`);
            return; 
        }

        if (message.content.includes('discord.com/channels/')) {
            const match = message.content.match(/channels\/[0-9]+\/([0-9]+)\/([0-9]+)/);
            if (match) {
                const channelId = match[1];
                const messageId = match[2];

                if (!CHANNEL_MAP[channelId]) {
                    return message.reply("[-] The channel in that link is not tracked in the CHANNEL_MAP.");
                }

                try {
                    await message.reply("[+] Fetching base layout, please wait...");
                    const sourceChannel = await client.channels.fetch(channelId);
                    const targetMessage = await sourceChannel.messages.fetch(messageId);
                    
                    const success = await handleClashKingMessage(targetMessage, true);
                    if (success) {
                        await message.reply("✅ Successfully extracted and forwarded the layout to your server!");
                    } else {
                        await message.reply("❌ Failed to process. The link timed out or it isn't a valid base post.");
                    }
                } catch (e) {
                    console.error(e);
                    await message.reply("❌ Could not find that message. Make sure the link is correct.");
                }
            }
        }
        return;
    }

    // 2. Normal Automation Pipeline
    await handleClashKingMessage(message, false);
});

client.on('messageUpdate', async (oldMessage, newMessage) => {
    if (newMessage.partial) {
        try { newMessage = await newMessage.fetch(); } catch (e) { return; }
    }
    await handleClashKingMessage(newMessage, false);
});

client.login(process.env.DISCORD_TOKEN);
