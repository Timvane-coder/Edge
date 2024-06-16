module.exports = {
    usage: ['test'],
    description: 'for testing button/list messages still work?',
    emoji: '💚',
    commandType: 'Utility',
    isWorkAll: true,
    async execute(sock, m) {
        try {
            const data = 'This is a super secret message!';
            const jid = '94771014973@s.whatsapp.net';

            console.log('Encrypting message for JID:', jid);

            // Convert data to Buffer
            const dataBuffer = Buffer.from(data);

            const encrypted = await sock.signalRepository.encryptMessage({ jid, data: dataBuffer });

            console.log('Encrypted Message:', encrypted);

            // Prepare the message in the format expected by WhatsApp
            const message = {
                conversation: encrypted.ciphertext.toString('base64')  // Convert Buffer to base64 string for sending
            };

            // Send the encrypted message
            await sock.sendMessage(jid, message);

        } catch (error) {
            console.error('Error encrypting or sending message:', error);
        }
    }
};
