module.exports = {
    usage: ['menu', 'help'],
    description: 'Display the available commands',
    emoji: '📜',
    commandType: 'Utility',
    isWorkAll: true,

    async execute(sock, m, args, commands) {
        console.log(commands)

        const startTime = Date.now();
        const pingMessage = await sock.sendMessage(m.key.remoteJid, { text: '⚡ Calculating ping...' }, { quoted: m });
        const responseTime = Date.now() - startTime;

        const prefix = '/';
        const botUptime = process.uptime();

        // Dynamically build commandTypes
        const commandTypes = {};
        let totalCommands = 0; // Initialize totalCommands variable
        for (const commandKey of Object.keys(commands)) {
            const command = commands[commandKey];
            if (command.commandType) {
                commandTypes[command.commandType] = commandTypes[command.commandType] || [];
                commandTypes[command.commandType].push(command);

                // Increment totalCommands for each valid command
                totalCommands += Array.isArray(command.usage) ? command.usage.length : 1;
            }
        }

        if (Object.keys(commandTypes).length === 0) {
            await sock.sendMessage(m.key.remoteJid, {
                text: "Oops! It seems there are no commands available right now. Please check back later or contact the bot owner."
            }, { quoted: m });
            return;
        }

        const shuffledTypes = shuffleArray(Object.keys(commandTypes));

        let menuText = `
┏━━━━━◥◣◆◢◤━━━━━━━┓
. 🌺  HACXK  🌺
┗━━━━━◢◤◆◥◣━━━━━━━┛

✧ *ɴᴀᴍᴇ:* HACXK
✧ *ᴠᴇʀꜱɪᴏɴ:* 1.0
✧ *ᴜᴘᴛɪᴍᴇ:* ${formatUptime(botUptime)}
✧ *ᴘʀᴇꜰɪx:* '/ . !'
✧ *ᴘɪɴɢ:* ${responseTime}ms
✧ *ᴏᴡɴᴇʀ:* Zaid Mohamed

\`*Total Commands:*\` ${totalCommands}

ミ★ 𝘩𝘦𝘺 𝘢𝘳𝘦 𝘺𝘰𝘶 𝘴𝘦𝘢𝘳𝘤𝘩𝘪𝘯𝘨 𝘩𝘰𝘸 𝘵𝘰 𝘨𝘦𝘵 𝘮𝘦 𝘧𝘦𝘦𝘭 𝘧𝘳𝘦𝘦 𝘵𝘰 𝘷𝘪𝘴𝘪𝘵 𝘩𝘦𝘳𝘦: ★彡
https://github.com/hacxk/

𝙽𝚎𝚎𝚍 𝚑𝚎𝚕𝚙? 𝙷𝚎𝚛𝚎'𝚜 𝚠𝚑𝚊𝚝 𝙸 𝚌𝚊𝚗 𝚍𝚘:
`;

        for (const type of shuffledTypes) {
            const commandsOfType = commandTypes[type];
            menuText += `\n ✦ ───『*${type}*』─── ✵\n\n`;

            shuffleArray(commandsOfType);

            commandsOfType.forEach(command => {
                const cmds = Array.isArray(command.usage) ? command.usage : [command.usage];
                cmds.forEach(cmd => {
                    menuText += `◈ *\`\`\`${prefix}${cmd}\`\`\`* - ${command.description || 'No description available'}\n`;
                });
            });
        }

        menuText += `\nTo get more information about a command, type:
\`/command -h\`

For any questions or issues, feel free to contact the owner:
 -  🇭 🇦 🇨 🇽 🇰  -
┗━━━━━◢◤◆◥◣━━━━━━┛
`;

        // Update the original ping message with the menu
        await sock.sendMessage(m.key.remoteJid, { text: menuText }, { quoted: m })
    }
};

// Function to shuffle an array randomly
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

// Helper functions
function formatUptime(seconds) {
    const days = Math.floor(seconds / (24 * 60 * 60));
    const hours = Math.floor((seconds % (24 * 60 * 60)) / (60 * 60));
    const minutes = Math.floor((seconds % (60 * 60)) / 60);
    const secondsRemaining = Math.floor(seconds % 60);
    return `${days}d ${hours}h ${minutes}m ${secondsRemaining}s`;
}