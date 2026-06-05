const { Client } = require('discord.js-selfbot-v13');
const express = require('express');

// --- CONFIGURATION ---
// Map your Source Channel IDs to your Target Channel IDs here.
// Format: 'SOURCE_CHANNEL_ID': 'TARGET_CHANNEL_ID'
const CHANNEL_MAP = {
    '1397976773773492345': '1512370311071531162',
    '1397976994209333278': '1512370360824107018',
    '1397977231862665387': '1512370396320501861',
    '1397977246781800578': '1512350167209082981', // Your TH14 IDs
    '1397977306009571489': '1512370432190451843',
    '1397977323227185284': '1512370468718641162',
    '1397977380022386789': '1512370507893440602',
    '1440934909043544185': '1512370543477784656'
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
async function handleClashKingMessage(message) {
    // Prevent duplicate processing
    if (processedMessages.has(message.id)) return;
    
    // Check if the message is from ClashKing AND if it's in one of our tracked Source channels
    if (message.author.id !== CLASHKING_BOT_ID) return;
    if (!CHANNEL_MAP[message.channelId]) return;

    // Get the correct target channel for this specific source
    const targetChannelId = CHANNEL_MAP[message.channelId];

    // Look for the "Link" button in the message components
    let linkButton = null;
    if (message.components) {
        for (const row of message.components) {
            linkButton = row.components.find(comp => comp.type === 'BUTTON');
            if (linkButton) break;
        }
    }

    if (!linkButton) return;

    // Lock this message ID to prevent double-firing
    processedMessages.add(message.id);
    setTimeout(() => processedMessages.delete(message.id), 5 * 60 * 1000);

    console.log(`[+] Found new base post in channel ${message.channelId}. Extracting...`);

    // 1. Get the Description
    let description = message.content || "";

    // 2. Get the Image (From Embed or Attachment)
    let imageUrl = null;
    if (message.attachments.size > 0) {
        imageUrl = message.attachments.first().url;
    } else if (message.embeds.length > 0 && message.embeds[0].image) {
        imageUrl = message.embeds[0].image.url;
    }

    try {
        console.log(`[+] Clicking the 'Link' button programmatically...`);
        
        // 3. Setup listener to catch the ephemeral response
        const ephemeralPromise = new Promise((resolve) => {
            const timeout = setTimeout(() => resolve(null), 15000); // Wait up to 15 seconds

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

        // Fire the click interaction
        await message.clickButton(linkButton.customId);

        // Wait for the gateway to catch the link
        const realClashLink = await ephemeralPromise;
        const targetChannel = await client.channels.fetch(targetChannelId);
        if (!targetChannel) return;

        // 4. Construct and send the final message
        if (!realClashLink) {
            console.log(`[-] Timed out waiting for the link. Sending fallback.`);
            let fallbackMsg = `**New Base Shared!**\n**Description:** ${description}\n*(Could not fetch link)*`;
            await targetChannel.send({ content: fallbackMsg, files: imageUrl ? [imageUrl] : [] });
            return;
        }

        console.log(`[+] Successfully extracted Link: ${realClashLink}`);
        
        // Wrap the link in < > to suppress the automatic Clash of Clans embed preview
        let outputMessage = `**New Base Shared!**\n\n**Description:**\n${description}\n\n**Layout Link:**\n<${realClashLink}>`;
        
        // Send to target channel mapped to this source
        if (imageUrl) {
            await targetChannel.send({ 
                content: outputMessage, 
                files: [imageUrl] 
            });
        } else {
            await targetChannel.send({ 
                content: outputMessage 
            });
        }
        
        console.log(`[+] Forwarded cleanly to target channel: ${targetChannelId}`);

    } catch (err) {
        console.error(`[!] Failed processing message ${message.id}:`, err.message);
    }
}

// Listeners
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
