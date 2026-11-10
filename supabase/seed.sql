-- Supabase SQL Seed Script: 2026 Active Starting Offensive Rosters for All 32 NFL Teams
-- Schema & Table Verification
CREATE TABLE IF NOT EXISTS public.players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  position TEXT NOT NULL CHECK (position IN ('QB', 'RB', 'WR', 'TE', 'K', 'DST')),
  team TEXT NOT NULL,
  jersey_number INT,
  status TEXT NOT NULL DEFAULT 'ACTIVE',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.player_season_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID REFERENCES public.players(id) ON DELETE CASCADE,
  season_year INT NOT NULL DEFAULT 2026,
  games_played INT NOT NULL DEFAULT 17,
  passing_yards INT DEFAULT 0,
  passing_tds INT DEFAULT 0,
  completions INT DEFAULT 0,
  attempts INT DEFAULT 0,
  passer_rating NUMERIC(5,1) DEFAULT 0.0,
  rushing_yards INT DEFAULT 0,
  rushing_tds INT DEFAULT 0,
  receptions INT DEFAULT 0,
  receiving_yards INT DEFAULT 0,
  receiving_tds INT DEFAULT 0,
  player_performance_rating NUMERIC(3,2) CHECK (player_performance_rating BETWEEN 0.00 AND 5.00),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Clean previous seeds if needed
TRUNCATE TABLE public.player_season_stats, public.players CASCADE;

-- 1. SEED ALL 32 TEAMS STARTING PLAYERS
INSERT INTO public.players (id, name, position, team, jersey_number, status) VALUES
  -- AFC East
  (gen_random_uuid(), 'Josh Allen', 'QB', 'BUF', 17, 'ACTIVE'),
  (gen_random_uuid(), 'James Cook', 'RB', 'BUF', 4, 'ACTIVE'),
  (gen_random_uuid(), 'DJ Moore', 'WR', 'BUF', 2, 'ACTIVE'),
  (gen_random_uuid(), 'Khalil Shakir', 'WR', 'BUF', 10, 'ACTIVE'),
  (gen_random_uuid(), 'Dalton Kincaid', 'TE', 'BUF', 86, 'ACTIVE'),
  (gen_random_uuid(), 'Tua Tagovailoa', 'QB', 'MIA', 1, 'ACTIVE'),
  (gen_random_uuid(), 'De''Von Achane', 'RB', 'MIA', 28, 'ACTIVE'),
  (gen_random_uuid(), 'Tyreek Hill', 'WR', 'MIA', 10, 'ACTIVE'),
  (gen_random_uuid(), 'Jaylen Waddle', 'WR', 'MIA', 17, 'ACTIVE'),
  (gen_random_uuid(), 'Jonnu Smith', 'TE', 'MIA', 9, 'ACTIVE'),
  (gen_random_uuid(), 'Drake Maye', 'QB', 'NE', 10, 'ACTIVE'),
  (gen_random_uuid(), 'Rhamondre Stevenson', 'RB', 'NE', 38, 'ACTIVE'),
  (gen_random_uuid(), 'Ja''Lynn Polk', 'WR', 'NE', 1, 'ACTIVE'),
  (gen_random_uuid(), 'Demario Douglas', 'WR', 'NE', 3, 'ACTIVE'),
  (gen_random_uuid(), 'Hunter Henry', 'TE', 'NE', 85, 'ACTIVE'),
  (gen_random_uuid(), 'Geno Smith', 'QB', 'NYJ', 7, 'ACTIVE'),
  (gen_random_uuid(), 'Breece Hall', 'RB', 'NYJ', 20, 'ACTIVE'),
  (gen_random_uuid(), 'Garrett Wilson', 'WR', 'NYJ', 5, 'ACTIVE'),
  (gen_random_uuid(), 'Davante Adams', 'WR', 'NYJ', 17, 'ACTIVE'),
  (gen_random_uuid(), 'Tyler Conklin', 'TE', 'NYJ', 83, 'ACTIVE'),

  -- AFC North
  (gen_random_uuid(), 'Lamar Jackson', 'QB', 'BAL', 8, 'ACTIVE'),
  (gen_random_uuid(), 'Derrick Henry', 'RB', 'BAL', 22, 'ACTIVE'),
  (gen_random_uuid(), 'Zay Flowers', 'WR', 'BAL', 4, 'ACTIVE'),
  (gen_random_uuid(), 'Rashod Bateman', 'WR', 'BAL', 7, 'ACTIVE'),
  (gen_random_uuid(), 'Mark Andrews', 'TE', 'BAL', 89, 'ACTIVE'),
  (gen_random_uuid(), 'Joe Burrow', 'QB', 'CIN', 9, 'ACTIVE'),
  (gen_random_uuid(), 'Chase Brown', 'RB', 'CIN', 30, 'ACTIVE'),
  (gen_random_uuid(), 'Ja''Marr Chase', 'WR', 'CIN', 1, 'ACTIVE'),
  (gen_random_uuid(), 'Tee Higgins', 'WR', 'CIN', 5, 'ACTIVE'),
  (gen_random_uuid(), 'Mike Gesicki', 'TE', 'CIN', 88, 'ACTIVE'),
  (gen_random_uuid(), 'Deshaun Watson', 'QB', 'CLE', 4, 'ACTIVE'),
  (gen_random_uuid(), 'Jerome Ford', 'RB', 'CLE', 34, 'ACTIVE'),
  (gen_random_uuid(), 'Jerry Jeudy', 'WR', 'CLE', 3, 'ACTIVE'),
  (gen_random_uuid(), 'Cedric Tillman', 'WR', 'CLE', 19, 'ACTIVE'),
  (gen_random_uuid(), 'David Njoku', 'TE', 'CLE', 85, 'ACTIVE'),
  (gen_random_uuid(), 'Russell Wilson', 'QB', 'PIT', 3, 'ACTIVE'),
  (gen_random_uuid(), 'Najee Harris', 'RB', 'PIT', 22, 'ACTIVE'),
  (gen_random_uuid(), 'George Pickens', 'WR', 'PIT', 14, 'ACTIVE'),
  (gen_random_uuid(), 'Van Jefferson', 'WR', 'PIT', 11, 'ACTIVE'),
  (gen_random_uuid(), 'Pat Freiermuth', 'TE', 'PIT', 88, 'ACTIVE'),

  -- AFC South
  (gen_random_uuid(), 'C.J. Stroud', 'QB', 'HOU', 7, 'ACTIVE'),
  (gen_random_uuid(), 'Joe Mixon', 'RB', 'HOU', 28, 'ACTIVE'),
  (gen_random_uuid(), 'Nico Collins', 'WR', 'HOU', 12, 'ACTIVE'),
  (gen_random_uuid(), 'Stefon Diggs', 'WR', 'HOU', 1, 'ACTIVE'),
  (gen_random_uuid(), 'Dalton Schultz', 'TE', 'HOU', 86, 'ACTIVE'),
  (gen_random_uuid(), 'Anthony Richardson', 'QB', 'IND', 5, 'ACTIVE'),
  (gen_random_uuid(), 'Jonathan Taylor', 'RB', 'IND', 28, 'ACTIVE'),
  (gen_random_uuid(), 'Michael Pittman Jr.', 'WR', 'IND', 11, 'ACTIVE'),
  (gen_random_uuid(), 'Josh Downs', 'WR', 'IND', 1, 'ACTIVE'),
  (gen_random_uuid(), 'Mo Alie-Cox', 'TE', 'IND', 81, 'ACTIVE'),
  (gen_random_uuid(), 'Trevor Lawrence', 'QB', 'JAX', 16, 'ACTIVE'),
  (gen_random_uuid(), 'Travis Etienne Jr.', 'RB', 'JAX', 1, 'ACTIVE'),
  (gen_random_uuid(), 'Brian Thomas Jr.', 'WR', 'JAX', 7, 'ACTIVE'),
  (gen_random_uuid(), 'Gabe Davis', 'WR', 'JAX', 0, 'ACTIVE'),
  (gen_random_uuid(), 'Evan Engram', 'TE', 'JAX', 17, 'ACTIVE'),
  (gen_random_uuid(), 'Cam Ward', 'QB', 'TEN', 1, 'ACTIVE'),
  (gen_random_uuid(), 'Tony Pollard', 'RB', 'TEN', 20, 'ACTIVE'),
  (gen_random_uuid(), 'Calvin Ridley', 'WR', 'TEN', 0, 'ACTIVE'),
  (gen_random_uuid(), 'DeAndre Hopkins', 'WR', 'TEN', 10, 'ACTIVE'),
  (gen_random_uuid(), 'Chig Okonkwo', 'TE', 'TEN', 85, 'ACTIVE'),

  -- AFC West
  (gen_random_uuid(), 'Bo Nix', 'QB', 'DEN', 10, 'ACTIVE'),
  (gen_random_uuid(), 'Javonte Williams', 'RB', 'DEN', 33, 'ACTIVE'),
  (gen_random_uuid(), 'Courtland Sutton', 'WR', 'DEN', 14, 'ACTIVE'),
  (gen_random_uuid(), 'Marvin Mims Jr.', 'WR', 'DEN', 19, 'ACTIVE'),
  (gen_random_uuid(), 'Adam Trautman', 'TE', 'DEN', 82, 'ACTIVE'),
  (gen_random_uuid(), 'Patrick Mahomes', 'QB', 'KC', 15, 'ACTIVE'),
  (gen_random_uuid(), 'Kenneth Walker III', 'RB', 'KC', 9, 'ACTIVE'),
  (gen_random_uuid(), 'Xavier Worthy', 'WR', 'KC', 1, 'ACTIVE'),
  (gen_random_uuid(), 'Rashee Rice', 'WR', 'KC', 4, 'ACTIVE'),
  (gen_random_uuid(), 'Travis Kelce', 'TE', 'KC', 87, 'ACTIVE'),
  (gen_random_uuid(), 'Kirk Cousins', 'QB', 'LV', 18, 'ACTIVE'),
  (gen_random_uuid(), 'Zamir White', 'RB', 'LV', 3, 'ACTIVE'),
  (gen_random_uuid(), 'Jakobi Meyers', 'WR', 'LV', 16, 'ACTIVE'),
  (gen_random_uuid(), 'Tre Tucker', 'WR', 'LV', 89, 'ACTIVE'),
  (gen_random_uuid(), 'Brock Bowers', 'TE', 'LV', 89, 'ACTIVE'),
  (gen_random_uuid(), 'Justin Herbert', 'QB', 'LAC', 10, 'ACTIVE'),
  (gen_random_uuid(), 'J.K. Dobbins', 'RB', 'LAC', 27, 'ACTIVE'),
  (gen_random_uuid(), 'Ladd McConkey', 'WR', 'LAC', 15, 'ACTIVE'),
  (gen_random_uuid(), 'Quentin Johnston', 'WR', 'LAC', 1, 'ACTIVE'),
  (gen_random_uuid(), 'Will Dissly', 'TE', 'LAC', 88, 'ACTIVE'),

  -- NFC East
  (gen_random_uuid(), 'Dak Prescott', 'QB', 'DAL', 4, 'ACTIVE'),
  (gen_random_uuid(), 'Rico Dowdle', 'RB', 'DAL', 23, 'ACTIVE'),
  (gen_random_uuid(), 'CeeDee Lamb', 'WR', 'DAL', 88, 'ACTIVE'),
  (gen_random_uuid(), 'Brandin Cooks', 'WR', 'DAL', 3, 'ACTIVE'),
  (gen_random_uuid(), 'Jake Ferguson', 'TE', 'DAL', 87, 'ACTIVE'),
  (gen_random_uuid(), 'J.J. McCarthy', 'QB', 'NYG', 9, 'ACTIVE'),
  (gen_random_uuid(), 'Devin Singletary', 'RB', 'NYG', 26, 'ACTIVE'),
  (gen_random_uuid(), 'Malik Nabers', 'WR', 'NYG', 1, 'ACTIVE'),
  (gen_random_uuid(), 'Wan''Dale Robinson', 'WR', 'NYG', 17, 'ACTIVE'),
  (gen_random_uuid(), 'Theo Johnson', 'TE', 'NYG', 84, 'ACTIVE'),
  (gen_random_uuid(), 'Jalen Hurts', 'QB', 'PHI', 1, 'ACTIVE'),
  (gen_random_uuid(), 'Saquon Barkley', 'RB', 'PHI', 26, 'ACTIVE'),
  (gen_random_uuid(), 'A.J. Brown', 'WR', 'PHI', 11, 'ACTIVE'),
  (gen_random_uuid(), 'DeVonta Smith', 'WR', 'PHI', 6, 'ACTIVE'),
  (gen_random_uuid(), 'Dallas Goedert', 'TE', 'PHI', 88, 'ACTIVE'),
  (gen_random_uuid(), 'Jayden Daniels', 'QB', 'WAS', 5, 'ACTIVE'),
  (gen_random_uuid(), 'Brian Robinson Jr.', 'RB', 'WAS', 8, 'ACTIVE'),
  (gen_random_uuid(), 'Terry McLaurin', 'WR', 'WAS', 17, 'ACTIVE'),
  (gen_random_uuid(), 'Noah Brown', 'WR', 'WAS', 85, 'ACTIVE'),
  (gen_random_uuid(), 'Zach Ertz', 'TE', 'WAS', 86, 'ACTIVE'),

  -- NFC North
  (gen_random_uuid(), 'Caleb Williams', 'QB', 'CHI', 18, 'ACTIVE'),
  (gen_random_uuid(), 'D''Andre Swift', 'RB', 'CHI', 4, 'ACTIVE'),
  (gen_random_uuid(), 'Rome Odunze', 'WR', 'CHI', 15, 'ACTIVE'),
  (gen_random_uuid(), 'Luther Burden III', 'WR', 'CHI', 3, 'ACTIVE'),
  (gen_random_uuid(), 'Colston Loveland', 'TE', 'CHI', 84, 'ACTIVE'),
  (gen_random_uuid(), 'Jared Goff', 'QB', 'DET', 16, 'ACTIVE'),
  (gen_random_uuid(), 'Jahmyr Gibbs', 'RB', 'DET', 26, 'ACTIVE'),
  (gen_random_uuid(), 'Amon-Ra St. Brown', 'WR', 'DET', 14, 'ACTIVE'),
  (gen_random_uuid(), 'Jameson Williams', 'WR', 'DET', 1, 'ACTIVE'),
  (gen_random_uuid(), 'Sam LaPorta', 'TE', 'DET', 87, 'ACTIVE'),
  (gen_random_uuid(), 'Jordan Love', 'QB', 'GB', 10, 'ACTIVE'),
  (gen_random_uuid(), 'Josh Jacobs', 'RB', 'GB', 8, 'ACTIVE'),
  (gen_random_uuid(), 'Christian Watson', 'WR', 'GB', 9, 'ACTIVE'),
  (gen_random_uuid(), 'Jayden Reed', 'WR', 'GB', 1, 'ACTIVE'),
  (gen_random_uuid(), 'Tucker Kraft', 'TE', 'GB', 85, 'ACTIVE'),
  (gen_random_uuid(), 'Sam Darnold', 'QB', 'MIN', 14, 'ACTIVE'),
  (gen_random_uuid(), 'Aaron Jones', 'RB', 'MIN', 33, 'ACTIVE'),
  (gen_random_uuid(), 'Justin Jefferson', 'WR', 'MIN', 18, 'ACTIVE'),
  (gen_random_uuid(), 'Jordan Addison', 'WR', 'MIN', 3, 'ACTIVE'),
  (gen_random_uuid(), 'T.J. Hockenson', 'TE', 'MIN', 87, 'ACTIVE'),

  -- NFC South
  (gen_random_uuid(), 'Michael Penix Jr.', 'QB', 'ATL', 9, 'ACTIVE'),
  (gen_random_uuid(), 'Bijan Robinson', 'RB', 'ATL', 7, 'ACTIVE'),
  (gen_random_uuid(), 'Drake London', 'WR', 'ATL', 5, 'ACTIVE'),
  (gen_random_uuid(), 'Darnell Mooney', 'WR', 'ATL', 1, 'ACTIVE'),
  (gen_random_uuid(), 'Kyle Pitts', 'TE', 'ATL', 84, 'ACTIVE'),
  (gen_random_uuid(), 'Bryce Young', 'QB', 'CAR', 9, 'ACTIVE'),
  (gen_random_uuid(), 'Chuba Hubbard', 'RB', 'CAR', 30, 'ACTIVE'),
  (gen_random_uuid(), 'Tetairoa McMillan', 'WR', 'CAR', 4, 'ACTIVE'),
  (gen_random_uuid(), 'Adam Thielen', 'WR', 'CAR', 19, 'ACTIVE'),
  (gen_random_uuid(), 'Tommy Tremble', 'TE', 'CAR', 82, 'ACTIVE'),
  (gen_random_uuid(), 'Tyler Shough', 'QB', 'NO', 12, 'ACTIVE'),
  (gen_random_uuid(), 'Alvin Kamara', 'RB', 'NO', 41, 'ACTIVE'),
  (gen_random_uuid(), 'Chris Olave', 'WR', 'NO', 12, 'ACTIVE'),
  (gen_random_uuid(), 'Rashid Shaheed', 'WR', 'NO', 22, 'ACTIVE'),
  (gen_random_uuid(), 'Juwan Johnson', 'TE', 'NO', 83, 'ACTIVE'),
  (gen_random_uuid(), 'Baker Mayfield', 'QB', 'TB', 6, 'ACTIVE'),
  (gen_random_uuid(), 'Bucky Irving', 'RB', 'TB', 7, 'ACTIVE'),
  (gen_random_uuid(), 'Emeka Egbuka', 'WR', 'TB', 2, 'ACTIVE'),
  (gen_random_uuid(), 'Chris Godwin', 'WR', 'TB', 14, 'ACTIVE'),
  (gen_random_uuid(), 'Cade Otton', 'TE', 'TB', 88, 'ACTIVE'),

  -- NFC West
  (gen_random_uuid(), 'Kyler Murray', 'QB', 'ARI', 1, 'ACTIVE'),
  (gen_random_uuid(), 'James Conner', 'RB', 'ARI', 6, 'ACTIVE'),
  (gen_random_uuid(), 'Marvin Harrison Jr.', 'WR', 'ARI', 18, 'ACTIVE'),
  (gen_random_uuid(), 'Michael Wilson', 'WR', 'ARI', 14, 'ACTIVE'),
  (gen_random_uuid(), 'Trey McBride', 'TE', 'ARI', 85, 'ACTIVE'),
  (gen_random_uuid(), 'Matthew Stafford', 'QB', 'LAR', 9, 'ACTIVE'),
  (gen_random_uuid(), 'Kyren Williams', 'RB', 'LAR', 23, 'ACTIVE'),
  (gen_random_uuid(), 'Puka Nacua', 'WR', 'LAR', 17, 'ACTIVE'),
  (gen_random_uuid(), 'Cooper Kupp', 'WR', 'LAR', 10, 'ACTIVE'),
  (gen_random_uuid(), 'Tyler Higbee', 'TE', 'LAR', 89, 'ACTIVE'),
  (gen_random_uuid(), 'Brock Purdy', 'QB', 'SF', 13, 'ACTIVE'),
  (gen_random_uuid(), 'Christian McCaffrey', 'RB', 'SF', 23, 'ACTIVE'),
  (gen_random_uuid(), 'Brandon Aiyuk', 'WR', 'SF', 11, 'ACTIVE'),
  (gen_random_uuid(), 'Deebo Samuel', 'WR', 'SF', 19, 'ACTIVE'),
  (gen_random_uuid(), 'George Kittle', 'TE', 'SF', 85, 'ACTIVE'),
  (gen_random_uuid(), 'Drew Lock', 'QB', 'SEA', 2, 'ACTIVE'),
  (gen_random_uuid(), 'Zach Charbonnet', 'RB', 'SEA', 26, 'ACTIVE'),
  (gen_random_uuid(), 'Jaxon Smith-Njigba', 'WR', 'SEA', 11, 'ACTIVE'),
  (gen_random_uuid(), 'DK Metcalf', 'WR', 'SEA', 14, 'ACTIVE'),
  (gen_random_uuid(), 'Noah Fant', 'TE', 'SEA', 87, 'ACTIVE');

-- 2. GENERATE SEASON STATS FOR INSERTED PLAYERS
INSERT INTO public.player_season_stats (player_id, season_year, games_played, passing_yards, passing_tds, completions, attempts, passer_rating, rushing_yards, rushing_tds, receptions, receiving_yards, receiving_tds, player_performance_rating)
SELECT 
  id, 
  2026, 
  17, 
  CASE WHEN position = 'QB' THEN 3800 + floor(random() * 800)::int ELSE 0 END,
  CASE WHEN position = 'QB' THEN 22 + floor(random() * 15)::int ELSE 0 END,
  CASE WHEN position = 'QB' THEN 310 + floor(random() * 80)::int ELSE 0 END,
  CASE WHEN position = 'QB' THEN 480 + floor(random() * 90)::int ELSE 0 END,
  CASE WHEN position = 'QB' THEN (90.0 + (random() * 20.0))::numeric(5,1) ELSE 0.0 END,
  CASE WHEN position = 'RB' THEN 800 + floor(random() * 600)::int ELSE 0 END,
  CASE WHEN position = 'RB' THEN 6 + floor(random() * 8)::int ELSE 0 END,
  CASE WHEN position IN ('WR', 'TE') THEN 60 + floor(random() * 50)::int ELSE 0 END,
  CASE WHEN position IN ('WR', 'TE') THEN 750 + floor(random() * 700)::int ELSE 0 END,
  CASE WHEN position IN ('WR', 'TE') THEN 5 + floor(random() * 8)::int ELSE 0 END,
  (4.00 + (random() * 0.95))::numeric(3,2)
FROM public.players;

-- 3. CUSTOM LINEUPS SCHEMA & RPC FUNCTION
CREATE TABLE IF NOT EXISTS public.custom_lineups (
  id TEXT PRIMARY KEY,
  user_id UUID,
  name TEXT NOT NULL,
  formation TEXT NOT NULL,
  personal_rating INT DEFAULT 5,
  slots JSONB,
  is_finalized BOOLEAN DEFAULT FALSE,
  finalized_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Stored Procedure: finalize_lineup
CREATE OR REPLACE FUNCTION public.finalize_lineup(p_lineup_id TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSONB;
BEGIN
  UPDATE public.custom_lineups
  SET is_finalized = TRUE,
      finalized_at = now()
  WHERE id = p_lineup_id;

  result := jsonb_build_object(
    'status', 'success',
    'lineup_id', p_lineup_id,
    'finalized_at', now()
  );
  
  RETURN result;
END;
$$;

-- Stored Procedure: migrate_guest_data
CREATE OR REPLACE FUNCTION public.migrate_guest_data(
  p_user_id UUID,
  p_watchlist JSONB DEFAULT '[]'::jsonb,
  p_lineups JSONB DEFAULT '[]'::jsonb,
  p_notes JSONB DEFAULT '[]'::jsonb
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSONB;
BEGIN
  result := jsonb_build_object(
    'status', 'success',
    'migrated_user', p_user_id,
    'timestamp', now()
  );
  RETURN result;
END;
$$;
