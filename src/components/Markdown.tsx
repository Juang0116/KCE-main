'use client';

import React from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeSanitize from 'rehype-sanitize';
import remarkGfm from 'remark-gfm';
import clsx from 'clsx';

interface MarkdownProps {
  content: string;
  className?: string;
}

export function Markdown({ content, className }: MarkdownProps) {
  const md = (content ?? '').toString();

  return (
    <article className={clsx('prose-custom max-w-none space-y-4 leading-relaxed', className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeSanitize]}
        components={{
          // Títulos con la fuente heading de KCE
          h1: ({ children }) => (
            <h1 className="mb-6 font-heading text-3xl font-bold tracking-tight text-brand-blue">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="mb-4 mt-8 font-heading text-2xl font-semibold tracking-tight text-brand-blue/90">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="mt-6 font-heading text-xl font-semibold text-[color:var(--color-text)]">
              {children}
            </h3>
          ),
          // Párrafos adaptativos (usan color-text con opacidad para legibilidad)
          p: ({ children }) => (
            <p className="text-[color:var(--color-text)]/80 text-sm leading-7 sm:text-base">
              {children}
            </p>
          ),
          // Listas elegantes
          ul: ({ children }) => (
            <ul className="text-[color:var(--color-text)]/80 list-disc space-y-3 pl-6 marker:text-brand-blue">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="text-[color:var(--color-text)]/80 list-decimal space-y-3 pl-6 font-medium marker:text-brand-blue">
              {children}
            </ol>
          ),
          li: ({ children }) => <li className="pl-1">{children}</li>,
          // Enlaces con estilo de marca
          a: ({ href, children }) => (
            <a
              className="font-medium text-brand-blue underline decoration-brand-blue/30 underline-offset-4 transition-colors hover:decoration-brand-blue"
              href={href ?? '#'}
              target="_blank"
              rel="noreferrer"
            >
              {children}
            </a>
          ),
          // Citas (Blockquotes) estilo editorial
          blockquote: ({ children }) => (
            <blockquote className="text-[color:var(--color-text)]/70 rounded-r-2xl border-l-4 border-brand-blue/20 bg-brand-blue/5 px-6 py-4 italic">
              {children}
            </blockquote>
          ),
          // Código (Inline)
          code: ({ children }) => (
            <code className="rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] px-1.5 py-0.5 font-mono text-xs text-brand-blue">
              {children}
            </code>
          ),
          // Bloques de código (Pre)
          pre: ({ children }) => (
            <pre className="overflow-auto rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] p-5 text-xs shadow-inner">
              {children}
            </pre>
          ),
        }}
      >
        {md}
      </ReactMarkdown>
    </article>
  );
}
