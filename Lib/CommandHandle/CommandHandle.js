const fs = require('fs');
const path = require('path');

async function commandHandle(sock, m, commands) {
    try {
        // Check for different message types that might contain text
        let text = '';
        if (m.message && m.message.conversation) {
            text = m.message.conversation.toLowerCase();
        } else if (m.message && m.message.extendedTextMessage && m.message.extendedTextMessage.text) {
            text = m.message.extendedTextMessage.text.toLowerCase();
        } else {
            return; // Skip non-text messages
        }

        // Check for command prefix (modify as needed)
        if (text.startsWith('!')) {
            const commandName = text.slice(1).split(' ')[0]; // Extract command name (without prefix and first space)
            const args = text.slice(1 + commandName.length).trim().split(' '); // Extract arguments

            for (const commandKey in commands) {
                const command = commands[commandKey];
                const usages = Array.isArray(command.usage) ? command.usage.map(usage => usage.toLowerCase()) : [command.usage.toLowerCase()];

                if (usages.includes(commandName)) {
                    try {
                        // Check if the command is channel-only and the message is not from a channel
                        if (command.isChannelOnly && !m.key.remoteJid.endsWith('@newsletter')) {
                            await sock.sendMessage(m.key.remoteJid, {
                                text: '🚨 This command can only be used in Channels.',
                            }, { quoted: m });
                            return;
                        }

                        // Check if the command is group-only and the message is not from a group
                        if (command.isGroupOnly && !m.key.remoteJid.endsWith('@g.us')) {
                            await sock.sendMessage(m.key.remoteJid, {
                                text: '🚨 This command can only be used in groups.',
                            }, { quoted: m });
                            return;
                        }

                        // React to the user's message with the command's emoji
                        if (command.emoji) {
                            await sock.sendMessage(m.key.remoteJid, {
                                react: { text: command.emoji, key: m.key }
                            });
                        }

                        await command.execute(sock, m, args); // Execute command
                        return; // Command found and executed, exit the loop

                    } catch (error) {
                        console.error(`Error executing command "${commandName}":`, error);
                        if (m.key.remoteJid.endsWith('@s.whatsapp.net') || m.key.remoteJid.endsWith('@g.us')) {
                            await sock.sendMessage(m.key.remoteJid, {
                                text: `🚨 *Error executing command* \`"${commandName}"\`:\n\`\`\`${error}\`\`\``
                            }, { quoted: m });
                        }
                    }
                }
            }
        }
    } catch (error) {
        console.error('Error handling command:', error);
        if (m.key.remoteJid.endsWith('@s.whatsapp.net') || m.key.remoteJid.endsWith('@g.us')) {
            await sock.sendMessage(m.key.remoteJid, {
                text: `*🚨 Error handling command:*\n\`\`\`${error}\`\`\``
            }, { quoted: m });
        }
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
