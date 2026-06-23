require('dotenv').config();
const express = require('express');
const twilio = require('twilio');
const mongoose = require('mongoose');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { GoogleGenAI } = require('@google/genai');

const Incident = require('./models/Incident'); 

const app = express();
const PORT = 5000;
app.use(cors());
app.use(express.json());

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

if (!fs.existsSync('./uploads')) {
    fs.mkdirSync('./uploads');
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/'),
    filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage: storage });

const RecommendationSchema = new mongoose.Schema({
    sourceType: { type: String, enum: ['upload', 'calendar'], required: true },
    inputData: { type: String, required: true }, 
    suggestedOutfit: { type: String, required: true },
    suggestedAccessory: { type: String, required: true },
    matchReason: { type: String, required: true },
    timestamp: { type: Date, default: Date.now }
});
const Recommendation = mongoose.model('Recommendation', RecommendationSchema);

async function bootLocalDatabaseEngine() {
 try {
    const permanentConnectionString = 'mongodb://127.0.0.1:27017/AuraLink';

    await mongoose.connect(permanentConnectionString);
    
    console.log("PERMANENT LOCAL MONGODB CONNECTED SUCCESSFULLY!");
    console.log(`Target Database Instance: AuraLink`);
  } catch (error) {
    console.error(" Permanent database connection failed to initialize:", error);
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

        const messageBody = ` EMERGENCY ALERT \n\nAura Smart Ring has detected a distress trigger! Please open your security dashboard console immediately to monitor live telemetry tracking.`;

        await client.messages.create({
            body: messageBody,
            from: process.env.TWILIO_PHONE_NUMBER,
            to: process.env.EMERGENCY_CONTACT_NUMBER
        });

        res.status(200).json({ 
            success: true, 
            message: "Incident created and SMS dispatched!",
            databaseId: newIncident._id,
            _id: newIncident._id,
            id: newIncident._id
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
        { $push: { coordinates: coordinates } },
        { new: true }
    );

    if (!updatedIncident) {
        return res.status(404).json({ success: false, message: "Incident record not found" });
    }

    console.log(`RING TELEMETRY RECOVERY: ID ${id} added step [${coordinates}] to path.`);
    res.status(200).json({ success: true, updatedIncident });
 }
  catch (error) {
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

app.post('/api/stylist/sync-calendar', async (req, res) => {
    try {
        const { eventTitle } = req.body;
        if (!eventTitle) {
            return res.status(400).json({ success: false, message: "No calendar event title provided." });
        }

        const aiPrompt = `
            You are a luxury fashion consultant and AI Stylist for a premium smart ring platform.
            Analyze the following calendar event: "${eventTitle}".
            
            Based on the event context, determine the best style profile. Choose exactly ONE of these three smart ring models to recommend:
            1. "Temple Gold Occasion Ring" (Best for heavy traditional, ethnic, festive, or cultural outfits)
            2. "Heritage Glow Band" (Best for sleek formal suits, black-tie galas, corporate meetings, or luxury dinners)
            3. "Aura Cyan Minimalist Ring" (Best for casual, high-tech street style, daily wear, or athletic activities)

            You must respond with a raw JSON object containing exactly these keys:
            {
                "suggestedOutfit": "A highly specific descriptive outfit recommendation",
                "suggestedAccessory": "The exact name of the selected smart ring",
                "matchReason": "A clear, professionally styled 2-sentence explanation of why this outfit and ring match the event vibe"
            }
            Do not include markdown blocks like \`\`\`json or extra conversational text. Return only the raw JSON.
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: aiPrompt,
        });

        const aiResult = JSON.parse(response.text.trim());

        const newRec = new Recommendation({
            sourceType: 'calendar',
            inputData: eventTitle,
            suggestedOutfit: aiResult.suggestedOutfit,
            suggestedAccessory: aiResult.suggestedAccessory,
            matchReason: aiResult.matchReason
        });
        await newRec.save();

        res.status(200).json({ success: true, data: newRec });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.post('/api/stylist/sync-mock-calendar', async (req, res) => {
    try {
        const mockUserCalendar = [
            { summary: "Executive Quarterly Networking Dinner" },
            { summary: "Attending Traditional Cousin's Mehendi Ceremony" },
            { summary: "Going to a Close Friend's Birthday Party Bash" }
        ];

        const currentEvent = mockUserCalendar[Math.floor(Math.random() * mockUserCalendar.length)];
        const eventTitle = currentEvent.summary;

        const aiPrompt = `
            You are a luxury fashion consultant and AI Stylist for a premium smart ring platform.
            Analyze the following calendar event: "${eventTitle}".
            
            Based on the event context, determine the best style profile. Choose exactly ONE of these three smart ring models to recommend:
            1. "Temple Gold Occasion Ring" (Best for heavy traditional, ethnic, festive, or cultural outfits)
            2. "Heritage Glow Band" (Best for sleek formal suits, black-tie galas, corporate meetings, or luxury dinners)
            3. "Aura Cyan Minimalist Ring" (Best for casual, high-tech street style, daily wear, or athletic activities)

            You must respond with a raw JSON object containing exactly these keys:
            {
                "suggestedOutfit": "A highly specific descriptive outfit recommendation",
                "suggestedAccessory": "The exact name of the selected smart ring",
                "matchReason": "A clear, professionally styled 2-sentence explanation of why this outfit and ring match the event vibe"
            }
            Do not include markdown blocks like \`\`\`json or extra conversational text. Return only the raw JSON.
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: aiPrompt,
        });

        const aiResult = JSON.parse(response.text.trim());

        const newRec = new Recommendation({
            sourceType: 'calendar',
            inputData: `Auto-Synced Event: ${eventTitle}`,
            suggestedOutfit: aiResult.suggestedOutfit,
            suggestedAccessory: aiResult.suggestedAccessory,
            matchReason: aiResult.matchReason
        });
        await newRec.save();

        res.status(200).json({ success: true, detectedEvent: eventTitle, data: newRec });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.get('/api/stylist/recommendations', async (req, res) => {
    try {
        const history = await Recommendation.find().sort({ timestamp: -1 });
        res.status(200).json({ success: true, count: history.length, data: history });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.post('/api/stylist/upload', upload.single('outfitImage'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: "No outfit image file detected." });
        }

        const imagePath = req.file.path;
        const imageBuffer = fs.readFileSync(imagePath);
        
        const imagePart = {
            inlineData: {
                data: imageBuffer.toString("base64"),
                mimeType: req.file.mimetype
            },
        };

        const aiPrompt = `
            You are an elite AI fashion stylist looking at an image of a piece of clothing uploaded by the user.
            Analyze the style, colors, texture, and formality of the clothing item provided in this image.
            
            Recommend a complete matching outfit combination that builds around this specific clothing piece.
            Then, determine the best situational profile and select exactly ONE smart ring mode to pair with it:
            1. "Temple Gold Occasion Ring" (Best if the uploaded clothing is traditional, ethnic, festive, or cultural)
            2. "Heritage Glow Band" (Best if the uploaded clothing is sleek formal, suits, black-tie, corporate, or luxury evening wear)
            3. "Aura Cyan Minimalist Ring" (Best if the uploaded clothing is casual, high-tech techwear, sportswear, or everyday outfits)

            You must respond with a raw JSON object containing exactly these keys:
            {
                "suggestedOutfit": "A highly specific descriptive outfit combination that integrates the uploaded item",
                "suggestedAccessory": "The exact name of the selected smart ring",
                "matchReason": "A clear, professional 2-sentence explanation of why this ring mode and combo elevates the visual style seen in the image"
            }
            Do not include markdown blocks like \`\`\`json or extra text. Return only raw JSON.
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: [imagePart, aiPrompt],
        });

        const aiResult = JSON.parse(response.text.trim());

        const newRec = new Recommendation({
            sourceType: 'upload',
            inputData: `Uploaded Image File: ${req.file.originalname}`,
            suggestedOutfit: aiResult.suggestedOutfit,
            suggestedAccessory: aiResult.suggestedAccessory,
            matchReason: aiResult.matchReason
        });
        await newRec.save();

        res.status(200).json({ success: true, data: newRec });

    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.listen(PORT, () => console.log(`Server is awake and running at http://localhost:5000`));