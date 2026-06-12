const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        // Reads your secret connection string from the .env file
        await mongoose.connect(process.env.MONGO_URI);
        console.log('🍃 MongoDB Atlas Cloud Connected Successfully!');
    } catch (error) {
        console.error('❌ Database connection failed:', error.message);
        process.exit(1); // Stop the server if the database fails to connect
    }
};

module.exports = connectDB;