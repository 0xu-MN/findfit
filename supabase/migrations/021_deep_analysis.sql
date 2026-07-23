ALTER TABLE ai_reports ADD COLUMN IF NOT EXISTS deep_analysis_data JSONB;
ALTER TABLE ai_reports ADD COLUMN IF NOT EXISTS deep_analysis_generated_at TIMESTAMPTZ;
