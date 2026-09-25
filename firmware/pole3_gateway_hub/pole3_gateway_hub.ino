#include "painlessMesh.h"
#include <ArduinoJson.h>

// Mesh Network Credentials
#define MESH_PREFIX     "NIRIKSHA_MESH"
#define MESH_PASSWORD   "nirikshaSecure2026"
#define MESH_PORT       5555

// Sensor Pin Definitions
#define MQ135_PIN       34
#define MQ7_PIN         35

painlessMesh mesh;
Scheduler userScheduler;

// Declare the local telemetry task (Runs every 3000ms indefinitely)
void broadcastLocalTelemetry();
Task taskSendTelemetry(3000, TASK_FOREVER, &broadcastLocalTelemetry);

// --- Task: Read Local Sensors & Print to USB ---
void broadcastLocalTelemetry() {
  int mq135_val = analogRead(MQ135_PIN);
  int mq7_val = analogRead(MQ7_PIN);

  // Build the JSON Payload
  StaticJsonDocument<256> doc;
  doc["pole_id"] = 3;
  doc["mesh_node_id"] = mesh.getNodeId();
  doc["air_quality_raw"] = mq135_val;
  doc["co_raw"] = mq7_val;

  String jsonOutput;
  serializeJson(doc, jsonOutput);

  // Print local telemetry directly to the Python backend via USB
  Serial.printf("MESH_JSON:%s\n", jsonOutput.c_str());
}

// --- Callback: Catch RF Packets from Pole 1 & Pole 2 ---
void receivedCallback(uint32_t from, String &msg) {
  // Pass the incoming mesh JSON string straight to the Python backend via USB
  Serial.printf("MESH_JSON:%s\n", msg.c_str());
}

void setup() {
  Serial.begin(115200);

  // Configure ESP32 ADC for full 0 - 3.3V range (12-bit: 0-4095)
  analogSetAttenuation(ADC_11db);
  
  // Initialize Sensor Pins
  pinMode(MQ135_PIN, INPUT);
  pinMode(MQ7_PIN, INPUT);

  // Initialize Mesh Network (Disabled internal debugging to prevent linker errors)
  mesh.setDebugMsgTypes(ERROR | STARTUP); 
  mesh.init(MESH_PREFIX, MESH_PASSWORD, &userScheduler, MESH_PORT);
  
  // CRITICAL: Declare this specific ESP32 as the Root Gateway Node
  mesh.setContainsRoot(true);

  // Assign the callback for incoming RF packets from Pole 1 & Pole 2
  mesh.onReceive(&receivedCallback);

  // Add and enable the non-blocking sensor task
  userScheduler.addTask(taskSendTelemetry);
  taskSendTelemetry.enable();
}

void loop() {
  // Execute the mesh background tasks (Never use delay() inside this loop)
  mesh.update();
}