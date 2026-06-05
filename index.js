const { Client } = require('discord.js-selfbot-v13');
const express = require('express');

// --- CONFIGURATION ---
const SOURCE_CHANNEL_ID = '1478369331376160928';
const TARGET_CHANNEL_ID = '1512350167209082981';
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
    if (message.channelId !== SOURCE_CHANNEL_ID) return;
    if (message.author.id !== CLASHKING_BOT_ID) return;

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

    console.log(`[+] Found new base post (${message.id}). Extracting...`);

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
        const targetChannel = await client.channels.fetch(TARGET_CHANNEL_ID);
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
        
        // Send to target channel
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
        
        console.log(`[+] Forwarded base and link perfectly to target channel.`);

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
