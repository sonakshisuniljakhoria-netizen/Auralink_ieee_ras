require('dotenv').config();
const express = require('express');
const twilio = require('twilio');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const Incident = require('./models/Incident'); 

const app = express();
const PORT = 5000;

async function bootLocalDatabaseEngine() {
  try {
    const mongoServer = await MongoMemoryServer.create();
    const localUri = mongoServer.getUri();

    await mongoose.connect(localUri, {
      dbName: "AuraLink"
    });
    
    console.log("🟢 GENUINE LOCAL MONGODB ENGINE CONNECTED SUCCESSFULLY!");
    console.log(`📌 Copy this link for Compass: ${localUri}AuraLink`);
  } catch (error) {
    console.error("❌ Local database failed to boot up:", error);
  }
}

bootLocalDatabaseEngine();

app.use(express.json());

const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

app.post('/api/crisis', async (req, res) => {
    const { victimName, coordinates } = req.body;

    try {
        const newIncident = new Incident({
            victimName,
            coordinates
        });
        await newIncident.save(); 
        console.log(`📝 Incident permanently logged in MongoDB for: ${victimName}`);

        const mapsUrl = `https://maps.google.com/?q=${coordinates}`;
        const messageBody = `🚨 EMERGENCY ALERT \n\n${victimName} is in danger! Live Campus Tracking Link: ${mapsUrl}`;

        await client.messages.create({
            body: messageBody,
            from: process.env.TWILIO_PHONE_NUMBER,
            to: process.env.EMERGENCY_CONTACT_NUMBER
        });

        res.status(200).json({ 
            success: true, 
            message: "Incident logged and SMS dispatched successfully!",
            databaseId: newIncident._id 
        });

    } catch (error) {
        console.error("Pipeline Error:", error);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.listen(PORT, () => console.log(`Server is awake and running at http://localhost:5000`));