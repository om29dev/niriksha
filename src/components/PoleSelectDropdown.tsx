import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Search, ChevronDown, Check, Layers } from 'lucide-react';
import type { PoleId, PoleState } from '../types/telemetry';
import { DEFAULT_POLES, type PoleItem } from '../constants/polesCatalog';

export type { PoleItem };

export interface PoleSelectDropdownProps<T extends PoleId | 'all' = PoleId> {
  poles?: PoleItem[];
  selectedPoleId: T;
  onSelectPole: (poleId: T) => void;
  poleStateMap?: Record<number, PoleState>;
  label?: string;
  showSearch?: boolean;
  width?: string;
  size?: 'sm' | 'md';
  allowAllOption?: boolean;
  allOptionLabel?: string;
  accentColor?: string;
}

export const PoleSelectDropdown = <T extends PoleId | 'all' = PoleId>({
  poles = DEFAULT_POLES,
  selectedPoleId,
  onSelectPole,
  poleStateMap,
  label,
  showSearch = true,
  width = '240px',
  size = 'md',
  allowAllOption = false,
  allOptionLabel = 'All Field Nodes',
  accentColor = '#2563eb'
}: PoleSelectDropdownProps<T>): React.ReactElement => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Close when clicked outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Auto-focus search input on dropdown open
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  const filteredPoles = useMemo(() => {
    if (!searchQuery.trim()) return poles;
    const q = searchQuery.toLowerCase();
    return poles.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.role.toLowerCase().includes(q) ||
        `pole ${p.id}`.includes(q) ||
        (p.location && p.location.toLowerCase().includes(q))
    );
  }, [poles, searchQuery]);

  const isAllSelected = selectedPoleId === 'all';
  const selectedItem = isAllSelected ? null : poles.find((p) => p.id === (selectedPoleId as unknown as number));
  const selectedState = isAllSelected ? undefined : poleStateMap?.[selectedPoleId as unknown as number];

  const isCompact = size === 'sm';

  return (
    <div ref={dropdownRef} style={{ position: 'relative', width, minWidth: isCompact ? '160px' : '200px' }}>
      {label && (
        <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', color: '#64748b', marginBottom: '4px' }}>
          {label}
        </label>
      )}

      {/* Selector Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: isCompact ? '6px' : '8px',
          padding: isCompact ? '5px 9px' : '7px 12px',
          borderRadius: '6px',
          border: '1px solid',
          borderColor: isOpen ? accentColor : '#cbd5e1',
          backgroundColor: '#ffffff',
          color: '#0f172a',
          fontSize: isCompact ? '12px' : '13px',
          fontWeight: '600',
          cursor: 'pointer',
          boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
          transition: 'all 0.15s ease'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
          {isAllSelected ? (
            <Layers style={{ width: '14px', height: '14px', color: accentColor, flexShrink: 0 }} />
          ) : selectedState?.isDown ? (
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#dc2626', flexShrink: 0 }} />
          ) : selectedState?.isOffline ? (
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#d97706', flexShrink: 0 }} />
          ) : (
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10b981', flexShrink: 0 }} />
          )}

          <span style={{ whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
            {isAllSelected ? allOptionLabel : (selectedItem?.name || `Pole ${selectedPoleId}`)}
          </span>
        </div>
        <ChevronDown
          style={{
            width: '14px',
            height: '14px',
            color: '#64748b',
            transform: isOpen ? 'rotate(180deg)' : 'none',
            transition: 'transform 0.2s ease',
            flexShrink: 0
          }}
        />
      </button>

      {/* Popover Dropdown with Search */}
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            left: 0,
            width: '100%',
            minWidth: '260px',
            backgroundColor: '#ffffff',
            border: '1px solid #cbd5e1',
            borderRadius: '8px',
            boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.06)',
            zIndex: 250,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          {/* Search Input Box */}
          {showSearch && (
            <div style={{ padding: '8px 10px', borderBottom: '1px solid #f1f5f9', backgroundColor: '#f8fafc' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '4px 8px' }}>
                <Search style={{ width: '13px', height: '13px', color: '#94a3b8' }} />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search poles by ID, role, or zone..."
                  style={{
                    border: 'none',
                    outline: 'none',
                    fontSize: '12px',
                    width: '100%',
                    color: '#0f172a',
                    backgroundColor: 'transparent'
                  }}
                />
              </div>
            </div>
          )}

          {/* List of Available Poles */}
          <div style={{ maxHeight: '240px', overflowY: 'auto', padding: '4px 0' }}>
            {/* Optional "All Poles" item */}
            {allowAllOption && (
              <div
                onClick={() => {
                  onSelectPole('all' as T);
                  setIsOpen(false);
                  setSearchQuery('');
                }}
                style={{
                  padding: '8px 12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  backgroundColor: isAllSelected ? '#eff6ff' : 'transparent',
                  cursor: 'pointer',
                  borderBottom: '1px solid #f1f5f9',
                  transition: 'background-color 0.15s ease'
                }}
                onMouseEnter={(e) => {
                  if (!isAllSelected) e.currentTarget.style.backgroundColor = '#f8fafc';
                }}
                onMouseLeave={(e) => {
                  if (!isAllSelected) e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Layers style={{ width: '14px', height: '14px', color: accentColor }} />
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '12px', fontWeight: isAllSelected ? '700' : '600', color: isAllSelected ? accentColor : '#0f172a' }}>
                      {allOptionLabel}
                    </span>
                    <span style={{ fontSize: '10px', color: '#64748b' }}>
                      Aggregate telemetry across all {poles.length} mesh nodes
                    </span>
                  </div>
                </div>
                {isAllSelected && <Check style={{ width: '14px', height: '14px', color: accentColor }} />}
              </div>
            )}

            {filteredPoles.length === 0 ? (
              <div style={{ padding: '12px', textAlign: 'center', fontSize: '12px', color: '#94a3b8' }}>
                No poles match "{searchQuery}"
              </div>
            ) : (
              filteredPoles.map((p) => {
                const isSelected = selectedPoleId === (p.id as unknown as T);
                const state = poleStateMap?.[p.id];

                let statusBadge = (
                  <span style={{ fontSize: '10px', fontWeight: '700', color: '#059669', backgroundColor: '#ecfdf5', padding: '1px 6px', borderRadius: '4px' }}>
                    Online
                  </span>
                );

                if (state?.isDown) {
                  statusBadge = (
                    <span style={{ fontSize: '10px', fontWeight: '700', color: '#dc2626', backgroundColor: '#fee2e2', padding: '1px 6px', borderRadius: '4px' }}>
                      Tilted
                    </span>
                  );
                } else if (state?.isOffline) {
                  statusBadge = (
                    <span style={{ fontSize: '10px', fontWeight: '700', color: '#b45309', backgroundColor: '#fef3c7', padding: '1px 6px', borderRadius: '4px' }}>
                      Offline
                    </span>
                  );
                }

                return (
                  <div
                    key={p.id}
                    onClick={() => {
                      onSelectPole(p.id as unknown as T);
                      setIsOpen(false);
                      setSearchQuery('');
                    }}
                    style={{
                      padding: '8px 12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      backgroundColor: isSelected ? '#eff6ff' : 'transparent',
                      cursor: 'pointer',
                      transition: 'background-color 0.15s ease'
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) e.currentTarget.style.backgroundColor = '#f8fafc';
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '13px', fontWeight: isSelected ? '700' : '600', color: isSelected ? accentColor : '#0f172a' }}>
                          {p.name}
                        </span>
                        {statusBadge}
                      </div>
                      <span style={{ fontSize: '11px', color: '#64748b', marginTop: '1px' }}>
                        {p.role}
                      </span>
                    </div>

                    {isSelected && <Check style={{ width: '14px', height: '14px', color: accentColor }} />}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
