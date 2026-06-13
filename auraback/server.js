require('dotenv').config();
const express = require('express');
const twilio = require('twilio');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

const Incident = require('./models/Incident'); 

const app = express();
const PORT = 5000;

app.use(express.json());

async function bootLocalDatabaseEngine() {
  try {
    const mongoServer = await MongoMemoryServer.create();
    const localUri = mongoServer.getUri();

    await mongoose.connect(localUri, {
      dbName: "AuraLink"
    });
    
    console.log(" GENUINE LOCAL MONGODB ENGINE CONNECTED SUCCESSFULLY!");
    console.log(`Copy this link for Compass: ${localUri}AuraLink`);
  } catch (error) {
    console.error(" Local database failed to boot up:", error);
  }
}
bootLocalDatabaseEngine();

const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

app.post('/api/crisis', async (req, res) => {
    const { victimName, coordinates } = req.body;

    try {
        const newIncident = new Incident({
            victimName,
            coordinates
        });
        await newIncident.save(); 
        console.log(` ALERT START: Incident created for ${victimName} (ID: ${newIncident._id})`);

        const messageBody =  'EMERGENCY ALERT \n\nAura Smart Ring has detected a distress trigger! Please open your security dashboard console immediately to monitor live telemetry tracking.`;

        await client.messages.create({
            body: messageBody,
            from: process.env.TWILIO_PHONE_NUMBER,
            to: process.env.EMERGENCY_CONTACT_NUMBER
        });

        res.status(200).json({ 
            success: true, 
            message: "Incident created and SMS dispatched!",
            databaseId: newIncident._id 
        });

    } catch (error) {
        console.error("POST Pipeline Error:", error);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.patch('/api/crisis/:id/location', async (req, res) => {
    const { id } = req.params;
    const { coordinates } = req.body;

    try {
        const updatedIncident = await Incident.findByIdAndUpdate(
            id,
            { coordinates },
            { new: true }
        );

        if (!updatedIncident) {
            return res.status(404).json({ success: false, message: "Incident record not found" });
        }

        console.log(`📡 RING TELEMETRY RECOVERY: ID ${id} location updated to [${coordinates}]`);
        res.status(200).json({ success: true, updatedIncident });

    } catch (error) {
        console.error("PATCH Pipeline Error:", error);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.get('/api/crisis/:id', async (req, res) => {
    try {
        const incident = await Incident.findById(req.params.id);
        if (!incident) {
            return res.status(404).json({ success: false, message: "Incident record not found" });
        }
        res.status(200).json({ success: true, coordinates: incident.coordinates });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.listen(PORT, () => console.log(`Server is awake and running at http://localhost:5000`));