import React from 'react';
import { Database, Trash2 } from 'lucide-react';

export interface DatabaseMaintenanceCardProps {
  dbHost: string;
  setDbHost: (h: string) => void;
  dbPort: number;
  setDbPort: (p: number) => void;
  dbUser: string;
  setDbUser: (u: string) => void;
  dbPassword: string;
  setDbPassword: (p: string) => void;
  dbName: string;
  setDbName: (n: string) => void;
  dbStatusMsg: { text: string; isError: boolean } | null;
  isUpdatingDb: boolean;
  onSaveDb: (e: React.FormEvent) => void;
  onResetData: () => void;
}

export const DatabaseMaintenanceCard: React.FC<DatabaseMaintenanceCardProps> = ({
  dbHost,
  setDbHost,
  dbPort,
  setDbPort,
  dbUser,
  setDbUser,
  dbPassword,
  setDbPassword,
  dbName,
  setDbName,
  dbStatusMsg,
  isUpdatingDb,
  onSaveDb,
  onResetData
}) => {
  return (
    <section style={{
      backgroundColor: '#ffffff',
      border: '1px solid #e2e8f0',
      borderRadius: '8px',
      padding: '20px',
      display: 'flex',
      flexDirection: 'column',
      gap: '16px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px' }}>
        <div style={{ width: '28px', height: '28px', borderRadius: '6px', backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563eb' }}>
          <Database style={{ width: '16px', height: '16px' }} />
        </div>
        <div>
          <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#0f172a', margin: 0 }}>
            Database Maintenance & Credentials
          </h3>
          <span style={{ fontSize: '11px', color: '#64748b' }}>
            PostgreSQL asyncpg batch storage credentials
          </span>
        </div>
      </div>

      <form onSubmit={onSaveDb} style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '10px' }}>
          <div>
            <label style={{ fontSize: '11px', fontWeight: '600', color: '#475569', display: 'block', marginBottom: '4px' }}>
              Host
            </label>
            <input
              type="text"
              value={dbHost}
              onChange={(e) => setDbHost(e.target.value)}
              style={{
                width: '100%',
                padding: '7px 10px',
                borderRadius: '6px',
                fontSize: '12px',
                border: '1px solid #cbd5e1',
                backgroundColor: '#ffffff'
              }}
              placeholder="localhost"
              required
            />
          </div>
          <div>
            <label style={{ fontSize: '11px', fontWeight: '600', color: '#475569', display: 'block', marginBottom: '4px' }}>
              Port
            </label>
            <input
              type="number"
              value={dbPort}
              onChange={(e) => setDbPort(parseInt(e.target.value) || 5432)}
              style={{
                width: '100%',
                padding: '7px 10px',
                borderRadius: '6px',
                fontSize: '12px',
                border: '1px solid #cbd5e1',
                backgroundColor: '#ffffff'
              }}
              required
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <div>
            <label style={{ fontSize: '11px', fontWeight: '600', color: '#475569', display: 'block', marginBottom: '4px' }}>
              Username
            </label>
            <input
              type="text"
              value={dbUser}
              onChange={(e) => setDbUser(e.target.value)}
              style={{
                width: '100%',
                padding: '7px 10px',
                borderRadius: '6px',
                fontSize: '12px',
                border: '1px solid #cbd5e1',
                backgroundColor: '#ffffff'
              }}
              required
            />
          </div>
          <div>
            <label style={{ fontSize: '11px', fontWeight: '600', color: '#475569', display: 'block', marginBottom: '4px' }}>
              Password
            </label>
            <input
              type="password"
              value={dbPassword}
              onChange={(e) => setDbPassword(e.target.value)}
              style={{
                width: '100%',
                padding: '7px 10px',
                borderRadius: '6px',
                fontSize: '12px',
                border: '1px solid #cbd5e1',
                backgroundColor: '#ffffff'
              }}
              placeholder="••••••••"
              required
            />
          </div>
        </div>

        <div>
          <label style={{ fontSize: '11px', fontWeight: '600', color: '#475569', display: 'block', marginBottom: '4px' }}>
            Database Name
          </label>
          <input
            type="text"
            value={dbName}
            onChange={(e) => setDbName(e.target.value)}
            style={{
              width: '100%',
              padding: '7px 10px',
              borderRadius: '6px',
              fontSize: '12px',
              border: '1px solid #cbd5e1',
              backgroundColor: '#ffffff'
            }}
            required
          />
        </div>

        {dbStatusMsg && (
          <div style={{
            fontSize: '11px',
            fontWeight: '600',
            padding: '8px 12px',
            borderRadius: '6px',
            backgroundColor: dbStatusMsg.isError ? '#fef2f2' : '#ecfdf5',
            color: dbStatusMsg.isError ? '#dc2626' : '#059669',
            border: `1px solid ${dbStatusMsg.isError ? '#fecaca' : '#a7f3d0'}`
          }}>
            {dbStatusMsg.text}
          </div>
        )}

        <button
          type="submit"
          disabled={isUpdatingDb}
          style={{
            marginTop: '4px',
            padding: '9px 14px',
            borderRadius: '6px',
            backgroundColor: isUpdatingDb ? '#94a3b8' : '#2563eb',
            color: '#ffffff',
            border: 'none',
            fontWeight: '600',
            fontSize: '13px',
            cursor: isUpdatingDb ? 'not-allowed' : 'pointer',
            transition: 'all 0.15s ease'
          }}
        >
          {isUpdatingDb ? 'Testing & Reconnecting...' : 'Save & Reconnect DB'}
        </button>
      </form>

      <div style={{
        borderTop: '1px solid #f1f5f9',
        paddingTop: '14px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 'auto'
      }}>
        <div>
          <div style={{ fontSize: '12px', fontWeight: '600', color: '#0f172a' }}>Purge Telemetry History</div>
          <div style={{ fontSize: '11px', color: '#64748b' }}>Clear records & reset charts</div>
        </div>
        <button
          type="button"
          onClick={onResetData}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '7px 12px',
            borderRadius: '6px',
            fontSize: '12px',
            fontWeight: '600',
            border: '1px solid #fecaca',
            backgroundColor: '#fef2f2',
            color: '#b91c1c',
            cursor: 'pointer'
          }}
        >
          <Trash2 style={{ width: '13px', height: '13px' }} />
          Purge Data
        </button>
      </div>
    </section>
  );
};
