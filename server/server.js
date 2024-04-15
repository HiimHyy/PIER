import express from 'express';
import { connect } from 'mqtt';
import cors from 'cors';
import {
  connectMongoDB,
  insertTemperatureData,
  getTemperatureRecords,
  deleteAllTemperatureData,
} from './mongodb.js';
import ip from 'ip';

const app = express();
const port = 3000;
const mqttBrokerIp = ip.address();

app.use(cors());
app.use(express.json());

// MQTT broker settings
const mqttClient = connect(`mqtt://${mqttBrokerIp}`);
const mqttTopic = 'esp32/temperature';

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
    const average = data.average;
    console.log(`Received temperature: ${temperature}, Average: ${average}`);
    insertTemperatureData({ temperature, average }).catch(console.error);
  } catch (error) {
    console.error('Error processing MQTT message:', error);
  }
});

connectMongoDB().catch(console.error);

app.get('/temperature', async (req, res) => {
  try {
    const records = await getTemperatureRecords();
    res.json(records);
  } catch (err) {
    console.error('Error retrieving temperature data:', err);
    res.status(500).send('Error retrieving temperature data');
  }
});

app.delete('/temperature', async (req, res) => {
  try {
    await deleteAllTemperatureData();
    res.status(200).send('All temperature records deleted');
  } catch (err) {
    console.error('Error deleting temperature records:', err);
    res.status(500).send('Error deleting temperature records');
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
