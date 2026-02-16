# AsterismChat - Agent Group Chat Interface

## 1. Project Overview

**Project Name:** AsterismChat  
**Project Type:** Web Application (Single Page Application)  
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
  - Status indicator (last response time or "waiting" state)
  - Delete button (appears on hover)
- "Add Agent" button at bottom with `+` icon

#### Chat Area
- Standard scrollable container (not virtualized for MVP)
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
  - Agent Name (text input, required)
  - Endpoint URL (text input, required, placeholder: `http://localhost:8000/v1/chat/completions`)
  - Model Name (text input, required, placeholder: `asterism/Asteri`)
  - API Key (password input with show/hide toggle, required)
- Buttons: Cancel (secondary), Save (primary)

#### Settings Panel
- Slide-out panel from right
- Options:
  - Clear chat history
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
| Agent responding | Three bouncing dots animation |

---

## 3. Functionality Specification

### 3.1 Core Features

#### Agent Management
1. **Add Agent**
   - Click "+" button in sidebar
   - Fill in: Name, Endpoint URL, Model Name, API Key
   - Validate: URL format (must be valid HTTP/HTTPS URL), non-empty fields
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

2. **Message Broadcasting Flow**
   ```
   User sends message
         │
         ▼
   ┌─────────────────┐
   │  User message   │─────── Display in chat
   │  appears locally│
   └─────────────────┘
         │
         ▼
   For each selected agent:
         │
         ▼
   ┌─────────────────────────────┐
   │  POST to agent endpoint     │
   │  - Current message          │
   │  - Session ID (for agent's  │
   │    internal session state)  │
   └─────────────────────────────┘
         │
         ▼
   ┌─────────────────────────────┐
   │  Agent handles session      │
   │  internally (context,       │
   │  history, etc.)             │
   │  Agent decides to respond   │
   │  (guard logic on agent side)│
   └─────────────────────────────┘
         │
         ▼
   Response appears in chat
   ```

3. **Response Handling**
   - Each agent responds independently (no guaranteed order)
   - Display responses as they arrive
   - Show "waiting" indicator if some agents haven't responded
   - No timeout - let agents respond at their own pace
   - Agent-to-agent conversation: Each agent maintains its own session. When Agent A responds, it goes to all agents in the next broadcast. Each agent decides internally whether to respond based on the message.

4. **Message History**
   - Persist chat in local storage
   - Load on page refresh
   - Clear history option in settings

### 3.2 API Integration

#### Request Format (to each agent)

Each agent maintains its **own internal session state**. We only send the current message with the session_id - the agent handles context internally.

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

**Message format for API:**
```typescript
interface ApiMessage {
  session_id: string;
  role: 'user';
  content: string;
}
```

**Construction rules:**
1. Send only the current user message
2. Always include `session_id` so agent can track its own session
3. `role` is always `"user"` for outgoing messages
4. Agent's response is added to our local chat display, but not sent back to other agents

#### Headers
```
Content-Type: application/json
Authorization: Bearer {API_KEY}
```

#### Response Handling
- Parse JSON response
- Extract `choices[0].message.content`
- Display with agent name and timestamp
- Handle errors:
  - **Network error**: Show "Connection failed" on message, allow retry
  - **401 Unauthorized**: Show "Invalid API key" error, highlight agent
  - **Timeout (30s)**: Show "Request timed out" error
  - **Invalid JSON**: Show "Invalid response" error
  - **Rate limited (429)**: Show "Rate limited, retrying..." with auto-retry

### 3.3 Data Models

```typescript
interface Agent {
  id: string;           // UUID
  name: string;         // Display name (e.g., "Asteri", "Assistant")
  endpoint: string;     // HTTP endpoint URL
  model: string;        // Model name (e.g., "asterism/Asteri")
  apiKey: string;       // Bearer token
  createdAt: number;    // Unix timestamp
  lastResponseAt?: number; // Last successful response timestamp
}

interface Message {
  id: string;           // UUID
  sessionId: string;    // For agent API
  content: string;      // Message text
  sender: 'user' | Agent['id'];
  senderName: string;   // Display name (e.g., "You", "Asteri")
  timestamp: number;    // Unix timestamp
  status: 'sending' | 'sent' | 'error';
  targets?: string[];   // Agent IDs this was sent to
  error?: string;       // Error message if status is 'error'
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
3. **Agent endpoint unreachable**: Show error on message, allow retry button
4. **API key invalid**: Show 401 error with "Update API key" action button
5. **Very long messages**: Allow text wrapping, no truncate for MVP
6. **Rapid message sending**: Queue messages, process sequentially
7. **Page refresh**: Restore state from local storage
8. **Agent takes long time to respond**: Show "typing" indicator, no timeout
9. **All agents fail to respond**: Show "No responses" indicator after user cancels or closes browser

---

## 4. Technical Architecture

### 4.1 Technology Stack

| Layer | Technology |
|-------|------------|
| Frontend | React + TypeScript |
| Styling | Tailwind CSS |
| State Management | React Context + useReducer |
| Storage | localStorage |
| HTTP Client | Fetch API |
| Build Tool | Vite |

**Why Tailwind CSS?**
- Faster development with utility classes
- Easy to implement Apple-like design system
- Built-in dark mode support
- Small bundle size with PurgeCSS

### 4.2 Project Structure

```
asterism-chat/
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.js
├── postcss.config.js
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── index.css
│   ├── types/
│   │   └── index.ts
│   ├── context/
│   │   └── ChatContext.tsx
│   ├── hooks/
│   │   ├── useLocalStorage.ts
│   │   └── useChat.ts
│   ├── services/
│   │   └── agentApi.ts
│   ├── utils/
│   │   └── messageFormatter.ts
│   └── components/
│       ├── Header/
│       │   ├── Header.tsx
│       │   └── Header.module.css
│       ├── Sidebar/
│       │   ├── Sidebar.tsx
│       │   ├── Sidebar.module.css
│       │   └── AgentCard.tsx
│       ├── ChatArea/
│       │   ├── ChatArea.tsx
│       │   └── ChatArea.module.css
│       ├── MessageBubble/
│       │   ├── MessageBubble.tsx
│       │   └── MessageBubble.module.css
│       ├── InputArea/
│       │   ├── InputArea.tsx
│       │   └── InputArea.module.css
│       ├── AgentModal/
│       │   ├── AgentModal.tsx
│       │   └── AgentModal.module.css
│       ├── SettingsPanel/
│       │   ├── SettingsPanel.tsx
│       │   └── SettingsPanel.module.css
│       └── common/
│           ├── Button.tsx
│           ├── Modal.tsx
│           ├── Input.tsx
│           └── Avatar.tsx
```

### 4.3 Security Considerations

⚠️ **Important Security Note:**

Storing API keys in localStorage has security implications:
- **XSS Vulnerability**: Malicious scripts can access localStorage
- **Physical Access**: Anyone with device access can view keys
- **No Encryption**: Keys stored in plain text

**Mitigations for MVP:**
1. Add warning in UI when adding API keys
2. Consider using sessionStorage instead (cleared on tab close)
3. For production: Use a backend proxy with proper authentication

### 4.4 No Backend Required

For this MVP, **no backend server is needed** if:
- Agents run on localhost or same domain
- CORS is handled by the agent servers
- Frontend is served via Vite dev server or static hosting

If agents are on different domains and CORS is an issue, a simple proxy can be added later.

---

## 5. Implementation Plan

### Phase 1: Foundation (Day 1)
- [ ] Initialize React + Vite + TypeScript project
- [ ] Set up Tailwind CSS with custom Apple-like theme
- [ ] Create type definitions
- [ ] Implement useLocalStorage hook

### Phase 2: Core UI (Day 2)
- [ ] Create ChatContext for state management
- [ ] Build Header component
- [ ] Build Sidebar with agent list
- [ ] Build ChatArea with message display
- [ ] Build MessageBubble component

### Phase 3: Agent Management (Day 3)
- [ ] Create AgentModal for add/edit
- [ ] Implement agent CRUD operations
- [ ] Add input validation
- [ ] Implement delete confirmation

### Phase 4: Chat Functionality (Day 4)
- [ ] Build InputArea with agent selector
- [ ] Implement message sending logic
- [ ] Create agentApi service
- [ ] Handle responses and display

### Phase 5: Polish (Day 5)
- [ ] Add animations
- [ ] Implement error handling states
- [ ] Add empty states
- [ ] Responsive design for mobile
- [ ] Settings panel with export/clear

**Total Estimated Time: 5 days**

---

## 6. Acceptance Criteria

### Visual Checkpoints
- [ ] Dark theme matches Apple elegance (deep blacks, subtle grays)
- [ ] All text is readable (proper contrast ratios)
- [ ] Animations are smooth (60fps)
- [ ] Layout is responsive (mobile 375px to desktop 1920px)
- [ ] Empty states are clear and helpful

### Functional Checkpoints
- [ ] Can add agent with name, endpoint, model, and API key
- [ ] Can edit existing agent configuration
- [ ] Can delete agent with confirmation
- [ ] Can send message to all agents (broadcast)
- [ ] Can send message to selected agents only
- [ ] Each agent receives current message with session_id (agent handles its own session)
- [ ] Agent responses display with correct sender name
- [ ] Chat history persists after page refresh
- [ ] Error states display clearly (network, auth, timeout)
- [ ] Can clear chat history
- [ ] Can export chat as JSON

### Performance Checkpoints
- [ ] Initial load < 2 seconds
- [ ] Message send < 100ms UI response
- [ ] Smooth scrolling with 100+ messages

---

## 7. Future Enhancements (Post-MVP)

- [ ] Markdown rendering in messages
- [ ] Code syntax highlighting
- [ ] Image/file attachments
- [ ] Multiple chat sessions
- [ ] Agent personality customization
- [ ] Message search
- [ ] Keyboard shortcuts
- [ ] Voice input (Speech-to-Text)
- [ ] Dark/Light theme toggle
- [ ] Agent collaboration settings (timeout, retry logic)
- [ ] Backend proxy for security
- [ ] User authentication

---

## 8. API Reference

### Sending a Message

**Request:**
```bash
curl --location 'http://localhost:8000/v1/chat/completions' \
--header 'Content-Type: application/json' \
--header 'Authorization: Bearer YOUR_API_KEY' \
--data '{
    "model": "asterism/Asteri",
    "messages": [
      {
        "session_id": "session-uuid",
        "role": "user",
        "content": "hello"
      }
    ]
  }'
```

**Response:**
```json
{
  "id": "chatcmpl-1760739de57f",
  "object": "chat.completion",
  "created": 1771210760,
  "model": "asterism/Asteri",
  "choices": [
    {
      "index": 0,
      "message": {
        "role": "assistant",
        "content": "Hello there! 👋 It's so nice to meet you. How are you doing today?"
      },
      "finish_reason": "stop"
    }
  ],
  "usage": {
    "prompt_tokens": 2418,
    "completion_tokens": 1258,
    "total_tokens": 3676
  }
}
```

---

## 9. Notes

- The guard logic for "what message should be answered" is on the **agent side** - the frontend simply broadcasts messages to all agents
- Use **non-streaming HTTP** for simplicity as specified
- All agent configurations are stored in **local storage**
- Session ID is generated on first load and persists in local storage
- Agents respond **asynchronously and independently** - no guaranteed order
- When an agent responds, that response becomes part of the conversation history for subsequent messages