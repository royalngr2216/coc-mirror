const { Client } = require('discord.js-selfbot-v13');
const express = require('express');

// --- CONFIGURATION ---
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
const processedLinks = new Set(); // Tracks forwarded links to prevent duplicates
const client = new Client({ checkUpdate: false });

// --- EXPRESS SERVER (UPTIMEROBOT) ---
const app = express();
app.get('/', (req, res) => res.send('Automation Bot Is Online'));
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`[Express] Keep-alive active on port ${PORT}`));

client.on('ready', () => console.log(`[Discord] Authenticated successfully as: ${client.user.tag}`));

// --- CORE PIPELINE FOR AUTOMATIC LATEST POSTS ---
async function handleClashKingMessage(message) {
    if (processedMessages.has(message.id)) return;
    if (message.author.id !== CLASHKING_BOT_ID) return;
    if (!CHANNEL_MAP[message.channelId]) return;

    // CRUCIAL FIX: Ignore the message entirely if it was originally posted more than 2 minutes ago
    // This stops download counter updates on old messages from triggering the bot automatically
    const messageAge = Date.now() - message.createdTimestamp;
    if (messageAge > 120000) return; 

    let linkButton = null;
    if (message.components) {
        for (const row of message.components) {
            linkButton = row.components.find(comp => comp.type === 'BUTTON');
            if (linkButton) break;
        }
    }

    if (!linkButton) return;

    processedMessages.add(message.id);
    setTimeout(() => processedMessages.delete(message.id), 5 * 60 * 1000);

    console.log(`[+] Automated: New active base detected (${message.id}). Processing...`);

    let description = message.content || "";
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
            processedLinks.add(realClashLink); // Log to prevent manual listener double-firing
            await forwardToTarget(message.channelId, description, realClashLink, imageUrl);
        }
    } catch (err) {
        console.error(`[!] Automation error on message ${message.id}:`, err.message);
    }
}

// --- GLOBAL CATCHER FOR MANUAL CLICKS ON OLD MESSAGES ---
client.on('messageCreate', async (msg) => {
    // Only looking for ClashKing links landing in our monitored channels
    if (msg.author.id !== CLASHKING_BOT_ID) return;
    if (!msg.content.includes('link.clashofclans.com')) return;
    if (!CHANNEL_MAP[msg.channelId]) return;

    const match = msg.content.match(/https:\/\/link\.clashofclans\.com\/\S+/);
    if (!match) return;
    const realClashLink = match[0];

    // If this link was already handled by the auto-mode loop above, skip it
    if (processedLinks.has(realClashLink)) return;
    processedLinks.add(realClashLink);
    setTimeout(() => processedLinks.delete(realClashLink), 30000);

    console.log(`[+] Manual Action: Detected link from your physical button click. Fetching context...`);

    let description = "Manually Selected Layout";
    let imageUrl = null;

    try {
        // Look through the last 10 messages in the channel to find the base layout card you clicked on
        const historicalMessages = await msg.channel.messages.fetch({ limit: 10 });
        const layoutContext = historicalMessages.find(m => m.author.id === CLASHKING_BOT_ID && (m.attachments.size > 0 || m.embeds.length > 0));
        
        if (layoutContext) {
            description = layoutContext.content || description;
            if (layoutContext.attachments.size > 0) {
                imageUrl = layoutContext.attachments.first().url;
            } else if (layoutContext.embeds.length > 0 && layoutContext.embeds[0].image) {
                imageUrl = layoutContext.embeds[0].image.url;
            }
        }
    } catch (e) {
        console.log(`[-] Could not find past layout details:`, e.message);
    }

    await forwardToTarget(msg.channelId, description, realClashLink, imageUrl);
});

// --- HELPER SEND FUNCTION ---
async function forwardToTarget(sourceChannelId, description, link, imageUrl) {
    try {
        const targetChannelId = CHANNEL_MAP[sourceChannelId];
        const targetChannel = await client.channels.fetch(targetChannelId);
        if (!targetChannel) return;

        let outputMessage = `**New Base Shared!**\n\n**Description:**\n${description}\n\n**Layout Link:**\n<${link}>`;
        
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

// Gateway Initialization Event Ties
client.on('messageCreate', async (message) => {
    await handleClashKingMessage(message);
});

client.on('messageUpdate', async (oldMessage, newMessage) => {
    if (newMessage.partial) {
        try { newMessage = await newMessage.fetch(); } catch (e) { return; }
    }
    await handleClashKingMessage(newMessage);
});

client.login(process.env.DISCORD_TOKEN);
                        
