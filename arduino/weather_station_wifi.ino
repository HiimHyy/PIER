#include <WiFi.h>
#include <PubSubClient.h>
#include <DHT.h>

// WiFi Settings
const char* ssid = "MB210-G";
const char* password = "studentMAMK";

// MQTT Settings
const char* mqtt_server = "172.20.49.27";
WiFiClient espClient;
PubSubClient mqttClient(espClient);

// DHT Sensor Settings
#define DHTPIN 26
#define DHTTYPE DHT11
DHT dht(DHTPIN, DHTTYPE);

// Fan Tachometer Settings
#define FAN_TACHO_PIN 27
volatile int pulseCount = 0;

// Measurement Settings
struct Measurement {
  float temperature;
  Measurement *next;
};
Measurement *firstMeasurement = nullptr;
Measurement *currentMeasurement = nullptr;
int measurementCounter = 0;
int currentMeasurements = 0;
float runningSum = 0.0;
const int amountOfMeasurements = 5;

// Function Prototypes
void setup_wifi();
void reconnect();
void addMeasurement(float temperature);
float calculateAverage();
int calculateRPM();
void IRAM_ATTR onFanSpeed();

void setup() {
  Serial.begin(115200);
  dht.begin();
  setup_wifi();
  mqttClient.setServer(mqtt_server, 1883);

  firstMeasurement = new Measurement{0, nullptr};
  currentMeasurement = firstMeasurement;

  pinMode(FAN_TACHO_PIN, INPUT_PULLUP);
  attachInterrupt(digitalPinToInterrupt(FAN_TACHO_PIN), onFanSpeed, FALLING);

  Serial.println("Setup complete.");
}

void loop() {
  if (!mqttClient.connected()) {
    reconnect();
  }
  mqttClient.loop();

  static unsigned long lastMillis = 0;
  if (millis() - lastMillis > 2000) {
    lastMillis = millis();

    float measuredTemp = dht.readTemperature();
    if (!isnan(measuredTemp)) {
      addMeasurement(measuredTemp);
      float averageTemp = calculateAverage();
      int fanRPM = calculateRPM();

      Serial.printf("Current Temperature: %.2f, Average Temperature: %.2f, Fan RPM: %d\n", measuredTemp, averageTemp, fanRPM);

      char payload[100];
      sprintf(payload, "{\"temperature\":%.2f, \"average\":%.2f, \"rpm\":%d}", measuredTemp, averageTemp, fanRPM);
      mqttClient.publish("esp32/temperature", payload);
    } else {
      Serial.println("Failed to read from DHT sensor!");
    }
  }
}

void setup_wifi() {
  Serial.print("Connecting to WiFi SSID: ");
  Serial.println(ssid);
  WiFi.begin(ssid, password);

  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nWiFi connected");
  Serial.print("IP address: ");
  Serial.println(WiFi.localIP());
}

void reconnect() {
  while (!mqttClient.connected()) {
    Serial.print("Attempting MQTT connection...");
    if (mqttClient.connect("ESP32_Client")) {
      Serial.println("connected");
    } else {
      Serial.print("failed, rc=");
      Serial.print(mqttClient.state());
      Serial.println(" try again in 5 seconds");
      delay(5000);
    }
  }
}

void addMeasurement(float temperature) {
  if (currentMeasurements == amountOfMeasurements) {
    runningSum -= firstMeasurement->temperature;
    Measurement *temp = firstMeasurement;
    firstMeasurement = firstMeasurement->next;
    delete temp;
  } else {
    currentMeasurements++;
  }

  runningSum += temperature;
  if (!currentMeasurement->next) {
    currentMeasurement->next = new Measurement{temperature, nullptr};
  }
  currentMeasurement = currentMeasurement->next;

  if (measurementCounter++ == amountOfMeasurements) {
    measurementCounter = 0;
  }
}

float calculateAverage() {
  if (currentMeasurements == 0) return 0.0;
  return runningSum / currentMeasurements;
}

int calculateRPM() {
  int rpm = (pulseCount * 60) / 2;
  pulseCount = 0;
  return rpm;
}

void IRAM_ATTR onFanSpeed() {
  pulseCount++;
}
