const axios = require('axios');

module.exports = {
    usage: ['exchange'],
    description: 'Converts currency amounts',
    emoji: '💱',
    commandType: 'Utility',
    isWorkAll: true,
    async execute(sock, m, args) {
        const amount = parseFloat(args[0]);
        const fromCurrency = args[1]?.toUpperCase();
        const toCurrency = args[2]?.toUpperCase();

        if (isNaN(amount) || !fromCurrency || !toCurrency) {
            const usageText = `
╭───────── 💱 Exchange Rates 💱 ─────────╮
│                                                  │
│ Usage: /exchange [amount] [from currency] [to currency] │
│ Example: /exchange 100 USD LKR                   │
│                                                  │
╰──────────────────────────────────────╯
            `;
            return await sock.sendMessage(m.key.remoteJid, { text: usageText }, { quoted: m });
        }

        try {
            const response = await axios.get(`https://api.exchangerate.host/latest?base=${fromCurrency}&symbols=${toCurrency}`); // Free API
            const rates = response.data.rates;

            if (!rates[toCurrency]) {
                return await sock.sendMessage(m.key.remoteJid, { text: 'Invalid currency code.' }, { quoted: m });
            }

            const convertedAmount = (amount * rates[toCurrency]).toFixed(2);

            // Premium UI with Date and Time
            const now = new Date();
            const dateTime = now.toLocaleString('en-US', { timeZoneName: 'short' });

            const resultText = `
╭───── 💱 Exchange Result 💱 ─────╮
│                                 │
│   ${amount} ${fromCurrency}  =  ${convertedAmount} ${toCurrency}   │
│                                 │
│   As of: ${dateTime}     │
│                                 │
╰─────────────────────╯
            `;

            await sock.sendMessage(m.key.remoteJid, { text: resultText }, { quoted: m });
        } catch (error) {
            const errorMessage = `
╭───────── ⚠️ Error ⚠️ ─────────╮
│                                 │
│   Error fetching exchange rates.  │
│   Please try again later.        │
│                                 │
╰─────────────────────────╯
            `;
            await sock.sendMessage(m.key.remoteJid, { text: errorMessage }, { quoted: m });
        }
    }
};
