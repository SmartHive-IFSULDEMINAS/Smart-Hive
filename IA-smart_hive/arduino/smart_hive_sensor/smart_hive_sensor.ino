/**
 * SmartHive - Sensor Firmware
 * 
 * Arduino firmware for AS7341 spectral sensor.
 * Reads 10-channel spectral data and sends via Serial.
 * 
 * Hardware: Arduino + Adafruit AS7341 breakout
 * Communication: 115200 baud, CSV format
 * 
 * Commands:
 *   '1' - Turn LED ON
 *   '0' - Turn LED OFF  
 *   'Bxx' - Set LED brightness (4-100 mA)
 */

#include <Wire.h>
#include <Adafruit_AS7341.h>

Adafruit_AS7341 as7341;

// Configuration
const int DEFAULT_LED_CURRENT = 20;  // mA
const int MIN_LED_CURRENT = 4;       // mA
const int MAX_LED_CURRENT = 100;     // mA (safety limit)
const int LOOP_DELAY_MS = 50;

int ledCurrent = DEFAULT_LED_CURRENT;

void setup() {
    Serial.begin(115200);
    
    // Initialize sensor
    if (!as7341.begin()) {
        // Sensor not found - halt
        while (1) { 
            delay(10); 
        }
    }
    
    // Configure for high sensitivity
    as7341.setATIME(29);
    as7341.setASTEP(599);
    as7341.setGain(AS7341_GAIN_256X);
    
    // Initialize LED (off by default)
    as7341.setLEDCurrent(ledCurrent);
    as7341.enableLED(false);
}

void loop() {
    // Process serial commands
    processCommands();
    
    // Read and send sensor data
    readAndSendData();
    
    delay(LOOP_DELAY_MS);
}

void processCommands() {
    if (Serial.available() > 0) {
        String comando = Serial.readStringUntil('\n');
        comando.trim();
        
        if (comando.length() > 0) {
            char tipo = comando.charAt(0);
            
            switch (tipo) {
                case '1':
                    // LED ON
                    as7341.enableLED(true);
                    break;
                    
                case '0':
                    // LED OFF
                    as7341.enableLED(false);
                    break;
                    
                case 'B':
                    // Set brightness (Bxx)
                    int valor = comando.substring(1).toInt();
                    valor = constrain(valor, MIN_LED_CURRENT, MAX_LED_CURRENT);
                    ledCurrent = valor;
                    as7341.setLEDCurrent(ledCurrent);
                    break;
            }
        }
    }
}

void readAndSendData() {
    uint16_t readings[12];
    
    if (!as7341.readAllChannels(readings)) {
        return;  // Read failed
    }
    
    // Send as CSV: F1,F2,F3,F4,F5,F6,F7,F8,NIR,Clear
    // Channel mapping based on AS7341 datasheet
    Serial.print(readings[0]);  Serial.print(",");  // F1 (415nm)
    Serial.print(readings[1]);  Serial.print(",");  // F2 (445nm)
    Serial.print(readings[2]);  Serial.print(",");  // F3 (480nm)
    Serial.print(readings[3]);  Serial.print(",");  // F4 (515nm)
    Serial.print(readings[6]);  Serial.print(",");  // F5 (555nm)
    Serial.print(readings[7]);  Serial.print(",");  // F6 (590nm)
    Serial.print(readings[8]);  Serial.print(",");  // F7 (630nm)
    Serial.print(readings[9]);  Serial.print(",");  // F8 (680nm)
    Serial.print(readings[10]); Serial.print(",");  // NIR (910nm)
    Serial.println(readings[11]);                    // Clear
}