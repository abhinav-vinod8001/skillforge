-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users are handled by Supabase Auth (auth.users). 
-- We can create a public profiles table if needed, but for now we'll tie data directly to auth.uid()

-- Syllabi Table
CREATE TABLE syllabi (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    file_name TEXT,
    raw_text TEXT,
    extracted_skills JSONB, -- Array of skills found
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Trends Table (Cached market trends)
CREATE TABLE market_trends (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    skill_name TEXT NOT NULL,
    growth_percentage INTEGER,
    demand_level TEXT, -- 'High', 'Medium', 'Low'
    context TEXT, -- e.g., 'hot in Kerala agrotech'
    scraped_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Roadmaps Table
CREATE TABLE roadmaps (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    syllabus_id UUID REFERENCES syllabi(id) ON DELETE SET NULL,
    milestones JSONB, -- The 4-week generated plan
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Projects Table (Code blueprints)
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    roadmap_id UUID REFERENCES roadmaps(id) ON DELETE SET NULL,
    title TEXT,
    files JSONB, -- { "package.json": "...", "app/page.tsx": "..." }
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Simulator Logs
CREATE TABLE simulator_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    skill_focus TEXT,
    score INTEGER,
    chat_history JSONB,
    metrics JSONB, -- e.g., {"bugs_resolved": 3, "efficiency": "92%"}
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Row Level Security (RLS)
ALTER TABLE syllabi ENABLE ROW LEVEL SECURITY;
ALTER TABLE roadmaps ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE simulator_logs ENABLE ROW LEVEL SECURITY;

-- Base Policies (Users only see their own data)
CREATE POLICY "Users can insert their own syllabi" ON syllabi FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can select their own syllabi" ON syllabi FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own roadmaps" ON roadmaps FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can select their own roadmaps" ON roadmaps FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own projects" ON projects FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can select their own projects" ON projects FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own logs" ON simulator_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can select their own logs" ON simulator_logs FOR SELECT USING (auth.uid() = user_id);

-- Prompt Lab Progress Table
CREATE TABLE prompt_lab_progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    challenge_id TEXT NOT NULL,
    best_score INTEGER DEFAULT 0,
    attempts INTEGER DEFAULT 0,
    completed BOOLEAN DEFAULT false,
    last_prompt TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Prompt Lab Badges Table
CREATE TABLE prompt_lab_badges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    badge_id TEXT NOT NULL,
    earned_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    UNIQUE(user_id, badge_id)
);

ALTER TABLE prompt_lab_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE prompt_lab_badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own prompt lab progress" ON prompt_lab_progress
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage their own badges" ON prompt_lab_badges
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
