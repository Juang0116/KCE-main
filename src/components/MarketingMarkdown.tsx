// src/components/MarketingMarkdown.tsx
import * as React from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeSanitize from 'rehype-sanitize';
import remarkGfm from 'remark-gfm';

type Props = {
  content: string;
  className?: string;
};

/**
 * Light-surface markdown renderer for marketing pages.
 * Uses sanitize + GFM and Tailwind prose styling.
 */
export function MarketingMarkdown({ content, className }: Props) {
  const md = String(content || '').trim();
  if (!md) return null;

  return (
    <div
      className={
        className ||
        'prose prose-slate max-w-none prose-headings:scroll-mt-24 prose-headings:font-semibold prose-a:text-[color:var(--brand-blue)]'
      }
    >
      <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeSanitize]}>
        {md}
      </ReactMarkdown>
    </div>
  );
}
