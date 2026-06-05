const { Client } = require('discord.js-selfbot-v13');
const express = require('express');

// --- CONFIGURATION ---
const SOURCE_CHANNEL_ID = '1478369331376160928';
const TARGET_CHANNEL_ID = '1512350167209082981';
const CLASHKING_BOT_ID = '824653933347209227';

// Memory cache to avoid duplicate forwards (Map tracking original message ID)
const processedMessages = new Set();

const client = new Client({
    checkUpdate: false // Prevents library update logs on startup
});

// --- EXPRESS KEEPALIVE SERVER FOR RENDER ---
const app = express();
app.get('/', (req, res) => res.send('Automation Bot Is Online'));
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Keep-alive server listening on port ${PORT}`));

// --- CORE BOT LOGIC ---
client.on('ready', () => {
    console.log(`Logged in seamlessly as: ${client.user.tag}`);
});

// Helper function to process valid ClashKing embeds
async function handleClashKingMessage(message) {
    // Avoid double-processing if updates fire rapidly
    if (processedMessages.has(message.id)) return;

    // Validation checks
    if (message.channelId !== SOURCE_CHANNEL_ID) return;
    if (message.author.id !== CLASHKING_BOT_ID) return;
    if (!message.embeds || message.embeds.length === 0) return;

    // Check if the message contains action components (buttons)
    if (!message.components || message.components.length === 0) return;

    // Find the blue button (Primary or Link types typically found in component rows)
    let linkButton = null;
    for (const row of message.components) {
        linkButton = row.components.find(comp => comp.type === 'BUTTON');
        if (linkButton) break;
    }

    if (!linkButton) return;

    // Mark as processed early to prevent double interaction clicks
    processedMessages.add(message.id);
    // Cleanup cache after 5 minutes to keep memory lightweight
    setTimeout(() => processedMessages.delete(message.id), 5 * 60 * 1000);

    console.log(`[+] Detected ClashKing base post (${message.id}). Attempting to click interaction button...`);

    try {
        // Setup the ephemeral catcher BEFORE clicking so we don't miss the fast gateway event
        const ephemeralPromise = new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                client.off('messageCreate', ephemeralListener);
                reject(new Error('Timeout waiting for ClashKing ephemeral response.'));
            }, 10000); // 10 seconds timeout safeguard

            const ephemeralListener = (msg) => {
                // Ephemeral responses will match the author ID and contain the clash link
                if (msg.author.id === CLASHKING_BOT_ID && msg.content.includes('link.clashofclans.com')) {
                    clearTimeout(timeout);
                    client.off('messageCreate', ephemeralListener);
                    resolve(msg.content);
                }
            };

            client.on('messageCreate', ephemeralListener);
        });

        // Click the interaction button natively using discord.js-selfbot-v13 mechanics
        await message.clickButton(linkButton.customId);

        // Wait for the gateway to catch the raw text string containing the URL
        const rawContent = await ephemeralPromise;
        const urlMatch = rawContent.match(/https:\/\/link\.clashofclans\.com\/[^\s]+/);
        
        if (!urlMatch) {
            console.log(`[-] Could not parse actual URL from the ephemeral message.`);
            return;
        }

        const realClashLink = urlMatch[0];
        console.log(`[+] Successfully intercepted real link: ${realClashLink}`);

        // Extract metadata from the original message embed
        const sourceEmbed = message.embeds[0];
        const description = sourceEmbed.description || "No description provided.";
        const imageUrl = sourceEmbed.image ? sourceEmbed.image.url : null;

        // Build cleanly structured message payload for target channel
        const targetChannel = await client.channels.fetch(TARGET_CHANNEL_ID);
        if (!targetChannel) return;

        let outputMessage = `**New Base Shared!**\n\n**Description:**\n${description}\n\n**Layout Link:**\n${realClashLink}`;
        
        if (imageUrl) {
            await targetChannel.send({
                content: outputMessage,
                files: [imageUrl]
            });
        } else {
            await targetChannel.send({ content: outputMessage });
        }
        
        console.log(`[+] Forwarded successfully to target channel.`);

    } catch (err) {
        console.error(`[!] Error automating interaction for ${message.id}:`, err.message);
    }
}

// Hook both Create and Update listeners to handle delayed embed rendering
client.on('messageCreate', async (message) => {
    await handleClashKingMessage(message);
});

client.on('messageUpdate', async (oldMessage, newMessage) => {
    // If the partial doesn't contain embed data yet, fetch the full content safely
    if (newMessage.partial) {
        try {
            newMessage = await newMessage.fetch();
        } catch (e) {
            return;
        }
    }
    await handleClashKingMessage(newMessage);
});

// Run automation cleanly
client.login(process.env.DISCORD_TOKEN);
