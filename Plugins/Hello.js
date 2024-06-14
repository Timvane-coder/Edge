const { HacxK } = require('../Lib/EventsHandle/EventsHandle');

module.exports = {
    usage: ['Hi', 'Hello'],
    description: 'Say hello!',
    emoji: '👋',
    isGroupOnly: true,
    isChannelOnly: true,
    isWorkAll: false,
    async execute(sock, m, args) {
        await sock.sendMessage(m.key.remoteJid, { text: 'Hello! Amigo 👋' }, { quoted: m });

        // Listen for specific messages once and then stop listening
        const listener = async (message) => {
            if (message.message && message.message.conversation && message.message.conversation.toLowerCase() === 'Hello!') {
                await sock.sendMessage(message.key.remoteJid, { text: 'Yo How Can I Help! You.' }, { quoted: message });
                HacxK.off('hacxk.messages', listener); // Remove the listener
            }
        };

        HacxK.on('hacxk.messages', listener);
    }
};
