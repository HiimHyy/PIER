import { MongoMemoryServer } from 'mongodb-memory-server';
import { MongoClient } from 'mongodb';

let mongoServer;
const dbName = 'weatherStation';
const collectionName = 'temperatureData';

let db, temperatureCollection;

export const connectMongoDB = async () => {
  try {
    // Start MongoDB Memory Server
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();

    console.log('MongoDB Memory Server URI:', mongoUri);

    // Connect to the in-memory database
    const client = await MongoClient.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    db = client.db(dbName);
    temperatureCollection = db.collection(collectionName);
    console.log('Connected to MongoDB Memory Server');
  } catch (err) {
    console.error('Failed to connect to MongoDB Memory Server', err);
  }
};

export const insertTemperatureData = async (temperature) => {
  if (!temperatureCollection) {
    console.log('Database not connected');
    return;
  }
  try {
    await temperatureCollection.insertOne({
      temperature,
      timestamp: new Date(),
    });
    console.log('Temperature data inserted');
  } catch (err) {
    console.error('Error inserting temperature data', err);
  }
};

export const getLatestTemperatureData = async () => {
  try {
    return await temperatureCollection.findOne({}, { sort: { timestamp: -1 } });
  } catch (err) {
    console.error('Error retrieving temperature data', err);
    throw err; // Rethrow to handle in the calling function
  }
};

// Optionally, you might want to export a function to stop the MongoDB Memory Server
export const disconnectMongoDB = async () => {
  if (mongoServer) {
    await mongoServer.stop();
  }
};
