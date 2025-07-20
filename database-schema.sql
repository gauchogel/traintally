-- Tally Train Database Schema
-- Run these commands in your Supabase SQL Editor

-- Enable Row Level Security
ALTER TABLE auth.users ENABLE ROW LEVEL SECURITY;

-- Create games table
CREATE TABLE games (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    game_id TEXT UNIQUE NOT NULL,
    name TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true
);

-- Create players table
CREATE TABLE players (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    game_id UUID REFERENCES games(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    train_color TEXT NOT NULL,
    is_offline BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(game_id, name)
);

-- Create rounds table
CREATE TABLE rounds (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    game_id UUID REFERENCES games(id) ON DELETE CASCADE,
    round_number INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(game_id, round_number)
);

-- Create scores table
CREATE TABLE scores (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    round_id UUID REFERENCES rounds(id) ON DELETE CASCADE,
    player_id UUID REFERENCES players(id) ON DELETE CASCADE,
    score INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(round_id, player_id)
);

-- Create indexes for better performance
CREATE INDEX idx_games_game_id ON games(game_id);
CREATE INDEX idx_players_game_id ON players(game_id);
CREATE INDEX idx_rounds_game_id ON rounds(game_id);
CREATE INDEX idx_scores_round_id ON scores(round_id);
CREATE INDEX idx_scores_player_id ON scores(player_id);

-- Enable Row Level Security on all tables
ALTER TABLE games ENABLE ROW LEVEL SECURITY;
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE rounds ENABLE ROW LEVEL SECURITY;
ALTER TABLE scores ENABLE ROW LEVEL SECURITY;

-- Create policies for public read/write access (for now)
-- In production, you'd want more restrictive policies
CREATE POLICY "Allow public read access to games" ON games FOR SELECT USING (true);
CREATE POLICY "Allow public insert access to games" ON games FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access to games" ON games FOR UPDATE USING (true);

CREATE POLICY "Allow public read access to players" ON players FOR SELECT USING (true);
CREATE POLICY "Allow public insert access to players" ON players FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access to players" ON players FOR UPDATE USING (true);

CREATE POLICY "Allow public read access to rounds" ON rounds FOR SELECT USING (true);
CREATE POLICY "Allow public insert access to rounds" ON rounds FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access to rounds" ON rounds FOR UPDATE USING (true);

CREATE POLICY "Allow public read access to scores" ON scores FOR SELECT USING (true);
CREATE POLICY "Allow public insert access to scores" ON scores FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access to scores" ON scores FOR UPDATE USING (true);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for games table
CREATE TRIGGER update_games_updated_at BEFORE UPDATE ON games
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column(); 