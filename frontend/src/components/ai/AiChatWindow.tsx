import React, { useRef, useEffect } from 'react';
import { Bot, User, Sparkles, PanelLeftOpen, Plus } from 'lucide-react';
import type { ChatMessage, ChatSession } from './AiChatSidebar';
import { MarkdownContent } from '../MarkdownContent';

export interface AiChatWindowProps {
  activeSession: ChatSession | null;
  isSidebarOpen: boolean;
  onOpenSidebar: () => void;
  onCreateNewChat: () => void;
  isTyping: boolean;
}

export const AiChatWindow: React.FC<AiChatWindowProps> = ({
  activeSession,
  isSidebarOpen,
  onOpenSidebar,
  onCreateNewChat,
  isTyping
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [activeSession?.messages, isTyping]);

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Top Chat Header Bar */}
      <div
        style={{
          padding: '12px 18px',
          borderBottom: '1px solid #e2e8f0',
          backgroundColor: '#ffffff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {!isSidebarOpen && (
            <button
              onClick={onOpenSidebar}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: '#64748b',
                padding: '4px',
                borderRadius: '4px',
                display: 'flex',
                alignItems: 'center'
              }}
              title="Open chat history sidebar"
            >
              <PanelLeftOpen style={{ width: '18px', height: '18px' }} />
            </button>
          )}

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Sparkles style={{ width: '16px', height: '16px', color: '#2563eb' }} />
              <h3 style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a', margin: 0 }}>
                {activeSession?.title || 'NIRIKSHA AI Assistant'}
              </h3>
            </div>
            <span style={{ fontSize: '11px', color: '#64748b' }}>
              Offline telemetry reasoning & safety assistant
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={onCreateNewChat}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '5px 10px',
              borderRadius: '5px',
              border: '1px solid #cbd5e1',
              backgroundColor: '#ffffff',
              color: '#334155',
              fontSize: '11.5px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            <Plus style={{ width: '13px', height: '13px' }} />
            <span>New Chat</span>
          </button>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {activeSession?.messages.map((m: ChatMessage) => {
          const isUser = m.role === 'user';
          return (
            <div
              key={m.id}
              style={{
                display: 'flex',
                justifyContent: isUser ? 'flex-end' : 'flex-start',
                gap: '10px'
              }}
            >
              {!isUser && (
                <div
                  style={{
                    width: '30px',
                    height: '30px',
                    borderRadius: '8px',
                    backgroundColor: '#eff6ff',
                    border: '1px solid #bfdbfe',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#2563eb',
                    flexShrink: 0
                  }}
                >
                  <Bot style={{ width: '16px', height: '16px' }} />
                </div>
              )}

              <div
                style={{
                  maxWidth: '75%',
                  padding: '12px 16px',
                  borderRadius: '8px',
                  backgroundColor: isUser ? '#2563eb' : '#f8fafc',
                  color: isUser ? '#ffffff' : '#0f172a',
                  border: isUser ? 'none' : '1px solid #e2e8f0',
                  fontSize: '12.5px',
                  lineHeight: '1.5'
                }}
              >
                <MarkdownContent content={m.content} isUser={isUser} />
                <div
                  style={{
                    fontSize: '9.5px',
                    color: isUser ? '#bfdbfe' : '#94a3b8',
                    marginTop: '6px',
                    textAlign: 'right'
                  }}
                >
                  {m.timestamp}
                </div>
              </div>

              {isUser && (
                <div
                  style={{
                    width: '30px',
                    height: '30px',
                    borderRadius: '8px',
                    backgroundColor: '#f1f5f9',
                    border: '1px solid #cbd5e1',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#475569',
                    flexShrink: 0
                  }}
                >
                  <User style={{ width: '16px', height: '16px' }} />
                </div>
              )}
            </div>
          );
        })}

        {isTyping && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '30px',
                height: '30px',
                borderRadius: '8px',
                backgroundColor: '#eff6ff',
                border: '1px solid #bfdbfe',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#2563eb'
              }}
            >
              <Bot style={{ width: '16px', height: '16px' }} />
            </div>
            <div style={{ padding: '8px 14px', borderRadius: '8px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', fontSize: '12px', color: '#64748b' }}>
              Evaluating telemetry across mesh nodes...
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>
    </div>
  );
};
