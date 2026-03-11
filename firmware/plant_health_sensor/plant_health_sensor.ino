#include <WiFi.h>
#include <HTTPClient.h>
#include <DHT.h>
#include <ArduinoJson.h>

// Configuration — edit these constants for your setup
#define WIFI_SSID "YOUR_WIFI_SSID"
#define WIFI_PASSWORD "YOUR_WIFI_PASSWORD"
#define BACKEND_URL "http://YOUR_BACKEND_IP:8000/api/sensor-data"
#define SENSOR_INTERVAL_MS 60000  // 1 minute, configurable
#define SOIL_MOISTURE_PIN 34      // ADC pin for capacitive soil moisture sensor
#define DHT_PIN 4                 // Digital pin for DHT11 sensor
#define DHT_TYPE DHT11
#define LDR_PIN 35                // ADC pin for LDR (light sensor)

// Global state
DHT dht(DHT_PIN, DHT_TYPE);

// Struct for DHT sensor readings
struct DHTData {
  float temperature;
  float humidity;
  bool valid;
};

// Forward declarations
float readSoilMoisture();
DHTData readDHT();
float readLDR();

void setup() {
  Serial.begin(115200);
  dht.begin();

  pinMode(SOIL_MOISTURE_PIN, INPUT);
  pinMode(LDR_PIN, INPUT);

  // Connect to WiFi with retry loop (max 20 attempts)
  Serial.print("Connecting to WiFi");
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    attempts++;
    Serial.print(" attempt ");
    Serial.println(attempts);
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.print("WiFi connected. IP: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println("WiFi connection failed after 20 attempts. Will retry in loop.");
  }
}

void loop() {
  // Check WiFi status — reconnect if disconnected
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi disconnected. Reconnecting...");
    WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
    int attempts = 0;
    while (WiFi.status() != WL_CONNECTED && attempts < 20) {
      delay(500);
      attempts++;
      Serial.print(" reconnect attempt ");
      Serial.println(attempts);
    }
    if (WiFi.status() != WL_CONNECTED) {
      Serial.println("Reconnection failed. Skipping this reading.");
      delay(SENSOR_INTERVAL_MS);
      return;
    }
    Serial.println("Reconnected to WiFi.");
  }

  // Read all sensors
  float soilMoisture = readSoilMoisture();
  DHTData dhtData = readDHT();
  float lux = readLDR();

  // Log sensor values
  Serial.print("Soil Moisture: ");
  Serial.print(soilMoisture);
  Serial.println("%");

  Serial.print("Temperature: ");
  Serial.print(dhtData.temperature);
  Serial.print("°C  Humidity: ");
  Serial.print(dhtData.humidity);
  Serial.println("%");

  Serial.print("Light (lux approx): ");
  Serial.println(lux);

  // CRITICAL: Skip POST if DHT readings are NaN
  if (!dhtData.valid || isnan(dhtData.temperature) || isnan(dhtData.humidity)) {
    Serial.println("DHT reading invalid (NaN). Skipping POST.");
    delay(SENSOR_INTERVAL_MS);
    return;
  }

  // Build JSON payload using ArduinoJson
  StaticJsonDocument<256> doc;
  doc["soil_moisture"] = soilMoisture;
  doc["temperature"] = dhtData.temperature;
  doc["humidity"] = dhtData.humidity;
  doc["light_lux"] = lux;

  String jsonPayload;
  serializeJson(doc, jsonPayload);

  // HTTP POST to backend
  HTTPClient http;
  http.begin(BACKEND_URL);
  http.addHeader("Content-Type", "application/json");

  int httpResponseCode = http.POST(jsonPayload);

  // Log HTTP response code
  Serial.print("HTTP Response code: ");
  Serial.println(httpResponseCode);

  if (httpResponseCode > 0) {
    String response = http.getString();
    Serial.print("Response: ");
    Serial.println(response);
  } else {
    Serial.print("HTTP POST error: ");
    Serial.println(http.errorToString(httpResponseCode).c_str());
  }

  http.end();

  delay(SENSOR_INTERVAL_MS);
}

// Read capacitive soil moisture sensor
// Returns 0-100 percentage (0 = dry, 100 = wet)
float readSoilMoisture() {
  int rawValue = analogRead(SOIL_MOISTURE_PIN);
  // Higher ADC value = drier soil for capacitive sensor
  // Map ADC range (0-4095) to moisture percentage (0-100)
  float moisture = map(rawValue, 4095, 0, 0, 100);
  return moisture;
}

// Read DHT11 temperature and humidity sensor
DHTData readDHT() {
  DHTData data;
  data.temperature = dht.readTemperature();
  data.humidity = dht.readHumidity();

  // Check if readings are valid (not NaN)
  if (isnan(data.temperature) || isnan(data.humidity)) {
    Serial.println("Failed to read from DHT sensor.");
    data.valid = false;
  } else {
    data.valid = true;
  }

  return data;
}

// Read LDR (light-dependent resistor) and approximate lux
// Returns lux approximation (0-65535 range approx)
float readLDR() {
  int rawValue = analogRead(LDR_PIN);
  // Convert ADC reading to voltage (3.3V reference, 12-bit ADC)
  float voltage = rawValue * (3.3 / 4095.0);
  // Approximate lux using a typical 10kΩ voltage divider formula
  // Resistance of LDR: R_ldr = (3.3 - voltage) / (voltage / 10000.0)
  // Avoid division by zero
  if (voltage < 0.001) {
    return 0.0;
  }
  float rLdr = (3.3 - voltage) * 10000.0 / voltage;
  // Approximate lux: lux = 500 / (R_ldr / 1000)
  float lux = 500.0 / (rLdr / 1000.0);
  // Clamp to reasonable range
  if (lux < 0.0) lux = 0.0;
  if (lux > 65535.0) lux = 65535.0;
  return lux;
}
