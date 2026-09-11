import React, { useState, useRef, useEffect } from 'react';
import {
  Bot,
  Send,
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  MessageSquare,
  Search,
  PanelLeftClose,
  PanelLeftOpen,
  User,
  Sparkles
} from 'lucide-react';
import type { TelemetryPacket, PersistentAlert } from '../../types/telemetry';

interface AiAssistantViewProps {
  latestPole1: TelemetryPacket | null;
  latestPole2: TelemetryPacket | null;
  latestPole3: TelemetryPacket | null;
  persistentAlerts: PersistentAlert[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface ChatSession {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  messages: ChatMessage[];
}

const STORAGE_KEY = 'niriksha_ai_chat_sessions';
const ACTIVE_SESSION_KEY = 'niriksha_ai_active_session_id';

const QUICK_PROMPTS = [
  "Diagnose current system health across all poles",
  "Are there any high voltage or electrocution risks?",
  "What is the current water submersion depth on Pole 1?",
  "Inspect gas and toxic chemical sensor levels",
  "Check if any poles have collapsed or tilted",
  "Summarize all active alerts and warnings"
];

const DEFAULT_WELCOME_MSG: ChatMessage = {
  id: 'welcome',
  role: 'assistant',
  content: "Hello! I am your **NIRIKSHA Telemetry & Safety AI Assistant**.\n\nI continuously monitor real-time telemetry from **Pole 1** (Flood & Tilt), **Pole 2** (Power Grid), and **Pole 3** (Master Hub & Air Quality). You can ask me to run health checks, interpret sensor readings, assess safety risks, or explain hardware protocols.",
  timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
};

function createNewSession(customTitle?: string): ChatSession {
  const now = Date.now();
  return {
    id: `session-${now}-${Math.random().toString(36).substring(2, 7)}`,
    title: customTitle || 'New Conversation',
    createdAt: now,
    updatedAt: now,
    messages: [DEFAULT_WELCOME_MSG]
  };
}

export const AiAssistantView: React.FC<AiAssistantViewProps> = () => {
  // Load sessions from localStorage or initialize with one default session
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
      console.error('Failed to load chat sessions', e);
    }
    const initial = createNewSession('System Diagnostics');
    return [initial];
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

  // Ensure activeSessionId is valid
  useEffect(() => {
    if (!sessions.some(s => s.id === activeSessionId)) {
      if (sessions.length > 0) {
        setActiveSessionId(sessions[0].id);
      } else {
        const fresh = createNewSession('System Diagnostics');
        setSessions([fresh]);
        setActiveSessionId(fresh.id);
      }
    }
  }, [sessions, activeSessionId]);

  // Sync across tabs/drawers when storage changes
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setSessions(parsed);
          }
        } catch (err) {
          console.error('Error syncing sessions in view', err);
        }
      }
      if (e.key === ACTIVE_SESSION_KEY && e.newValue) {
        setActiveSessionId(e.newValue);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Persist sessions
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
    } catch (e) {
      console.error('Failed to save chat sessions', e);
    }
  }, [sessions]);

  // Persist activeSessionId
  useEffect(() => {
    if (activeSessionId) {
      try {
        localStorage.setItem(ACTIVE_SESSION_KEY, activeSessionId);
      } catch (e) {
        console.error('Failed to save active session id', e);
      }
    }
  }, [activeSessionId]);

  const activeSession = sessions.find(s => s.id === activeSessionId) || sessions[0] || null;

  // Sidebar & Search State
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);
  const [searchFilter, setSearchFilter] = useState<string>('');
  
  // Renaming state
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editingTitleText, setEditingTitleText] = useState<string>('');

  // Delete confirm state
  const [deletingSessionId, setDeletingSessionId] = useState<string | null>(null);

  // Chat input and typing
  const [inputMessage, setInputMessage] = useState<string>('');
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const renameInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [activeSession?.messages, isTyping]);

  useEffect(() => {
    if (editingSessionId && renameInputRef.current) {
      renameInputRef.current.focus();
      renameInputRef.current.select();
    }
  }, [editingSessionId]);

  // Handle creating a new chat session
  const handleCreateNewChat = () => {
    const newSession = createNewSession('New Chat');
    setSessions(prev => [newSession, ...prev]);
    setActiveSessionId(newSession.id);
    setInputMessage('');
  };

  // Handle renaming a chat session
  const handleStartRename = (e: React.MouseEvent, session: ChatSession) => {
    e.stopPropagation();
    setEditingSessionId(session.id);
    setEditingTitleText(session.title);
  };

  const handleSaveRename = (sessionId: string) => {
    const trimmed = editingTitleText.trim();
    if (trimmed) {
      setSessions(prev =>
        prev.map(s => (s.id === sessionId ? { ...s, title: trimmed, updatedAt: Date.now() } : s))
      );
    }
    setEditingSessionId(null);
    setEditingTitleText('');
  };

  const handleCancelRename = () => {
    setEditingSessionId(null);
    setEditingTitleText('');
  };

  // Handle deleting a chat session
  const handleDeleteSession = (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation();
    const remaining = sessions.filter(s => s.id !== sessionId);
    if (remaining.length === 0) {
      const fresh = createNewSession('New Chat');
      setSessions([fresh]);
      setActiveSessionId(fresh.id);
    } else {
      setSessions(remaining);
      if (activeSessionId === sessionId) {
        setActiveSessionId(remaining[0].id);
      }
    }
    setDeletingSessionId(null);
  };

  // Send message
  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputMessage).trim();
    if (!text || isTyping || !activeSession) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    // If first user message and session still has default title, rename title automatically based on prompt
    const isFirstUserMessage = !activeSession.messages.some(m => m.role === 'user');
    const autoTitle = isFirstUserMessage
      ? text.length > 32
        ? `${text.substring(0, 32)}...`
        : text
      : activeSession.title;

    const updatedSessionMessages = [...activeSession.messages, userMsg];

    setSessions(prev =>
      prev.map(s =>
        s.id === activeSession.id
          ? {
              ...s,
              title: isFirstUserMessage && (s.title === 'New Chat' || s.title === 'New Conversation') ? autoTitle : s.title,
              messages: updatedSessionMessages,
              updatedAt: Date.now()
            }
          : s
      )
    );

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
        throw new Error(`HTTP error ${response.status}`);
      }

      const json = await response.json();
      const botMsg: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: json.reply || "I evaluated the query against current telemetry but received no response.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setSessions(prev =>
        prev.map(s =>
          s.id === activeSession.id
            ? { ...s, messages: [...s.messages, botMsg], updatedAt: Date.now() }
            : s
        )
      );
    } catch (err) {
      console.error('AI chat error', err);
      const errorMsg: ChatMessage = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: "⚠️ **Connection Notice:** Could not reach the backend diagnostic service. Please verify that FastAPI is running on `http://127.0.0.1:8000`.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setSessions(prev =>
        prev.map(s =>
          s.id === activeSession.id
            ? { ...s, messages: [...s.messages, errorMsg], updatedAt: Date.now() }
            : s
        )
      );
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };

  const filteredSessions = sessions.filter(s =>
    s.title.toLowerCase().includes(searchFilter.toLowerCase())
  );

  const hasUserSentPromptInCurrentSession = activeSession?.messages.some(m => m.role === 'user');

  return (
    <div
      style={{
        display: 'flex',
        height: 'calc(100vh - 120px)',
        backgroundColor: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '8px',
        overflow: 'hidden',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
      }}
    >
      {/* 1. Collapsible Chat Sessions Sidebar */}
      <div
        style={{
          width: isSidebarOpen ? '280px' : '0px',
          transition: 'width 0.2s ease',
          backgroundColor: '#f8fafc',
          borderRight: isSidebarOpen ? '1px solid #e2e8f0' : 'none',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          flexShrink: 0
        }}
      >
        {/* Sidebar Header: New Chat Button */}
        <div style={{ padding: '14px', borderBottom: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '13px', fontWeight: '700', color: '#0f172a', letterSpacing: '0.02em' }}>
              Chat History
            </span>
            <button
              onClick={() => setIsSidebarOpen(false)}
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
              title="Close sidebar"
            >
              <PanelLeftClose style={{ width: '16px', height: '16px' }} />
            </button>
          </div>

          <button
            onClick={handleCreateNewChat}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              padding: '8px 14px',
              borderRadius: '6px',
              backgroundColor: '#2563eb',
              color: '#ffffff',
              fontSize: '12.5px',
              fontWeight: '600',
              border: 'none',
              cursor: 'pointer',
              transition: 'background-color 0.15s'
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#1d4ed8')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#2563eb')}
          >
            <Plus style={{ width: '15px', height: '15px' }} />
            <span>New Chat</span>
          </button>

          {/* Search sessions */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 10px',
              borderRadius: '6px',
              backgroundColor: '#ffffff',
              border: '1px solid #cbd5e1'
            }}
          >
            <Search style={{ width: '13px', height: '13px', color: '#94a3b8' }} />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              style={{
                border: 'none',
                outline: 'none',
                fontSize: '11.5px',
                width: '100%',
                backgroundColor: 'transparent',
                color: '#0f172a'
              }}
            />
          </div>
        </div>

        {/* Sessions List */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
          {filteredSessions.length === 0 ? (
            <div style={{ padding: '24px 12px', textAlign: 'center', color: '#94a3b8', fontSize: '12px' }}>
              No chats found
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
              {filteredSessions.map((session) => {
                const isActive = session.id === activeSession?.id;
                const isEditing = editingSessionId === session.id;
                const isDeleting = deletingSessionId === session.id;

                return (
                  <div
                    key={session.id}
                    onClick={() => {
                      if (!isEditing) {
                        setActiveSessionId(session.id);
                      }
                    }}
                    style={{
                      padding: '8px 10px',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      backgroundColor: isActive ? '#e2e8f0' : 'transparent',
                      color: isActive ? '#0f172a' : '#475569',
                      transition: 'background-color 0.15s',
                      position: 'relative'
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) e.currentTarget.style.backgroundColor = '#f1f5f9';
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: 0 }}>
                      <MessageSquare style={{ width: '14px', height: '14px', color: isActive ? '#2563eb' : '#94a3b8', flexShrink: 0 }} />
                      {isEditing ? (
                        <input
                          ref={renameInputRef}
                          value={editingTitleText}
                          onChange={(e) => setEditingTitleText(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveRename(session.id);
                            if (e.key === 'Escape') handleCancelRename();
                          }}
                          onClick={(e) => e.stopPropagation()}
                          style={{
                            fontSize: '12px',
                            fontWeight: '500',
                            padding: '2px 4px',
                            borderRadius: '4px',
                            border: '1px solid #2563eb',
                            outline: 'none',
                            width: '100%',
                            color: '#0f172a',
                            backgroundColor: '#ffffff'
                          }}
                        />
                      ) : (
                        <span
                          style={{
                            fontSize: '12px',
                            fontWeight: isActive ? '600' : '500',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}
                          title={session.title}
                        >
                          {session.title}
                        </span>
                      )}
                    </div>

                    {/* Action buttons (Rename, Delete) */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '2px', marginLeft: '6px' }} onClick={(e) => e.stopPropagation()}>
                      {isEditing ? (
                        <>
                          <button
                            onClick={() => handleSaveRename(session.id)}
                            style={{ background: 'none', border: 'none', color: '#16a34a', cursor: 'pointer', padding: '2px' }}
                            title="Save"
                          >
                            <Check style={{ width: '13px', height: '13px' }} />
                          </button>
                          <button
                            onClick={handleCancelRename}
                            style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: '2px' }}
                            title="Cancel"
                          >
                            <X style={{ width: '13px', height: '13px' }} />
                          </button>
                        </>
                      ) : isDeleting ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                          <button
                            onClick={(e) => handleDeleteSession(e, session.id)}
                            style={{
                              backgroundColor: '#dc2626',
                              color: '#ffffff',
                              border: 'none',
                              borderRadius: '3px',
                              padding: '1px 5px',
                              fontSize: '10px',
                              cursor: 'pointer',
                              fontWeight: '600'
                            }}
                          >
                            Del
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeletingSessionId(null);
                            }}
                            style={{
                              backgroundColor: '#e2e8f0',
                              color: '#334155',
                              border: 'none',
                              borderRadius: '3px',
                              padding: '1px 5px',
                              fontSize: '10px',
                              cursor: 'pointer'
                            }}
                          >
                            No
                          </button>
                        </div>
                      ) : (
                        <>
                          <button
                            onClick={(e) => handleStartRename(e, session)}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: '#94a3b8',
                              cursor: 'pointer',
                              padding: '3px',
                              display: 'flex',
                              alignItems: 'center',
                              borderRadius: '3px'
                            }}
                            title="Rename chat"
                            onMouseEnter={(e) => (e.currentTarget.style.color = '#0f172a')}
                            onMouseLeave={(e) => (e.currentTarget.style.color = '#94a3b8')}
                          >
                            <Edit2 style={{ width: '12px', height: '12px' }} />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeletingSessionId(session.id);
                            }}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: '#94a3b8',
                              cursor: 'pointer',
                              padding: '3px',
                              display: 'flex',
                              alignItems: 'center',
                              borderRadius: '3px'
                            }}
                            title="Delete chat"
                            onMouseEnter={(e) => (e.currentTarget.style.color = '#dc2626')}
                            onMouseLeave={(e) => (e.currentTarget.style.color = '#94a3b8')}
                          >
                            <Trash2 style={{ width: '12px', height: '12px' }} />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* 2. Main Chat Area */}
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
                onClick={() => setIsSidebarOpen(true)}
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
              onClick={handleCreateNewChat}
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
          {activeSession?.messages.map((m) => {
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
                    lineHeight: '1.5',
                    whiteSpace: 'pre-line'
                  }}
                >
                  <div>{m.content}</div>
                  <div
                    style={{
                      fontSize: '9.5px',
                      color: isUser ? '#bfdbfe' : '#94a3b8',
                      marginTop: '5px',
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

        {/* Suggested Prompts (disappears once the user sends the first prompt in this chat) */}
        {!hasUserSentPromptInCurrentSession && (
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
            {QUICK_PROMPTS.map((prompt, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(prompt)}
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
            onClick={() => handleSendMessage()}
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
    </div>
  );
};
