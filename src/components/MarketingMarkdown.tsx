'use client';

import * as React from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeSanitize from 'rehype-sanitize';
import remarkGfm from 'remark-gfm';
import clsx from 'clsx';

type Props = {
  content: string;
  className?: string;
};

/**
 * Renderizador de Markdown para páginas de marketing y legales.
 * Optimizado para legibilidad en superficies claras/oscuras y SEO.
 */
export function MarketingMarkdown({ content, className }: Props) {
  const md = String(content || '').trim();
  if (!md) return null;

  return (
    <div
      className={clsx(
        // Base Typography (Tailwind Typography Plugin)
        'prose prose-neutral max-w-none dark:prose-invert',
        // Headings & Layout
        'prose-headings:scroll-mt-28 prose-headings:font-heading prose-headings:tracking-tight',
        'prose-h1:text-4xl prose-h1:text-brand-blue prose-h1:mb-10',
        'prose-h2:text-2xl prose-h2:border-b prose-h2:border-brand-dark/5 prose-h2:pb-2 prose-h2:mt-12',
        // Links & Bold
        'prose-a:text-brand-blue prose-a:no-underline hover:prose-a:underline prose-a:font-semibold',
        'prose-strong:text-[color:var(--color-text)] dark:prose-strong:text-white',
        // Lists & Blockquotes
        'prose-li:marker:text-brand-blue/60 prose-blockquote:border-l-brand-blue prose-blockquote:bg-brand-blue/5 prose-blockquote:py-1 prose-blockquote:rounded-r-xl',
        // Custom override from props
        className
      )}
    >
      <ReactMarkdown 
        remarkPlugins={[remarkGfm]} 
        rehypePlugins={[rehypeSanitize]}
      >
        {md}
      </ReactMarkdown>
    </div>
  );
}