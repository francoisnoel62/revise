// ABOUTME: Right-side sheet for chatting with a character persona via streaming.
// ABOUTME: Shows the conversation history, a text input, and a Copy button on each character reply.

'use client';

import { useState, useRef, useEffect, KeyboardEvent } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Copy, Send } from 'lucide-react';
import { useCharacterChat, UIMessage } from '@/hooks/useCharacterChat';
import type { SerializedCharacter } from '@/app/actions/character-actions';

interface CharacterChatSheetProps {
  open: boolean;
  character: SerializedCharacter;
  projectId: string;
  onClose: () => void;
  initialConversationId?: string;
  initialMessages?: UIMessage[];
}

export function CharacterChatSheet({
  open,
  character,
  projectId,
  onClose,
  initialConversationId,
  initialMessages = [],
}: CharacterChatSheetProps) {
  const [inputValue, setInputValue] = useState('');
  const scrollRef = useRef<HTMLElement>(null);

  const { messages, isStreaming, sendMessage } = useCharacterChat({
    projectId,
    characterId: character.id,
    initialConversationId,
    initialMessages,
  });

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const handleSend = () => {
    if (!inputValue.trim()) return;
    sendMessage(inputValue);
    setInputValue('');
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <Sheet open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <SheetContent side="right" className="flex flex-col max-w-lg w-full p-0">
        <SheetHeader className="px-6 py-4 border-b shrink-0">
          <SheetTitle>Discuter avec {character.name}</SheetTitle>
        </SheetHeader>

        <ScrollArea className="flex-1 min-h-0 px-4 py-4">
          <div className="space-y-4">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex flex-col gap-1 ${msg.role === 'author' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`rounded-lg px-4 py-2 max-w-[80%] text-sm whitespace-pre-wrap ${
                    msg.role === 'author'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-foreground'
                  }`}
                >
                  {msg.content}
                  {isStreaming && i === messages.length - 1 && msg.role === 'character' && (
                    <span className="inline-block w-1 h-4 ml-1 bg-current animate-pulse align-middle" />
                  )}
                </div>
                {msg.role === 'character' && msg.content && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 text-xs px-2"
                    onClick={() => navigator.clipboard.writeText(msg.content)}
                    aria-label="Copier"
                  >
                    <Copy className="h-3 w-3 mr-1" />
                    Copier
                  </Button>
                )}
              </div>
            ))}
            <div ref={scrollRef} />
          </div>
        </ScrollArea>

        <div className="border-t px-4 py-3 flex gap-2 shrink-0">
          <input
            className="flex-1 text-sm border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50 bg-background"
            placeholder="Écrire un message…"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isStreaming}
          />
          <Button
            size="sm"
            onClick={handleSend}
            disabled={isStreaming || !inputValue.trim()}
            aria-label="Envoyer"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
