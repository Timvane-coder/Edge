module.exports = {
    usage: ['ping'],
    description: 'Checks the bot\'s response time and network latency',
    emoji: '⚡',
    commandType: 'Utility', // Add command type categorization
    isWorkAll: true,
    async execute(sock, m) {
        console.log('ping')
        const startTime = Date.now();
        const pingMessage = await sock.sendMessage(m.key.remoteJid, { text: '⚡ Pinging...' }, { quoted: m });
        const endTime = Date.now();

        const latency = endTime - startTime;
        const responseTime = pingMessage.messageTimestamp - m.messageTimestamp;

        // Enhanced Premium Styling
        const pingText = `
╭─────── ⚡ PING ⚡ ───────╮
│                              │
│ Latency:      ${latency}ms │
│ Response Time: ${responseTime}ms │
│                              │
╰─────────────────────╯
        `;

        await sock.sendMessage(m.key.remoteJid, {
            edit: pingMessage.key,
            text: pingText,
            type: "MESSAGE_EDIT"
        });
    }
};
