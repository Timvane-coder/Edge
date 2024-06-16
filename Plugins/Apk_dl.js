const axios = require('axios');
const { HacxK } = require('../Lib/EventsHandle/EventsHandle');

module.exports = {
    usage: ['apk', 'app'],
    description: 'Download APK File From apkpure.com',
    emoji: '📦',
    commandType: 'Utility',  // Added commandType
    isGroupOnly: true,
    isChannelOnly: false,
    isWorkAll: true,

    async execute(sock, m, args) {
        try {
            if (!args[0]) {
                await sock.sendMessage(m.key.remoteJid, { text: '🚨 Please provide an app name to search for.' }, { quoted: m });
                return;
            }

            const query = args.join(' ');
            const result = await axios.get('https://hacxkmd.vercel.app/api/apksearch/hacxkapksearch?q=' + query);

            if (!result.data || !result.data.result) {
                await sock.sendMessage(m.key.remoteJid, { text: '❌ No results found.' }, { quoted: m });
                return;
            }

            // Filter results that match the provided argument
            const matchedResults = result.data.result.filter(app => app.name.toLowerCase().includes(query.toLowerCase()));

            if (matchedResults.length === 0) {
                await sock.sendMessage(m.key.remoteJid, { text: '❌ No matching apps found.' }, { quoted: m });
                return;
            }

            // Create message with matched results
            let message = '📦 *Matched APKs:* 📦\n\n';
            matchedResults.forEach((app, index) => {
                message += `*${index + 1}. ${app.name}*\n`;
                message += `🖥️ *Developer:* ${app.developer}\n`;
                message += `📂 *Category:* ${app.category}\n`;
                message += `💾 *Size:* ${(app.size / 1024 / 1024).toFixed(2)} MB\n`;
                message += `🆚 *Version:* ${app.version}\n\n`;
            });

            message += 'Please reply with the number of the app you want to download.';

            const sentMessage = await sock.sendMessage(m.key.remoteJid, { text: message }, { quoted: m });

            // Add a temporary listener for user's reply
            const listener = async (response) => {
                if (response.message && response.message.extendedTextMessage && 
                    response.message.extendedTextMessage.contextInfo && 
                    response.message.extendedTextMessage.contextInfo.stanzaId === sentMessage.key.id) {

                    const messageContent = extractMessageContent(response);
                    if (!messageContent) return;

                    const choice = parseInt(messageContent, 10);
                    if (isNaN(choice) || choice < 1 || choice > matchedResults.length) {
                        await sock.sendMessage(response.key.remoteJid, { text: '❌ Invalid choice. Please reply with a valid number.' }, { quoted: response });
                        return;
                    }

                    const selectedApp = matchedResults[choice - 1];
                    const downloadMessage = `⬇️ *Download ${selectedApp.name}*\n\n🔗 [Download Link](${selectedApp.downloadUrl.slice('/download')})\n\nEnjoy!`;

                    await sock.sendMessage(response.key.remoteJid, { text: downloadMessage }, { quoted: response });

                    // Remove listener after processing
                    HacxK.off('hacxk.messages', listener);
                }
            };

            HacxK.on('hacxk.messages', listener);

        } catch (error) {
            console.error('Error fetching or sending message:', error);
            await sock.sendMessage(m.key.remoteJid, { text: '❌ An error occurred while processing your request.' }, { quoted: m });
        }
    }
};

function extractMessageContent(message) {
    if (message.message) {
        if (message.message.conversation) {
            return message.message.conversation;
        } else if (message.message.extendedTextMessage) {
            return message.message.extendedTextMessage.text;
        } else {
            return null;
        }
    }
    return null;
}
