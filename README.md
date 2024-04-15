# PIER - Weather Station Application

This is a weather station application built using Arduino, Vite, MQTT, Node.js, Python, Docker and MongoDB.

## Description

The weather station application collects data from various sensors connected to an Arduino board. The collected data is then sent to a MQTT broker for real-time communication. A Node.js server subscribes to the MQTT broker and stores the data in a MongoDB database. The data can be accessed and analyzed using the provided APIs.

## Features

- Collects weather data from sensors connected to an Arduino board
- Real-time communication using MQTT
- Stores data in a MongoDB database
- Provides APIs for accessing and analyzing the collected data
- Mock data for testing purposes
- Dockerized for easy deployment

## Prerequisites

Before running the weather station application, make sure you have the following installed:

- Arduino IDE
- Node package manager (npm)
- Docker && Docker-Compose
- Python (optional)

## Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/HiimHyy/weather_station.git
   ```

2. Give execution permissions to the shell scripts:

   ```bash
   cd weather_station
   chmod +x program.sh
   ```

3. Run the shell script to install the dependencies:

   ```bash
    ./program.sh install
   ```

4. Connect the sensors to the Arduino board and upload the Arduino sketch to the board.
5. Start the programs:

   ```bash
   ./program.sh start
   ```

6. Go to `http://localhost:5173` to access the weather station application.

## Contributing

Contributions are welcome! If you have any ideas or improvements, feel free to submit a pull request.

## License

This project is licensed under the [MIT License](LICENSE).
