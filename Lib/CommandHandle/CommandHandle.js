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
        } else {
            return; // Skip non-text messages
        }

        if (text.startsWith('!')) {
            const commandName = text.slice(1).split(' ')[0];
            const args = text.slice(1 + commandName.length).trim().split(' ');

            for (const commandKey in commands) {
                const command = commands[commandKey];
                const usages = Array.isArray(command.usage) ? command.usage.map(usage => usage.toLowerCase()) : [command.usage.toLowerCase()];

                if (usages.includes(commandName)) {
                    try {
                        // **** Improved Work Mode Logic ****
                        let isValidChat = command.isWorkAll; 

                        if (!isValidChat) {
                            isValidChat = (command.isChannelOnly && m.key.remoteJid.endsWith('@newsletter')) ||
                                          (command.isGroupOnly && m.key.remoteJid.endsWith('@g.us'));
                        }

                        if (!isValidChat) {
                            throw new CommandError(
                                `This command can only be used in ${command.isChannelOnly ? 'Channels' : command.isGroupOnly ? 'Groups' : 'Unsupported chats'}.`,
                                commandName
                            );
                        }

                        if (command.emoji) {
                            await sock.sendMessage(m.key.remoteJid, { react: { text: command.emoji, key: m.key } });
                        }

                        await command.execute(sock, m, args);
                        return;
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
                }
            }
        }
    } catch (error) {
        console.error('Error handling command:', error);
        // Handle the error here, potentially send a generic error message to the user
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

module.exports = { commandHandle, loadCommands };
