'use client';
import { useRouter } from 'next/navigation';

import { useEffect, useState, useRef } from 'react';
import { reuleaux } from 'ldrs';

reuleaux.register();

type Companion = {
  id: number;
  name: string;
  avatar_url: string;
};

type StoryItem = {
  id: number;
  media_url: string;
  media_type: 'image' | 'video';
  caption: string;
  order_index: number;
};

type Story = {
  id: number;
  companion_id: number;
  items: StoryItem[];
};

export default function Home() {
  const [companions, setCompanions] = useState<Companion[]>([]);
  const [story, setStory] = useState<Story | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  // const timerRef = useRef<NodeJS.Timeout | null>(null);
  const [progress, setProgress] = useState(0);
  const [paused, setPaused] = useState(false);
  const [unread, setUnread] = useState(0);
  const [toast, setToast] = useState<string | null>(null);
  const [seenCompanions, setSeenCompanions] = useState<Set<number>>(new Set());
  const [loadingStories, setLoadingStories] = useState(true);

  // const viewedRef = useRef<Set<number>>(new Set());
  const router = useRouter();
  const showToast = (message: string) => {
    setToast(message);
    setTimeout(() => {
      setToast(null);
    }, 2000);
  };

  const refreshUnread = async () => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/messages/unread`,
        {
          cache: 'no-store',
        },
      );
      const data = await res.json();
      setUnread(Number(data?.unread ?? 0));
    } catch (e) {
      console.error('refreshUnread failed:', e);
    }
  };

  const [storyStatus, setStoryStatus] = useState<any[]>([]);

  const [messages, setMessages] = useState<any[]>([]);
  const [showDM, setShowDM] = useState(false);

  const [isTyping, setIsTyping] = useState(false);

  type FloatingReaction = {
    id: string;
    emoji: string;
    offset: number;
  };

  const [floatingReactions, setFloatingReactions] = useState<
    FloatingReaction[]
  >([]);

  const triggerFloatingReaction = (emoji: string) => {
    const id = crypto.randomUUID();
    const offset = Math.random() * 80 - 40; // -40px to +40px

    setFloatingReactions((prev) => [...prev, { id, emoji, offset }]);

    setTimeout(() => {
      setFloatingReactions((prev) => prev.filter((r) => r.id !== id));
    }, 1200);
  };
  useEffect(() => {
    setLoadingStories(true);

    fetch(`${process.env.NEXT_PUBLIC_API_URL}/stories/status`, {
      cache: 'no-store',
    })
      .then((res) => res.json())
      .then((data) =>
        setStoryStatus(
          Array.isArray(data)
            ? data
            : Array.isArray(data?.data)
              ? data.data
              : [],
        ),
      )
      .catch(() => setStoryStatus([]))
      .finally(() => {
        setLoadingStories(false);
      });
  }, []);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/companions`)
      .then((res) => res.json())
      .then((data) => setCompanions(data));
  }, []);

  useEffect(() => {
    refreshUnread();
  }, []);

  useEffect(() => {
    if (!story || !story.items || story.items.length === 0) return;

    const currentItem = story.items[currentIndex];

    setProgress(0);

    let interval: NodeJS.Timeout;
    let timeout: NodeJS.Timeout;

    if (currentItem.media_type === 'image' && !paused) {
      interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            return 100;
          }
          return prev + 2.5; // 100% over ~4s
        });
      }, 100);

      timeout = setTimeout(() => {
        next();
      }, 4000);
    }

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [currentIndex, story]);

  useEffect(() => {
    if (!story || !story.items || story.items.length === 0) return;

    const item = story.items[currentIndex];

    fetch(`${process.env.NEXT_PUBLIC_API_URL}/stories/view`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        story_item_id: item.id,
      }),
    });
  }, [currentIndex, story]);

  const openStory = async (companionId: number) => {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/stories/${companionId}`,
    );
    const data = await res.json();
    setStory(data);
    setCurrentIndex(0);
  };

  const closeStory = async () => {
    // mark currently-open companion as seen (instant UI update)
    if (story?.companion_id) {
      setSeenCompanions((prev) => {
        const next = new Set(prev);
        next.add(Number(story.companion_id));
        return next;
      });
    }

    setStory(null);

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/stories/status`,
        {
          cache: 'no-store',
        },
      );
      const data = await res.json();

      // force array always (prevents null / weird shapes)
      setStoryStatus(
        Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : [],
      );
    } catch (e) {
      console.error('stories/status failed:', e);
      setStoryStatus([]);
    }
  };

  const next = () => {
    if (!story) return;
    if (currentIndex < story.items.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      closeStory();
    }
  };

  const prev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  useEffect(() => {
    console.log('storyStatus isArray?', Array.isArray(storyStatus));
    console.log('storyStatus raw:', storyStatus);
    if (Array.isArray(storyStatus)) {
      console.log('storyStatus[0]:', storyStatus[0]);
      console.log('keys:', storyStatus[0] ? Object.keys(storyStatus[0]) : null);
    }
  }, [storyStatus]);

  return (
    <>
      {loadingStories && (
        <div className="fixed inset-0 flex items-center justify-center bg-gradient-to-b from-black to-gray-950 z-50">
          {' '}
          <l-reuleaux
            size="40"
            stroke="6"
            stroke-length="0.15"
            bg-opacity="0.1"
            speed="1.2"
            color="white"
          ></l-reuleaux>
        </div>
      )}
      {!loadingStories && (
        <main className="min-h-screen bg-gradient-to-b from-black to-gray-950 text-white p-4">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">Stories</h1>
            <div
              className="relative cursor-pointer"
              onClick={() => router.push('/chat')}
            >
              <span className="text-xl">💌</span>
              {unread > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-xs px-2 py-0.5 rounded-full">
                  {unread}
                </span>
              )}
            </div>
          </div>

          <div className="flex space-x-4 overflow-x-auto">
            {Array.isArray(companions) &&
              companions.map((companion) => {
                const status = Array.isArray(storyStatus)
                  ? storyStatus.find((s) => {
                      const cid = Number(
                        s.companion_id ?? s.companionId ?? s.companionID,
                      );
                      return cid === Number(companion.id);
                    })
                  : null;

                const total = status
                  ? Number(status.total ?? status.Total ?? status.story_total)
                  : 0;
                const viewed = status
                  ? Number(
                      status.viewed ?? status.Viewed ?? status.viewed_count,
                    )
                  : 0;

                const allSeenBackend = total > 0 && viewed >= total;
                const allSeen =
                  allSeenBackend || seenCompanions.has(companion.id);

                return (
                  <div
                    key={companion.id}
                    className="flex flex-col items-center cursor-pointer"
                    onClick={() => openStory(companion.id)}
                  >
                    <div
                      className={`w-20 h-20 rounded-full p-1 border-4 ${
                        allSeen ? 'border-gray-500' : 'border-pink-500'
                      }`}
                    >
                      <img
                        src={companion.avatar_url}
                        alt={companion.name}
                        className="w-full h-full rounded-full object-cover"
                      />
                    </div>
                    <span className="mt-2 text-sm">{companion.name}</span>
                  </div>
                );
              })}
          </div>

          {/* Story Modal */}
          {story && story.items && story.items.length > 0 && (
            <div
              className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50"
              onMouseDown={() => setPaused(true)}
              onMouseUp={() => setPaused(false)}
              onTouchStart={() => setPaused(true)}
              onTouchEnd={() => setPaused(false)}
            >
              <div className="relative w-full h-full md:w-[400px] md:h-[700px]">
                {/* Click zones */}
                <div
                  className="absolute left-0 top-0 w-1/2 h-full z-10"
                  onClick={prev}
                />
                <div
                  className="absolute right-0 top-0 w-1/2 h-full z-10"
                  onClick={next}
                />

                <div className="absolute top-4 left-2 right-2 flex space-x-1 z-20">
                  {story.items.map((_, index) => (
                    <div
                      key={index}
                      className="flex-1 bg-gray-700 h-1 rounded overflow-hidden"
                    >
                      <div
                        className="h-1 bg-white transition-all duration-100"
                        style={{
                          width:
                            index < currentIndex
                              ? '100%'
                              : index === currentIndex
                                ? `${progress}%`
                                : '0%',
                        }}
                      />
                    </div>
                  ))}
                </div>

                {/* Media */}
                {story.items && story.items.length > 0 && (
                  <>
                    {story.items[currentIndex]?.media_type === 'image' ? (
                      <img
                        src={story.items[currentIndex]?.media_url}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <video
                        src={story.items[currentIndex]?.media_url}
                        autoPlay
                        onEnded={next}
                        className="w-full h-full object-cover"
                      />
                    )}

                    {/* Caption */}
                    <div className="absolute bottom-10 left-4 right-4 text-white text-lg">
                      {story.items[currentIndex]?.caption}
                    </div>
                  </>
                )}

                <div className="absolute bottom-4 left-0 right-0 flex justify-center space-x-6 z-20">
                  {['❤️', '🔥', '❤️‍🔥'].map((reaction) => (
                    <button
                      key={reaction}
                      onClick={async () => {
                        await fetch(
                          `${process.env.NEXT_PUBLIC_API_URL}/stories/react`,
                          {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              story_item_id: story.items[currentIndex].id,
                              reaction_type: reaction,
                            }),
                          },
                        );

                        // ✅ refresh 💌 badge
                        refreshUnread();

                        triggerFloatingReaction(reaction);
                      }}
                      className="text-2xl"
                    >
                      {reaction}
                    </button>
                  ))}
                </div>

                {/* Close button */}
                <button
                  onClick={closeStory}
                  className="absolute top-4 right-4 text-white text-xl"
                >
                  ✕
                </button>
                <div className="absolute bottom-20 left-1/2 -translate-x-1/2 pointer-events-none">
                  {floatingReactions.map((r) => (
                    <div
                      key={r.id}
                      className="text-4xl animate-float absolute"
                      style={{ left: `calc(50% + ${r.offset}px)` }}
                    >
                      {r.emoji}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
          <section className="mt-8 relative rounded-2xl overflow-hidden animate-fade-up">
            <img
              src={companions[0]?.avatar_url}
              className="w-full h-[280px] object-cover opacity-70"
            />

            <div className="absolute inset-0 bg-gradient-to-t from-black/90 to-transparent p-6 flex flex-col justify-end">
              <h2 className="text-2xl font-bold">
                {companions[0]?.name} posted something for you
              </h2>

              <p className="text-gray-300 text-sm mt-2">
                Tap to see her latest moment.
              </p>

              <button
                onClick={() => openStory(companions[0]?.id)}
                className="mt-4 bg-pink-600 px-5 py-2 rounded-full w-fit hover:bg-pink-500 transition"
              >
                View Story
              </button>
            </div>
          </section>

          <section className="mt-10 animate-fade-up">
            <h2 className="text-lg font-semibold mb-4">
              Your Connection Levels
            </h2>

            <div className="space-y-4">
              {companions.map((companion) => {
                const level = Math.floor(Math.random() * 100); // temp scoring logic

                return (
                  <div
                    key={companion.id}
                    className="bg-gray-900 rounded-xl p-4"
                  >
                    <div className="flex justify-between mb-2">
                      <span>{companion.name}</span>
                      <span className="text-pink-400 text-sm">
                        Level {Math.floor(level / 20) + 1}
                      </span>
                    </div>

                    <div className="w-full bg-gray-700 h-2 rounded-full">
                      <div
                        className="bg-pink-500 h-2 rounded-full transition-all"
                        style={{ width: `${level}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="mt-10 animate-fade-up">
            <h2 className="text-lg font-semibold mb-4">Daily Moment</h2>

            <div className="bg-gradient-to-r from-pink-600/20 to-purple-600/20 p-5 rounded-xl">
              <p className="text-gray-300">Nova asks:</p>

              <p className="mt-2 text-white font-medium">
                “What made you smile today?”
              </p>

              <button
                onClick={() => router.push('/chat')}
                className="mt-4 bg-white text-black px-4 py-2 rounded-full"
              >
                Reply to Her
              </button>
            </div>
          </section>

          {/* Direct messages */}
          {showDM && (
            <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50">
              <div className="w-full h-full md:w-[400px] md:h-[700px] bg-gray-900 p-4 overflow-y-auto relative">
                <h2 className="text-xl font-bold mb-4">Direct Messages</h2>
                {isTyping && (
                  <div className="mb-4 text-gray-400 italic">
                    Nova is typing<span className="animate-pulse">...</span>
                  </div>
                )}

                {messages.length === 0 && (
                  <p className="text-gray-400">No messages yet.</p>
                )}

                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className="mb-4 p-3 rounded-lg bg-pink-600 text-white max-w-[80%]"
                  >
                    {msg.content}
                  </div>
                ))}

                <button
                  onClick={() => setShowDM(false)}
                  className="absolute top-4 right-4 text-xl"
                >
                  ✕
                </button>
              </div>
            </div>
          )}
          {toast && (
            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-gray-800 text-white px-4 py-2 rounded-full shadow-lg animate-fade-in-out z-[999]">
              {toast}
            </div>
          )}
        </main>
      )}
    </>
  );
}
