export interface PoleGeoConfig {
  id: number;
  name: string;
  role: string;
  x: number; // SVG percent coordinate [0, 100]
  y: number;
  lat: number;
  lng: number;
  coverageRadius: number; // in meters
}

export const POLE_GEO_CONFIGS: Record<number, PoleGeoConfig> = {
  1: {
    id: 1,
    name: 'Pole 1 (Relay)',
    role: 'Flood & Tilt Inundation Node',
    x: 28,
    y: 68,
    lat: 18.5204,
    lng: 73.8567,
    coverageRadius: 180
  },
  2: {
    id: 2,
    name: 'Pole 2 (Relay)',
    role: 'Power Grid Monitoring Node',
    x: 74,
    y: 62,
    lat: 18.5221,
    lng: 73.8592,
    coverageRadius: 200
  },
  3: {
    id: 3,
    name: 'Pole 3 (Root Hub)',
    role: 'Gateway Master & Air Quality Sink',
    x: 50,
    y: 28,
    lat: 18.5235,
    lng: 73.8580,
    coverageRadius: 260
  }
};
