# Agent Coding Guidelines

This document provides guidelines for agents working on the AsterismChat codebase.

## Project Overview

AsterismChat is a React + TypeScript chat application with an Express backend. The frontend uses Vite, TailwindCSS v4, and React 19. The backend uses Express, Prisma, and PostgreSQL.

```
/                    # Frontend (React + Vite)
├── src/             # Frontend source code
│   ├── components/  # React components
│   ├── context/     # React context providers
│   ├── hooks/       # Custom React hooks
│   ├── services/    # API service functions
│   ├── types/       # TypeScript type definitions
│   └── utils/       # Utility functions
└── server/          # Backend (Express + Prisma)
    └── src/
        ├── controllers/
        ├── routes/
        ├── services/
        ├── db/
        └── utils/
```

## Build / Lint / Test Commands

### Frontend (root directory)

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Run ESLint
npm run lint

# Preview production build
npm run preview

# Run lint on specific file
npx eslint src/components/SomeComponent.tsx

# Run lint with auto-fix
npm run lint -- --fix
```

### Backend (server directory)

```bash
cd server

# Start development server (with auto-reload)
npm run dev

# Build TypeScript
npm run build

# Start production server
npm run start

# Prisma database commands
npm run db:generate   # Generate Prisma client
npm run db:push       # Push schema to database
npm run db:migrate    # Run migrations
npm run db:studio     # Open Prisma Studio
```

### Docker

```bash
# Build and start all services
docker-compose up --build

# Start only frontend
docker-compose up frontend

# Start only backend
docker-compose up backend
```

**Note:** There are currently no test files in this project. If adding tests, use Vitest for the frontend and Jest for the backend.

## Code Style Guidelines

### General Principles

- Keep functions small and focused (single responsibility)
- Prefer composition over inheritance
- Use early returns to reduce nesting
- Avoid premature abstractions

### TypeScript

- **Always use explicit types** for function parameters and return types
- Use `interface` for object shapes, `type` for unions/intersections
- Enable strict mode in tsconfig
- Use `unknown` instead of `any`, or narrow with type guards

```typescript
// Good
function getAgentById(id: string): Agent | undefined {
  return agents.find(agent => agent.id === id);
}

// Avoid
function getAgentById(id) {
  return agents.find(agent => agent.id === id);
}
```

### Naming Conventions

- **Components**: PascalCase (e.g., `ChatArea.tsx`, `MessageBubble.tsx`)
- **Interfaces/Types**: PascalCase with descriptive names (e.g., `Agent`, `ChatState`)
- **Functions/variables**: camelCase (e.g., `handleAddAgent`, `isLoading`)
- **Custom hooks**: camelCase with `use` prefix (e.g., `useLocalStorage`, `useKeyboardShortcuts`)
- **Files**: kebab-case for non-component files (e.g., `chatReducer.ts`, `chatActions.ts`)
- **Constants**: SCREAMING_SNAKE_CASE for config constants (e.g., `MAX_MESSAGE_LENGTH`)

### Imports

- Use absolute imports from root for project modules
- Group imports in this order: external → internal → types → styles
- Use explicit named imports (avoid default imports for utilities)

```typescript
// Good
import React, { useState, useCallback } from 'react';
import { ChatProvider, useChat } from './context/ChatContext';
import { ThemeProvider } from './context/ThemeContext';
import { Button } from './components/common/Button';
import { Agent } from '../types';
import './styles.css';

// Avoid
import * as React from 'react';
import chatContext from './context/ChatContext';
```

### React Patterns

- Use functional components with hooks
- Destructure props in component signature
- Define interfaces for component props adjacent to component
- Use `useCallback` for event handlers passed to child components
- Use `useMemo` for expensive computations
- Keep context providers at top level

```typescript
// Good
interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'danger';
  onClick?: () => void;
}

export function Button({ variant = 'primary', onClick }: ButtonProps) {
  return <button onClick={onClick}>{children}</button>;
}
```

### Error Handling

- Use try/catch for async operations
- Handle errors at component boundaries (error boundaries for React)
- Log errors with appropriate context
- Display user-friendly error messages

```typescript
// Good
try {
  const response = await fetchAgent(agentId);
  if (!response.ok) {
    throw new Error(`Failed to fetch agent: ${response.statusText}`);
  }
  return response.data;
} catch (error) {
  logger.error('Failed to fetch agent', { agentId, error });
  throw error;
}
```

### CSS / Styling

- Use TailwindCSS utility classes
- Define custom CSS variables in global styles for theming
- Use CSS variables for colors: `var(--bg-primary)`, `var(--text-primary)`, etc.
- Keep custom CSS minimal; prefer Tailwind classes

```typescript
// Good
<div className="flex items-center justify-between px-4 py-2">

// For theme-aware colors
<div className="bg-[var(--bg-primary)] text-[var(--text-primary)]">
```

### File Organization

- One component per file (colocate with its types and styles)
- Use index files for clean imports from directories
- Group related files in feature directories

```
components/
├── ChatArea/
│   ├── ChatArea.tsx
│   └── index.ts
└── common/
    ├── Button.tsx
    └── Input.tsx
```

### ESLint Rules

The project uses:
- `@eslint/js` - JavaScript recommended rules
- `typescript-eslint` - TypeScript-specific rules
- `eslint-plugin-react-hooks` - React hooks rules
- `eslint-plugin-react-refresh` - Validates React refresh

Run `npm run lint` before committing to catch issues.

### Backend Specific

- Use controller-service-route pattern
- Validate input with Zod or similar
- Use proper HTTP status codes
- Include request IDs in logs for tracing
- Use Prisma for database operations

```typescript
// Route → Controller → Service pattern
// routes/agents.ts - define routes
// controllers/agentsController.ts - handle request/response
// services/agentsService.ts - business logic
```

### Git Conventions

- Use meaningful commit messages
- Commit related changes together
- Run lint before committing
- Do not commit secrets (use `.env` with `.env.example` for template)

## Common Tasks

### Adding a new component

1. Create component file in appropriate directory
2. Define props interface
3. Implement component with TypeScript
4. Export from index.ts if directory has one
5. Run lint to check for issues

### Adding a new API endpoint

1. Create service function in server/src/services/
2. Create controller in server/src/controllers/
3. Define route in server/src/routes/
4. Test with curl or Postman
5. Update server/src/index.ts if needed

### Database changes

1. Edit schema in server/prisma/schema.prisma
2. Run `npm run db:generate`
3. Run `npm run db:migrate` or `npm run db:push`
