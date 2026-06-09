const express = require('express');
const app = express();
const PORT = 5000;

app.use(express.json());

// Your first API endpoint
app.post('/api/crisis', (req, res) => {
    const dataFromFrontend = req.body;
    
    console.log(" EMERGENCY TRIGGER RECEIVED ON THE SERVER! ");
    console.log("Data details:", dataFromFrontend);

    res.status(200).json({ 
        status: "Success", 
        message: "Server caught the emergency! Twilio logic will go here next." 
    });
});

app.listen(PORT, () => {
    console.log(`Server is awake and running at http://localhost:${PORT}`);
});