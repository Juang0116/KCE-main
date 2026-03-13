// src/components/Markdown.tsx
import React from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeSanitize from 'rehype-sanitize';
import remarkGfm from 'remark-gfm';

export function Markdown({ content }: { content: string }) {
  const md = (content ?? '').toString();

  return (
    <article className="space-y-4 leading-7">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeSanitize]}
        components={{
          h1: ({ children }) => (
            <h1 className="text-3xl font-semibold tracking-tight">{children}</h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-2xl font-semibold tracking-tight">{children}</h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-xl font-semibold tracking-tight">{children}</h3>
          ),
          p: ({ children }) => <p className="text-sm text-slate-200/90 sm:text-base">{children}</p>,
          ul: ({ children }) => (
            <ul className="list-disc space-y-2 pl-6 text-slate-200/90">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal space-y-2 pl-6 text-slate-200/90">{children}</ol>
          ),
          li: ({ children }) => <li className="text-sm sm:text-base">{children}</li>,
          a: ({ href, children }) => (
            <a
              className="underline underline-offset-4"
              href={href ?? '#'}
              target="_blank"
              rel="noreferrer"
            >
              {children}
            </a>
          ),
          blockquote: ({ children }) => (
            <blockquote className="border-l-2 border-slate-600 pl-4 italic text-slate-200/80">
              {children}
            </blockquote>
          ),
          code: ({ children }) => (
            <code className="rounded bg-slate-800 px-1.5 py-0.5 text-xs">{children}</code>
          ),
          pre: ({ children }) => (
            <pre className="overflow-auto rounded-lg bg-slate-900 p-4 text-xs">{children}</pre>
          ),
        }}
      >
        {md}
      </ReactMarkdown>
    </article>
  );
}
