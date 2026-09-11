import React from 'react';
import { Send } from 'lucide-react';

export interface AiPromptInputProps {
  inputMessage: string;
  setInputMessage: (msg: string) => void;
  onSendMessage: (text?: string) => void;
  isTyping: boolean;
  quickPrompts: string[];
  showQuickPrompts: boolean;
}

export const AiPromptInput: React.FC<AiPromptInputProps> = ({
  inputMessage,
  setInputMessage,
  onSendMessage,
  isTyping,
  quickPrompts,
  showQuickPrompts
}) => {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      onSendMessage();
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {/* Suggested Prompts (disappears once user sends first prompt in current session) */}
      {showQuickPrompts && (
        <div
          style={{
            padding: '10px 20px',
            borderTop: '1px solid #f1f5f9',
            backgroundColor: '#fafbfc',
            display: 'flex',
            flexWrap: 'wrap',
            gap: '6px',
            overflow: 'hidden'
          }}
        >
          {quickPrompts.map((prompt, idx) => (
            <button
              key={idx}
              onClick={() => onSendMessage(prompt)}
              style={{
                fontSize: '11px',
                fontWeight: '600',
                padding: '5px 12px',
                borderRadius: '9999px',
                backgroundColor: '#ffffff',
                border: '1px solid #cbd5e1',
                color: '#334155',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                whiteSpace: 'nowrap'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#2563eb';
                e.currentTarget.style.color = '#2563eb';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#cbd5e1';
                e.currentTarget.style.color = '#334155';
              }}
            >
              {prompt}
            </button>
          ))}
        </div>
      )}

      {/* Input Bar */}
      <div style={{ padding: '14px 20px', borderTop: '1px solid #e2e8f0', display: 'flex', gap: '10px', backgroundColor: '#ffffff' }}>
        <input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask about live voltages, submersion depth, gas levels, pole tilt, or node health..."
          style={{
            flex: 1,
            padding: '10px 14px',
            borderRadius: '6px',
            border: '1px solid #cbd5e1',
            fontSize: '12.5px',
            outline: 'none',
            backgroundColor: '#ffffff',
            color: '#0f172a'
          }}
        />
        <button
          onClick={() => onSendMessage()}
          disabled={!inputMessage.trim() || isTyping}
          style={{
            padding: '0 18px',
            borderRadius: '6px',
            backgroundColor: '#2563eb',
            color: '#ffffff',
            border: 'none',
            cursor: !inputMessage.trim() || isTyping ? 'not-allowed' : 'pointer',
            opacity: !inputMessage.trim() || isTyping ? 0.6 : 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            fontSize: '12.5px',
            fontWeight: '600'
          }}
        >
          <span>Send</span>
          <Send style={{ width: '13px', height: '13px' }} />
        </button>
      </div>
    </div>
  );
};
