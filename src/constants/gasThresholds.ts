// Calibration and Safety Threshold Standards for NIRIKSHA Sensor Array
// Each sensor has distinct atmospheric baselines, toxicity danger limits, and environmental characteristics:
// - MQ-7: Carbon Monoxide (CO) - highly lethal at low concentrations (>50 ppm is OSHA/NIOSH danger)
// - MQ-135: Air Quality (NH3, NOx, Alcohol, Benzene, Smoke) - ambient air deterioration (>150 ppm)
// - MQ-136: Hydrogen Sulfide (H2S) - sewer gas, extremely toxic at low ppm (>15 ppm)
// - Temperature: Ambient heat warning threshold (>45°C)
// - Humidity: Ambient relative humidity condensation threshold (>85%)

export interface GasThresholdConfig {
  mq7: number;        // Carbon Monoxide threshold in ppm (Default: 50)
  mq135: number;      // Air Quality / Pollution threshold in ppm (Default: 150)
  mq136: number;      // Hydrogen Sulfide / Sewage Gas threshold in ppm (Default: 15)
  temp: number;       // High Temperature Warning threshold in °C (Default: 45)
  humidity: number;   // High Relative Humidity Warning threshold in % (Default: 85)
}

export const DEFAULT_GAS_THRESHOLDS: GasThresholdConfig = {
  mq7: 50.0,
  mq135: 150.0,
  mq136: 15.0,
  temp: 45.0,
  humidity: 85.0
};
