
# 🤖 WhatsAppBotTemplate

A simple and elegant WhatsApp bot written in JavaScript using the Baileys library. This bot can interact with groups, channels, and normal messages. Customize it to your heart's content! 🌟✨

## 🚀 Create Your Own WhatsApp Bot

---

> [!CAUTION]
>
> First You Need to Install [NodeJS](https://nodejs.org/en) in your bot building environment.

---

### 🛠️ Setup Instructions

Follow these magical steps to create and customize your very own WhatsApp bot:

1. **🧙‍♂️ Clone the Repository**
   ```bash
   git clone https://github.com/hacxk/WhatsappBotTemplate.git
   ```

2. **📦 Install Dependencies**
   ```bash
   cd WhatsappBotTemplate
   npm install
   ```

3. **⚙️ Configure the Bot**
   - Open the `config.js` file and add your WhatsApp account details if needed.

4. **🎉 Run the Bot**
   ```bash
   node index.js
   ```

### 🔮 Creating a Command

> [!NOTE]
>
> If you want more help join our whatsapp channel [HACXK MD 🙋‍♂️](https://whatsapp.com/channel/0029Vahkcya1SWt1EzYAg43I).

To create a new command, follow this enchanting structure. Each command is a module that exports an object with specific properties and an `execute` function. ✨

> 📝 To create a command, first create a `filename.js` in the Plugins folder.

> [!NOTE]
>
> Don't Need to Restart Whole NodeJS Process When Make Changes in Plugin Folder Commands (!Only Works New Update).

```javascript
module.exports = {
    usage: ['Hi'], // 🎯 Command usage trigger
    description: 'Say hello!', // 📜 Description of the command
    emoji: '👋', // 🎨 Emoji associated with the command
    isGroupOnly: false, // 👥 Set to true if the command should only work in groups
    isChannelOnly: false, // 📢 Set to true if the command should only work in channels
    isWorkAll: true, // 🌍 Set to true if the command should work all type
    async execute(sock, m, args) {
        // 🧠 The function to be executed when the command is called
        await hacxk.reply('Hello! 👋', m);
    }
};
```

### 🔍 Explanation of Command Properties

- **`usage`**: 🎯 An array of strings that represent the triggers for this command.
- **`description`**: 📜 A brief description of what the command does.
- **`emoji`**: 🎨 An emoji to visually represent the command.
- **`isGroupOnly`**: 👥 A boolean indicating if the command should only work in group chats.
- **`isChannelOnly`**: 📢 A boolean indicating if the command should only work in channels.
- **`isWorkAll`**:👥 A boolean indicating if the command work in all mode (private/group/channels)
- **`execute(sock, m, args)`**: The main function that gets executed when the command is called. It takes the following parameters:
  - `sock`: The WhatsApp socket instance.
  - `m`: The message object that triggered the command.
  - `args`: An array of arguments passed to the command.

---

### 💬 Sending Messages

You can send different types of messages using the bot. Here are the supported types:

1. **📝 Normal Text Messages**
   ```javascript
   await hacxk.reply(text, m);
   ```

      - `text`: The text message you want to send.
   - `m`: The message you want to reply to.

2. **😄 React to Messages**
   ```javascript
   await hacxk.react(emoji, m);
   ```

     - `emoji`: The emoji reaction.
   - `m`: The message you want to react to.

3. **🖼️ Image Messages**
   ```javascript
   await hacxk.Image(imageBuffer, m, caption);
   ```

      - `imageBuffer`: The image buffer you want to send.
   - `m`: The message you want to reply to.
   - `caption`: (Optional) A caption for the image.

4. **🎵 Audio Messages**
   ```javascript
   await hacxk.Audio(audioBuffer, m);
   ```

      - `audioBuffer`: The audio buffer you want to send.
   - `m`: The message you want to reply to.

---

# ✨ Event Listener: Your Baileys Bot ✨

🚀 This module lets you listen for specific events and react with custom actions.

🎉 **Why Use Event Listeners?**

* 🎯 **Precision:** Respond only to the events you care about.
* ⚡️ **Efficiency:** Your bot doesn't have to constantly check for things.
* 🧠 **Flexibility:** Build complex interactions and workflows.

# 📖 Event Handling with HacxK

Welcome to the HacxK event handling guide! This guide will walk you through the process of setting up and using event listeners in your bot using the `HacxK` event emitter.

## 💡 How It Works

1. **Import HacxK:**  
   The `HacxK` object is your gateway to event handling.
   ```javascript
   const { HacxK } = require('../Lib/EventsHandle/EventsHandle'); // Import the HacxK event emitter
   ```

2. **Choose Your Event:**  
   We'll focus on the `hacxk.messages` event, which triggers when a new message is received.
   ```javascript
   HacxK.on('hacxk.messages', listener);
   ```

3. **Create a Listener:**  
   Write a function to define how your bot should react when the event occurs.
   ```javascript
   // Example Function! You Can Also Write Your Own Function/Logic
   // 👂 Listen for "Hello!" replies only once
   const listener = async (message) => {
       if (message.message && message.message.conversation && message.message.conversation.toLowerCase() === 'hello!') {
           await sock.sendMessage(message.key.remoteJid, { text: 'Yo! How can I help you?' }, { quoted: message });
           HacxK.off('hacxk.messages', listener); // Stop listening after responding
       }
   };

   HacxK.on('hacxk.messages', listener);
   ```

4. **Attach the Listener:**  
   Use `HacxK.on` to connect your function to the event.
   ```javascript
   HacxK.on('hacxk.messages', listener);
   ```

5. **(Optional) Remove the Listener:**  
   For one-time actions, use `HacxK.off` to stop listening after you've reacted.
   ```javascript
   HacxK.off('hacxk.messages', listener); // Stop listening after responding
   ```
`

## 🛠️ Example: A Friendly Greeting Bot

```javascript
const { HacxK } = require('../Lib/EventsHandle/EventsHandle');

module.exports = {
    usage: ['Hi', 'Hello'],
    description: 'Say hello!',
    emoji: '👋',
    isGroupOnly: true,
    isChannelOnly: true,
    isWorkAll: false,
    async execute(sock, m, args) {
        await sock.sendMessage(m.key.remoteJid, { text: 'Hello! 👋' }, { quoted: m });

        // Listen for specific messages once and then stop listening
        const listener = async (message) => {
            if (message.message && message.message.conversation && message.message.conversation.toLowerCase() === 'Hello!') {
                await sock.sendMessage(message.key.remoteJid, { text: 'Yo How Can I Help! You.' }, { quoted: message });
                HacxK.off('hacxk.messages', listener); // Remove the listener
            }
        };

        HacxK.on('hacxk.messages', listener);
    }
};

```

---

## 💡 Example Commands

Here's an example of a simple "Hello" command to get you started:

```javascript
const { HacxK } = require('../Lib/EventsHandle/EventsHandle');

module.exports = {
    usage: ['Hi', 'Hello'],
    description: 'Say hello!',
    emoji: '👋',
    isGroupOnly: true,
    isChannelOnly: true,
    isWorkAll: false,
    async execute(sock, m, args) {
        await sock.sendMessage(m.key.remoteJid, { text: 'Hello! 👋' }, { quoted: m });

        // Listen for specific messages once and then stop listening
        const listener = async (message) => {
            if (message.message && message.message.conversation && message.message.conversation.toLowerCase() === 'Hello!') {
                await sock.sendMessage(message.key.remoteJid, { text: 'Yo How Can I Help! You.' }, { quoted: message });
                HacxK.off('hacxk.messages', listener); // Remove the listener
            }
        };

        HacxK.on('hacxk.messages', listener);
    }
};

```

This command will reply with "Hello there! 👋 How can I assist you today?" whenever someone types "Hello".

---

## 🤝 Contributing

Contributions are welcome! If you have ideas to improve this bot, feel free to open an issue or submit a pull request on GitHub. 

---

## 📄 License

This project is licensed under the MIT License. See the LICENSE file for more details.

---

Stay connected and have fun with your new WhatsApp bot! 🚀💬

![WhatsApp Bot](https://example.com/your-image-link.jpg)

---

### 🛠️ Additional Helper Functions

Below is a utility to handle sending messages and updating presence status. It includes handling for sending text, image, audio, and reaction messages.

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

                react: async (emoji, m) => {
                    try {
                        if (!m || !m.key || !emoji) {
                            throw new Error("Message object or key or Emoji is not available");
                        }
                        await sock.readMessages([m.key]);
                        await sock.sendPresenceUpdate('composing', m.key.remoteJid);
                        await delay(500);
                        const message = await sock.sendMessage(m.key.remoteJid, { react: { text: emoji, key: m.key } });
                        await sock.sendPresenceUpdate('available', m.key.remoteJid);
                        return message;
                    } catch (error) {
                        console.error("Failed to send Reaction:", error);
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

---

## 🌟 Features

- 🔌 Easy to set up and use
- 🛠️ Highly customizable
- 👥 Works in groups, channels, and private chats
- 🖼️ Supports text, image, and audio messages
- 😄 React to messages with emojis
- 🚀 Extendable command system

---

## 📚 Documentation

For more detailed information on how to use and extend this bot, check out our [Wiki](https://github.com/hacxk/WhatsappBotTemplate/wiki).

---

## 🐛 Bug Reports

Found a bug? Please report it in the [Issues](https://github.com/hacxk/WhatsappBotTemplate/issues) section of our GitHub repository.

---

## 💖 Support the Project

If you find this project helpful, consider giving it a star ⭐ on GitHub!

---

Happy Botting! 🤖💬✨
