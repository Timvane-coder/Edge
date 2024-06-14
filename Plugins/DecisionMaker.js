module.exports = {
    usage: 'decide', // Corrected usage
    description: 'Helps you make a yes-or-no decision',
    emoji: '🤔',
    commandType: 'Fun',
    isWorkAll: true,

    async execute(sock, m, args) {
        const question = args.join(' ');
        if (!question) {
            return await sock.sendMessage(m.key.remoteJid, {
                text: `
╭───────── 🤔 Decide 🤔 ─────────╮
│                               │
│   Usage: /decide [your question]  │
│   Example: /decide Should I...?   │
│                               │
╰─────────────────────────╯`
            }, { quoted: m });
        }

        const answers = [
            'Yes', 'No', 'Maybe', 'Definitely', 'Absolutely not', 
            'Ask again later', 'Signs point to yes', 'Reply hazy, try again', 
            'Without a doubt', 'My sources say no', 'Most likely', 'Outlook not so good', 
            'It is certain', 'Cannot predict now', 'Better not tell you now', 
            'Concentrate and ask again', 'Don\'t count on it', 'Very doubtful'
        ]; 
        const randomAnswer = answers[Math.floor(Math.random() * answers.length)];

        const decisionText = `
╭───────── 🎱 Magic 8-Ball 🎱 ─────────╮
│                                                │
│                *Your Question:*              │
│               ${question}                │
│                                                │
│                *The 8-Ball Says:*             │
│               ${randomAnswer}                │
│                                                │
╰──────────────────────────────────────╯
        `;

        await sock.sendMessage(m.key.remoteJid, { text: decisionText }, { quoted: m });
    }
};
