import React from 'react';
import { Cpu } from 'lucide-react';

export interface OllamaConfigCardProps {
  ollamaHost: string;
  setOllamaHost: (h: string) => void;
  ollamaModel: string;
  setOllamaModel: (m: string) => void;
  ollamaStatusMsg: { text: string; isError: boolean } | null;
  isUpdatingOllama: boolean;
  onSaveOllama: (e: React.FormEvent) => void;
}

export const OllamaConfigCard: React.FC<OllamaConfigCardProps> = ({
  ollamaHost,
  setOllamaHost,
  ollamaModel,
  setOllamaModel,
  ollamaStatusMsg,
  isUpdatingOllama,
  onSaveOllama
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
        <div style={{ width: '28px', height: '28px', borderRadius: '6px', backgroundColor: '#f5f3ff', border: '1px solid #ddd6fe', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#7c3aed' }}>
          <Cpu style={{ width: '16px', height: '16px' }} />
        </div>
        <div>
          <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#0f172a', margin: 0 }}>
            Ollama AI Local Engine
          </h3>
          <span style={{ fontSize: '11px', color: '#64748b' }}>
            Offline LLM inference endpoint & model tag
          </span>
        </div>
      </div>

      <form onSubmit={onSaveOllama} style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1 }}>
        <div>
          <label style={{ fontSize: '11px', fontWeight: '600', color: '#475569', display: 'block', marginBottom: '4px' }}>
            Ollama Model Tag (e.g. what you use for ollama pull)
          </label>
          <input
            type="text"
            value={ollamaModel}
            onChange={(e) => setOllamaModel(e.target.value)}
            style={{
              width: '100%',
              padding: '7px 10px',
              borderRadius: '6px',
              fontSize: '12px',
              border: '1px solid #cbd5e1',
              backgroundColor: '#ffffff',
              fontFamily: 'monospace'
            }}
            placeholder="qwen2.5:0.5b or llama3.2:1b"
            required
          />
          <span style={{ fontSize: '11px', color: '#64748b', display: 'block', marginTop: '3px' }}>
            Directly matches model pulled via <code style={{ backgroundColor: '#f1f5f9', padding: '1px 4px', borderRadius: '3px' }}>ollama pull &lt;model&gt;</code>.
          </span>
        </div>

        <div>
          <label style={{ fontSize: '11px', fontWeight: '600', color: '#475569', display: 'block', marginBottom: '4px' }}>
            Ollama Daemon Endpoint (Host & Port)
          </label>
          <input
            type="text"
            value={ollamaHost}
            onChange={(e) => setOllamaHost(e.target.value)}
            style={{
              width: '100%',
              padding: '7px 10px',
              borderRadius: '6px',
              fontSize: '12px',
              border: '1px solid #cbd5e1',
              backgroundColor: '#ffffff',
              fontFamily: 'monospace'
            }}
            placeholder="http://127.0.0.1:11434"
            required
          />
          <span style={{ fontSize: '11px', color: '#64748b', display: 'block', marginTop: '3px' }}>
            Default local HTTP API port: <code style={{ backgroundColor: '#f1f5f9', padding: '1px 4px', borderRadius: '3px' }}>11434</code>.
          </span>
        </div>

        {ollamaStatusMsg && (
          <div style={{
            fontSize: '11px',
            fontWeight: '600',
            padding: '8px 12px',
            borderRadius: '6px',
            backgroundColor: ollamaStatusMsg.isError ? '#fef2f2' : '#ecfdf5',
            color: ollamaStatusMsg.isError ? '#dc2626' : '#059669',
            border: `1px solid ${ollamaStatusMsg.isError ? '#fecaca' : '#a7f3d0'}`
          }}>
            {ollamaStatusMsg.text}
          </div>
        )}

        <button
          type="submit"
          disabled={isUpdatingOllama}
          style={{
            marginTop: 'auto',
            padding: '9px 14px',
            borderRadius: '6px',
            backgroundColor: isUpdatingOllama ? '#94a3b8' : '#7c3aed',
            color: '#ffffff',
            border: 'none',
            fontWeight: '600',
            fontSize: '13px',
            cursor: isUpdatingOllama ? 'not-allowed' : 'pointer',
            transition: 'all 0.15s ease'
          }}
        >
          {isUpdatingOllama ? 'Saving Configuration...' : 'Save Ollama Configuration'}
        </button>
      </form>
    </section>
  );
};
