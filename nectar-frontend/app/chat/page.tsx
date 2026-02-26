'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ChatInbox() {
  const [companions, setCompanions] = useState([]);
  const router = useRouter();

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/companions`)
      .then((res) => res.json())
      .then((data) => setCompanions(data));
  }, []);

  return (
    <div className="min-h-screen bg-black text-white p-4">
      {/* Header */}
      <div className="p-4 flex items-center border-b border-gray-800">
        <button
          onClick={() => router.push('/')}
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

        <h1 className="text-2xl font-bold ml-4">Direct Messages</h1>
      </div>

      {companions.map((companion: any) => (
        <div
          key={companion.id}
          onClick={() => router.push(`/chat/${companion.id}`)}
          className="flex items-center space-x-4 mb-4 p-3 bg-gray-900 rounded-lg cursor-pointer"
        >
          <img src={companion.avatar_url} className="w-12 h-12 rounded-full" />
          <div>
            <div className="font-semibold">{companion.name}</div>
            <div className="text-sm text-gray-400">
              Tap to open conversation
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
