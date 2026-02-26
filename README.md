# Nectar AI Companion App – Take Home Assessment

## Overview

This project is a full-stack AI Companion application built with:

- Frontend: Next.js (App Router)
- Backend: Go (Gin framework)
- Database: PostgreSQL
- AI Model: Claude (Anthropic API with streaming)

The goal was to simulate Nectar AI’s “Social Loop” and build a compelling AI companionship experience centered around Stories and real-time interaction.

---

## Competitor Research

Before building, I studied:

- Instagram Stories (progress bars, tapping navigation)
- Character.AI (chat-first AI engagement)
- Replika (AI companionship loops)

Key insight:
Successful AI companionship apps rely on _continuous interaction loops_, not just chat. Stories create asynchronous engagement, while chat builds emotional continuity.

---

## Core Feature: Stories System

### Implemented:

- Horizontal Stories feed
- Unseen / Seen visual indicators
- Story progress bar animation
- Auto-advance timer (images)
- Video support
- Reaction system (❤️, 🔥, ❤️‍🔥)
- Story view tracking
- At least 5 companions
- At least one Story with 4+ posts (mixed media)

### Product Reasoning

Stories simulate passive social engagement.
Users don’t always want to initiate chat. Stories:

- Create curiosity
- Encourage reactions
- Trigger conversation loops

This mirrors real social apps and increases daily retention.

---

## Feature #1 – Real-Time Streaming AI Chat

Implemented Server-Sent Events (SSE) streaming from backend to frontend.

### Why this feature?

Most AI chat apps render responses after full completion.
Streaming:

- Feels human
- Increases perceived intelligence
- Reduces latency perception
- Improves emotional realism

### Technical Details

- Backend streams Claude responses using `text/event-stream`
- Frontend parses incremental `data:` chunks
- React state updates assistant message in-place
- Typing indicator replaced with animated loading spinner

---

## Feature #2 – Reaction-Triggered Social Loop

When a user reacts to a Story:

- Backend stores reaction
- Upon chat open, system checks:
  - Last reaction timestamp
  - Last message timestamp
- If reaction is newer → AI sends contextual DM

This creates:

Story → Reaction → Direct Message → Conversation

A self-reinforcing loop that drives engagement.

This feature was designed intentionally to simulate emotional continuity.

---

## Architecture Decisions

### Backend (Go + Gin)

Why Go?

- High concurrency support
- Excellent for streaming
- Clean separation of handlers
- Strong performance characteristics

Folder structure:

- handlers/
- models/
- db/

Clear separation between routing, logic, and database layer.

---

### Database (PostgreSQL)

Chosen because:

- Relational structure suits:
  - companions
  - stories
  - story_items
  - direct_messages
  - reactions
- Easy indexing for:
  - user_id
  - companion_id
  - created_at

Scalability considerations:

- Indexed `user_id` and `companion_id`
- Ordered queries optimized for pagination
- Limited history retrieval (last 30 messages for LLM context)

---

### Frontend (NextJS App Router)

Why App Router?

- Server/client separation
- Clean routing structure
- Optimized rendering

Performance:

- Avoided unnecessary refetches
- Used streaming updates for chat
- Optimized Story timers with cleanup effects

---

## Data Fetching and Scalability

- Limited LLM context window (last 30 messages)
- Avoided N+1 queries
- Used DESC + reverse for message ordering
- Designed unread count endpoint for badge updates
- Streaming reduces backend response wait time

Future scalability:

- Redis for unread counters
- CDN for media assets
- Background job queue for AI processing

---

## UX / Polish

- Story progress animation
- Seen/unseen gradient rings
- Floating reaction animations
- Typing animation replaced with smooth spinner
- Glassmorphism chat bubbles
- Mobile responsive layout

Goal: Feel like a real social AI app, not a prototype.

---

## Engineering Challenges

### 1. SSE Streaming Bugs

- Duplicate assistant messages
- React stale closure issue
- Key collision warnings

Solution:

- Insert single placeholder assistant message
- Stream updates by mapping state
- Removed duplicate conditional insertions

---

### 2. Nested Git Repository Issue

Accidentally created frontend as a submodule.
Resolved by removing nested `.git` directory and re-adding as normal directory.

---

### 3. Story View State Sync

Backend view count and frontend seen state needed synchronization.
Solved via status endpoint and optimistic UI update.

---

## What I Would Improve With More Time

- WebSocket instead of SSE
- AI memory embedding system
- Push notifications
- Real authentication system
- Real-time unread updates via polling or sockets
- Edge deployment for AI streaming

---

## Environment Variables

The backend requires two environment variables:

- DATABASE_URL
- ANTHROPIC_API_KEY

This project uses Supabase (Session Pooler, URI format).

Example format:

DATABASE_URL=postgresql://username:password@host:5432/postgres?sslmode=require

---

### Option 1 – Using a `.env` file (recommended)

Create a `.env` file inside `nectar-backend/` and copy values from `.env.example`.

---

### Option 2 – Setting environment variables manually (Windows)

You can set them using:

setx DATABASE_URL "your_database_url"
setx ANTHROPIC_API_KEY "your_api_key"

Then restart your terminal before running:

go run cmd/main.go

Note: Secrets are excluded from version control for security reasons.

## Deployment

Frontend: Vercel-ready  
Backend: Deployable to Railway / Fly.io / Render  
Database: PostgreSQL

---

## Conclusion

This project was designed not just to meet the requirements, but to simulate a production-grade AI companionship loop.

The focus was on:

- Emotional engagement
- Streaming realism
- Social interaction patterns
- Clean architecture
- Scalability awareness

The result is a fully functional AI companion application optimized for both mobile and desktop use.
