'use client';

import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeSanitize from 'rehype-sanitize';
import clsx from 'clsx';

type Tone = 'default' | 'inverse';

/**
 * Mantenemos la lógica de clases pero inyectamos la paleta KCE
 * para que el chat se sienta "premium".
 */
function getClasses(tone: Tone) {
  return {
    muted: tone === 'inverse' ? 'text-white/80' : 'text-brand-dark/70',
    border: tone === 'inverse' ? 'border-white/20' : 'border-brand-dark/10',
    codeBg: tone === 'inverse' ? 'bg-white/10' : 'bg-brand-blue/5',
    text: tone === 'inverse' ? 'text-white' : 'text-brand-dark',
    accent: tone === 'inverse' ? 'text-white' : 'text-brand-blue',
  };
}

export function ChatMarkdown({
  content,
  tone = 'default',
}: {
  content: string;
  tone?: Tone;
}) {
  const s = getClasses(tone);
  const md = String(content ?? '').trim();

  return (
    <article className={clsx("space-y-3 text-[13px] leading-6", s.text)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeSanitize]}
        components={{
          // Títulos más compactos para la burbuja de chat
          h1: ({ children }) => <h1 className={clsx("text-base font-bold tracking-tight", s.accent)}>{children}</h1>,
          h2: ({ children }) => <h2 className={clsx("text-sm font-bold tracking-tight", s.accent)}>{children}</h2>,
          h3: ({ children }) => <h3 className={clsx("text-sm font-bold tracking-tight", s.accent)}>{children}</h3>,
          
          p: ({ children }) => <p className="m-0 whitespace-pre-wrap last:mb-0">{children}</p>,
          
          strong: ({ children }) => <strong className="font-bold">{children}</strong>,
          
          // Listas con estilo KCE
          ul: ({ children }) => <ul className="my-2 list-disc space-y-1 pl-5 marker:text-brand-blue/50">{children}</ul>,
          ol: ({ children }) => <ol className="my-2 list-decimal space-y-1 pl-5 marker:font-bold">{children}</ol>,
          
          hr: () => <hr className={clsx("my-3 border-t", s.border)} />,
          
          blockquote: ({ children }) => (
            <blockquote className={clsx("border-l-2 pl-3 italic", s.border, s.muted)}>
              {children}
            </blockquote>
          ),
          
          // Soporte para código inline y bloques
          code: ({ children, className }) => {
            const isInline = !className?.includes('language-');
            return (
              <code className={clsx(
                "rounded px-1.5 py-0.5 font-mono text-[11px]",
                isInline ? s.codeBg : "block bg-brand-dark text-white p-3 overflow-x-auto"
              )}>
                {children}
              </code>
            );
          },
          
          pre: ({ children }) => <pre className="bg-transparent p-0">{children}</pre>,
          
          // Links con el color brand-blue/yellow de KCE
          a: ({ href, children }) => (
            <a 
              href={href ?? '#'} 
              target="_blank" 
              rel="noreferrer" 
              className={clsx(
                "font-bold underline underline-offset-4 transition-colors",
                tone === 'inverse' ? "text-white hover:text-white/80" : "text-brand-blue hover:text-brand-blue/70"
              )}
            >
              {children}
            </a>
          ),
        }}
      >
        {md}
      </ReactMarkdown>
    </article>
  );
}