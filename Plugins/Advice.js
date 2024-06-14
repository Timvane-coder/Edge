const axios = require('axios');

module.exports = {
    usage: ['advice', 'tip'], // Added alias 'tip'
    description: 'Get a random piece of advice to ponder', // More descriptive
    emoji: '💡',
    commandType: 'Inspirational', // Categorized
    isWorkAll: true,

    async execute(sock, m) {
        try {
            const response = await axios.get('https://api.adviceslip.com/advice');
            const adviceData = response.data.slip;

            if (!adviceData || !adviceData.advice) { // Check for valid response
                throw new Error('Invalid advice response from API'); 
            }

            const adviceText = `
┏━━💡 *PIECE OF ADVICE* 💡━━┓
  ${adviceData.advice}
┗━━━━━━━━━━━━━━━━━━━┛
            `; 

            await sock.sendMessage(m.key.remoteJid, { text: adviceText }, { quoted: m });
        } catch (error) {
            console.error('Error fetching advice:', error.message);
            await sock.sendMessage(m.key.remoteJid, { 
                text: 'Unable to find any wisdom at the moment. Please try again later.' 
            }, { quoted: m });
        }
    }
};
