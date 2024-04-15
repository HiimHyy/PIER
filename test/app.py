import paho.mqtt.client as mqtt
import time
import random
import json
import socket

# MQTT settings
ip = socket.gethostbyname(socket.gethostname())
mqtt_server = ip
mqtt_topic = "esp32/temperature"
client_id = "ESP32_Simulator"

# Simulated temperature range
min_temp = 20
max_temp = 30

# Measurements buffer for calculating the average
measurements = []


def on_connect(client, userdata, flags, rc):
    if rc == 0:
        print("Connected to MQTT Broker!")
    else:
        print(f"Failed to connect, return code {rc}\n")


# Create MQTT client and connect to the server
client = mqtt.Client(client_id)
client.on_connect = on_connect
client.connect(mqtt_server)

client.loop_start()


def calculate_average(measurements):
    # Calculate the average temperature from the measurements buffer
    return sum(measurements) / len(measurements) if measurements else 0


try:
    while True:
        # Simulate reading temperature
        simulated_temperature = random.uniform(min_temp, max_temp)

        # Add the simulated temperature to the measurements buffer
        measurements.append(simulated_temperature)
        # Limit the buffer to the most recent 5 measurements for average calculation
        if len(measurements) > 5:
            measurements.pop(0)

        # Calculate the average temperature from the buffer
        average_temp = calculate_average(measurements)

        # Prepare and publish the data payload as a JSON string
        payload = json.dumps(
            {
                "temperature": round(simulated_temperature, 2),
                "average": round(average_temp, 2),
            }
        )

        client.publish(mqtt_topic, payload)
        print(f"Published to {mqtt_topic}: {payload}")

        # Wait before generating and sending the next value
        time.sleep(10)

except KeyboardInterrupt:
    print("Simulation stopped by user")
    client.loop_stop()
