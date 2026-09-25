import type { TelemetryPacket, PersistentAlert } from '../types/telemetry';

export function generateLocalAiResponse(
  prompt: string,
  latestPole1: TelemetryPacket | null,
  latestPole2: TelemetryPacket | null,
  latestPole3: TelemetryPacket | null,
  persistentAlerts: PersistentAlert[]
): string {
  const p = prompt.toLowerCase().trim();

  // Specific pole queries
  if (p.includes('pole 1') || p.includes('node 1')) {
    if (!latestPole1) return "📡 **Pole 1 Diagnostic:** Telemetry packet is currently initializing.";
    const isLeak = (latestPole1.voltage ?? 0) > 5.0;
    return `### 📡 Pole 1 Diagnostic Status
- **Voltage:** \`${latestPole1.voltage?.toFixed(2)} V\` (${isLeak ? '🚨 **CRITICAL ELECTRIFICATION LEAK**' : '✅ Safe Grounding'})
- **Water Submersion:** \`${latestPole1.water_depth?.toFixed(1)} cm\` (${(latestPole1.water_depth ?? 0) > 100 ? '⚠️ High Flood Inundation' : '✅ Safe Drain'})
- **Temperature:** \`${latestPole1.temperature?.toFixed(1)} °C\`
- **Structural Inclination:** ${latestPole1.is_upright ? '✅ Upright Nominal' : '🚨 **STRUCTURAL TILT / COLLAPSE**'}
- **Air Pollutants (MQ-135):** \`${latestPole1.mq135?.toFixed(1)} ppm\`
- **RF Mesh Sequence:** \`#${latestPole1.seq}\``;
  }

  if (p.includes('pole 2') || p.includes('node 2')) {
    if (!latestPole2) return "📡 **Pole 2 Diagnostic:** Telemetry packet is currently initializing.";
    const isFire = (latestPole2.temperature ?? 0) >= 60.0;
    return `### 📡 Pole 2 Diagnostic Status
- **Voltage:** \`${latestPole2.voltage?.toFixed(2)} V\`
- **Water Submersion:** \`${latestPole2.water_depth?.toFixed(1)} cm\`
- **Temperature:** \`${latestPole2.temperature?.toFixed(1)} °C\` (${isFire ? '🔥 **THERMAL FIRE OUTBREAK**' : '✅ Nominal Ambient'})
- **Structural Inclination:** ${latestPole2.is_upright ? '✅ Upright Nominal' : '🚨 **STRUCTURAL TILT / COLLAPSE**'}
- **RF Mesh Sequence:** \`#${latestPole2.seq}\``;
  }

  if (p.includes('pole 3') || p.includes('node 3') || p.includes('gas') || p.includes('mq') || p.includes('air quality')) {
    if (!latestPole3) return "📡 **Pole 3 Diagnostic:** Telemetry packet is currently initializing.";
    const isCoHigh = (latestPole3.mq7 ?? 0) > 50;
    const isVocHigh = (latestPole3.mq135 ?? 0) > 150;
    const isH2sHigh = (latestPole3.mq136 ?? 0) > 15;
    return `### 📡 Pole 3 Quad-Gas Array Telemetry
- **Carbon Monoxide (MQ-7):** \`${latestPole3.mq7?.toFixed(1)} ppm\` (${isCoHigh ? '🚨 **HAZARDOUS CO LEVEL**' : '✅ Safe Safe Environs'})
- **Air Quality & VOCs (MQ-135):** \`${latestPole3.mq135?.toFixed(1)} ppm\` (${isVocHigh ? '⚠️ **ELEVATED CONTAMINANTS**' : '✅ Good Air Quality'})
- **Sewage Gas / H2S (MQ-136):** \`${latestPole3.mq136?.toFixed(1)} ppm\` (${isH2sHigh ? '⚠️ **H2S LEAK DETECTED**' : '✅ Baseline'})
- **Power Draw:** \`${latestPole3.power?.toFixed(1)} W\``;
  }

  if (p.includes('hazard') || p.includes('alert') || p.includes('emergency') || p.includes('voltage') || p.includes('fire') || p.includes('flood')) {
    const hazards: string[] = [];

    [
      { id: 1, pkt: latestPole1 },
      { id: 2, pkt: latestPole2 },
      { id: 3, pkt: latestPole3 }
    ].forEach(({ id, pkt }) => {
      if (!pkt) return;
      if (pkt.voltage && pkt.voltage > 5.0) {
        hazards.push(`⚡ **Pole ${id} Water Electrification:** Measured submerged voltage of \`${pkt.voltage.toFixed(2)}V\` exceeds the 5.0V life safety limit.`);
      }
      if (pkt.temperature && pkt.temperature >= 60.0) {
        hazards.push(`🔥 **Pole ${id} Fire Outbreak:** Measured ambient thermal spike of \`${pkt.temperature.toFixed(1)}°C\` triggers emergency fire protocols.`);
      }
      if (pkt.water_depth && pkt.water_depth > 100.0) {
        hazards.push(`🌊 **Pole ${id} Severe Flood:** Inundation level reached \`${pkt.water_depth.toFixed(1)}cm\`.`);
      }
      if (pkt.is_upright === false) {
        hazards.push(`🚨 **Pole ${id} Structural Inclinometer Trip:** Node is tilted beyond 45° or fallen.`);
      }
    });

    if (hazards.length > 0) {
      return `### 🚨 Active Critical Safety Emergencies (${hazards.length})
${hazards.map((h) => `- ${h}`).join('\n')}

#### 🛠️ Recommended Operator Response:
1. Isolate feeder power to the affected section if voltage exceeds 5V.
2. Verify visual confirmation or dispatch field emergency teams.
3. Acknowledge and manage active entries in the **Alerts & Hazards** view.`;
    }

    const unresolved = persistentAlerts.filter((a) => a.status === 'UNRESOLVED').length;
    return `### 🛡️ Fleet Safety Status: Nominal
All active nodes are operating within established safety envelopes:
- Submerged voltages are safely grounded (< 5.0V).
- Surface water inundation levels remain below alert thresholds (< 100cm).
- Structural tilt sensors confirm all poles remain upright.
${unresolved > 0 ? `*Note: There are ${unresolved} unresolved historical incidents logged.*` : '*Zero active warnings on mesh network.*'}`;
  }

  // Fallback broad summary
  return `### 🤖 NIRIKSHA Telemetry & Safety Intelligence
The browser simulation engine is monitoring telemetry streams across Poles 1, 2, and 3:

| Metric | Status | Normal Range |
| :--- | :--- | :--- |
| **Water Voltage** | Safe Grounding | < 5.0 V |
| **Water Level** | Inundation Safe | < 100 cm |
| **Thermal Fire** | Ambient Nominal | < 60 °C |
| **Air Quality** | Good Dispersion | < 150 ppm |

💡 *Ask me questions like:*
- *"Is there any voltage hazard?"*
- *"Show status of Pole 1"*
- *"What are the gas readings on Pole 3?"*
- *"Explain safety protocol for water electrification"*`;
}
