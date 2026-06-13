const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

async function connectLocalDatabase() {
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

connectLocalDatabase();