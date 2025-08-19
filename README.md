# DevCodeRift - Multiplayer Web App

A simple multiplayer web application built with Next.js, Auth.js, Supabase, and Pusher.

## Features

- ✅ User authentication (username/password)
- ✅ User registration and login
- ✅ Session management with Auth.js
- ✅ Persistent storage with Supabase
- ✅ Real-time connectivity with Pusher (configured)
- ✅ Responsive design with Tailwind CSS
- ✅ TypeScript support

## Tech Stack

- **Frontend**: Next.js 15 with App Router
- **Authentication**: Auth.js (NextAuth.js)
- **Database**: Supabase
- **Real-time**: Pusher
- **Styling**: Tailwind CSS
- **Language**: TypeScript

## Setup Instructions

### 1. Clone and Install Dependencies

```bash
git clone <your-repo-url>
cd devrifttool
npm install
```

### 2. Set up Supabase

1. Go to [Supabase](https://supabase.com) and create a new project
2. In the SQL Editor, run the schema from `database/schema.sql`
3. Get your project URL and anon key from Project Settings > API

### 3. Set up Pusher

1. Go to [Pusher](https://pusher.com) and create a new app
2. Get your app credentials from the App Keys section

### 4. Environment Variables

Copy `.env.example` to `.env.local` and fill in your values:

```bash
cp .env.example .env.local
```

Update the following variables:

```env
# Auth.js
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-here

# Supabase
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

# Pusher
NEXT_PUBLIC_PUSHER_APP_ID=your-pusher-app-id
NEXT_PUBLIC_PUSHER_KEY=your-pusher-key
PUSHER_SECRET=your-pusher-secret
NEXT_PUBLIC_PUSHER_CLUSTER=your-pusher-cluster
```

### 5. Generate NextAuth Secret

You can generate a secret key using:

```bash
openssl rand -base64 32
```

### 6. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see your app.

## Project Structure

```
src/
├── app/
│   ├── api/auth/         # Auth.js API routes
│   ├── auth/             # Authentication pages
│   ├── layout.tsx        # Root layout
│   └── page.tsx          # Home page
├── components/
│   ├── auth/             # Authentication components
│   ├── AuthProvider.tsx  # Session provider
│   └── Navigation.tsx    # Navigation component
├── lib/
│   ├── auth.ts           # Auth.js configuration
│   ├── pusher.ts         # Pusher configuration
│   └── supabase.ts       # Supabase client
└── types/
    └── next-auth.d.ts    # Auth.js type definitions
```

## Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add your environment variables in Vercel project settings
4. Update `NEXTAUTH_URL` to your production domain
5. Deploy!

### Domain Setup

Since you have `devcoderift.com`, you can:

1. Add the domain in Vercel project settings
2. Update your DNS records to point to Vercel
3. Update `NEXTAUTH_URL` to `https://devcoderift.com`

## Next Steps

Now that you have a basic authentication system, you can:

1. Add more user profile fields
2. Implement real-time features with Pusher
3. Add multiplayer game logic
4. Create user dashboards
5. Add email verification
6. Implement password reset functionality

## API Endpoints

- `POST /api/auth/register` - User registration
- `GET/POST /api/auth/[...nextauth]` - Auth.js endpoints
- `GET /api/auth/session` - Get current session

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License
