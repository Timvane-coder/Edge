module.exports = {
    usage: ['Hi', 'Hello'],
    description: 'Say hello!',
    emoji: '👋',
    isGroupOnly: false,
    isChannelOnly: false,
    async execute(sock, m, args) {
        await hacxk.reply('Hello! 👋', m);
    }
};
