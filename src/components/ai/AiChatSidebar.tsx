import React, { useRef, useEffect } from 'react';
import {
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  MessageSquare,
  Search,
  PanelLeftClose
} from 'lucide-react';

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

export interface AiChatSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  sessions: ChatSession[];
  activeSessionId: string;
  onSelectSession: (id: string) => void;
  onCreateNewChat: () => void;
  onSaveRename: (sessionId: string, newTitle: string) => void;
  onDeleteSession: (sessionId: string) => void;
}

export const AiChatSidebar: React.FC<AiChatSidebarProps> = ({
  isOpen,
  onClose,
  sessions,
  activeSessionId,
  onSelectSession,
  onCreateNewChat,
  onSaveRename,
  onDeleteSession
}) => {
  const [searchFilter, setSearchFilter] = React.useState<string>('');
  const [editingSessionId, setEditingSessionId] = React.useState<string | null>(null);
  const [editingTitleText, setEditingTitleText] = React.useState<string>('');
  const [deletingSessionId, setDeletingSessionId] = React.useState<string | null>(null);

  const renameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingSessionId && renameInputRef.current) {
      renameInputRef.current.focus();
      renameInputRef.current.select();
    }
  }, [editingSessionId]);

  const handleStartRename = (e: React.MouseEvent, session: ChatSession) => {
    e.stopPropagation();
    setEditingSessionId(session.id);
    setEditingTitleText(session.title);
  };

  const handleCommitRename = (sessionId: string) => {
    const trimmed = editingTitleText.trim();
    if (trimmed) {
      onSaveRename(sessionId, trimmed);
    }
    setEditingSessionId(null);
    setEditingTitleText('');
  };

  const handleCancelRename = () => {
    setEditingSessionId(null);
    setEditingTitleText('');
  };

  const filteredSessions = sessions.filter(s =>
    s.title.toLowerCase().includes(searchFilter.toLowerCase())
  );

  return (
    <div
      style={{
        width: isOpen ? '280px' : '0px',
        transition: 'width 0.2s ease',
        backgroundColor: '#f8fafc',
        borderRight: isOpen ? '1px solid #e2e8f0' : 'none',
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
            onClick={onClose}
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
          onClick={onCreateNewChat}
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
              const isActive = session.id === activeSessionId;
              const isEditing = editingSessionId === session.id;
              const isDeleting = deletingSessionId === session.id;

              return (
                <div
                  key={session.id}
                  onClick={() => {
                    if (!isEditing) {
                      onSelectSession(session.id);
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
                          if (e.key === 'Enter') handleCommitRename(session.id);
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
                          onClick={() => handleCommitRename(session.id)}
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
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteSession(session.id);
                            setDeletingSessionId(null);
                          }}
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
  );
};
