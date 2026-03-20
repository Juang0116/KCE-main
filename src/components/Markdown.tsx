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
    <article className={clsx("prose-custom max-w-none space-y-4 leading-relaxed", className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeSanitize]}
        components={{
          // Títulos con la fuente heading de KCE
          h1: ({ children }) => (
            <h1 className="text-3xl font-heading font-bold tracking-tight text-brand-blue mb-6">{children}</h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-2xl font-heading font-semibold tracking-tight text-brand-blue/90 mt-8 mb-4">{children}</h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-xl font-heading font-semibold text-[color:var(--color-text)] mt-6">{children}</h3>
          ),
          // Párrafos adaptativos (usan color-text con opacidad para legibilidad)
          p: ({ children }) => (
            <p className="text-sm leading-7 text-[color:var(--color-text)]/80 sm:text-base">
              {children}
            </p>
          ),
          // Listas elegantes
          ul: ({ children }) => (
            <ul className="list-disc space-y-3 pl-6 text-[color:var(--color-text)]/80 marker:text-brand-blue">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal space-y-3 pl-6 text-[color:var(--color-text)]/80 marker:text-brand-blue font-medium">
              {children}
            </ol>
          ),
          li: ({ children }) => <li className="pl-1">{children}</li>,
          // Enlaces con estilo de marca
          a: ({ href, children }) => (
            <a
              className="font-medium text-brand-blue underline underline-offset-4 decoration-brand-blue/30 transition-colors hover:decoration-brand-blue"
              href={href ?? '#'}
              target="_blank"
              rel="noreferrer"
            >
              {children}
            </a>
          ),
          // Citas (Blockquotes) estilo editorial
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-brand-blue/20 bg-brand-blue/5 px-6 py-4 italic text-[color:var(--color-text)]/70 rounded-r-2xl">
              {children}
            </blockquote>
          ),
          // Código (Inline)
          code: ({ children }) => (
            <code className="rounded-md bg-[color:var(--color-surface-2)] border border-[color:var(--color-border)] px-1.5 py-0.5 text-xs font-mono text-brand-blue">
              {children}
            </code>
          ),
          // Bloques de código (Pre)
          pre: ({ children }) => (
            <pre className="overflow-auto rounded-2xl bg-[color:var(--color-surface-2)] border border-[color:var(--color-border)] p-5 text-xs shadow-inner">
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