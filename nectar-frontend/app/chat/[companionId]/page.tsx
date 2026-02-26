'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { leapfrog } from 'ldrs';

leapfrog.register();

export default function ChatPage() {
  const { companionId } = useParams();
  type Message = {
    id: string;
    content: string;
    is_user: boolean;
  };

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const numericCompanionId = Number(companionId);
  const router = useRouter();

  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!companionId) return;

    fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/messages?companion_id=${numericCompanionId}`,
    )
      .then((res) => res.json())
      .then((data) => {
        console.log('Fetched messages:', data);
        setMessages(Array.isArray(data) ? data : []);
      });
  }, [companionId]);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userText = input;
    setInput('');

    const userId = crypto.randomUUID();
    const assistantId = crypto.randomUUID();

    // setMessages((prev) => [
    //   ...prev,
    //   {
    //     id: userId,
    //     content: userText,
    //     is_user: true,
    //   },
    //   {
    //     id: assistantId,
    //     content: '',
    //     is_user: false,
    //   },
    // ]);
    setMessages((prev) => [
      ...prev,
      {
        id: userId,
        content: userText,
        is_user: true,
      },
      {
        id: assistantId,
        content: '',
        is_user: false,
      },
    ]);

    setIsTyping(true);

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/messages/stream`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companion_id: numericCompanionId,
          content: userText,
        }),
      },
    );

    if (!response.ok) {
      const text = await response.text();
      console.error('Stream error:', response.status, text);
      setIsTyping(false);
      return;
    }

    const reader = response.body?.getReader();
    if (!reader) {
      console.error('No response body reader (stream not supported?)');
      setIsTyping(false);
      return;
    }

    const decoder = new TextDecoder();
    let buffer = '';
    let fullText = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      // Process complete lines
      let lineEnd;
      while ((lineEnd = buffer.indexOf('\n')) !== -1) {
        let line = buffer.slice(0, lineEnd);
        buffer = buffer.slice(lineEnd + 1);

        line = line.replace(/\r$/, ''); // handle \r\n

        if (line.startsWith('data: ')) {
          const payload = line.slice(6);
          if (!payload) continue;

          try {
            const parsed = JSON.parse(payload);
            const delta = parsed.delta;
            if (!delta) continue;

            fullText += delta;
          } catch {
            // fallback if ever plain text
            fullText += payload;
          }

          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantId ? { ...msg, content: fullText } : msg,
            ),
          );
        }
      }
    }

    setIsTyping(false);
  };

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  console.log(messages);

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* Header */}
      <div className="p-4 flex items-center border-b border-gray-800">
        <button
          onClick={() => router.push('/chat')}
          className="w-10 h-10 flex items-center justify-center
                   rounded-full backdrop-blur-md
                   bg-white/10 hover:bg-white/20
                   border border-white/10
                   transition-all duration-200"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-5 h-5 text-white"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>

        <span className="ml-4 font-semibold text-lg">Chat</span>
      </div>

      <div className="flex-1 p-4 overflow-y-auto flex flex-col">
        {messages.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center text-gray-500">
            <div className="text-lg font-medium mb-2">
              Start the conversation
            </div>
            <div className="text-sm">Send a message to begin chatting.</div>
          </div>
        ) : (
          // messages.map((msg: any) => (
          //   <div
          //     key={msg.id}
          //     className={`mb-3 px-4 py-2 rounded-2xl max-w-[70%] ${
          //       msg.is_user
          //         ? 'bg-gray-700 self-end'
          //         : 'bg-white/10 backdrop-blur-md'
          //     }`}
          //   >
          //     {msg.content}
          //   </div>
          // ))
          messages.map((msg: any) => {
            const isAssistant = !msg.is_user;
            const isStreamingBubble =
              isAssistant && msg.content === '' && isTyping;

            return (
              <div
                key={msg.id}
                className={`mb-3 px-4 py-2 rounded-2xl max-w-[70%] ${
                  msg.is_user
                    ? 'bg-gray-700 self-end'
                    : 'bg-white/10 backdrop-blur-md'
                }`}
              >
                {isStreamingBubble ? (
                  <l-leapfrog size="40" speed="2.5" color="white"></l-leapfrog>
                ) : (
                  msg.content
                )}
              </div>
            );
          })
        )}
        {/* {isTyping && <div className="mb-3 text-gray-400 italic">Typing...</div>}
        {isTyping && (
          <div className="mb-3 px-4 py-3 rounded-2xl bg-white/10 backdrop-blur-md max-w-[70%]">
            <l-leapfrog size="40" speed="2.5" color="white"></l-leapfrog>
          </div>
        )} */}
        <div ref={bottomRef} />
      </div>

      <div className="p-4 flex space-x-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="flex-1 bg-gray-800 p-2 rounded"
        />
        <button onClick={sendMessage} className="bg-pink-600 px-4 rounded">
          Send
        </button>
      </div>
    </div>
  );
}
