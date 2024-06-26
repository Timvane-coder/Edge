const EventEmitter = require('events');
const HacxK = new EventEmitter();

async function ownEvent(sock) {
    sock.ev.on('messages.upsert', async ({ messages }) => {
        for (const m of messages) {
            if (settings.autoReadMessages) {
                await sock.readMessages([m.key]);
            }
            console.log(JSON.stringify(m))
            HacxK.emit('hacxk.messages', m);
        }
    });

    sock.ev.on('call', async (call) => {
        try {
            const { chatId, from, id, date, isVideo, isGroup } = call[0];

            // Log or store call details as needed
            console.log(`[${new Date(date).toLocaleString()}] ${callType} from ${from} (${groupName})`);

            sock.ev.on('call', async (call) => {
                try {
                    const { chatId, from, id, date, isVideo, isGroup } = call[0];

                    // Log or store call details as needed
                    console.log(`[${new Date(date).toLocaleString()}] ${callType} from ${from} (${groupName})`);

                    // Check if the caller is an owner
                    const isOwner = settings.ownerNumbers.includes(from);

                    // Reject the call only if not from an owner and rejectCalls is enabled
                    if (!isOwner && settings.rejectCalls) {
                        await sock.rejectCall(id, from);
                        await sock.sendMessage(from, { text: "Sorry, I'm a bot and can't answer calls right now." });
                    }
                } catch (error) {
                    console.error('Error rejecting call:', error);
                }
            });


            // Optional: Send a message to the caller (replace with your actual message)
            // await sock.sendMessage(from, { text: "Sorry, I'm a bot and can't answer calls right now." });
        } catch (error) {
            console.error('Error rejecting call:', error);
        }
    });

}

module.exports = { ownEvent, HacxK };
