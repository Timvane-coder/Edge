const express = require('express');
const { startHacxkMDNews } = require('./Utils/Socket');

const app = express();
const port = process.env.PORT || 3000; // Use environment variable for port if available

// Middleware for parsing JSON and URL-encoded data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Define your other routes here (e.g., API endpoints, etc.)

app.get('/', (req, res) => {
    res.send('Status: Working!');
});

// Error handling (move this to the end of your middleware stack)
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Internal Server Error');
});

// Start the server
(async () => {  // Wrap in an immediately invoked async function
    try {
        await startHacxkMDNews();
        app.listen(port, () => {
            console.log(`Server is listening on port ${port}`);
        });
    } catch (err) {
        console.error('Error starting server:', err);
    }
})();
