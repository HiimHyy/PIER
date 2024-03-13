import express from 'express';
import { connect } from 'mqtt';
import cors from 'cors';
import {
  connectMongoDB,
  insertTemperatureData,
  getTemperatureRecords, // Adjusted to use the new function
} from './mongodb.js';
import ip from 'ip';

const app = express();
const port = 3000;
const mqttBrokerIp = ip.address();

app.use(cors());
app.use(express.json());

// MQTT broker settings
const mqttClient = connect(`mqtt://${mqttBrokerIp}`);
const mqttTopic = 'esp32/temperature'; // Ensure this matches your topic

mqttClient.on('connect', () => {
  console.log('Connected to MQTT Broker.');
  mqttClient.subscribe(mqttTopic, () => {
    console.log(`Subscribed to topic '${mqttTopic}'`);
  });
});

mqttClient.on('message', (topic, message) => {
  try {
    const data = JSON.parse(message.toString());
    const temperature = data.temperature;
    const average = data.average; // Ensure these match the data structure sent by your device
    console.log(`Received temperature: ${temperature}, Average: ${average}`);
    insertTemperatureData({ temperature, average }).catch(console.error); // Adjust based on your actual data structure
  } catch (error) {
    console.error('Error processing MQTT message:', error);
  }
});

// Connect to MongoDB upon server start
connectMongoDB().catch(console.error);

// Adjusted to serve multiple temperature records
app.get('/temperature', async (req, res) => {
  try {
    // Here we call the getTemperatureRecords() which we assumed to implement in mongodb.js
    const records = await getTemperatureRecords(); // Consider adding query parameters to customize the query
    res.json(records); // Send an array of records to the client
  } catch (err) {
    console.error('Error retrieving temperature data:', err);
    res.status(500).send('Error retrieving temperature data');
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
