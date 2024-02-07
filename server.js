// server.js
import express from 'express';
import pkg from 'body-parser';
import { connect } from 'mqtt';
import {
  connectMongoDB,
  insertTemperatureData,
  getLatestTemperatureData,
} from './mongodb.js';

const { json } = pkg;

const app = express();
const port = 3000;

// MQTT broker settings
const mqttClient = connect('mqtt://172.20.49.51'); // Update with your MQTT broker's address
const mqttTopic = 'esp32/temperature'; // Update with your MQTT topic

// MQTT client setup
mqttClient.on('connect', () => {
  console.log(`Connected to MQTT Broker.`);
  mqttClient.subscribe(mqttTopic, () => {
    console.log(`Subscribed to topic '${mqttTopic}'`);
  });
});

mqttClient.on('message', (topic, message) => {
  const temperature = message.toString();
  console.log(`Received message: ${temperature}`);
  insertTemperatureData(temperature).catch(console.error);
});

// Express setup
app.use(json());

app.get('/temperature', async (req, res) => {
  try {
    const latestTemperature = await getLatestTemperatureData();
    res.send({
      temperature: latestTemperature
        ? latestTemperature.temperature
        : 'No data',
    });
  } catch (err) {
    res.status(500).send('Error retrieving temperature data');
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
  connectMongoDB().catch(console.error);
});
