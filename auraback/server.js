const express = require('express');
const twilio = require('twilio');
require('dotenv').config(); 

const app = express();
const PORT = 5000;

app.use(express.json());

const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID; 
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;   
const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER; 


const client = new twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);

app.post('/api/crisis', (req, res) => {
    const { victimName, coordinates } = req.body;
    
    console.log(` EMERGENCY TRIGGERED BY: ${victimName}! `);

const messageBody = `ALERT! ${victimName} has triggered a crisis mode. Last known location: https://www.google.com/maps?q=${coordinates.replace(/\s+/g, '')}`;    
    client.messages.create({
        body: messageBody,
        from: TWILIO_PHONE_NUMBER,
        to: process.env.EMERGENCY_CONTACT_NUMBER 
    })
    .then(message => {
        console.log(`✉️ SMS successfully sent via Twilio! SID: ${message.sid}`);
        res.status(200).json({ 
            status: "Success", 
            message: "SMS dispatched cleanly to emergency contacts!" 
        });
    })
    .catch(error => {
        console.error(" Twilio failed to send SMS:", error);
        res.status(500).json({ 
            status: "Error", 
            message: "Failed to dispatch SMS text." 
        });
    });
});

app.listen(PORT, () => {
    console.log(` Server is awake and running at http://localhost:${PORT}`);
});