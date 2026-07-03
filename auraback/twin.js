const axios = require('axios');

const ACTIVE_INCIDENT_ID = "6a3d308d0360d97c9ea3035d"; 
const BACKEND_URL = `http://localhost:5000/api/crisis/${ACTIVE_INCIDENT_ID}/location`;

const simulatedWalkingRoute = [
    "12.9716,79.1594",
    "12.9725,79.1605",
    "12.9735,79.1615",
    "12.9742,79.1628"
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