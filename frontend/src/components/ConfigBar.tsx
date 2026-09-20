import React from 'react';
import { RefreshCw, Trash2, Server, Radio, Cpu } from 'lucide-react';
import type { PortInfo } from '../types/telemetry';

interface ConfigBarProps {
  serialConnected: boolean;
  mqttConnected: boolean;
  selectedPort: string;
  ports: PortInfo[];
  onPortSelect: (portName: string) => void;
  onScanPorts: () => void;
  onResetData: () => void;
}

export const ConfigBar: React.FC<ConfigBarProps> = ({
  serialConnected,
  mqttConnected,
  selectedPort,
  ports,
  onPortSelect,
  onScanPorts,
  onResetData
}) => {
  return (
    <section className="bg-white border border-slate-200 rounded-lg px-4 py-3 mb-5 flex items-center justify-between flex-wrap gap-3 shadow-sm">
      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Ingestion Feeds:</span>

        {/* Serial Hardware Gateway Status */}
        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-md px-2.5 py-1 text-xs">
          <Cpu className="w-3.5 h-3.5 text-blue-600" />
          <span className="font-medium text-slate-700">Serial COM:</span>
          <span className={`inline-block w-2 h-2 rounded-full ${serialConnected ? 'bg-emerald-500' : 'bg-amber-500'}`} />
          <span className="font-mono text-slate-600">{serialConnected ? (selectedPort || 'Active') : 'Standby'}</span>
        </div>

        {/* COM Port Selector */}
        <select
          value={selectedPort}
          onChange={(e) => onPortSelect(e.target.value)}
          className="text-xs px-2.5 py-1 bg-white border border-slate-300 rounded-md text-slate-800 font-medium focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          {ports.length === 0 ? (
            <option value="">No COM Ports Detected</option>
          ) : (
            ports.map((p) => (
              <option key={p.device} value={p.device}>
                {p.device} - {p.description}
              </option>
            ))
          )}
        </select>

        <button
          onClick={onScanPorts}
          title="Rescan Hardware COM Ports"
          className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-md transition-colors"
        >
          <RefreshCw className="w-3 h-3" />
          <span>Rescan</span>
        </button>

        {/* MQTT Industrial Gateway Status */}
        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-md px-2.5 py-1 text-xs">
          <Radio className="w-3.5 h-3.5 text-blue-600" />
          <span className="font-medium text-slate-700">MQTT Broker:</span>
          <span className={`inline-block w-2 h-2 rounded-full ${mqttConnected ? 'bg-emerald-500' : 'bg-slate-400'}`} />
          <span className="text-slate-600">{mqttConnected ? 'Subscribed' : 'Connecting'}</span>
        </div>

        {/* Reset Database and Telemetry Buffer */}
        <button
          onClick={onResetData}
          title="Clear Telemetry Records and Reset Alerts"
          className="flex items-center gap-1.5 px-3 py-1 text-xs font-medium text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-md transition-colors"
        >
          <Trash2 className="w-3 h-3 text-rose-600" />
          <span>Reset All</span>
        </button>
      </div>

      <div className="flex items-center gap-2 text-xs text-slate-500">
        <Server className="w-3.5 h-3.5 text-blue-600" />
        <span>PostgreSQL Pool: <code className="text-slate-700 font-mono">iot_dashboard</code></span>
      </div>
    </section>
  );
};
