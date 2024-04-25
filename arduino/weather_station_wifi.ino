#include <WiFi.h>
#include <PubSubClient.h>
#include <DHT.h>
#include <LiquidCrystal_I2C.h>

bool systemEnabled = false;

// WiFi Settings
const char* ssid = "MB210-G";
const char* password = "studentMAMK";

// MQTT Settings
const char* mqtt_server = "172.20.49.14";
WiFiClient espClient;
PubSubClient mqttClient(espClient);

// DHT Sensor Settings
#define DHTPIN 26
#define DHTTYPE DHT11
DHT dht(DHTPIN, DHTTYPE);

// Fan Tachometer Settings
#define FAN_TACHO_PIN 27
volatile int pulseCount = 0;

// LCD settings
const int lcdColumns = 16;
const int lcdRows = 2;
LiquidCrystal_I2C lcd(0x27, lcdColumns, lcdRows);

// Touch Switch settings
const int TOUCH_SENSOR_PIN = 5;

// Measurement Settings
struct Measurement {
  float temperature;
  Measurement *next;
};
Measurement *firstMeasurement = nullptr;
Measurement *currentMeasurement = nullptr;
int currentMeasurements = 0;
float runningSum = 0.0;
const int amountOfMeasurements = 5;

// Function Prototypes
void setup_wifi();
void reconnect();
void addMeasurement(float temperature);
void clearMeasurements();
float calculateAverage();
int calculateRPM();
void IRAM_ATTR onFanSpeed();

void setup() {
  Serial.begin(115200);
  dht.begin();
  setup_wifi();
  mqttClient.setServer(mqtt_server, 1883);

  pinMode(FAN_TACHO_PIN, INPUT_PULLUP);
  attachInterrupt(digitalPinToInterrupt(FAN_TACHO_PIN), onFanSpeed, FALLING);

  // Initialize LCD
  lcd.init();
  lcd.backlight();

  pinMode(TOUCH_SENSOR_PIN, INPUT);

  Serial.println("Setup complete.");
}

void loop() {
  static int lastState = LOW;
  int currentState = digitalRead(TOUCH_SENSOR_PIN);

  // Toggle system state on touch sensor state change from LOW to HIGH
  if(lastState == LOW && currentState == HIGH) {
    systemEnabled = !systemEnabled; // Toggle the system's enabled state
    if(systemEnabled) {
      Serial.println("System Enabled");
      lcd.clear();
      lcd.setCursor(0, 0);
      lcd.print("System Enabled");
    } else {
      Serial.println("System Disabled");
      clearMeasurements(); // Clear measurements on disable
      lcd.clear();
      lcd.setCursor(0, 0);
      lcd.print("System Disabled");
    }
  }
  lastState = currentState; // Update lastState for the next loop iteration

  if(systemEnabled) {
    // Only run the main program logic if the system is enabled
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

        // Display on LCD
        lcd.clear();
        lcd.setCursor(0, 0);
        lcd.print("Temp: ");
        lcd.print(measuredTemp, 2);
        lcd.print((char)223); // Degree symbol
        lcd.print("C");
        
        lcd.setCursor(0, 1);
        lcd.print("Avg: ");
        lcd.print(averageTemp, 2);
        lcd.print((char)223); // Degree symbol
        lcd.print("C");
      } else {
        Serial.println("Failed to read from DHT sensor!");
      }
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
    // Attempt to connect to the MQTT broker
    if (mqttClient.connect("ESP32_Client")) {
      Serial.println("connected");
    } else {
      Serial.print("failed, rc=");
      Serial.print(mqttClient.state());
      Serial.println(" try again in 5 seconds");
      // Wait 5 seconds before retrying
      delay(5000);
    }
  }
}

void addMeasurement(float temperature) {
  Measurement* newMeasurement = new Measurement{temperature, nullptr};
  
  if (currentMeasurements < amountOfMeasurements) {
    currentMeasurements++;
  } else {
    // Remove the oldest measurement
    Measurement* temp = firstMeasurement;
    runningSum -= temp->temperature;
    firstMeasurement = firstMeasurement->next;
    delete temp;
  }

  runningSum += temperature;

  if (firstMeasurement == nullptr) {
    firstMeasurement = newMeasurement;
    currentMeasurement = newMeasurement;
  } else {
    currentMeasurement->next = newMeasurement;
    currentMeasurement = newMeasurement;
  }
}

void clearMeasurements() {
  while (firstMeasurement != nullptr) {
    Measurement* temp = firstMeasurement->next;
    delete firstMeasurement;
    firstMeasurement = temp;
  }
  currentMeasurement = nullptr;
  currentMeasurements = 0;
  runningSum = 0.0;
}

float calculateAverage() {
  if (currentMeasurements == 0) return 0.0;
  return runningSum / currentMeasurements;
}

int calculateRPM() {
  // Calculate RPM based on the number of pulses counted in one minute
  int rpm = (pulseCount * 60) / 2; // Divide by 2 due to the fan's two-pulse per revolution characteristic (if applicable)
  pulseCount = 0; // Reset pulse count for the next measurement period
  return rpm;
}

void IRAM_ATTR onFanSpeed() {
  pulseCount++; // Increment the pulse count whenever the interrupt is triggered
}
