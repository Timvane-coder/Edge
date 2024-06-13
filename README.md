# WhatsAppBotTemplate

A simple and elegant WhatsApp bot written in JavaScript using the Baileys library. This bot can interact with groups, channels, and normal messages. You can easily modify it to suit your needs! 🌟

## Create Your Own WhatsApp Bot

### Setup Instructions

Follow these steps to create and customize your own WhatsApp bot:

1. **Clone the Repository**
   ```bash
   git clone https://github.com/hacxk/WhatsappBotTemplate.git
   ```
2. **Install Dependencies**
   ```bash
   cd WhatsappBotTemplate
   npm install
   ```
3. **Configure the Bot**
   - Open the `config.js` file and add your WhatsApp account details if you want.

4. **Run the Bot**
   ```bash
   node index.js
   ```

### Creating a Command

To create a new command, follow the structure below. Each command is a module that exports an object with specific properties and an `execute` function. ✨

> To create a command, first create a `filename.js` in the Plugins folder.

```javascript
module.exports = {
    usage: ['Hi'], // Command usage trigger
    description: 'Say hello!', // Description of the command
    emoji: '👋', // Emoji associated with the command
    isGroupOnly: false, // Set to true if the command should only work in groups
    isChannelOnly: false, // Set to true if the command should only work in channels
    async execute(sock, m, args) {
        // The function to be executed when the command is called
        await hacxk.reply('Hello! 👋', m);
    }
};
```

### Explanation of Command Properties

- **`usage`**: An array of strings that represent the triggers for this command. In this example, typing "Hi" will trigger the command.
- **`description`**: A brief description of what the command does.
- **`emoji`**: An emoji to visually represent the command.
- **`isGroupOnly`**: A boolean indicating if the command should only work in group chats.
- **`isChannelOnly`**: A boolean indicating if the command should only work in channels.
- **`execute(sock, m, args)`**: The main function that gets executed when the command is called. It takes the following parameters:
  - `sock`: The WhatsApp socket instance.
  - `m`: The message object that triggered the command.
  - `args`: An array of arguments passed to the command.

---

### Sending Messages

You can send different types of messages using the bot. Here are the supported types:

1. **Normal Text Messages**
   ```javascript
   await hacxk.reply(text, m);
   ```
   - `text`: The text message you want to send.
   - `m`: The message you want to reply to.

2. **Image Messages**
   ```javascript
   await hacxk.Image(imageBuffer, m, caption);
   ```
   - `imageBuffer`: The image buffer you want to send.
   - `m`: The message you want to reply to.
   - `caption`: (Optional) A caption for the image.

3. **Audio Messages**
   ```javascript
   await hacxk.Audio(audioBuffer, m);
   ```
   - `audioBuffer`: The audio buffer you want to send.
   - `m`: The message you want to reply to.

---

## Example Commands

Here's an example of a simple "Hello" command to get you started:

```javascript
module.exports = {
    usage: ['Hello'],
    description: 'Greets the user with a friendly message!',
    emoji: '👋',
    isGroupOnly: false,
    isChannelOnly: false,
    async execute(sock, m, args) {
        await hacxk.reply('Hello there! 👋 How can I assist you today?', m);
    }
};
```

This command will reply with "Hello there! 👋 How can I assist you today?" whenever someone types "Hello".

---

## Contributing

Contributions are welcome! If you have ideas to improve this bot, feel free to open an issue or submit a pull request on GitHub.

---

## License

This project is licensed under the MIT License. See the LICENSE file for more details.

---

Stay connected and have fun with your new WhatsApp bot! 🚀💬

![WhatsApp Bot](https://example.com/your-image-link.jpg)

---

### Additional Helper Functions

Below is a utility to handle sending messages and updating presence status. It includes handling for sending text, image, and audio messages.

```javascript
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

async function sendMessageHandle(sock) {
    if (!sock) {
        throw new Error("Socket not provided");
    }

    try {
        if (!global.hacxk) {
            global.hacxk = {
                reply: async (text, m) => {
                    try {
                        if (!m || !m.key) {
                            throw new Error("Message object or key is not available");
                        }
                        if (m.key.remoteJid.endsWith('@newsletter')) {
                            await sock.sendMessage(m.key.remoteJid, { text: text });
                        } else {
                            await sock.readMessages([m.key]);
                            await sock.sendPresenceUpdate('composing', m.key.remoteJid);
                            await delay(500);
                            const message = await sock.sendMessage(m.key.remoteJid, { text: text }, { quoted: m });
                            await sock.sendPresenceUpdate('available', m.key.remoteJid);
                            return message;
                        }
                    } catch (error) {
                        console.error("Failed to send reply:", error);
                        throw error;
                    }
                },

                Image: async (imageBuffer, m, caption) => {
                    try {
                        if (!imageBuffer || !m || !m.key) {
                            throw new Error("Image buffer, message object, or key is not available");
                        }

                        await sock.readMessages([m.key]);
                        await sock.sendPresenceUpdate('composing', m.key.remoteJid);
                        await delay(500);
                        const message = await sock.sendMessage(m.key.remoteJid, { image: imageBuffer, caption: caption }, { quoted: m });
                        await sock.sendPresenceUpdate('available', m.key.remoteJid);
                        return message;
                    } catch (error) {
                        console.error("Failed to send image:", error);
                        throw error;
                    }
                },

                Audio: async (audioBuffer, m) => {
                    try {
                        if (!audioBuffer || !m || !m.key) {
                            throw new Error("Audio buffer, message object, or key is not available");
                        }

                        await sock.readMessages([m.key]);
                        await sock.sendPresenceUpdate('recording', m.key.remoteJid);
                        await delay(500);
                        const message = await sock.sendMessage(m.key.remoteJid, { audio: audioBuffer, mimetype: 'audio/mp4' }, { quoted: m });
                        await sock.sendPresenceUpdate('available', m.key.remoteJid);
                        return message;
                    } catch (error) {
                        console.error("Failed to send audio:", error);
                        throw error;
                    }
                }
            };
        }
    } catch (error) {
        console.error("Error initializing global send object:", error);
        throw error;
    }
}

module.exports = { sendMessageHandle };
```
