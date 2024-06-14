const moment = require('moment-timezone');

module.exports = {
    usage: ['time'],
    description: 'Tells the current time in your location or a specified timezone',
    emoji: '⏰',
    commandType: 'Utility', // Add commandType for categorization
    isWorkAll: true,
    async execute(sock, m, args) {
        const timezone = args[0] || moment.tz.guess(); // Guess user's timezone if not provided

        try {
            const timeString = moment().tz(timezone).format('hh:mm:ss A z');

            // Premium UI with Clock Emoji
            const timeText = `
            
╭───── ⏰ Time ⏰ ──────╮
│                          │
│    ${timeString}    │
│                          │
╰────────────────╯
            `;

            await sock.sendMessage(m.key.remoteJid, { text: timeText }, { quoted: m });
        } catch (error) {
            const errorMessage = `
            
╭───── ⚠️ Error ⚠️ ──────╮
│                          │
│ Invalid timezone. Please     │
│ use a valid timezone name  │
│ (e.g., America/New_York).  │
│                          │
╰────────────────╯
            `;
            await sock.sendMessage(m.key.remoteJid, { text: errorMessage }, { quoted: m });
        }
    }
};
