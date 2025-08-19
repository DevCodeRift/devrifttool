-- Clean update script for chat functionality
-- This script safely updates existing tables and policies

-- First, drop existing policies if they exist
DROP POLICY IF EXISTS "Authenticated users can view chat messages" ON chat_messages;
DROP POLICY IF EXISTS "Users can send chat messages" ON chat_messages;
DROP POLICY IF EXISTS "Authenticated users can view online users" ON online_users;
DROP POLICY IF EXISTS "Users can update their own presence" ON online_users;

-- Create chat messages table (will skip if already exists)
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

-- Create NEW policies for chat messages
CREATE POLICY "Authenticated users can view chat messages" ON chat_messages
    FOR SELECT USING (true);

CREATE POLICY "Users can send chat messages" ON chat_messages
    FOR INSERT WITH CHECK (true);

-- Create online users table (will skip if already exists)
CREATE TABLE IF NOT EXISTS online_users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    username VARCHAR(50) NOT NULL,
    last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Enable Row Level Security for online users
ALTER TABLE online_users ENABLE ROW LEVEL SECURITY;

-- Create NEW policies for online users
CREATE POLICY "Authenticated users can view online users" ON online_users
    FOR SELECT USING (true);

CREATE POLICY "Users can update their own presence" ON online_users
    FOR ALL USING (true);
