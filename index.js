const express = require('express');
const http = require('http'); // Import the 'http' module
const socketIo = require('socket.io');
const { startHacxkMDNews } = require('./Utils/Socket');

const app = express();
const server = http.createServer(app); // Create an HTTP server
const io = socketIo(server);             // Attach Socket.IO to the server
const port = process.env.PORT || 3000;

// Middleware for parsing JSON and URL-encoded data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Define your other routes here (e.g., API endpoints, etc.)

app.get("/", (req, res) => {
    res.sendFile("./Public/index.html", {
        root: __dirname,
    });
});

// Error handling (move this to the end of your middleware stack)
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Internal Server Error');
});



// Socket.IO Event Handling
io.on('connection', (socket) => {
    console.log('A user connected');
    socket.on('disconnect', () => {
        console.log('User disconnected');
    });
});

// Start the server
(async () => {  // Wrap in an immediately invoked async function
    try {
        await startHacxkMDNews(io);
        app.listen(port, () => {
            console.log(`Server is listening on port ${port}`);
        });
    } catch (err) {
        console.error('Error starting server:', err);
    }
})();
