const axios = require('axios');

module.exports = {
    usage: ['wyr'],
    description: 'Play a round of "Would You Rather?"',
    emoji: '🤔',
    commandType: 'Fun', // Add the commandType here
    isWorkAll: true,
    async execute(sock, m) {
        try {
            const response = await axios.get('https://api.truthordarebot.xyz/api/wyr');
            const questionData = response.data;

            const wyrText = `
┏━━━━━━🤔  WOULD YOU RATHER...?  🤔━━━━━━┓
┃                                          ┃
┃  ${questionData.question}                  ┃ 
┃                                          ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
            `;

            // Send the question as a reply with the question mark emoji
            await sock.sendMessage(m.key.remoteJid, { text: wyrText }, { quoted: m, mentions: [m.sender] }); 

            // Encourage participation
            await sock.sendMessage(m.key.remoteJid, { 
                text: "Reply with 'A' or 'B' to choose your answer! 💬",
                mentions: [m.sender] 
            });

        } catch (error) {
            await sock.sendMessage(m.key.remoteJid, { text: 'Error fetching "Would You Rather?" question. Please try again later.' }, { quoted: m });
        }
    }
};
