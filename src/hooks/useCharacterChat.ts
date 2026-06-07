// ABOUTME: Hook managing character chat state and SSE streaming.
// ABOUTME: Exposes sendMessage(), messages, isStreaming, conversationId.

'use client';

import { useState, useCallback, useRef } from 'react';

export interface UIMessage {
  role: 'author' | 'character';
  content: string;
  createdAt: string;
}

interface UseCharacterChatOptions {
  projectId: string;
  characterId: string;
  initialConversationId?: string;
  initialMessages?: UIMessage[];
}

export function useCharacterChat({
  projectId,
  characterId,
  initialConversationId,
  initialMessages = [],
}: UseCharacterChatOptions) {
  const [messages, setMessages] = useState<UIMessage[]>(initialMessages);
  const [isStreaming, setIsStreaming] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(
    initialConversationId ?? null,
  );
  const abortRef = useRef<AbortController | null>(null);

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || isStreaming) return;

      const authorMsg: UIMessage = {
        role: 'author',
        content: text,
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, authorMsg]);
      setIsStreaming(true);

      let characterContent = '';
      setMessages((prev) => [
        ...prev,
        { role: 'character', content: '', createdAt: new Date().toISOString() },
      ]);

      abortRef.current = new AbortController();

      try {
        const response = await fetch('/api/character-chat/stream', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ projectId, characterId, conversationId, message: text }),
          signal: abortRef.current.signal,
        });

        if (!response.body) throw new Error('No stream body');

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });

          const lines = buffer.split('\n');
          buffer = lines.pop() ?? '';

          for (const line of lines) {
            if (!line.startsWith('data: ')) continue;
            const payload = line.slice(6);
            if (payload === '[DONE]') break;

            const event = JSON.parse(payload);
            if (event.type === 'meta') {
              setConversationId(event.conversationId);
            } else if (event.type === 'chunk') {
              characterContent += event.text;
              setMessages((prev) => {
                const updated = [...prev];
                updated[updated.length - 1] = {
                  ...updated[updated.length - 1],
                  content: characterContent,
                };
                return updated;
              });
            }
          }
        }
      } catch (err: unknown) {
        if ((err as Error).name !== 'AbortError') {
          setMessages((prev) => {
            const updated = [...prev];
            updated[updated.length - 1] = {
              ...updated[updated.length - 1],
              content: '[Erreur — réessaie]',
            };
            return updated;
          });
        }
      } finally {
        setIsStreaming(false);
      }
    },
    [projectId, characterId, conversationId, isStreaming],
  );

  const stopStream = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  return { messages, isStreaming, conversationId, sendMessage, stopStream };
}
