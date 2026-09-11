#include "painlessMesh.h"

#define MESH_PREFIX   "NIRIKSHA_MESH"
#define MESH_PASSWORD "nirikshaSecure2026"
#define MESH_PORT     5555

Scheduler userScheduler;
painlessMesh mesh;

void receivedCallback(uint32_t from, String &msg) {
  // Outputs strictly formatted JSON for the Python parser
  Serial.print("MESH_JSON:");
  Serial.println(msg);
}

void setup() {
  Serial.begin(115200);
  delay(2000); 

  // Initialize Mesh
  mesh.setDebugMsgTypes(ERROR | STARTUP);
  mesh.init(MESH_PREFIX, MESH_PASSWORD, &userScheduler, MESH_PORT);
  
  // Designates this node as the Root Hub
  mesh.setRoot(true);
  mesh.setContainsRoot(true);

  mesh.onReceive(&receivedCallback);
}

void loop() {
  mesh.update();
}