#include "painlessMesh.h"
#include <ArduinoJson.h>
#include <PZEM004Tv30.h>

#define MESH_PREFIX   "NIRIKSHA_MESH"
#define MESH_PASSWORD "nirikshaSecure2026"
#define MESH_PORT     5555

#define PZEM_RX_PIN 16
#define PZEM_TX_PIN 17
const int TRIG_PIN  = 18;
const int ECHO_PIN  = 19;
const int TILT_PIN  = 27;

const float TOTAL_POLE_HEIGHT_CM = 150.0;
const float SPEED_OF_SOUND = 0.0343;

PZEM004Tv30 pzem(Serial2, PZEM_RX_PIN, PZEM_TX_PIN);

Scheduler userScheduler;
painlessMesh mesh;

void sendSensorTelemetry();
// Staggered timing: 2700ms to prevent collisions with Pole 1
Task taskSendTelemetry(TASK_MILLISECOND * 2700, TASK_FOREVER, &sendSensorTelemetry);

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

  // Non-blocking PZEM read
  float v = pzem.voltage();
  float i = 0.0, p = 0.0, e = 0.0, f = 0.0, pf = 0.0;

  if (!isnan(v) && v > 0.0) {
    i = pzem.current(); p = pzem.power(); e = pzem.energy();
    f = pzem.frequency(); pf = pzem.pf();
    if (isnan(i)) i = 0.0; if (isnan(p)) p = 0.0;
    if (isnan(e)) e = 0.0; if (isnan(f)) f = 50.0;
    if (isnan(pf)) pf = 1.0;
  } else {
    v = 0.0;
  }

  bool isUpright = (digitalRead(TILT_PIN) == HIGH);

  StaticJsonDocument<256> doc;
  doc["pole_id"] = 2;
  doc["mesh_node_id"] = mesh.getNodeId();
  doc["water_depth"] = round(waterDepth * 10.0) / 10.0;
  doc["is_upright"] = isUpright;
  doc["voltage"] = round(v * 10.0) / 10.0;
  doc["current"] = round(i * 1000.0) / 1000.0;
  doc["power"] = round(p * 10.0) / 10.0;
  doc["energy"] = round(e * 1000.0) / 1000.0;
  doc["frequency"] = round(f * 10.0) / 10.0;
  doc["pf"] = round(pf * 100.0) / 100.0;

  String msg;
  serializeJson(doc, msg);
  mesh.sendBroadcast(msg);
}

void setup() {
  Serial.begin(115200);
  delay(2500); // Boot stagger offset

  Serial2.begin(9600, SERIAL_8N1, PZEM_RX_PIN, PZEM_TX_PIN);
  pinMode(TRIG_PIN, OUTPUT); pinMode(ECHO_PIN, INPUT); pinMode(TILT_PIN, INPUT);

  mesh.setDebugMsgTypes(ERROR | STARTUP);
  mesh.init(MESH_PREFIX, MESH_PASSWORD, &userScheduler, MESH_PORT);
  mesh.setContainsRoot(true); // Seeks the Gateway

  userScheduler.addTask(taskSendTelemetry);
  taskSendTelemetry.enable();
}

void loop() {
  mesh.update();
}