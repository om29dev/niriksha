import React from 'react';

interface MarkdownContentProps {
  content: string;
  isUser?: boolean;
}

export const MarkdownContent: React.FC<MarkdownContentProps> = ({ content, isUser = false }) => {
  if (isUser) {
    return <div style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{content}</div>;
  }

  // Parse lines into blocks
  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];
  let inCodeBlock = false;
  let codeBlockLines: string[] = [];
  let currentList: { ordered: boolean; items: string[] } | null = null;

  const flushList = (keyPrefix: string) => {
    if (!currentList) return;
    const ListTag = currentList.ordered ? 'ol' : 'ul';
    elements.push(
      <ListTag
        key={`${keyPrefix}-list`}
        style={{
          margin: '4px 0 8px 18px',
          padding: 0,
          display: 'flex',
          flexDirection: 'column',
          gap: '4px'
        }}
      >
        {currentList.items.map((item, idx) => (
          <li key={idx} style={{ lineHeight: '1.45' }}>
            {renderInlineMarkdown(item)}
          </li>
        ))}
      </ListTag>
    );
    currentList = null;
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Handle code fences ```
    if (line.trim().startsWith('```')) {
      if (inCodeBlock) {
        elements.push(
          <pre
            key={`code-${i}`}
            style={{
              backgroundColor: '#0f172a',
              color: '#f8fafc',
              padding: '10px 14px',
              borderRadius: '6px',
              fontSize: '11px',
              fontFamily: 'Consolas, Monaco, monospace',
              overflowX: 'auto',
              margin: '6px 0 10px 0'
            }}
          >
            <code>{codeBlockLines.join('\n')}</code>
          </pre>
        );
        codeBlockLines = [];
        inCodeBlock = false;
      } else {
        flushList(`before-code-${i}`);
        inCodeBlock = true;
      }
      continue;
    }

    if (inCodeBlock) {
      codeBlockLines.push(line);
      continue;
    }

    // Headings
    if (line.startsWith('### ')) {
      flushList(`heading3-${i}`);
      elements.push(
        <h4
          key={`h3-${i}`}
          style={{
            fontSize: '13.5px',
            fontWeight: '700',
            color: '#0f172a',
            margin: '8px 0 4px 0',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          {renderInlineMarkdown(line.slice(4))}
        </h4>
      );
      continue;
    }

    if (line.startsWith('## ')) {
      flushList(`heading2-${i}`);
      elements.push(
        <h3
          key={`h2-${i}`}
          style={{
            fontSize: '14px',
            fontWeight: '700',
            color: '#0f172a',
            margin: '10px 0 4px 0',
            borderBottom: '1px solid #e2e8f0',
            paddingBottom: '2px'
          }}
        >
          {renderInlineMarkdown(line.slice(3))}
        </h3>
      );
      continue;
    }

    if (line.startsWith('# ')) {
      flushList(`heading1-${i}`);
      elements.push(
        <h2
          key={`h1-${i}`}
          style={{
            fontSize: '15px',
            fontWeight: '800',
            color: '#0f172a',
            margin: '12px 0 6px 0'
          }}
        >
          {renderInlineMarkdown(line.slice(2))}
        </h2>
      );
      continue;
    }

    // Unordered bullet list items (- or *)
    const bulletMatch = line.match(/^(\s*)([-*])\s+(.*)$/);
    if (bulletMatch) {
      const itemText = bulletMatch[3];
      if (!currentList || currentList.ordered) {
        flushList(`ul-flush-${i}`);
        currentList = { ordered: false, items: [] };
      }
      currentList.items.push(itemText);
      continue;
    }

    // Ordered list items (1. )
    const numberedMatch = line.match(/^(\s*)(\d+)\.\s+(.*)$/);
    if (numberedMatch) {
      const itemText = numberedMatch[3];
      if (!currentList || !currentList.ordered) {
        flushList(`ol-flush-${i}`);
        currentList = { ordered: true, items: [] };
      }
      currentList.items.push(itemText);
      continue;
    }

    // If not a list item, flush any accumulated list
    flushList(`line-${i}`);

    // Blank line
    if (!line.trim()) {
      elements.push(<div key={`blank-${i}`} style={{ height: '6px' }} />);
      continue;
    }

    // Normal paragraph line
    elements.push(
      <p
        key={`p-${i}`}
        style={{
          margin: '2px 0 4px 0',
          lineHeight: '1.5',
          color: '#1e293b'
        }}
      >
        {renderInlineMarkdown(line)}
      </p>
    );
  }

  flushList('final');

  if (inCodeBlock && codeBlockLines.length > 0) {
    elements.push(
      <pre
        key="unclosed-code"
        style={{
          backgroundColor: '#0f172a',
          color: '#f8fafc',
          padding: '10px 14px',
          borderRadius: '6px',
          fontSize: '11px',
          fontFamily: 'Consolas, Monaco, monospace'
        }}
      >
        <code>{codeBlockLines.join('\n')}</code>
      </pre>
    );
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        wordBreak: 'break-word',
        gap: '2px'
      }}
    >
      {elements}
    </div>
  );
};

// Parse inline formatting: **bold**, *italic*, `code`
function renderInlineMarkdown(text: string): React.ReactNode {
  const parts: React.ReactNode[] = [];
  let remaining = text;
  let keyIndex = 0;

  while (remaining.length > 0) {
    // 1. Code inline `code`
    const codeMatch = remaining.match(/^(.*?)`([^`]+)`(.*)$/s);
    // 2. Bold **bold**
    const boldMatch = remaining.match(/^(.*?)\*\*([^*]+)\*\*(.*)$/s);
    // 3. Italic *italic*
    const italicMatch = remaining.match(/^(.*?)\*([^*]+)\*(.*)$/s);

    // Find first matching delimiter
    const matches = [
      codeMatch ? { type: 'code', index: codeMatch[1].length, match: codeMatch } : null,
      boldMatch ? { type: 'bold', index: boldMatch[1].length, match: boldMatch } : null,
      italicMatch ? { type: 'italic', index: italicMatch[1].length, match: italicMatch } : null
    ].filter(Boolean) as { type: string; index: number; match: RegExpMatchArray }[];

    if (matches.length === 0) {
      parts.push(remaining);
      break;
    }

    // Sort by earliest position in text
    matches.sort((a, b) => a.index - b.index);
    const earliest = matches[0];

    const before = earliest.match[1];
    const middle = earliest.match[2];
    const after = earliest.match[3];

    if (before) parts.push(before);

    if (earliest.type === 'code') {
      parts.push(
        <code
          key={`code-in-${keyIndex++}`}
          style={{
            backgroundColor: '#f1f5f9',
            border: '1px solid #e2e8f0',
            color: '#b91c1c',
            padding: '1px 5px',
            borderRadius: '4px',
            fontSize: '90%',
            fontFamily: 'Consolas, Monaco, monospace'
          }}
        >
          {middle}
        </code>
      );
    } else if (earliest.type === 'bold') {
      parts.push(
        <strong key={`bold-${keyIndex++}`} style={{ fontWeight: '700', color: '#0f172a' }}>
          {middle}
        </strong>
      );
    } else if (earliest.type === 'italic') {
      parts.push(
        <em key={`italic-${keyIndex++}`} style={{ fontStyle: 'italic' }}>
          {middle}
        </em>
      );
    }

    remaining = after;
  }

  return <>{parts}</>;
}
