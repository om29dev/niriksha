// Calibration and Safety Threshold Standards for NIRIKSHA Multi-Gas Array
// Each gas has distinct atmospheric baselines, toxicity danger limits, and sensor response characteristics:
// - MQ-7: Carbon Monoxide (CO) - highly lethal at low concentrations (>50 ppm is OSHA/NIOSH danger)
// - MQ-135: Air Quality (NH3, NOx, Alcohol, Benzene, Smoke) - ambient air deterioration (>150 ppm)
// - MQ-136: Hydrogen Sulfide (H2S) - sewer gas, extremely toxic at low ppm (>15 ppm)
// - MQ-2: Smoke & Combustible Gases (LPG, Propane, Methane, Hydrogen) - combustion / explosive (>300 ppm)

export interface GasThresholdConfig {
  mq7: number;    // Carbon Monoxide threshold in ppm (Default: 50)
  mq135: number;  // Air Quality / Pollution threshold in ppm (Default: 150)
  mq136: number;  // Hydrogen Sulfide / Sewage Gas threshold in ppm (Default: 15)
  mq2: number;    // Combustible Gas / Smoke threshold in ppm (Default: 300)
}

export const DEFAULT_GAS_THRESHOLDS: GasThresholdConfig = {
  mq7: 50.0,
  mq135: 150.0,
  mq136: 15.0,
  mq2: 300.0
};
