# Email Chain Parser

A full-stack web application that parses email files (.eml, .txt) and extracts structured data including sender, recipients, subject, timestamps, and splits email chains into individual messages.

## Features

- **User Authentication** - Secure sign-up and sign-in with email verification
- **Email File Upload** - Support for .eml and .txt file formats
- **Chain Detection & Splitting** - Automatically splits email threads into individual messages
- **Structured Data Extraction** - Extracts sender, recipients, subject, dates, and message bodies
- **Clean UI** - Responsive interface built with Tailwind CSS
- **User Isolation** - Each user's parsed emails are kept private
- **Real-time Parsing** - Instant feedback and results

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Next.js 14 (App Router), React, TypeScript |
| **Backend** | Next.js API Routes |
| **Authentication** | Supabase Auth (PostgreSQL-backed) |
| **Database** | PostgreSQL (Supabase) |
| **Email Parsing** | mailparser + custom regex parser |
| **Styling** | Tailwind CSS |

## Prerequisites

- **Node.js** 18.17 or later
- **npm** or **yarn**
- **Supabase account** (free tier works)
- **Git**

## Local Setup

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/email-parser.git
cd email-parser
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Set Up Supabase

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Wait for the project to finish setting up (~2 minutes)
3. Navigate to **Settings** → **API**
4. Copy your **Project URL** and **anon public** key

### 4. Configure Environment Variables
```bash
# Copy the example environment file
cp .env.example .env.local
```

Edit `.env.local` and add your Supabase credentials:
```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

**Important:** Never commit `.env.local` to Git. It's already in `.gitignore`.

### 5. Run the Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 6. Create Your First Account

1. Click **"Sign Up"**
2. Enter your email and password (minimum 6 characters)
3. Check your email for the confirmation link
4. Click the link to verify your email
5. Return to the app and sign in

## Testing the Parser

Create a test email file (`test-chain.eml`):
```
From: Jane Smith <jane@example.com>
To: John Doe <john@example.com>
Subject: Re: Re: Project Update
Date: Wed, 20 Nov 2024 14:30:00 +0000

Hi John,

Perfect! Thanks for the clarification.

Best,
Jane

On Nov 20, 2024, at 10:15 AM, John Doe <john@example.com> wrote:

Hi Jane,

The deadline is next Friday, November 29th.

Let me know if you need anything else!

Best,
John

On Nov 19, 2024, at 3:45 PM, Jane Smith <jane@example.com> wrote:

Hi John,

Can you remind me of the project deadline?

Thanks,
Jane
```

Upload this file to see the parser split it into 3 individual messages.

## Project Structure
```
email-parser/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/               # Backend API routes
│   │   │   └── upload/        
│   │   │       └── route.ts   # Email upload & parsing endpoint
│   │   ├── layout.tsx         # Root layout
│   │   ├── page.tsx           # Home page
│   │   └── globals.css        # Global styles
│   ├── components/            # React components
│   │   ├── Auth.tsx           # Authentication UI (sign in/up)
│   │   ├── EmailUpload.tsx    # File upload & results display
│   │   └── ProtectedLayout.tsx # Auth wrapper component
│   └── lib/                   # Utility functions
│       ├── supabase.ts        # Supabase client configuration
│       └── emailParser.ts     # Email chain parsing logic
├── public/                    # Static assets
├── .env.example              # Environment variables template
├── .env.local               # Your secrets (not in Git)
├── .gitignore               # Git ignore rules
├── package.json             # Dependencies
├── tsconfig.json            # TypeScript configuration
└── tailwind.config.ts       # Tailwind CSS configuration
```

---

## How Authentication Works

### Architecture

This application uses **Supabase Auth**, which provides a complete authentication system backed by PostgreSQL.

### Authentication Flow

#### **Sign Up:**
```
1. User enters email + password
   ↓
2. Frontend calls: supabase.auth.signUp()
   ↓
3. Supabase:
   - Hashes password (bcrypt)
   - Stores user in auth.users table
   - Sends confirmation email
   ↓
4. User clicks email verification link
   ↓
5. Email confirmed → user can sign in
```

#### **Sign In:**
```
1. User enters credentials
   ↓
2. Frontend calls: supabase.auth.signInWithPassword()
   ↓
3. Supabase verifies password hash
   ↓
4. Returns JWT tokens:
   - Access token (1 hour expiry)
   - Refresh token (60 days expiry)
   ↓
5. Tokens stored in browser localStorage
   ↓
6. All subsequent requests include access token
```

### Session Management

**Client-Side (`ProtectedLayout.tsx`):**
```typescript
// Check authentication status
supabase.auth.getUser()

// Listen for auth changes (sign in/out)
supabase.auth.onAuthStateChange((event, session) => {
  // Update UI based on auth state
})
```

**Token Storage:**
- Stored in `localStorage` under key: `sb-<project-ref>-auth-token`
- Automatically refreshed by Supabase client library
- Sent with every API request

**Protected Routes:**
- `ProtectedLayout` wrapper component checks auth status
- If not authenticated → shows login page
- If authenticated → renders child components

### Security Features

- **Password Hashing:** bcrypt with salt
- **Email Verification:** Required before access
- **JWT Tokens:** Cryptographically signed
- **Automatic Token Refresh:** Handled by client library
- **Row Level Security (RLS):** Database-level access control (ready for implementation)

---

## How Email Parsing Works

### Overview

The email parser uses a **multi-stage regex-based approach** to detect email chains, split them into individual messages, and extract structured metadata.

### Architecture
```
Email File Upload
    ↓
mailparser (parse .eml format)
    ↓
Extract headers (sender, recipients, subject, date)
    ↓
Custom Chain Parser (emailParser.ts)
    ↓
Structured Output (JSON)
```

**Key Technique:** Positive lookahead `(?=pattern)`
- Splits BEFORE the pattern
- Keeps the pattern in the result
- Essential for preserving message headers


## Assumptions & Limitations

### Assumptions

1. **Email Format**
   - Assumes emails are in standard .eml or plain text format
   - Expects UTF-8 or common character encodings
   - Assumes English language patterns (On...wrote:, From:, Sent:)

2. **Chain Structure**
   - Assumes chronological ordering (newest first)
   - Assumes standard reply patterns are used by email clients
   - Assumes replies include original message

3. **User Behavior**
   - Each user creates their own Supabase project for testing (demo mode)
   - Users verify email before accessing the application
   - Email files are relatively small (< 10MB)

4. **Environment**
   - Modern browser with JavaScript enabled
   - Internet connection for authentication
   - Email confirmation link accessible

### Known Limitations

#### **1. Email Chain Parsing**

**Limited Pattern Coverage (~70-80% accuracy):**
- Handles Gmail/Apple Mail format ("On...wrote:")
- Handles Outlook format ("From:/Sent:")
- Handles original message delimiters
- May miss non-standard formats
- Doesn't handle non-English email clients
- Struggles with heavily formatted HTML emails

**Metadata Extraction:**
- Sender extraction may return "Unknown" if pattern doesn't match
- Date parsing falls back to current date if format unrecognized
- Doesn't extract all participants (Cc, Bcc) from individual messages

**Edge Cases Not Handled:**
- Forwarded emails (vs. replies)
- Inline images and attachments
- Calendar invites embedded in emails
- Encrypted or signed emails (PGP/S/MIME)
- Emails with custom headers or non-standard formatting

#### **2. Authentication**

**Email Confirmation Required:**
- Users must verify email before accessing the app
- No password reset flow implemented
- No social login (Google, GitHub, etc.)

**Session Management:**
- Tokens stored in localStorage (vulnerable to XSS)
- Production should use httpOnly cookies
- No automatic session timeout UI

#### **3. Storage & Scalability**

**No Database Persistence:**
- Parsed emails are NOT saved to database
- Results lost on page refresh
- No email history or search

**File Size Limits:**
- Client-side: No explicit limit (browser memory dependent)
- Server-side: Next.js default (~4.5MB)
- Large email chains (>1MB) may be slow to parse

**Concurrency:**
- Single-threaded parsing (one email at a time)
- No batch upload support
- No background job processing

#### **4. Error Handling**

**Limited Error Recovery:**
- Malformed .eml files may cause parsing to fail
- No graceful degradation for unsupported formats
- Error messages could be more descriptive

**No Validation:**
- Doesn't validate email structure before parsing
- Doesn't check for malicious file content
- No file type verification beyond extension

#### **5. UI/UX**

**Basic Interface:**
- No drag-and-drop file upload
- No loading indicators during upload
- No export functionality (CSV, JSON download)
- No email preview before parsing

**Mobile Experience:**
- Responsive but not optimized for mobile
- File picker UX on mobile could be improved

#### **6. Security**

**Current Implementation:**
- `anon` key exposed in client (acceptable for demo)
- No rate limiting on uploads
- No file size validation
- No content scanning for malicious files

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.