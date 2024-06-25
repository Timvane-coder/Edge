const fs = require('fs');
const path = require('path');

class CommandError extends Error {
    constructor(message, commandName) {
        super(message);
        this.name = 'CommandError';
        this.commandName = commandName;
    }
}

async function commandHandle(sock, m, commands) {
    try {
        let text = '';
        if (m.message && m.message.conversation) {
            text = m.message.conversation.toLowerCase();
        } else if (m.message && m.message.extendedTextMessage && m.message.extendedTextMessage.text) {
            text = m.message.extendedTextMessage.text.toLowerCase();
        } else if (m.message) {
            for (const key of Object.keys(m.message)) {
                if (m.message[key]?.caption) {
                    text = m.message[key].caption.toLowerCase();
                    break;
                }
            }
        } else {
            return;
        }

        const commandPrefixes = ['!', '.', '/'];
        const sender = getSenderFromGroupMessage(m);
        const prefix = commandPrefixes.find(p => text.startsWith(p));
        if (!prefix) return;

        const [commandName, ...args] = text.slice(prefix.length).trim().split(/\s+/);
        const command = Object.values(commands).find(cmd => {
            const usages = Array.isArray(cmd.usage) ? cmd.usage.map(u => u.toLowerCase()) : [cmd.usage.toLowerCase()];
            return usages.includes(commandName);
        });

        if (!command) {
            await sock.sendMessage(m.key.remoteJid, { text: `🚨 Command not found: "${commandName}"` }, { quoted: m });
            return;
        }

        // Check if the command is allowed in the current chat context
        if (settings.workMode.toLowerCase() === 'private' && m.key.remoteJid.endsWith('@g.us')) { // Group chat
            await sock.sendMessage(m.key.remoteJid, { react: { text: '❌', key: m.key } });
            return
        }

        if (command.isAdminUse &&
            m.key.fromMe !== true &&
            !settings.ownerNumbers.includes(sender)) {
            await sock.sendMessage(m.key.remoteJid, {
                react: {
                    text: '⚠️',
                    key: m.key
                }
            });
            return await sock.sendMessage(m.key.remoteJid, {
                text: `
╭• ─────────── ✾ ─────────── •╮
┊ ⚠️  Admin Only Command  ⚠️ 
╰• ─────────── ✾ ─────────── •╯

╭─── ･ ｡ﾟ☆: *.☽ .* :☆ﾟ. ───╮
┊ Sorry, this command is only for admins
┊ or the bot owner.
╰─── ･ ｡ﾟ☆: *.☽ .* :☆ﾟ. ───╯
`
            }, { quoted: m });
        }

        try {
            const isValidChat = command.isWorkAll ||
                (command.isChannelOnly && m.key.remoteJid.endsWith('@newsletter')) ||
                (command.isGroupOnly && m.key.remoteJid.endsWith('@g.us'));

            if (!isValidChat) {
                throw new CommandError(
                    `This command can only be used in ${command.isChannelOnly ? 'Channels' : command.isGroupOnly ? 'Groups' : 'Unsupported chats'}.`,
                    commandName
                );
            }

            if (command.emoji) {
                await sock.sendMessage(m.key.remoteJid, { react: { text: command.emoji, key: m.key } });
            }

            await sock.readMessages([m.key]);
            await command.execute(sock, m, args, commands); // Pass commands if needed
            return
        } catch (error) {
            if (error instanceof CommandError) {
                await sock.sendMessage(m.key.remoteJid, { text: `🚨 ${error.message}` }, { quoted: m });
            } else {
                const errorMessage = `Error executing command "${commandName}":\n\`\`\`${error.stack || error.message}\`\`\``;
                console.error(errorMessage);

                // Send error to developer (replace with actual developer's number)
                await sock.sendMessage(sock.user.id, { text: errorMessage });

                // Send user-friendly error message
                await sock.sendMessage(m.key.remoteJid, { text: `🚨 An error occurred while executing the command. The developer has been notified.` }, { quoted: m });
            }
        }
    } catch (error) {
        console.error('Error handling command:', error);
    }
}

async function loadCommands() {
    const commands = {};
    const pluginDir = path.join(__dirname, '../../Plugins'); // Path to your plugins folder

    // Read directory contents
    const files = await fs.promises.readdir(pluginDir);

    // Loop through each file
    for (const file of files) {
        if (!file.endsWith('.js')) continue; // Skip non-JavaScript files

        const commandPath = path.join(pluginDir, file);

        try {
            // Dynamically import the command module
            const commandModule = require(commandPath);

            if (commandModule.usage) {
                const commandName = commandModule.usage;
                commands[commandName] = commandModule; // Add command module to commands object using usage as key
            } else {
                console.warn(`Command in ${file} does not have a usage property.`);
            }
        } catch (error) {
            console.error(`Error loading command from ${file}:`, error);
        }
    }

    return commands;
}

function getSenderFromGroupMessage(m) {
    if (m.key.remoteJid.endsWith('@g.us')) { // Check if it's a group chat
        return m.key.participant.split('@')[0]; // Extract participant ID for group chats
    } else {
        return m.key.remoteJid.split('@')[0]; // For individual chats, return the remoteJid directly
    }
}


module.exports = { commandHandle, loadCommands };