const axios = require('axios');

const ACTIVE_INCIDENT_ID = "6a32edf9834be282931a5193"; 
const BACKEND_URL = `http://localhost:5000/api/crisis/${ACTIVE_INCIDENT_ID}/location`;

const simulatedWalkingRoute = [
    "19.0600,72.8300",
    "19.0615,72.8315",
    "19.0630,72.8333",
    "19.0645,72.8348",
    "19.0660,72.8362",
    "19.0675,72.8379"
];

let currentStep = 0;

console.log
console.log(" AURA SMART RING: AUTOMATED DIGITAL TWIN ACTIVE");

const trackingInterval = setInterval(async () => {
    if (currentStep < simulatedWalkingRoute.length) {
        const currentCoordinates = simulatedWalkingRoute[currentStep];
        
        try {
            await axios.patch(BACKEND_URL, { coordinates: currentCoordinates });
            console.log(` [TELEMETRY SENT] Step ${currentStep + 1}/${simulatedWalkingRoute.length} -> [${currentCoordinates}]`);
            currentStep++;
        } catch (error) {
            console.error(" Telemetry transmission failed:", error.message);
        }
    } else {
        console.log(" SIMULATION COMPLETE: User has stopped moving.");
        clearInterval(trackingInterval);
        process.exit();
    }
}, 3000);