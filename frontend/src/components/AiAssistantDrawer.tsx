import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  X,
  Send,
  Bot,
  Maximize2,
  Plus
} from 'lucide-react';
import type { PoleId, TelemetryPacket, PersistentAlert, PoleState } from '../types/telemetry';
import { MarkdownContent } from './MarkdownContent';

interface AiAssistantDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  latestPole1: TelemetryPacket | null;
  latestPole2: TelemetryPacket | null;
  latestPole3: TelemetryPacket | null;
  persistentAlerts: PersistentAlert[];
  poleStateMap: Record<PoleId, PoleState>;
  onNavigatePole?: (poleId: PoleId) => void;
  onOpenFullView?: () => void;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

interface ChatSession {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  messages: ChatMessage[];
}

const STORAGE_KEY = 'niriksha_ai_chat_sessions';
const ACTIVE_SESSION_KEY = 'niriksha_ai_active_session_id';

const QUICK_ACTIONS = [
  "Assess overall fleet health",
  "Check high voltage leakage risk",
  "Evaluate water flood depth",
  "Inspect gas and air quality levels",
  "Check pole upright stability"
];

const DEFAULT_WELCOME_MSG: ChatMessage = {
  id: 'welcome',
  role: 'assistant',
  content: "Hello Operator! I have live direct access to all sensor streams across your mesh nodes. Ask me to diagnose any anomaly, explain active alerts, or analyze power and environmental thresholds.",
  timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
};

function createDrawerSession(customTitle?: string): ChatSession {
  const now = Date.now();
  return {
    id: `session-${now}-${Math.random().toString(36).substring(2, 7)}`,
    title: customTitle || 'New Conversation',
    createdAt: now,
    updatedAt: now,
    messages: [DEFAULT_WELCOME_MSG]
  };
}

export const AiAssistantDrawer: React.FC<AiAssistantDrawerProps> = ({
  isOpen,
  onClose,
  latestPole1: _latestPole1,
  latestPole2: _latestPole2,
  latestPole3: _latestPole3,
  persistentAlerts,
  onNavigatePole: _onNavigatePole,
  onOpenFullView
}) => {
  const [inputMessage, setInputMessage] = useState<string>('');
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const [sessions, setSessions] = useState<ChatSession[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed: ChatSession[] = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Failed to load chat sessions in drawer', e);
    }
    return [createDrawerSession('System Diagnostics')];
  });

  const [activeSessionId, setActiveSessionId] = useState<string>(() => {
    try {
      const savedActive = localStorage.getItem(ACTIVE_SESSION_KEY);
      if (savedActive) return savedActive;
    } catch {
      // fallback
    }
    return '';
  });

  // Re-sync when drawer opens or storage updates
  useEffect(() => {
    if (!isOpen) return;

    const reloadFromStorage = () => {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed: ChatSession[] = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setSessions(parsed);
          }
        }
        const savedActive = localStorage.getItem(ACTIVE_SESSION_KEY);
        if (savedActive) {
          setActiveSessionId(savedActive);
        }
      } catch (e) {
        console.error('Error syncing drawer storage', e);
      }
    };

    reloadFromStorage();

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY || e.key === ACTIVE_SESSION_KEY) {
        reloadFromStorage();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [isOpen]);

  // Ensure activeSessionId is valid
  useEffect(() => {
    if (!sessions.some(s => s.id === activeSessionId)) {
      if (sessions.length > 0) {
        setActiveSessionId(sessions[0].id);
      } else {
        const fresh = createDrawerSession('System Diagnostics');
        setSessions([fresh]);
        setActiveSessionId(fresh.id);
      }
    }
  }, [sessions, activeSessionId]);

  // Dynamically fetch AI welcome greeting for fresh session
  useEffect(() => {
    const fetchAiWelcome = async () => {
      try {
        const res = await fetch('http://127.0.0.1:8000/api/ai/welcome');
        if (res.ok) {
          const data = await res.json();
          if (data.message) {
            setSessions(prev =>
              prev.map(s => {
                if (s.messages.length === 1 && s.messages[0].id === 'welcome') {
                  return {
                    ...s,
                    messages: [{
                      ...s.messages[0],
                      content: data.message
                    }]
                  };
                }
                return s;
              })
            );
          }
        }
      } catch {
        // Fallback welcome message already present
      }
    };
    fetchAiWelcome();
  }, []);

  // Save sessions to localStorage
  const persistSessions = (updatedSessions: ChatSession[]) => {
    setSessions(updatedSessions);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedSessions));
    } catch (e) {
      console.error('Failed to save chat sessions from drawer', e);
    }
  };

  const persistActiveSessionId = (id: string) => {
    setActiveSessionId(id);
    try {
      localStorage.setItem(ACTIVE_SESSION_KEY, id);
    } catch (e) {
      console.error('Failed to save active session id from drawer', e);
    }
  };

  const activeSession = sessions.find(s => s.id === activeSessionId) || sessions[0] || null;
  const messages = activeSession?.messages || [DEFAULT_WELCOME_MSG];

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const hasUserSentPrompt = messages.some(m => m.role === 'user');

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, isTyping]);

  if (!isOpen) return null;

  const handleCreateNewChat = () => {
    const newSession = createDrawerSession('New Chat');
    const updated = [newSession, ...sessions];
    persistSessions(updated);
    persistActiveSessionId(newSession.id);
  };

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputMessage).trim();
    if (!text || isTyping || !activeSession) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const isFirstUserMessage = !activeSession.messages.some(m => m.role === 'user');
    const autoTitle = isFirstUserMessage
      ? text.length > 32
        ? `${text.substring(0, 32)}...`
        : text
      : activeSession.title;

    const updatedSessionMessages = [...activeSession.messages, userMsg];

    const newSessions = sessions.map(s =>
      s.id === activeSession.id
        ? {
            ...s,
            title: isFirstUserMessage && (s.title === 'New Chat' || s.title === 'New Conversation') ? autoTitle : s.title,
            messages: updatedSessionMessages,
            updatedAt: Date.now()
          }
        : s
    );

    persistSessions(newSessions);
    setInputMessage('');
    setIsTyping(true);

    try {
      const response = await fetch('http://127.0.0.1:8000/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          history: updatedSessionMessages.map(m => ({ role: m.role, content: m.content }))
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const json = await response.json();
      const botMsg: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: json.reply || "Telemetry evaluated.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      const finalSessions = newSessions.map(s =>
        s.id === activeSession.id
          ? {
              ...s,
              messages: [...s.messages, botMsg],
              updatedAt: Date.now()
            }
          : s
      );
      persistSessions(finalSessions);
    } catch (err) {
      console.error('Drawer AI chat error', err);
      const botErr: ChatMessage = {
        id: `err-${Date.now()}`,
        role: 'assistant',
        content: "⚠️ **Offline Rule Engine Fallback:** Ensure FastAPI is active on `http://127.0.0.1:8000`.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      const finalSessions = newSessions.map(s =>
        s.id === activeSession.id
          ? {
              ...s,
              messages: [...s.messages, botErr],
              updatedAt: Date.now()
            }
          : s
      );
      persistSessions(finalSessions);
    } finally {
      setIsTyping(false);
    }
  };

  const unresolvedCount = persistentAlerts.filter(a => a.status === 'UNRESOLVED').length;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        right: 0,
        bottom: 0,
        width: '460px',
        maxWidth: '100vw',
        backgroundColor: '#ffffff',
        borderLeft: '1px solid #e2e8f0',
        boxShadow: '-8px 0 25px rgba(0,0,0,0.1)',
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '16px 20px',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: '#f8fafc'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, flex: 1 }}>
          <div
            style={{
              width: '32px',
              height: '32px',
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
            <Sparkles style={{ width: '18px', height: '18px' }} />
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a', margin: 0, whiteSpace: 'nowrap' }}>
                AI Assistant
              </h3>
              {unresolvedCount > 0 && (
                <span style={{ fontSize: '10px', fontWeight: '700', color: '#dc2626', backgroundColor: '#fee2e2', padding: '1px 5px', borderRadius: '4px', whiteSpace: 'nowrap' }}>
                  {unresolvedCount} Alerts
                </span>
              )}
            </div>
            <div style={{ fontSize: '11px', color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              Live Telemetry & Diagnostics
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
          <button
            onClick={handleCreateNewChat}
            style={{
              border: '1px solid #e2e8f0',
              background: '#ffffff',
              color: '#334155',
              cursor: 'pointer',
              padding: '4px 8px',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '11px',
              fontWeight: '600',
              transition: 'background-color 0.15s'
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f1f5f9')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#ffffff')}
            title="Start a new chat session"
          >
            <Plus style={{ width: '13px', height: '13px', color: '#2563eb' }} />
            <span>New</span>
          </button>

          {onOpenFullView && (
            <button
              onClick={() => {
                onOpenFullView();
                onClose();
              }}
              style={{
                border: '1px solid #bfdbfe',
                background: '#eff6ff',
                color: '#2563eb',
                cursor: 'pointer',
                padding: '4px 8px',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '11px',
                fontWeight: '600',
                transition: 'all 0.15s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#dbeafe';
                e.currentTarget.style.borderColor = '#93c5fd';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#eff6ff';
                e.currentTarget.style.borderColor = '#bfdbfe';
              }}
              title="Open full AI Diagnostic View"
            >
              <Maximize2 style={{ width: '12px', height: '12px' }} />
              <span>Full</span>
            </button>
          )}

          <button
            onClick={onClose}
            style={{
              border: 'none',
              background: 'transparent',
              color: '#64748b',
              cursor: 'pointer',
              padding: '4px',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            title="Close AI Assistant"
          >
            <X style={{ width: '18px', height: '18px' }} />
          </button>
        </div>
      </div>



      {/* Chat Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {messages.map((m) => {
          const isUser = m.role === 'user';
          return (
            <div
              key={m.id}
              style={{
                display: 'flex',
                justifyContent: isUser ? 'flex-end' : 'flex-start',
                gap: '8px'
              }}
            >
              {!isUser && (
                <div
                  style={{
                    width: '26px',
                    height: '26px',
                    borderRadius: '6px',
                    backgroundColor: '#eff6ff',
                    border: '1px solid #bfdbfe',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#2563eb',
                    flexShrink: 0
                  }}
                >
                  <Bot style={{ width: '15px', height: '15px' }} />
                </div>
              )}
              <div
                style={{
                  maxWidth: '82%',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  backgroundColor: isUser ? '#2563eb' : '#f8fafc',
                  color: isUser ? '#ffffff' : '#0f172a',
                  border: isUser ? 'none' : '1px solid #e2e8f0',
                  fontSize: '12px',
                  lineHeight: '1.5',
                  whiteSpace: 'pre-line'
                }}
              >
                <div style={{ fontSize: '12px' }}>
                  <MarkdownContent content={m.content} isUser={isUser} />
                </div>
                <div style={{ fontSize: '9px', color: isUser ? '#bfdbfe' : '#94a3b8', marginTop: '6px', textAlign: 'right' }}>
                  {m.timestamp}
                </div>
              </div>
            </div>
          );
        })}

        {isTyping && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div
              style={{
                width: '26px',
                height: '26px',
                borderRadius: '6px',
                backgroundColor: '#eff6ff',
                border: '1px solid #bfdbfe',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#2563eb'
              }}
            >
              <Bot style={{ width: '15px', height: '15px' }} />
            </div>
            <div style={{ fontSize: '11px', color: '#64748b' }}>AI is analyzing live sensor signals...</div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Action Chips (2 lines, non-scrollable, disappears after first prompt) */}
      {!hasUserSentPrompt && (
        <div style={{
          padding: '8px 14px',
          borderTop: '1px solid #f1f5f9',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '6px',
          overflow: 'hidden'
        }}>
          {QUICK_ACTIONS.map((act, i) => (
            <button
              key={i}
              onClick={() => handleSendMessage(act)}
              style={{
                fontSize: '11px',
                padding: '4px 10px',
                borderRadius: '9999px',
                border: '1px solid #cbd5e1',
                backgroundColor: '#ffffff',
                color: '#334155',
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}
            >
              {act}
            </button>
          ))}
        </div>
      )}

      {/* Input Field */}
      <div style={{ padding: '14px', borderTop: '1px solid #e2e8f0', display: 'flex', gap: '8px' }}>
        <input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
          placeholder="Ask AI about any sensor reading or alert..."
          style={{
            flex: 1,
            padding: '8px 12px',
            borderRadius: '6px',
            border: '1px solid #cbd5e1',
            fontSize: '12px',
            outline: 'none',
            color: '#0f172a'
          }}
        />
        <button
          onClick={() => handleSendMessage()}
          disabled={!inputMessage.trim() || isTyping}
          style={{
            padding: '0 14px',
            borderRadius: '6px',
            backgroundColor: '#2563eb',
            color: '#ffffff',
            border: 'none',
            cursor: !inputMessage.trim() || isTyping ? 'not-allowed' : 'pointer',
            opacity: !inputMessage.trim() || isTyping ? 0.6 : 1,
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            fontSize: '12px',
            fontWeight: '600'
          }}
        >
          <span>Ask</span>
          <Send style={{ width: '12px', height: '12px' }} />
        </button>
      </div>
    </div>
  );
};
