# Night Market OPS Dashboard

A comprehensive operations management dashboard built for Night Market, designed to streamline team coordination, task management, and real-time communication across the organization.

## Overview

Night Market OPS Dashboard is a modern, full-featured operations command center that enables teams to manage tasks, track KPIs, access SOPs, and communicate effectively in real-time. Built with React and TypeScript, it delivers a premium user experience with a sleek dark theme and responsive design.

## Features

### Task Management
- **Kanban Board**: Visual task organization with drag-and-drop columns (Backlog, In Progress, Review, Completed)
- **List View**: Traditional table view with sorting and filtering
- **Task Details**: Comprehensive task modals with descriptions, assignments, priorities, and due dates
- **Real-time Updates**: Live synchronization across all connected clients

### Team Communication
- **Channel-based Chat**: Organized team discussions with dedicated channels
- **Direct Messaging**: Private one-on-one conversations
- **@Mentions**: Tag team members with autocomplete dropdown
- **File Sharing**: Upload and share images and documents
- **Emoji Support**: Built-in emoji picker for expressive communication
- **Real-time Messaging**: Instant message delivery via Supabase Realtime

### KPI Tracking
- **Visual Dashboards**: Interactive charts and graphs for performance metrics
- **Custom KPIs**: Track metrics relevant to your operations
- **Historical Data**: Monitor trends and performance over time

### SOP Library
- **Document Management**: Centralized repository for standard operating procedures
- **Search & Filter**: Quickly find relevant documentation
- **RAG-powered Search**: AI-enhanced semantic search using embeddings

### AI Assistant
- **Context-aware Chat**: Intelligent assistant with access to your SOP documents
- **RAG Integration**: Retrieval-augmented generation for accurate, document-grounded responses

### Notifications
- **Real-time Alerts**: Stay updated on task assignments, mentions, and important events
- **Notification Center**: Centralized view of all notifications

## Tech Stack

### Frontend
- **React 19** - UI library
- **TypeScript** - Type-safe development
- **Vite** - Build tool and dev server
- **React Router** - Client-side routing
- **Lucide React** - Icon library
- **Tailwind CSS** - Utility-first styling

### Backend
- **Supabase** - Backend as a Service
  - PostgreSQL database
  - Authentication
  - Real-time subscriptions
  - Edge Functions
  - Storage

### AI/ML
- **OpenAI Embeddings** - Document vectorization
- **pgvector** - Vector similarity search
- **RAG Pipeline** - Retrieval-augmented generation

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── layout/         # Header, Sidebar, Layout
│   ├── AIAssistant.tsx # AI chat interface
│   ├── TaskModal.tsx   # Task creation/editing
│   └── ...
├── context/            # React context providers
│   ├── AuthContext.tsx # Authentication state
│   ├── ThemeContext.tsx# Dark/light mode
│   └── ...
├── hooks/              # Custom React hooks
│   ├── useTasks.ts     # Task CRUD operations
│   ├── useTeamChat.ts  # Chat functionality
│   ├── useKPIs.ts      # KPI data fetching
│   └── useRAG.ts       # AI/RAG integration
├── pages/              # Route components
│   ├── OverviewBoard.tsx
│   ├── TeamChat.tsx
│   ├── KPIBoard.tsx
│   ├── SOPLibrary.tsx
│   └── ...
└── lib/                # Utilities and configs
    └── supabase.ts     # Supabase client

supabase/
├── functions/          # Edge Functions
│   ├── generate-embeddings/
│   ├── search/
│   └── rag-chat/
└── migrations/         # Database migrations
```

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn
- Supabase account

### Installation

1. Clone the repository:
```bash
git clone https://github.com/stunner100/ops-dashboard-react.git
cd ops-dashboard-react
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

Configure the following variables:
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. Run database migrations:
```bash
supabase db push
```

5. Start the development server:
```bash
npm run dev
```

The app will be available at `http://localhost:5173`

### Deployment

Deploy to Vercel:
```bash
vercel --prod
```

## Authentication

The dashboard uses Supabase Auth with support for:
- Email/password authentication
- Role-based access (Customer Service, Rider Manager, Vendor Account Manager)

## Database Schema

Key tables include:
- `profiles` - User profiles with roles
- `tasks` - Task management
- `kpis` - Key performance indicators
- `sop_documents` - Standard operating procedures
- `sop_embeddings` - Document embeddings for RAG
- `chat_channels` - Team chat channels
- `chat_messages` - Channel messages
- `direct_messages` - Private messages
- `notifications` - User notifications

## License

MIT License
