---
name: spatial-map-reporting
description: >-
  Architectural and operational guidelines for the offline Live Map vector schematic,
  scalable pole navigation with search dropdowns, and PostgreSQL audit report generator.
---

# Spatial Map, Search & Audit Reporting Skill

This skill details the patterns for building and operating spatial map topologies, scalable fleet navigation, and audit report generators within the air-gapped NIRIKSHA IoT Platform.

---

## 🗺️ Live Vector Map Guidelines (`LiveMapView.tsx`)

1. **100% Offline Air-Gapped Rendering:**
   - External tile servers (OpenStreetMap, Mapbox, Google Maps CDN) are prohibited.
   - All spatial rendering is generated via declarative SVG elements (`viewBox="0 0 1000 650"`).
   - Architectural coordinate grid pattern overlays are generated via SVG `<pattern>`.
2. **Node Pins & Link Topology:**
   - Coordinates are stored as relative percentages (`x: 0-100`, `y: 0-100`) mapped to physical Lat/Lng coordinates.
   - RF painlessMesh wireless links are illustrated with animated/staggered dashed stroke lines and cadence indicators (2300ms / 2500ms).
   - Dynamic coverage radii reflect each node's transceiver specifications.
3. **Interactive Inspection:**
   - Clicking any node pin highlights the marker and opens the Node Inspection Drawer showing live metrics (Voltage, Depth, Power, Tilt) and a direct navigation shortcut.

---

## 🔍 Scalable Pole Navigation & Search (`PoleSelectDropdown.tsx`)

1. **Extensibility for Large Fleets:**
   - Hardcoded 3-tab limits are replaced with scalable search dropdowns.
   - Text search filters across pole IDs, names, and functional roles.
2. **Real-Time Status Dots:**
   - Each entry in the dropdown visually signals node state:
     - 🟢 Green: Online & nominal
     - 🔴 Red: Tilt / Fallen hazard
     - 🟡 Amber: Offline / Signal lost

---

## 📋 Audit Reports Generator (`ReportsView.tsx`)

1. **Database-Driven Statistical Aggregation:**
   - Endpoint: `/api/telemetry/stats?since_timestamp=...&pole_id=...`
   - Computes Min, Max, and Average across all sensor dimensions without fetching millions of raw rows into client memory.
2. **Laboratory Print & PDF Stylesheet:**
   - Formatted in clean `#0f172a` and `#2563eb` typography.
   - Supports browser-native Print to PDF (`window.print()`).
3. **CSV Data Export:**
   - Endpoint: `/api/telemetry/export` returns RFC 4180 compliant CSV streams with appropriate `Content-Disposition: attachment` headers.
