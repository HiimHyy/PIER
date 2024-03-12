import { MongoClient } from 'mongodb';

const dbName = 'weatherStation';
const collectionName = 'temperatureData';

let db, temperatureCollection;

export const connectMongoDB = async () => {
  try {
    const mongoUri = 'mongodb://mongoadmin:secret@localhost:27017';
    console.log('Connecting to MongoDB at URI:', mongoUri);

    const client = new MongoClient(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    await client.connect();
    db = client.db(dbName);
    temperatureCollection = db.collection(collectionName);

    console.log('Connected to MongoDB');
  } catch (err) {
    console.error('Failed to connect to MongoDB', err);
  }
};

export const insertTemperatureData = async ({ temperature, average }) => {
  if (!temperatureCollection) {
    console.error('Database not connected');
    return;
  }
  try {
    await temperatureCollection.insertOne({
      temperature,
      average, // Assuming you also want to store the average
      timestamp: new Date(),
    });
    console.log('Temperature data inserted');
  } catch (err) {
    console.error('Error inserting temperature data', err);
  }
};

// Function to retrieve multiple temperature records
export const getTemperatureRecords = async (limit = 10) => {
  // Optionally add a limit parameter
  if (!temperatureCollection) {
    console.error('Database not connected');
    return [];
  }
  try {
    return await temperatureCollection
      .find({})
      .sort({ timestamp: -1 })
      .limit(limit)
      .toArray();
  } catch (err) {
    console.error('Error retrieving temperature records', err);
    return []; // Return an empty array on error to simplify client handling
  }
};

export const getLatestTemperatureData = async () => {
  if (!temperatureCollection) {
    console.error('Database not connected');
    return null;
  }
  try {
    return await temperatureCollection.findOne({}, { sort: { timestamp: -1 } });
  } catch (err) {
    console.error('Error retrieving latest temperature data', err);
    return null; // Return null to indicate no data
  }
};

export const disconnectMongoDB = async () => {
  if (db) {
    await db.client.close();
    console.log('Disconnected from MongoDB');
  }
};
