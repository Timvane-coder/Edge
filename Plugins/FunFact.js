const axios = require('axios');

module.exports = {
    usage: ['fact', 'funfact'],
    description: 'Get a random fun fact',
    emoji: '🤯',
    commandType: 'Fun', // Categorize the command
    isWorkAll: true,
    async execute(sock, m) {
        try {
            const response = await axios.get('https://uselessfacts.jsph.pl/random.json?language=en');
            const factData = response.data;

            // Premium UI with Fact Bubble and Source
            const factText = `

╭───────── 🤯 Did You Know? 🤯 ─────────╮
💭 ${factData.text} 
╰─────────────────────────────╯
Source: ${factData.source_url} 
            `;

            await sock.sendMessage(m.key.remoteJid, { text: factText }, { quoted: m });
        } catch (error) {
            await sock.sendMessage(m.key.remoteJid, { text: 'Error fetching fun fact. Please try again later.' }, { quoted: m });
        }
    }
};
