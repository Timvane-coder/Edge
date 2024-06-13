const express = require('express');
const { startHacxkMDNews } = require('./Utils/Socket')

// Create an Express application
const app = express();
const port = 3000; // Port number

// Define a route handler for the root path
app.get('/', (req, res) => {
    res.send('Status: Working!');
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Internal Server Error');
});

// Start the server
app.listen(port, async () => {
    await startHacxkMDNews()
    console.log(`Server is listening on port ${port}`);
});
