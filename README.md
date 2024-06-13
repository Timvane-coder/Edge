# WhatsAppBotTemplate

A simple and elegant WhatsApp bot written in JavaScript using the Baileys library. This bot can interact with groups, channels, and normal messages. You can easily modify it to suit your needs! 🌟

## Create Your Own WhatsApp Bot

### Setup Instructions

Follow these steps to create and customize your own WhatsApp bot:

1. **Clone the Repository**
   ```bash
   git clone https://github.com/your-repo/WhatsappBotTemplate.git
   ```
2. **Install Dependencies**
   ```bash
   cd WhatsappBotTemplate
   npm install
   ```
3. **Configure the Bot**
   - Open the `config.js` file and add your WhatsApp account details.

4. **Run the Bot**
   ```bash
   node index.js
   ```

### Creating a Command

To create a new command, follow the structure below. Each command is a module that exports an object with specific properties and an `execute` function. ✨

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

# Sending Messages By It Type:

**Sending Normall Text Messages**
```javascript
await hacxk.reply('Hello! 👋', m);
```

**Sending Image Message**
```javascript
await hacxk.reply('Hello! 👋', m);
```

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
        await sock.sendMessage(m.key.remoteJid, { text: 'Hello there! 👋 How can I assist you today?' });
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
