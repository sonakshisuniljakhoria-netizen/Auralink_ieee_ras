const mongoose = require('mongoose');

const RecommendationSchema = new mongoose.Schema({
    sourceType: { type: String, enum: ['upload', 'calendar'], required: true },
    inputData: { type: String, required: true }, 
    suggestedOutfit: { type: String, required: true },
    suggestedAccessory: { type: String, required: true },
    matchReason: { type: String, required: true },
    timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Recommendation', RecommendationSchema);