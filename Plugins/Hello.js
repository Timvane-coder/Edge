const { HacxK } = require('../Lib/EventsHandle/EventsHandle');

module.exports = {
    usage: ['Hi', 'Hello'],
    description: 'Say hello!',
    emoji: '👋',
    isGroupOnly: true,
    isChannelOnly: true,
    isWorkAll: false,
    async execute(sock, m, args) {
        await sock.sendMessage(m.key.remoteJid, { text: 'Hello! 👋' }, { quoted: m });

        // Listen for specific messages once and then stop listening
        const listener = async (message) => {
            if (message.message && message.message.conversation && message.message.conversation.toLowerCase() === 'yo') {
                await sock.sendMessage(message.key.remoteJid, { text: 'This is a response to the specific message' }, { quoted: message });
                HacxK.off('hacxk.messages', listener); // Remove the listener
            }
        };

        HacxK.on('hacxk.messages', listener);
    }
};
