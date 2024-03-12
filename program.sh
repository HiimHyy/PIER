#!/bin/bash

# Define directories
MQTT_DIR="mqtt"
SERVER_DIR="server"

# Function to stop processes listening on specific ports
function stop_ports() {
    for PORT in "$@"; do
        echo "Checking for processes listening on port $PORT..."
        if lsof -Pi :$PORT -sTCP:LISTEN -t >/dev/null; then
            echo "Found processes listening on port $PORT. Attempting to stop..."
            lsof -Pi :$PORT -sTCP:LISTEN -t | xargs kill -9
            echo "Stopped processes on port $PORT."
        else
            echo "No processes found listening on port $PORT."
        fi
    done
}

# Function to install Node.js dependencies
function install_dependencies() {
    echo "Installing dependencies..."
    (cd $SERVER_DIR && npm install)
    echo "Dependencies installed."
}

# Function to start the Mosquitto MQTT broker and the Node.js server
function start_app() {
    # Stopping any processes that may be using required ports
    stop_ports 3000 # Add other ports as needed, separated by spaces

    echo "Starting the Mosquitto MQTT broker..."
    (cd $MQTT_DIR && docker-compose up -d)

    echo "Starting the Node.js server..."
    (
        cd $SERVER_DIR && nohup node server.js >server.log 2>&1 &
        echo $! >"$SERVER_DIR/server.PID"
    )
    echo "Weather station app and Node.js server started."
}

# Function to stop the Mosquitto MQTT broker and the Node.js server, and clear the log
function stop_app() {
    echo "Stopping the Mosquitto MQTT broker..."
    (cd $MQTT_DIR && docker-compose down)

    echo "Stopping the Node.js server and clearing the PID file..."
    if [ -f "$SERVER_DIR/server.PID" ]; then
        SERVER_PID=$(cat $SERVER_DIR/server.PID)
        kill $SERVER_PID 2>/dev/null
        rm -f $SERVER_DIR/server.PID
        echo "Node.js server stopped."
    else
        echo "Node.js server PID file not found. Server might not have been running."
    fi

    echo "Clearing the server log..."
    >$SERVER_DIR/server.log
    echo "Server log cleared."
}

# Function to show the status of the Mosquitto MQTT broker
function status_app() {
    echo "Application status:"
    docker ps -a | grep mosquitto
}

# Function to show logs of the Mosquitto MQTT broker
function log_app() {
    echo "Application logs:"
    docker logs mosquitto
}

case "$1" in
install)
    install_dependencies
    ;;
start)
    start_app
    ;;
stop)
    stop_app
    ;;
status)
    status_app
    ;;
logs)
    log_app
    ;;
*)
    echo "Usage: $0 {install|start|stop|status|logs}"
    exit 1
    ;;
esac
exit 0
