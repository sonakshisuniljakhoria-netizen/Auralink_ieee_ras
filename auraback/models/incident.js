const mongoose = require('mongoose');

const IncidentSchema = new mongoose.Schema({
    victimName: {
        type: String,
        required: true
    },
    coordinates: {
        type: String,
        required: true
    },
    status: {
        type: String,
        default: 'Active/Dispatched'
    },
    timestamp: {
        type: Date,
        default: Date.now // Automatically logs the exact second the alert happened
    }
});

module.exports = mongoose.model('Incident', IncidentSchema);