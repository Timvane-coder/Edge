const axios = require('axios');

module.exports = {
    usage: ['quote', 'inspire'], // Allow multiple triggers
    description: 'Get a random inspirational quote',
    emoji: '✨',
    commandType: 'Motivation', // Categorize the command
    isWorkAll: true,
    async execute(sock, m) {
        try {
            const response = await axios.get('https://api.quotable.io/random');
            const quoteData = response.data;

            // Premium UI with Quote Bubbles and Attribution
            const quoteText = `

╭────────── *✨Quote of the Day✨* ──────────╮
  ❝ ${quoteData.content} ❞
  
    — ${quoteData.author}
╰────────────────────────────────╯
            `;

            await sock.sendMessage(m.key.remoteJid, { text: quoteText }, { quoted: m });
        } catch (error) {
            await sock.sendMessage(m.key.remoteJid, { text: 'Error fetching quote. Please try again later.' }, { quoted: m });
        }
    }
};
