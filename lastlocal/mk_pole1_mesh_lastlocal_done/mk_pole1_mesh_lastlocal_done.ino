#include "painlessMesh.h"
#include <ArduinoJson.h>

#define MESH_PREFIX   "NIRIKSHA_MESH"
#define MESH_PASSWORD "nirikshaSecure2026"
#define MESH_PORT     5555

const int TRIG_PIN = 18;
const int ECHO_PIN = 19;
const int ZMPT_PIN = 34;
const int TILT_PIN = 27;

const float TOTAL_POLE_HEIGHT_CM = 150.0;
const float SPEED_OF_SOUND = 0.0343;

// Tuned ZMPT Calibration
float VOLTAGE_FACTOR = 0.1394;
const int NOISE_CUTOFF = 1100;

Scheduler userScheduler;
painlessMesh mesh;

float readCleanACVoltage() {
  float readings[3];

  for (int i = 0; i < 3; i++) {
    int minVal = 4095;
    int maxVal = 0;
    uint32_t startTime = millis();

    while ((millis() - startTime) < 40) {
      int readVal = analogRead(ZMPT_PIN);
      if (readVal > maxVal) maxVal = readVal;
      if (readVal < minVal) minVal = readVal;
    }

    int peakToPeak = maxVal - minVal;
    if (peakToPeak < NOISE_CUTOFF) {
      readings[i] = 0.0;
    } else {
      readings[i] = peakToPeak * VOLTAGE_FACTOR;
    }
  }

  if (readings[0] > readings[1]) { float t = readings[0]; readings[0] = readings[1]; readings[1] = t; }
  if (readings[1] > readings[2]) { float t = readings[1]; readings[1] = readings[2]; readings[2] = t; }
  if (readings[0] > readings[1]) { float t = readings[0]; readings[0] = readings[1]; readings[1] = t; }

  return readings[1];
}

void sendSensorTelemetry();
// Staggered timing: 2300ms to prevent collisions with Pole 2
Task taskSendTelemetry(TASK_MILLISECOND * 2300, TASK_FOREVER, &sendSensorTelemetry);

void sendSensorTelemetry() {
  digitalWrite(TRIG_PIN, LOW); delayMicroseconds(5);
  digitalWrite(TRIG_PIN, HIGH); delayMicroseconds(10);
  digitalWrite(TRIG_PIN, LOW);
  long duration = pulseIn(ECHO_PIN, HIGH, 30000);
  float waterDepth = 0.0;
  if (duration > 0) {
    waterDepth = TOTAL_POLE_HEIGHT_CM - ((duration * SPEED_OF_SOUND) / 2.0);
    if (waterDepth < 0) waterDepth = 0;
  }

  float v_ac = readCleanACVoltage();
  bool isUpright = (digitalRead(TILT_PIN) == HIGH);

  StaticJsonDocument<256> doc;
  doc["pole_id"] = 1;
  doc["mesh_node_id"] = mesh.getNodeId();
  doc["water_depth"] = round(waterDepth * 10.0) / 10.0;
  doc["is_upright"] = isUpright;
  doc["voltage"] = round(v_ac * 10.0) / 10.0;
  doc["current"] = 0.0;
  doc["power"] = 0.0;
  doc["energy"] = 0.0;
  doc["frequency"] = (v_ac > 0.0) ? 50.0 : 0.0;
  doc["pf"] = (v_ac > 0.0) ? 1.0 : 0.0;

  String msg;
  serializeJson(doc, msg);
  mesh.sendBroadcast(msg);
}

void setup() {
  Serial.begin(115200);
  delay(1000);
  
  pinMode(TRIG_PIN, OUTPUT);
  pinMode(ECHO_PIN, INPUT);
  pinMode(TILT_PIN, INPUT);
  
  analogReadResolution(12);
  analogSetPinAttenuation(ZMPT_PIN, ADC_11db);

  mesh.setDebugMsgTypes(ERROR | STARTUP);
  mesh.init(MESH_PREFIX, MESH_PASSWORD, &userScheduler, MESH_PORT);
  mesh.setContainsRoot(true); // Seeks the Gateway

  userScheduler.addTask(taskSendTelemetry);
  taskSendTelemetry.enable();
}

void loop() {
  mesh.update();
}