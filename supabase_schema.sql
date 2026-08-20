-- 1. Spor & Koşu Aktiviteleri Tablosu
CREATE TABLE IF NOT EXISTS activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  user_id TEXT NOT NULL,
  type TEXT NOT NULL, -- 'running', 'cycling', 'swimming', 'strength', 'walking', 'yoga', 'other'
  duration INTEGER NOT NULL, -- dakika cinsinden
  distance NUMERIC, -- km cinsinden (koşu/bisiklet/yürüyüş için)
  calories INTEGER, -- kcal
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT
);

-- 2. Su Tüketimi Tablosu
CREATE TABLE IF NOT EXISTS water_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  user_id TEXT NOT NULL,
  amount INTEGER NOT NULL, -- ml cinsinden
  date DATE NOT NULL DEFAULT CURRENT_DATE
);

-- 3. Haftalık Antrenman Takvimi Tablosu (Haftalık Bazda Kayıt)
CREATE TABLE IF NOT EXISTS workouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  user_id TEXT NOT NULL,
  day_of_week INTEGER NOT NULL, -- 0 (Paz) - 6 (Cmt) arası
  title TEXT NOT NULL,
  description TEXT,
  is_completed BOOLEAN DEFAULT FALSE,
  time_of_day TEXT, -- örn. '08:00', '19:30'
  week_start DATE NOT NULL -- O antrenmanın ait olduğu haftanın Pazartesi günü tarihi (örn. YYYY-MM-DD)
);

-- 4. Kilo Kayıtları Tablosu
CREATE TABLE IF NOT EXISTS weight_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  user_id TEXT NOT NULL,
  weight NUMERIC NOT NULL, -- kg cinsinden
  date DATE NOT NULL DEFAULT CURRENT_DATE
);

-- 5. Besin Kalori Tüketim Tablosu
CREATE TABLE IF NOT EXISTS calorie_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  user_id TEXT NOT NULL,
  amount INTEGER NOT NULL, -- kcal cinsinden
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT -- örn. 'Kahvaltı', 'Akşam Yemeği', 'Snack'
);

-- Herkesin kendi user_id'siyle erişebilmesi için basit RLS politikaları (Public Read/Write)
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE water_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE weight_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE calorie_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public access to activities" ON activities;
CREATE POLICY "Allow public access to activities" ON activities FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public access to water_logs" ON water_logs;
CREATE POLICY "Allow public access to water_logs" ON water_logs FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public access to workouts" ON workouts;
CREATE POLICY "Allow public access to workouts" ON workouts FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public access to weight_logs" ON weight_logs;
CREATE POLICY "Allow public access to weight_logs" ON weight_logs FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public access to calorie_logs" ON calorie_logs;
CREATE POLICY "Allow public access to calorie_logs" ON calorie_logs FOR ALL USING (true) WITH CHECK (true);
