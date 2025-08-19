-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255),
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create an index on username for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);

-- Create an index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create a policy that allows users to read their own data
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (auth.uid() = id);

-- Create a policy that allows users to update their own data
CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (auth.uid() = id);

-- Optional: Create a sessions table for future use
CREATE TABLE IF NOT EXISTS user_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    session_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true
);

-- Enable Row Level Security for sessions
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;

-- Create a policy for user sessions
CREATE POLICY "Users can manage own sessions" ON user_sessions
    FOR ALL USING (user_id = auth.uid());

-- Create chat messages table for multiplayer testing
CREATE TABLE IF NOT EXISTS chat_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    username VARCHAR(50) NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create an index on created_at for faster lookups
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at DESC);

-- Enable Row Level Security for chat messages
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Create a policy that allows all authenticated users to read chat messages
CREATE POLICY "Authenticated users can view chat messages" ON chat_messages
    FOR SELECT USING (true);

-- Create a policy that allows users to insert their own messages
CREATE POLICY "Users can send chat messages" ON chat_messages
    FOR INSERT WITH CHECK (true);

-- Create online users table for presence tracking
CREATE TABLE IF NOT EXISTS online_users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    username VARCHAR(50) NOT NULL,
    last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Enable Row Level Security for online users
ALTER TABLE online_users ENABLE ROW LEVEL SECURITY;

-- Create a policy for online users
CREATE POLICY "Authenticated users can view online users" ON online_users
    FOR SELECT USING (true);

CREATE POLICY "Users can update their own presence" ON online_users
    FOR ALL USING (true);
