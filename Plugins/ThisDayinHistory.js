const axios = require('axios');

module.exports = {
    usage: ['thisday', 'onthisday'],
    description: 'Find out what happened on this day in history',
    emoji: '📜',
    commandType: 'Info', // Categorize the command
    isWorkAll: true,
    async execute(sock, m) {
        const today = new Date();
        const month = today.getMonth() + 1; 
        const day = today.getDate();

        try {
            const response = await axios.get(`https://history.muffinlabs.com/date/${month}/${day}`);
            const historyData = response.data.data.Events;

            // Get multiple random events (e.g., 3) for more variety
            const numEventsToShow = 3; 
            const randomEvents = [];
            while (randomEvents.length < numEventsToShow && randomEvents.length < historyData.length) {
                const randomIndex = Math.floor(Math.random() * historyData.length);
                const randomEvent = historyData[randomIndex];
                if (!randomEvents.includes(randomEvent)) { // Avoid duplicates
                    randomEvents.push(randomEvent);
                }
            }

            // Premium UI with a touch of history
            let thisDayText = `
╭───────── 📜 On This Day 📜 ─────────╮
│                                 │`;

            randomEvents.forEach(event => {
                thisDayText += `│    ${event.year}: ${event.text}    │\n`;
            });

            thisDayText += `│                                 │
╰─────────────────────────╯`;

            await sock.sendMessage(m.key.remoteJid, { text: thisDayText }, { quoted: m });
        } catch (error) {
            await sock.sendMessage(m.key.remoteJid, { text: 'Error fetching historical events. Please try again later.' }, { quoted: m });
        }
    }
};
