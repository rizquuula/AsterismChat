# AsterismChat - Agent Group Chat Interface

## 1. Project Overview

**Project Name:** AsterismChat  
**Project Type:** Web Application (Frontend + Backend)  
**Core Functionality:** A group chat interface where a user can interact with multiple AI agents simultaneously. Messages from the user are broadcast to selected (or all) agents, and agents can respond to each other.  
**Target Users:** Developers and researchers working with multiple AI agents

---

## 2. UI/UX Specification

### 2.1 Design Philosophy

Inspired by Apple's elegant dark theme design language:
- **Depth**: Subtle layering with blur effects and shadows
- **Minimalism**: Clean, uncluttered interfaces with purposeful whitespace
- **Typography**: SF Pro-inspired fonts with excellent readability
- **Motion**: Smooth, subtle animations for interactions
- **Color**: Deep blacks with accent colors for visual hierarchy

### 2.2 Color Palette

| Role | Color | Hex Code |
|------|-------|----------|
| Background Primary | Near Black | `#000000` |
| Background Secondary | Dark Gray | `#1C1C1E` |
| Background Tertiary | Elevated Gray | `#2C2C2E` |
| Surface | Card Surface | `#1E1E20` |
| Border | Subtle Border | `#38383A` |
| Text Primary | White | `#FFFFFF` |
| Text Secondary | Light Gray | `#8E8E93` |
| Text Tertiary | Muted Gray | `#636366` |
| Accent Primary | Apple Blue | `#0A84FF` |
| Accent Success | Apple Green | `#30D158` |
| Accent Warning | Apple Orange | `#FF9F0A` |
| Accent Error | Apple Red | `#FF453A` |
| User Message Bubble | Dark Blue | `#0A84FF` (20% opacity) |
| Agent Message Bubble | Dark Gray | `#2C2C2E` |

### 2.3 Typography

| Element | Font | Size | Weight |
|---------|------|------|--------|
| App Title | SF Pro Display | 20px | 600 |
| Section Header | SF Pro Text | 17px | 600 |
| Agent Name | SF Pro Text | 14px | 600 |
| Message Text | SF Pro Text | 15px | 400 |
| Timestamp | SF Pro Text | 12px | 400 |
| Input Text | SF Pro Text | 15px | 400 |
| Button Text | SF Pro Text | 15px | 500 |

### 2.4 Layout Structure

```
┌─────────────────────────────────────────────────────────────────┐
│  HEADER (56px height)                                           │
│  [Logo/Title: AsterismChat]              [Agents Button] [⚙️]   │
├────────────────┬────────────────────────────────────────────────┤
│                │                                                │
│   SIDEBAR      │              CHAT AREA                         │
│   (280px)      │                                                │
│                │  ┌──────────────────────────────────────────┐  │
│  Agents List   │  │  Message Bubble                          │  │
│  ─────────     │  │  [Avatar] [Name]        [Timestamp]      │  │
│  [+] Add Agent │  │  Message content here...                  │  │
│                │  │                                          │  │
│  • Agent 1     │  │                                          │  │
│  • Agent 2     │  │                                          │  │
│  • Agent 3     │  └──────────────────────────────────────────┘  │
│                │                                                │
│                │  (Scrollable message area)                     │
│                │                                                │
├────────────────┴────────────────────────────────────────────────┤
│  INPUT AREA (auto-height, min 60px, max 200px)                  │
│  [Agent Select] [           Message Input          ] [Send ➤]  │
└─────────────────────────────────────────────────────────────────┘
```

### 2.5 Components

#### Header
- Fixed position at top
- Blur background effect (`backdrop-filter: blur(20px)`)
- Contains: App title (left), Agents count badge, Settings icon (right)

#### Sidebar - Agents Panel
- Collapsible on mobile (hamburger menu)
- Each agent card shows:
  - Avatar (colored circle with first letter of agent name)
  - Agent name
  - Status indicator (online/offline dot)
  - Delete button (appears on hover)
- "Add Agent" button at bottom with `+` icon

#### Chat Area
- Virtualized scrolling for performance
- Messages grouped by timestamp (Today, Yesterday, Date)
- Each message shows:
  - Sender avatar (colored circle)
  - Sender name (bold)
  - Timestamp (relative: "2m ago", "1h ago")
  - Message content
- User messages: Right-aligned, blue tinted background
- Agent messages: Left-aligned, dark gray background

#### Message Input Area
- Multi-line textarea with auto-resize
- Agent selector dropdown (default: all selected)
- Send button with keyboard shortcut (Cmd/Ctrl + Enter)

#### Add/Edit Agent Modal
- Centered modal with backdrop blur
- Fields:
  - Agent Name (text input)
  - Endpoint URL (text input, placeholder: `http://localhost:8000/v1/chat/completions`)
  - API Key (password input with show/hide toggle)
- Buttons: Cancel (secondary), Save (primary)

#### Settings Panel
- Slide-out panel from right
- Options:
  - Clear chat history
  - Theme toggle (future: light mode)
  - Export chat as JSON

### 2.6 Animations & Interactions

| Interaction | Animation |
|-------------|-----------|
| Message appear | Fade in + slide up (200ms ease-out) |
| Send button hover | Scale 1.05 + background lighten (150ms) |
| Agent card hover | Background lighten + slight scale (150ms) |
| Modal open | Fade in + scale from 0.95 (200ms ease-out) |
| Sidebar collapse | Slide + fade (250ms ease-in-out) |
| Loading state | Pulsing skeleton with shimmer effect |
| Agent typing | Three bouncing dots animation |

---

## 3. Functionality Specification

### 3.1 Core Features

#### Agent Management
1. **Add Agent**
   - Click "+" button in sidebar
   - Fill in: Name, Endpoint URL, API Key
   - Validate: URL format, non-empty fields
   - Save to local storage

2. **Remove Agent**
   - Hover over agent card in sidebar
   - Click delete (trash) icon
   - Confirm deletion in modal
   - Remove from local storage

3. **Edit Agent**
   - Click on agent card
   - Opens edit modal with pre-filled data
   - Update and save

#### Chat Functionality
1. **Send Message**
   - Type message in input area
   - Select target agents (default: all)
   - Click send or press Cmd/Ctrl + Enter
   - Message appears in chat immediately (pending state)
   - Send HTTP POST to each selected agent's endpoint

2. **Message Broadcasting**
   - User message → sent to selected agents
   - Each agent receives the full message history
   - Each agent decides whether to respond (guard logic on agent side)
   - Agent responses appear in chat as they arrive

3. **Receive Responses**
   - Poll or receive agent responses via HTTP
   - Display responses in chat with agent's name
   - Handle errors gracefully (show error state on message)

4. **Message History**
   - Persist chat in local storage
   - Load on page refresh
   - Clear history option in settings

### 3.2 API Integration

#### Request Format (to each agent)
```json
{
  "model": "asterism/Asteri",
  "messages": [
    {
      "session_id": "session-uuid",
      "role": "user",
      "content": "hello"
    }
  ]
}
```

#### Headers
```
Content-Type: application/json
Authorization: Bearer {API_KEY}
```

#### Response Handling
- Parse JSON response
- Extract `choices[0].message.content`
- Display with agent name and timestamp
- Handle errors: network, timeout (30s), invalid JSON

### 3.3 Data Models

```typescript
interface Agent {
  id: string;           // UUID
  name: string;         // Display name
  endpoint: string;     // HTTP endpoint URL
  apiKey: string;       // Bearer token
  createdAt: number;    // Unix timestamp
}

interface Message {
  id: string;           // UUID
  sessionId: string;    // For agent API
  content: string;      // Message text
  sender: 'user' | Agent['id'];
  senderName: string;   // Display name
  timestamp: number;    // Unix timestamp
  status: 'sending' | 'sent' | 'error';
  targets?: string[];   // Agent IDs this was sent to
}

interface ChatState {
  agents: Agent[];
  messages: Message[];
  sessionId: string;
}
```

### 3.4 Edge Cases

1. **No agents configured**: Show empty state with "Add your first agent" prompt
2. **All agents removed**: Disable input, show empty state
3. **Agent endpoint unreachable**: Show error on message, allow retry
4. **API key invalid**: Show 401 error, prompt to update agent
5. **Very long messages**: Truncate in UI with "Show more" option
6. **Rapid message sending**: Queue messages, process sequentially
7. **Page refresh**: Restore state from local storage

---

## 4. Technical Architecture

### 4.1 Technology Stack

| Layer | Technology |
|-------|------------|
| Frontend | React + TypeScript |
| Styling | CSS Modules or Tailwind CSS |
| State Management | React Context + useReducer |
| Storage | localStorage |
| HTTP Client | Fetch API |
| Build Tool | Vite |

### 4.2 Project Structure

```
asterism-chat/
├── public/
│   └── index.html
├── src/
│   ├── components/
│   │   ├── Header/
│   │   ├── Sidebar/
│   │   ├── ChatArea/
│   │   ├── MessageBubble/
│   │   ├── InputArea/
│   │   ├── AgentModal/
│   │   └── SettingsPanel/
│   ├── context/
│   │   └── ChatContext.tsx
│   ├── hooks/
│   │   ├── useLocalStorage.ts
│   │   └── useChat.ts
│   ├── services/
│   │   └── agentApi.ts
│   ├── types/
│   │   └── index.ts
│   ├── styles/
│   │   └── global.css
│   ├── App.tsx
│   └── main.tsx
├── package.json
├── tsconfig.json
├── vite.config.ts
└── index.html
```

### 4.3 Backend Requirements

A simple backend server is required to:
1. Serve the frontend static files
2. Handle CORS if frontend and agents are on different domains
3. (Optional) Proxy requests to agents if needed

Can be implemented with:
- **Node.js/Express**: Simple and familiar
- **Python/FastAPI**: Quick to set up
- **Go**: High performance

For simplicity, we can use a **Node.js/Express** server.

```
server/
├── index.js          # Express server
├── package.json
└── .env              # Port configuration
```

---

## 5. Implementation Phases

### Phase 1: Core UI (Week 1)
- [ ] Set up React + Vite project
- [ ] Implement dark theme styling
- [ ] Create Header component
- [ ] Create Sidebar with agent list
- [ ] Create ChatArea with message display
- [ ] Create InputArea with agent selector
- [ ] Add local storage persistence

### Phase 2: Agent Management (Week 1-2)
- [ ] Create Add Agent modal
- [ ] Create Edit Agent modal
- [ ] Implement agent CRUD operations
- [ ] Validate agent inputs
- [ ] Add delete confirmation

### Phase 3: API Integration (Week 2)
- [ ] Create agent API service
- [ ] Implement message sending logic
- [ ] Handle responses and display
- [ ] Implement error handling
- [ ] Add loading states

### Phase 4: Polish (Week 2-3)
- [ ] Add animations
- [ ] Implement virtual scrolling (if needed)
- [ ] Add empty states
- [ ] Responsive design for mobile
- [ ] Settings panel
- [ ] Export chat functionality

---

## 6. Acceptance Criteria

### Visual Checkpoints
- [ ] Dark theme matches Apple elegance
- [ ] All text is readable (proper contrast)
- [ ] Animations are smooth (60fps)
- [ ] Layout is responsive (mobile + desktop)
- [ ] Empty states are clear and helpful

### Functional Checkpoints
- [ ] Can add, edit, delete agents
- [ ] Can send message to all agents
- [ ] Can send message to selected agents
- [ ] Agent responses display correctly
- [ ] Chat history persists after refresh
- [ ] Error states are handled gracefully

### Performance Checkpoints
- [ ] Initial load < 2 seconds
- [ ] Message send < 100ms UI response
- [ ] Smooth scrolling with 100+ messages

---

## 7. Future Enhancements

- [ ] Voice input (Speech-to-Text)
- [ ] Markdown rendering in messages
- [ ] Code syntax highlighting
- [ ] Image/file attachments
- [ ] Multiple sessions
- [ ] Agent personality customization
- [ ] Message search
- [ ] Keyboard shortcuts
- [ ] Dark/Light theme toggle
- [ ] Agent collaboration settings (timeout, retry logic)

---

## 8. Notes

- The guard logic for "what message should be answered" is on the **agent side** - the backend simply broadcasts messages to all agents
- Use **non-streaming HTTP** for simplicity as specified
- All agent configurations are stored in **local storage** (no backend database needed for MVP)
- Session ID is generated on first load and persists in local storage