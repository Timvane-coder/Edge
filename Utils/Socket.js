const { default: makeWASocket, useMultiFileAuthState, jidDecode, DisconnectReason, fetchLatestBaileysVersion, makeCacheableSignalKeyStore, makeInMemoryStore, delay, Browsers } = require("@whiskeysockets/baileys");
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
})();

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
            version: version,
            printQRInTerminal: pairingOption === 'QR CODE',
            mobile: false,
            shouldSyncHistoryMessage: true,
            syncFullHistory: true,
            downloadHistory: true,
            msgRetryCounterCache,
            logger: pino({ level: "silent" }),
            browser: Browsers.ubuntu("Chrome"),  // Else Put This   browser: ["Ubuntu", "Chrome", "20.0.04"], Don't Remove this commented
            auth: {
                creds: state.creds,
                /** caching makes the store faster to send/recv messages */
                keys: makeCacheableSignalKeyStore(state.keys, logger),
            },
            linkPreviewImageThumbnailWidth: 1980,
            generateHighQualityLinkPreview: true,
            maxMsgRetryCount: 10,
            retryRequestDelayMs: 500,
            getMessage,
            patchMessageBeforeSending: async (msg, recipientJids) => {
                for (const jid of recipientJids) {
                    const messageType = Object.keys(msg)[0];
                    // Optimize presence updates based on message type
                    if (messageType === 'audioMessage') {
                        await sock.sendPresenceUpdate('recording', jid);
                        const audioDuration = msg.audio.seconds || 5; // Estimate duration if not provided
                        await delay(audioDuration * 100); // Reduce delay time
                        await sock.sendPresenceUpdate('paused', jid);
                        await delay(100); // Reduce delay time
                    } else {
                        await sock.sendPresenceUpdate('composing', jid);
                        await delay(100); // Reduce delay time
                        await sock.sendPresenceUpdate('paused', jid);
                    }
                }
                return msg;
            }
        });

        store?.bind(sock.ev);

        sock.ev.on('connection.update', async ({ receivedPendingNotifications }) => {
            sock.ev.flush(true);
        });

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
                            await delay(1000);
                            sock.ev.removeAllListeners();
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

            // Enable read receipts
            sock.sendReadReceiptAck = true;
        });

        sock.ev.on('creds.update', () => {
            sock.ev.removeAllListeners('creds.update'); // Remove previous listeners
            saveCreds();
        });

        sock.ev.on('messages.upsert', async ({ messages }) => {
            for (const m of messages) {
                try {
                    await handleMessage(m);
                    await commandHandle(sock, m, commands);
                } catch (error) {
                    if (error.message.includes('waiting for message')) {
                        // Send a message to the user acknowledging the issue
                        await sock.sendMessage(m.key.remoteJid, {
                            text: "This message is encrypted and can't be read yet. Please wait for a few moments while it is decrypted."
                        });
                    } else if (error.message.includes('waiting for message') && retryCount < 3) {
                        // Retry decryption a few times before falling back
                        setTimeout(async () => {
                            try {
                                await handleMessage(m);
                                await commandHandle(sock, m, commands);
                            } catch (error) {
                                console.error(chalk.red('Retry failed:'), error.message);
                                // Fallback option: Inform the user and offer a solution
                                await sock.sendMessage(m.key.remoteJid, {
                                    text: "This message could not be decrypted. Please check your WhatsApp on your phone or contact support for assistance."
                                });
                            }
                        }, 5000); // Retry after 5 seconds
                        retryCount++;
                    }
                }
            }
        });

        async function getMessage(key) {
            if (store) {
                const msg = await store.loadMessage(key.remoteJid, key.id);
                return msg?.message || undefined;
            }

            // Only if store is present
            return proto.Message.fromObject({});
        }

        // Socket.js -- This is For Listening User Option!
        await ownEvent(sock);


    } catch (error) {
        console.error(chalk.red('An error occurred:'), error.message);
    }
};

const debounceTimeout = 1000; // Adjust debounce time as needed (in milliseconds)

function watchPlugins(pluginDir) {
    let reloadTimeout;

    fs.watch(pluginDir, { recursive: true }, (eventType, filename) => {
        if (filename.endsWith('.js')) {
            clearTimeout(reloadTimeout); // Debounce: Clear any pending reloads
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
                    // Optionally: Log the full error stack for debugging
                    // console.error(error.stack); 
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
