import React, { useState, useEffect } from 'react';
import type { TelemetryPacket, PersistentAlert } from '../../types/telemetry';
import { AiChatSidebar, type ChatMessage, type ChatSession } from '../ai/AiChatSidebar';
import { AiChatWindow } from '../ai/AiChatWindow';
import { AiPromptInput } from '../ai/AiPromptInput';

interface AiAssistantViewProps {
  latestPole1: TelemetryPacket | null;
  latestPole2: TelemetryPacket | null;
  latestPole3: TelemetryPacket | null;
  persistentAlerts: PersistentAlert[];
}

export type { ChatMessage, ChatSession };

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

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
    } catch (e) {
      console.error('Failed to save chat sessions', e);
    }
  }, [sessions]);

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
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);
  const [inputMessage, setInputMessage] = useState<string>('');
  const [isTyping, setIsTyping] = useState<boolean>(false);

  const handleCreateNewChat = () => {
    const newSession = createNewSession('New Chat');
    setSessions(prev => [newSession, ...prev]);
    setActiveSessionId(newSession.id);
    setInputMessage('');
  };

  const handleSaveRename = (sessionId: string, newTitle: string) => {
    setSessions(prev =>
      prev.map(s => (s.id === sessionId ? { ...s, title: newTitle, updatedAt: Date.now() } : s))
    );
  };

  const handleDeleteSession = (sessionId: string) => {
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
      <AiChatSidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        sessions={sessions}
        activeSessionId={activeSessionId}
        onSelectSession={setActiveSessionId}
        onCreateNewChat={handleCreateNewChat}
        onSaveRename={handleSaveRename}
        onDeleteSession={handleDeleteSession}
      />

      {/* 2. Main Chat Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <AiChatWindow
          activeSession={activeSession}
          isSidebarOpen={isSidebarOpen}
          onOpenSidebar={() => setIsSidebarOpen(true)}
          onCreateNewChat={handleCreateNewChat}
          isTyping={isTyping}
        />

        <AiPromptInput
          inputMessage={inputMessage}
          setInputMessage={setInputMessage}
          onSendMessage={handleSendMessage}
          isTyping={isTyping}
          quickPrompts={QUICK_PROMPTS}
          showQuickPrompts={!hasUserSentPromptInCurrentSession}
        />
      </div>
    </div>
  );
};

