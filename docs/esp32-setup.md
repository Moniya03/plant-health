# ESP32 Hardware Setup Guide

Build your plant health sensor node using this hardware manual. It covers everything from parts lists to final testing.

## 📋 Required Components

| Component | Quantity | Description | Approx. Cost |
| :--- | :--- | :--- | :--- |
| ESP32 DevKit V1 (30-pin) | 1 | WiFi-enabled microcontroller | $5-8 |
| DHT11 Sensor Module | 1 | Temperature and humidity sensor (breakout board with 3 pins) | $2-3 |
| HW-103 Soil Moisture Sensor | 1 | Resistive soil moisture sensor module with analog + digital output | $2-4 |
| LDR Sensor Module | 1 | Light sensor module with LM393 comparator (digital output) | $1-2 |
| Breadboard | 1 | For prototyping connections | $3-5 |
| Jumper Wires | ~10 | Male-to-male and male-to-female | $2-3 |
| Micro-USB Cable | 1 | For ESP32 power and programming | $2 |

## 🔌 Pin Mapping

Check this table for the physical connections between your sensors and the ESP32 board.

| Sensor | Sensor Pin | ESP32 Pin | ESP32 Label | Signal Type |
| :--- | :--- | :--- | :--- | :--- |
| DHT11 | VCC | 3V3 | 3.3V Power | Power |
| DHT11 | DATA | GPIO4 | D4 | Digital (one-wire) |
| DHT11 | GND | GND | Ground | Ground |
| Soil Moisture | VCC | 3V3 | 3.3V Power | Power |
| Soil Moisture | V0 | GPIO34 | D34 (ADC1_CH6) | Analog |
| Soil Moisture | GND | GND | Ground | Ground |
| Soil Moisture | D0 | — | — | Digital (threshold, unused by firmware) |
| LDR Module | VCC | 3V3 | 3.3V Power | Power |
| LDR Module | D0 | GPIO35 | D35 | Digital |
| LDR Module | GND | GND | Ground | Ground |

## 📡 Wiring Diagrams

This mermaid flowchart visualizes how all parts link together.

```mermaid
graph LR
  subgraph ESP32["ESP32 DevKit V1"]
    GPIO4["GPIO4"]
    GPIO34["GPIO34 (ADC1)"]
    GPIO35["GPIO35 (ADC1)"]
    V33["3.3V"]
    GND["GND"]
  end

  subgraph DHT11["DHT11 Sensor"]
    D_VCC["VCC"]
    D_DATA["DATA"]
    D_GND["GND"]
  end

  subgraph SOIL["Soil Moisture Sensor"]
    S_VCC["VCC"]
    S_V0["V0"]
    S_GND["GND"]
  end

  subgraph LDR_MODULE["LDR Sensor Module"]
    L_VCC["VCC"]
    L_D0["D0"]
    L_GND["GND"]
  end

  V33 --> D_VCC
  V33 --> S_VCC
  V33 --> L_VCC

  GPIO4 --> D_DATA
  GPIO34 --> S_V0
  GPIO35 --> L_D0

  GND --> D_GND
  GND --> S_GND
  GND --> L_GND
```

## ⚡ Detailed Wiring Instructions

Set up your connections by following these steps for each module.

### 1. DHT11 Wiring
- Hook up DHT11 VCC to ESP32 3V3.
- Link DHT11 DATA to ESP32 GPIO4.
- Connect DHT11 GND to ESP32 GND.
- The 3-pin module includes a built-in pull-up resistor. No external resistor needed.

### 2. Soil Moisture Sensor (HW-103)
- Attach the sensor VCC to ESP32 3V3. (CRITICAL: Do not use 5V or you'll fry the ESP32 ADC).
- Wire the sensor V0 (analog output) to ESP32 GPIO34.
- Join the sensor GND to ESP32 GND.

### 3. LDR Sensor Module
- Connect LDR module VCC to ESP32 3V3.
- Connect LDR module D0 to ESP32 GPIO35 (D35).
- Connect LDR module GND to ESP32 GND.
- Note: Adjust the onboard potentiometer to set the desired light/dark switching threshold.

## 🔧 ASCII Wiring Diagram

```
ESP32 3.3V ──┬──────────── DHT11 VCC
             ├──────────── Soil Moisture VCC
             └──────────── LDR Module VCC

ESP32 GND  ──┬──────────── DHT11 GND
             ├──────────── Soil Moisture GND
             └──────────── LDR Module GND

ESP32 D4  (GPIO4)  ────── DHT11 DAT
ESP32 D34 (GPIO34) ────── Soil Moisture V0
ESP32 D35 (GPIO35) ────── LDR Module D0
```

## 💡 Important Notes / Gotchas

- Pins GPIO34 and GPIO35 are input-only and lack internal pull resistors, making them ideal for analog data.
- ADC1 channels handle GPIO34 and GPIO35 because ADC2 stops working when WiFi is active.
- Digital communication for DHT11 happens on GPIO4 without interfering with WiFi.
- Soil moisture sensors require 3.3V power since higher voltages break the ESP32 input.
- Readings from the DHT11 should only happen once per second to avoid errors.
- The 12-bit ADC provides a range from 0 to 4095.
- Higher ADC values signify drier soil.
- The LDR module outputs a digital signal: LOW when bright, HIGH when dark (typical LM393 polarity). The firmware converts this to 100 (bright) or 0 (dark).
- The soil moisture sensor's D0 pin provides a digital threshold output (not used by firmware). The V0 pin provides analog readings used for precise moisture percentage.

## 🚀 Firmware Setup

1. Install Arduino IDE (2.0+).
2. Add ESP32 board support: File > Preferences > Additional Board Manager URLs: `https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json`
3. Open Board Manager, search for "esp32", and install the "ESP32 by Espressif Systems" package.
4. Install libraries via Library Manager: `DHT sensor library` by Adafruit and `ArduinoJson` by Benoit Blanchon.
5. Open `firmware/plant_health_sensor/plant_health_sensor.ino`.
6. Update these constants at the top of the file:
   - `WIFI_SSID`: Your WiFi network name
   - `WIFI_PASSWORD`: Your WiFi password
   - `BACKEND_URL`: Your backend endpoint (e.g., `http://192.168.1.100:8000/api/sensor-data`)
   - `SENSOR_INTERVAL_MS`: Reading interval in milliseconds (default 60000 = 1 minute)
7. Choose "ESP32 Dev Module" from the Tools > Board menu.
8. Pick your ESP32 port under Tools > Port.
9. Click the Upload arrow.
10. Watch the Serial Monitor at 115200 baud for incoming data.

## 📏 Sensor Calibration

- **Soil moisture**: Note the ADC values when the sensor is in water (wet) and air (dry). You can then tweak the mapping in your firmware code.
- **LDR Module**: Adjust the onboard potentiometer to set the desired light/dark switching threshold. The firmware reads this as a simple digital signal (0=dark, 100=bright).
- **DHT11**: Expect occasional read failures. The code skips these automatically using a NaN check.

## 🆘 Troubleshooting

- **DHT failures**: Verify your wiring connections. The 3-pin module has a built-in pull-up — no external resistor needed. Ensure you aren't reading the sensor too often.
- **WiFi issues**: Confirm your credentials and make sure you're using 2.4GHz WiFi.
- **Server errors**: Check the `BACKEND_URL`. Confirm the backend app is active.
- **Jumpy readings**: Try adding a 100nF capacitor between the sensor signal and GND.
- **Fixed moisture values**: Look at the 3.3V rail for issues. Make sure the sensor sits properly in the dirt.
