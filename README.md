# Shorewatch - Coral Care Social Intelligence App

A modern Next.js App Router application for managing social intelligence and team collaboration at Coral Care.

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

Visit `http://localhost:3000`

## Project Structure

### App Pages
- **`app/page.js`** - Login page with email/password authentication
- **`app/dashboard/`** - Main dashboard hub with quick stats
- **`app/dashboard/inbox/`** - Social conversation inbox with filters
- **`app/dashboard/inbox/[threadId]/`** - Individual conversation threads with AI drafts
- **`app/dashboard/team/`** - Team member management
- **`app/invite/[inviteToken]/`** - Invite acceptance page
- **`app/error.js`** - Global error boundary

### Styling
- **`app/globals.css`** - Global styles with Coral Care brand colors and typography
- **`*.module.css`** - Component-scoped CSS modules for encapsulation

### Components

#### Common
- **`Button.js`** - Reusable button with variants (primary, secondary, danger, ghost) and sizes
- **`Badge.js`** - Status/sentiment badges (positive, negative, neutral, needs_attention, flagged)
- **`Modal.js`** - Reusable modal overlay with overlay, close button, and animations

#### Inbox
- **`ThreadCard.js`** - Individual conversation card with avatar, preview, sentiment, and draft indicator
- **`ThreadFilters.js`** - Filter pill buttons for inbox (All, Needs Attention, Unread, Flagged, Positive, Negative)

#### Team
- **`InviteModal.js`** - Modal for inviting team members with email and role selection

### Middleware
- **`middleware.js`** - Protects `/dashboard/*` routes, checks for sessionToken cookie, allows public auth and invite routes

## Coral Care Brand System

### Colors
- **Deep Blue Sea**: `#030043` (navy, primary, headlines)
- **Jellyfish**: `#FE416D` (hot pink, primary CTAs)
- **Clownfish**: `#FF824E` (orange, secondary CTAs)
- **Seaweed**: `#00D2D3` (teal, provider brand, focus states)
- **Ocean Breeze**: `#3292E4` (blue, links)
- **Coral Reef**: `#FF685E` (coral, warmth/actions)

### Typography
- **Body**: Plus Jakarta Sans (Google Fonts)
- **Headings**: Fraunces 700 (Google Fonts)

## API Integration

The app integrates with the following endpoints:

### Authentication
- `POST /api/v1/auth/session` - Login with email/password
- `POST /api/v1/auth/invite-accept` - Accept invite and create account
- `GET /api/v1/auth/invite/[inviteToken]` - Validate invite

### Inbox & Threads
- `GET /api/v1/inbox` - List threads with filters
- `GET /api/v1/inbox/threads/[threadId]` - Get thread details and messages
- `POST /api/v1/inbox/threads/[threadId]/read` - Mark thread as read
- `POST /api/v1/drafts/[draftId]/publish` - Send AI-generated draft

### Team
- `GET /api/v1/team` - Get team info and members
- `POST /api/v1/team/invite` - Send team member invite
- `DELETE /api/v1/team/members/[memberId]` - Remove team member

## Features

### Login & Onboarding
- Clean, centered login form with email/password
- Invite acceptance with password creation
- Session persistence via cookies

### Dashboard
- Quick stats cards (unread threads, flagged items, response time, sentiment)
- Quick action cards linking to main features

### Inbox
- Thread list with author, preview, sentiment badge, and time
- Filter pills for quick categorization
- Unread indicator (blue dot)
- AI draft readiness indicator
- Click to open full conversation

### Conversation View
- Chronological message history
- Author names and timestamps for each message
- AI-generated draft in distinct box
- Reply composer with Cmd+Enter shortcut
- Redraft capability

### Team Management
- View team info (name, member count, creation date)
- Member list with avatars, roles, and status
- Remove members
- Invite new members via modal

## Security

- Session tokens stored in httpOnly cookies
- Middleware protects dashboard routes
- Public routes: `/`, `/api/v1/auth/`, `/invite/`
- Auth required for: `/dashboard/*`

## Development Notes

- All components use CSS modules for style isolation
- Client components marked with `'use client'` where needed
- Responsive design with mobile-first approach
- Keyboard shortcuts: Cmd+Enter in reply composer
- Error states with retry buttons
- Loading states with spinners

## Building for Production

```bash
npm run build
npm start
```

## Browser Support

Modern browsers with ES2020 support.
