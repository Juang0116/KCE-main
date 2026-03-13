'use client';

import * as React from 'react';

type Props = {
  prompts: string[];
};

export default function PromptStarterButtons({ prompts }: Props) {
  const onPrompt = React.useCallback((prompt: string) => {
    try {
      window.dispatchEvent(new CustomEvent('kce:open-chat', { detail: { prompt } }));
    } catch {
      window.dispatchEvent(new Event('kce:open-chat'));
    }
  }, []);

  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {prompts.map((prompt) => (
        <button
          key={prompt}
          type="button"
          className="rounded-full border border-white/12 bg-white/10 px-3 py-2 text-left text-xs text-white/84 transition hover:bg-white/14"
          onClick={() => onPrompt(prompt)}
        >
          {prompt}
        </button>
      ))}
    </div>
  );
}
