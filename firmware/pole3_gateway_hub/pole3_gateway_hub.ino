#include "painlessMesh.h"
#include <ArduinoJson.h>
#include <Wire.h>
#include "DHT.h"

// =====================================================
// MESH NETWORK
// =====================================================

#define MESH_PREFIX   "NIRIKSHA_MESH"
#define MESH_PASSWORD "nirikshaSecure2026"
#define MESH_PORT     5555

painlessMesh mesh;
Scheduler userScheduler;


// =====================================================
// SENSOR PINS
// =====================================================

#define MQ135_PIN 34
#define MQ7_PIN   35

// MPU6050
#define SDA_PIN 32
#define SCL_PIN 33

#define MPU_ADDR 0x68

// DHT11
#define DHTPIN 27
#define DHTTYPE DHT11

DHT dht(DHTPIN, DHTTYPE);


// =====================================================
// MPU6050 VARIABLES
// =====================================================

int16_t rawAcX, rawAcY, rawAcZ;
int16_t rawTmp;
int16_t rawGyX, rawGyY, rawGyZ;

float ax_offset = 0;
float ay_offset = 0;
float az_offset = 0;

float gx_offset = 0;
float gy_offset = 0;
float gz_offset = 0;


// =====================================================
// TELEMETRY TASK
// =====================================================

void broadcastLocalTelemetry();

Task taskSendTelemetry(
  3000,
  TASK_FOREVER,
  &broadcastLocalTelemetry
);


// =====================================================
// MESH STATUS TASK
// =====================================================

void checkMeshStatus();

Task taskCheckMesh(
  3000,
  TASK_FOREVER,
  &checkMeshStatus
);


// =====================================================
// READ MPU6050
// =====================================================

void readMPU() {

  Wire.beginTransmission(MPU_ADDR);
  Wire.write(0x3B);
  Wire.endTransmission(false);

  Wire.requestFrom(MPU_ADDR, 14, true);

  if (Wire.available() >= 14) {

    rawAcX = Wire.read() << 8 | Wire.read();
    rawAcY = Wire.read() << 8 | Wire.read();
    rawAcZ = Wire.read() << 8 | Wire.read();

    rawTmp = Wire.read() << 8 | Wire.read();

    rawGyX = Wire.read() << 8 | Wire.read();
    rawGyY = Wire.read() << 8 | Wire.read();
    rawGyZ = Wire.read() << 8 | Wire.read();
  }
}


// =====================================================
// MPU6050 CALIBRATION
// =====================================================

void calibrateMPU() {

  Serial.println("Calibrating MPU6050...");
  Serial.println("KEEP MPU6050 FLAT AND STILL!");

  for (int i = 0; i < 200; i++) {

    readMPU();

    ax_offset += rawAcX;
    ay_offset += rawAcY;
    az_offset += (rawAcZ - 16384);

    gx_offset += rawGyX;
    gy_offset += rawGyY;
    gz_offset += rawGyZ;

    delay(5);
  }

  ax_offset /= 200;
  ay_offset /= 200;
  az_offset /= 200;

  gx_offset /= 200;
  gy_offset /= 200;
  gz_offset /= 200;

  Serial.println("MPU6050 Calibration Done!");
}


// =====================================================
// SENSOR TELEMETRY
// =====================================================

void broadcastLocalTelemetry() {

  // ===================================================
  // MQ SENSORS
  // ===================================================

  int mq135_val = analogRead(MQ135_PIN);
  int mq7_val   = analogRead(MQ7_PIN);


  // ===================================================
  // DHT11
  // ===================================================

  float humidity = dht.readHumidity();
  float dhtTemp  = dht.readTemperature();


  // ===================================================
  // MPU6050
  // ===================================================

  readMPU();

  float ax = (rawAcX - ax_offset) / 16384.0 * 9.81;
  float ay = (rawAcY - ay_offset) / 16384.0 * 9.81;
  float az = (rawAcZ - az_offset) / 16384.0 * 9.81;

  float gx = (rawGyX - gx_offset) / 131.0;
  float gy = (rawGyY - gy_offset) / 131.0;
  float gz = (rawGyZ - gz_offset) / 131.0;

  float mpuTemp = (rawTmp / 340.0) + 36.53;


  // ===================================================
  // JSON
  // ===================================================

  StaticJsonDocument<512> doc;

  doc["pole_id"] = 3;
  doc["mesh_node_id"] = mesh.getNodeId();

  // MQ
  doc["air_quality_raw"] = mq135_val;
  doc["co_raw"] = mq7_val;

  // DHT11
  if (!isnan(humidity))
    doc["humidity"] = humidity;
  else
    doc["humidity"] = nullptr;

  if (!isnan(dhtTemp))
    doc["temperature"] = dhtTemp;
  else
    doc["temperature"] = nullptr;

  // MPU Accelerometer
  doc["accel_x"] = ax;
  doc["accel_y"] = ay;
  doc["accel_z"] = az;

  // MPU Gyroscope
  doc["gyro_x"] = gx;
  doc["gyro_y"] = gy;
  doc["gyro_z"] = gz;

  // MPU Temperature
  doc["mpu_temperature"] = mpuTemp;


  // ===================================================
  // SERIALIZE
  // ===================================================

  String jsonOutput;

  serializeJson(doc, jsonOutput);


  // ===================================================
  // ALWAYS SEND TO PYTHON BACKEND
  // ===================================================

  Serial.printf("MESH_JSON:%s\n", jsonOutput.c_str());


  // ===================================================
  // SEND THROUGH MESH IF AVAILABLE
  // ===================================================

  if (mesh.getNodeList().size() > 0) {

    mesh.sendBroadcast(jsonOutput);

    Serial.println("MESH: Payload broadcasted");

  } else {

    Serial.println("MESH: No nodes connected - payload kept local");

  }
}


// =====================================================
// CHECK MESH STATUS
// =====================================================

void checkMeshStatus() {

  int nodeCount = mesh.getNodeList().size();

  if (nodeCount > 0) {

    Serial.print("MESH STATUS: CONNECTED | Nodes: ");
    Serial.println(nodeCount);

  } else {

    Serial.println("MESH STATUS: DISCONNECTED | Searching for nodes...");
  }
}


// =====================================================
// RECEIVE MESH PACKETS
// =====================================================

void receivedCallback(uint32_t from, String &msg) {

  Serial.printf(
    "MESH_JSON:%s\n",
    msg.c_str()
  );
}


// =====================================================
// CONNECTION EVENTS
// =====================================================

void newConnectionCallback(uint32_t nodeId) {

  Serial.print("MESH: New connection -> ");
  Serial.println(nodeId);
}


void changedConnectionCallback() {

  Serial.println("MESH: Connection topology changed");

  int nodeCount = mesh.getNodeList().size();

  Serial.print("MESH: Connected nodes = ");
  Serial.println(nodeCount);
}


void droppedConnectionCallback(uint32_t nodeId) {

  Serial.print("MESH: Node disconnected -> ");
  Serial.println(nodeId);
}


// =====================================================
// SETUP
// =====================================================

void setup() {

  Serial.begin(115200);

  // ===================================================
  // ADC
  // ===================================================

  analogSetAttenuation(ADC_11db);

  pinMode(MQ135_PIN, INPUT);
  pinMode(MQ7_PIN, INPUT);


  // ===================================================
  // I2C
  // ===================================================

  Wire.begin(SDA_PIN, SCL_PIN);


  // ===================================================
  // DHT11
  // ===================================================

  dht.begin();


  // ===================================================
  // MPU6050
  // ===================================================

  Wire.beginTransmission(MPU_ADDR);
  Wire.write(0x6B);
  Wire.write(0x00);
  Wire.endTransmission(true);

  // DLPF = 21 Hz
  Wire.beginTransmission(MPU_ADDR);
  Wire.write(0x1A);
  Wire.write(0x04);
  Wire.endTransmission(true);


  // ===================================================
  // CALIBRATION
  // ===================================================

  calibrateMPU();


  // ===================================================
  // MESH
  // ===================================================

  mesh.setDebugMsgTypes(ERROR | STARTUP);

  mesh.init(
    MESH_PREFIX,
    MESH_PASSWORD,
    &userScheduler,
    MESH_PORT
  );

  mesh.setContainsRoot(true);

  // Receive data
  mesh.onReceive(&receivedCallback);

  // Connection events
  mesh.onNewConnection(&newConnectionCallback);
  mesh.onChangedConnections(&changedConnectionCallback);
  mesh.onDroppedConnection(&droppedConnectionCallback);


  // ===================================================
  // TASKS
  // ===================================================

  userScheduler.addTask(taskSendTelemetry);
  taskSendTelemetry.enable();

  userScheduler.addTask(taskCheckMesh);
  taskCheckMesh.enable();


  // ===================================================
  // STARTUP MESSAGE
  // ===================================================

  Serial.println();
  Serial.println("======================================");
  Serial.println("     NIRIKSHA SENSOR MESH NODE");
  Serial.println("======================================");

  Serial.println("MQ135      -> GPIO 34");
  Serial.println("MQ7        -> GPIO 35");
  Serial.println("MPU SDA    -> GPIO 32");
  Serial.println("MPU SCL    -> GPIO 33");
  Serial.println("DHT11      -> GPIO 27");

  Serial.println("--------------------------------------");
  Serial.println("Sensor telemetry: EVERY 3 SECONDS");
  Serial.println("Mesh reconnection: AUTOMATIC");
  Serial.println("USB backend: ALWAYS ACTIVE");
  Serial.println("======================================");
}


// =====================================================
// LOOP
// =====================================================

void loop() {

  // IMPORTANT:
  // This continuously handles:
  // - Mesh packets
  // - Discovery
  // - Reconnection
  // - Routing
  // - Connection changes

  mesh.update();
}