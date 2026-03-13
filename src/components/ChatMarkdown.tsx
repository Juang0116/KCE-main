import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeSanitize from 'rehype-sanitize';

type Tone = 'default' | 'inverse';

function classes(tone: Tone) {
  const muted = tone === 'inverse' ? 'text-white/85' : 'text-[color:var(--color-text)]/78';
  const border = tone === 'inverse' ? 'border-white/20' : 'border-[var(--color-border)]';
  const codeBg = tone === 'inverse' ? 'bg-white/15' : 'bg-[color:var(--color-surface-2)]';
  return { muted, border, codeBg };
}

export function ChatMarkdown({
  content,
  tone = 'default',
}: {
  content: string;
  tone?: Tone;
}) {
  const { muted, border, codeBg } = classes(tone);
  const md = String(content ?? '').trim();

  return (
    <article className="space-y-3 text-sm leading-6">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeSanitize]}
        components={{
          h1: ({ children }) => <h1 className="text-base font-semibold tracking-tight">{children}</h1>,
          h2: ({ children }) => <h2 className="text-sm font-semibold tracking-tight">{children}</h2>,
          h3: ({ children }) => <h3 className="text-sm font-semibold tracking-tight">{children}</h3>,
          p: ({ children }) => <p className="m-0 whitespace-pre-wrap">{children}</p>,
          strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
          em: ({ children }) => <em className="italic">{children}</em>,
          ul: ({ children }) => <ul className="my-2 list-disc space-y-1 pl-5">{children}</ul>,
          ol: ({ children }) => <ol className="my-2 list-decimal space-y-1 pl-5">{children}</ol>,
          li: ({ children }) => <li className="marker:font-semibold">{children}</li>,
          hr: () => <hr className={`my-3 border-t ${border}`} />,
          blockquote: ({ children }) => (
            <blockquote className={`border-l-2 ${border} pl-3 italic ${muted}`}>{children}</blockquote>
          ),
          code: ({ children }) => (
            <code className={`rounded px-1.5 py-0.5 text-[11px] ${codeBg}`}>{children}</code>
          ),
          pre: ({ children }) => (
            <pre className={`overflow-x-auto rounded-xl p-3 text-[12px] ${codeBg}`}>{children}</pre>
          ),
          a: ({ href, children }) => (
            <a href={href ?? '#'} target="_blank" rel="noreferrer" className="font-medium underline underline-offset-4">
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
