import React, { memo } from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { decodeUnicodeEscapeSequences } from '../../utils/emojiDecoder';

interface MarkdownRendererProps {
  content: string;
}

function MarkdownRendererComponent({ content }: MarkdownRendererProps) {
  // Decode Unicode escape sequences (e.g., \uD83D\uDE00) to actual emoji characters
  const decodedContent = decodeUnicodeEscapeSequences(content);

  return (
    <ReactMarkdown
      components={{
        // Headings
        h1: ({ children }) => (
          <h1 className="text-xl font-bold text-[var(--text-primary)] mb-2 mt-3">{children}</h1>
        ),
        h2: ({ children }) => (
          <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-2 mt-3">{children}</h2>
        ),
        h3: ({ children }) => (
          <h3 className="text-base font-semibold text-[var(--text-primary)] mb-1 mt-2">{children}</h3>
        ),
        h4: ({ children }) => (
          <h4 className="text-sm font-semibold text-[var(--text-primary)] mb-1 mt-2">{children}</h4>
        ),
        h5: ({ children }) => (
          <h5 className="text-sm font-medium text-[var(--text-primary)] mb-1 mt-1">{children}</h5>
        ),
        h6: ({ children }) => (
          <h6 className="text-sm font-medium text-[var(--text-secondary)] mb-1 mt-1">{children}</h6>
        ),

        // Paragraphs
        p: ({ children }) => (
          <p className="text-[15px] text-[var(--text-primary)] mb-2 last:mb-0">{children}</p>
        ),

        // Links
        a: ({ href, children }) => (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[var(--accent-primary)] hover:underline"
          >
            {children}
          </a>
        ),

        // Bold and Italic
        strong: ({ children }) => (
          <strong className="font-semibold text-[var(--text-primary)]">{children}</strong>
        ),
        em: ({ children }) => (
          <em className="italic text-[var(--text-secondary)]">{children}</em>
        ),

        // Lists
        ul: ({ children }) => (
          <ul className="list-disc list-inside mb-2 space-y-1">{children}</ul>
        ),
        ol: ({ children }) => (
          <ol className="list-decimal list-inside mb-2 space-y-1">{children}</ol>
        ),
        li: ({ children }) => (
          <li className="text-[15px] text-[var(--text-primary)]">{children}</li>
        ),

        // Blockquotes
        blockquote: ({ children }) => (
          <blockquote className="border-l-4 border-[var(--accent-primary)] pl-3 my-2 text-[var(--text-secondary)] italic">
            {children}
          </blockquote>
        ),

        // Code - inline and blocks
        code: ({ className, children, ...props }) => {
          const match = /language-(\w+)/.exec(className || '');
          const isInline = !match && !className;

          if (isInline) {
            return (
              <code
                className="bg-[var(--bg-tertiary)] text-[var(--accent-error)] px-1.5 py-0.5 rounded text-sm font-mono"
                {...props}
              >
                {children}
              </code>
            );
          }

          return (
            <SyntaxHighlighter
              style={oneDark}
              language={match ? match[1] : 'text'}
              PreTag="div"
              customStyle={{
                margin: '8px 0',
                borderRadius: '8px',
                fontSize: '13px',
              }}
            >
              {String(children).replace(/\n$/, '')}
            </SyntaxHighlighter>
          );
        },

        // Pre tag wrapper for code blocks
        pre: ({ children }) => (
          <pre className="overflow-x-auto my-2">{children}</pre>
        ),

        // Horizontal rule
        hr: () => <hr className="border-[var(--border)] my-4" />,

        // Tables
        table: ({ children }) => (
          <div className="overflow-x-auto my-2">
            <table className="min-w-full border border-[var(--border)] rounded-lg overflow-hidden">
              {children}
            </table>
          </div>
        ),
        thead: ({ children }) => (
          <thead className="bg-[var(--bg-secondary)]">{children}</thead>
        ),
        tbody: ({ children }) => (
          <tbody>{children}</tbody>
        ),
        tr: ({ children }) => (
          <tr className="border-b border-[var(--border)] last:border-0">{children}</tr>
        ),
        th: ({ children }) => (
          <th className="px-3 py-2 text-left text-sm font-semibold text-[var(--text-primary)]">
            {children}
          </th>
        ),
        td: ({ children }) => (
          <td className="px-3 py-2 text-sm text-[var(--text-secondary)]">{children}</td>
        ),

        // Images
        img: ({ src, alt }) => (
          <img
            src={src}
            alt={alt}
            className="max-w-full h-auto rounded-lg my-2"
            loading="lazy"
          />
        ),

        // Strikethrough
        del: ({ children }) => (
          <del className="text-[var(--text-tertiary)] line-through">{children}</del>
        ),
      }}
    >
      {decodedContent}
    </ReactMarkdown>
  );
}

// Memoize to prevent unnecessary re-renders
export const MarkdownRenderer = memo(MarkdownRendererComponent);