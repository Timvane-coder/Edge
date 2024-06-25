const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion, makeCacheableSignalKeyStore, makeInMemoryStore, delay } = require("@whiskeysockets/baileys");
const path = require('path');
const pino = require('pino');
const { Boom } = require("@hapi/boom");
const NodeCache = require("node-cache");
const fs = require('fs');

// Handling Functions
const { handleMessage } = require('../Lib/MessageHandle/MessagesHandle');
const { commandHandle, loadCommands } = require('../Lib/CommandHandle/CommandHandle');
const { sendMessageHandle } = require('../Lib/SendMessageHandle/SendMessageHandle');
const { ownEvent } = require('../Lib/EventsHandle/EventsHandle');

// Load commands when starting the bot
let commands;
(async () => {
    commands = await loadCommands();
    const pluginDir = path.join(__dirname, '../Plugins');
    watchPlugins(pluginDir);
    refreshSettings();
})();

async function refreshSettings() {
    try {
        delete require.cache[require.resolve('../Settings')];
        require('../Settings')
        return
    } catch (error) {
        console.error('Error refreshing settings:', error.message);
    }
}

// Set up logging
const logger = pino({ level: 'silent' });
const store = makeInMemoryStore({ logger: pino().child({ level: 'silent', stream: 'store' }) });
const msgRetryCounterCache = new NodeCache();

const startHacxkMDNews = async () => {
    // Dynamic import inquirer & chalk
    const inquirerModule = await import('inquirer');
    const chalk = (await import('chalk')).default;
    const inquirer = inquirerModule.default;

    try {
        // Load state and authentication
        const { state, saveCreds } = await useMultiFileAuthState(path.join(__dirname, '../Session'));

        // fetch latest version of WA Web
        const { version, isLatest } = await fetchLatestBaileysVersion()
        console.log(chalk.cyanBright(`using WA v${version.join('.')}, isLatest: ${isLatest}`))

        let pairingOption;
        let pairingNumber;

        if (!state.creds.me) {
            // Prompt user for pairing option
            const response = await inquirer.prompt([{
                type: 'list',
                name: 'pairingOption',
                message: 'Select an option to pair:',
                choices: ['QR CODE', 'Whatsapp Pairing Code']
            }]);
            pairingOption = response.pairingOption;

            if (pairingOption === 'Whatsapp Pairing Code') {
                const numberResponse = await inquirer.prompt([{
                    type: 'input',
                    name: 'pairingNumber',
                    message: 'Please enter your valid WhatsApp number (without + sign):',
                    validate: input => /^\d+$/.test(input) ? true : 'Please enter a valid number'
                }]);
                pairingNumber = numberResponse.pairingNumber;
            }
        } else {
            pairingOption = 'QR CODE';
        }

        const sock = await makeWASocket({
            version: [2, 3000, 1014080102],
            printQRInTerminal: pairingOption === 'QR CODE',
            mobile: false,
            keepAliveIntervalMs: 10000,
            syncFullHistory: false,
            downloadHistory: false,
            markOnlineOnConnect: true,
            defaultQueryTimeoutMs: undefined,
            logger,
            Browsers: ['Hacxk-MD', 'Chrome', '113.0.5672.126'],
            auth: {
                creds: state.creds,
                keys: makeCacheableSignalKeyStore(state.keys, logger),
            },
            linkPreviewImageThumbnailWidth: 1980,
            generateHighQualityLinkPreview: true,
            patchMessageBeforeSending: async (msg, recipientJids) => {
                const messageType = Object.keys(msg)[0];
                const messageContent = msg[messageType]?.text || msg[messageType]?.caption || '';

                // Default typing delay settings
                const defaultTypingDelay = {
                    min: 400, // Minimum delay in milliseconds
                    max: 800, // Maximum delay in milliseconds
                    longMessageThreshold: 300, // Characters
                };

                // Merge default and custom settings (if available)
                const typingDelay = { ...defaultTypingDelay, ...(settings.typingDelay || {}) };
                const messageLength = messageContent.length;

                // Handle audio messages
                if (messageType === 'audioMessage') {
                    await sock.sendPresenceUpdate('recording', recipientJids[0]);
                    const audioDuration = msg.audioMessage.seconds || 5; // Estimate duration if not provided
                    await delay(audioDuration * 1000); // Wait for the audio duration
                    await sock.sendPresenceUpdate('paused', recipientJids[0]);
                    return msg;
                }

                // Handle text or caption messages
                const typingDuration = messageLength > typingDelay.longMessageThreshold
                    ? typingDelay.max
                    : (Math.random() * (typingDelay.max - typingDelay.min) + typingDelay.min);

                await sock.sendPresenceUpdate('composing', recipientJids[0]);
                await delay(typingDuration);
                await sock.sendPresenceUpdate('paused', recipientJids[0]);
                return msg;
            }
        });

        // Socket.js -- This is For Listening User Option!
        await ownEvent(sock);


        sock.ev.on('connection.update', async (update) => {
            const { connection, lastDisconnect, qr } = update;

            if (qr && pairingOption === 'QR CODE') {
                console.log(qr);
            }

            if (!sock.authState.creds.registered && pairingOption === 'Whatsapp Pairing Code') {
                setTimeout(async () => {
                    const code = await sock.requestPairingCode(pairingNumber);
                    console.log(chalk.greenBright(`Pairing Code: ${code}`))
                }, 5000);
            }

            if (connection === "open") {
                // Store the interval IDs so we can clear them later
                let keepAliveInterval;
                let unavailableInterval;

                keepAliveInterval = setInterval(async () => {
                    try {
                        await sock.sendPresenceUpdate('available', sock.user.id);
                    } catch (error) {
                        if (error.message !== 'Connection Closed') { // Only log other errors
                            console.error('Error sending keep-alive:', error);
                        }
                    }
                }, 10000);
                console.log(chalk.cyan('Connected! 🔒✅'));
                await sendMessageHandle(sock);
                await sock.sendMessage(sock.user.id, { text: '*Bot Is Online!*' });
                return new Promise((resolve, reject) => {
                    setTimeout(async () => {
                        try {
                            console.log(chalk.yellow('Restarting socket to clear in-memory store...'))
                            // Clear intervals before ending the socket
                            clearInterval(keepAliveInterval);
                            clearInterval(unavailableInterval);

                            await sock.end({ reason: 'Clearing store' }); // Disconnect gracefully
                            resolve();
                        } catch (error) {
                            reject(error);
                        }
                    }, 10 * 60 * 1000);
                });
            }

            const code = lastDisconnect?.error?.output?.statusCode;

            if (connection === "close" || code) {
                try {
                    const reason = lastDisconnect && lastDisconnect.error ? new Boom(lastDisconnect.error).output.statusCode : 500;
                    switch (reason) {
                        case DisconnectReason.connectionClosed:
                            console.log(chalk.cyan('Connection closed! 🔒'));
                            sock.ev.removeAllListeners();
                            await delay(5000); // Add a delay before reconnecting
                            startHacxkMDNews();
                            await sock.ws.close();
                            return;
                        case DisconnectReason.connectionLost:
                            console.log(chalk.cyan('Connection lost from server! 📡'));
                            console.log(chalk.cyan('Trying to Reconnect! 🔂'));
                            await delay(2000);
                            sock.ev.removeAllListeners();
                            startHacxkMDNews();
                            await sock.ws.close();
                            return;
                        case DisconnectReason.restartRequired:
                            console.log(chalk.cyan('Restart required, restarting... 🔄'));
                            await delay(5000);
                            // sock.ev.removeAllListeners();
                            startHacxkMDNews();
                            return;
                        case DisconnectReason.timedOut:
                            console.log(chalk.cyan('Connection timed out! ⌛'));
                            sock.ev.removeAllListeners();
                            await delay(5000); // Add a delay before reconnecting
                            startHacxkMDNews();
                            await sock.ws.close();
                            return;
                        default:
                            console.log(chalk.cyan('Connection closed with bot. Trying to run again. ⚠️'));
                            sock.ev.removeAllListeners();
                            await delay(5000); // Add a delay before reconnecting
                            startHacxkMDNews();
                            await sock.ws.close();
                            return;
                    }
                } catch (error) {
                    console.error(chalk.red('Error occurred during connection close:'), error.message);
                }
            }

            //    // Enable read receipts
            sock.sendReadReceiptAck = true;
        });

        sock.ev.on('creds.update', saveCreds);


        await test(sock)


    } catch (error) {
        console.error(chalk.red('An error occurred:'), error.message);
    }
};

async function test(sock) {
    sock.ev.on('messages.upsert', async ({ messages }) => {
        console.log(messages[0])
        for (const m of messages) {
            try {
                await commandHandle(sock, m, commands);
                await handleMessage(m);
            } catch (error) {
                console.log(error)
            }
        }
    });
}

const debounceTimeout = 2000;

function watchPlugins(pluginDir) {
    let reloadTimeout;

    fs.watch(pluginDir, { recursive: true }, (eventType, filename) => {
        if (filename.endsWith('.js')) {
            clearTimeout(reloadTimeout);
            reloadTimeout = setTimeout(async () => {
                const commandPath = path.join(pluginDir, filename);

                try {
                    delete require.cache[require.resolve(commandPath)];
                    const newCommandModule = require(commandPath);

                    // Check if module is valid before registering
                    if (typeof newCommandModule.execute === 'function' && newCommandModule.usage) {
                        registerCommand(newCommandModule, commands);
                        console.log('\x1b[35m%s\x1b[0m', `[Hot Reload] Successfully reloaded ${filename}`);
                    } else {
                        console.warn('\x1b[35m%s\x1b[0m', `[Hot Reload] Skipped ${filename}: Invalid command module format.`);
                    }
                } catch (error) {
                    console.error(`[Hot Reload] Error reloading ${filename}: ${error.message}`);
                }
            }, debounceTimeout);
        }
    });

    // Watch for changes in Settings.js in the root folder
    fs.watch(path.join(__dirname, '../Settings.js'), (eventType) => {
        if (eventType === 'change') {
            // Debounce here as well, if needed
            clearTimeout(reloadTimeout);
            reloadTimeout = setTimeout(() => {
                try {
                    delete require.cache[require.resolve('../Settings.js')];
                    refreshSettings(); // Call your refreshSettings function
                    console.log('\x1b[35m%s\x1b[0m', '[Hot Reload] Settings.js reloaded');
                } catch (error) {
                    console.error('[Hot Reload] Error reloading Settings.js:', error.message);
                }
            }, debounceTimeout);
        }
    });
}

function registerCommand(commandModule, commands) {
    if (commandModule.usage) {
        const commandName = commandModule.usage;
        commands[commandName] = commandModule;
    }
}

module.exports = { startHacxkMDNews };
