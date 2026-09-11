import type { PoleId } from '../types/telemetry';

export interface PoleItem {
  id: PoleId;
  name: string;
  role: string;
  location?: string;
}

/**
 * Centralized catalog of field poles.
 * Engineered for arbitrary fleet scalability: additional poles can be appended
 * here or dynamically populated from backend fleet discovery.
 */
export const DEFAULT_POLES: PoleItem[] = [
  {
    id: 1,
    name: 'Pole 1 (Relay)',
    role: 'Submersion & Tilt Inundation Node',
    location: 'Zone 1 - Lowland Basin'
  },
  {
    id: 2,
    name: 'Pole 2 (Relay)',
    role: 'Power Grid & Current Monitoring Node',
    location: 'Zone 2 - Transformer Station'
  },
  {
    id: 3,
    name: 'Pole 3 (Root Hub)',
    role: 'Gateway Master & Air Quality Weather Sink',
    location: 'Zone 3 - Central Gateway'
  }
];

export const getPoleCatalog = (): PoleItem[] => {
  return DEFAULT_POLES;
};

export const getPoleById = (id: PoleId | number): PoleItem | undefined => {
  return DEFAULT_POLES.find((p) => p.id === id);
};
