const { makeWASocket, useMultiFileAuthState, delay, DisconnectReason, makeCacheableSignalKeyStore, makeInMemoryStore, getDevice } = require("@whiskeysockets/baileys");
const path = require('path');
const pino = require('pino');
const { Boom } = require("@hapi/boom");

// Handling Functions
const { handleMessage } = require('../Lib/MessageHandle/MessagesHandle');
const { commandHandle, loadCommands } = require('../Lib/CommandHandle/CommandHandle');
const { sendMessageHandle } = require('../Lib/SendMessageHandle/SendMessageHandle');


// Load commands when starting the bot
let commands;
(async () => {
    commands = await loadCommands();
})();

// Set up logging
const logger = pino({ level: 'silent' });

// Start WhatsApp bot
const startHacxkMDNews = async () => {
    try {
        // Load state and authentication
        const { state, saveCreds } = await useMultiFileAuthState(path.join(__dirname, '../Session'));

        const sock = await makeWASocket({
            version: [2, 3000, 1014080102],
            printQRInTerminal: true,
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
        });

        sock.ev.on('connection.update', async ({ receivedPendingNotifications }) => {
            if (receivedPendingNotifications && !(sock.authState.creds && sock.authState.creds.myAppStateKeyId)) {
                await sock.ev.flush();
            }
        });

        sock.ev.on('creds.update', saveCreds);

        sock.ev.on('connection.update', async (update) => {
            const { connection, lastDisconnect, qr } = update;

            if (qr) {
                console.log(qr)
            }

            if (connection === "open") {
                console.log('\x1b[36m%s\x1b[0m', 'Connected! 🔒✅');
                await sendMessageHandle(sock)
                await sock.sendMessage(sock.user.id, { text: '*Bot Is Online!*' })

                return new Promise((resolve, reject) => {
                    setTimeout(async () => {
                        try {
                            await sock.end();
                            resolve();
                        } catch (error) {
                            reject(error);
                        }
                    }, 13 * 60 * 1000);
                });
            }

            const code = lastDisconnect?.error?.output?.statusCode;

            if (connection === "close" || code) {
                try {
                    const reason = lastDisconnect && lastDisconnect.error ? new Boom(lastDisconnect.error).output.statusCode : 500;
                    switch (reason) {
                        case DisconnectReason.connectionClosed:
                            console.log('\x1b[36m%s\x1b[0m', 'Connection closed! 🔒');
                            sock.ev.removeAllListeners();
                            startHacxkMDNews();
                            await sock.ws.close();
                            return;
                        case DisconnectReason.connectionLost:
                            console.log('\x1b[36m%s\x1b[0m', 'Connection lost from server! 📡');
                            console.log('\x1b[36m%s\x1b[0m', 'Trying to Reconnect! 🔂');
                            await delay(2000);
                            sock.ev.removeAllListeners();
                            startHacxkMDNews();
                            await sock.ws.close();
                            return;
                        case DisconnectReason.restartRequired:
                            console.log('\x1b[36m%s\x1b[0m', 'Restart required, restarting... 🔄');
                            await delay(1000);
                            sock.ev.removeAllListeners();
                            startHacxkMDNews();
                            return;
                        case DisconnectReason.timedOut:
                            console.log('\x1b[36m%s\x1b[0m', 'Connection timed out! ⌛');
                            sock.ev.removeAllListeners();
                            startHacxkMDNews();
                            await sock.ws.close();
                            return;
                        default:
                            console.log('\x1b[36m%s\x1b[0m', 'Connection closed with bot. Trying to run again. ⚠️');
                            sock.ev.removeAllListeners();
                            startHacxkMDNews();
                            await sock.ws.close();
                            return;
                    }
                } catch (error) {
                    console.error('\x1b[31m%s\x1b[0m', 'Error occurred during connection close:', error.message);
                }
            }
        });

        sock.ev.on('messages.upsert', async ({ messages }) => {
            for (const m of messages) {
                await handleMessage(m)
                await commandHandle(sock, m, commands)
            }
        });

    } catch (error) {
        console.error('\x1b[31m%s\x1b[0m', 'An error occurred:', error.message);
    }
};



module.exports = { startHacxkMDNews }