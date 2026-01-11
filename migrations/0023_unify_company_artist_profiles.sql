-- Migration: Unify company and artist profiles
-- Add missing fields to companies table to match artist profile capabilities

-- Portfolio and professional information
ALTER TABLE companies ADD COLUMN IF NOT EXISTS portfolio jsonb DEFAULT '[]'::jsonb;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS bio text;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS history jsonb DEFAULT '[]'::jsonb; -- Company timeline/milestones
ALTER TABLE companies ADD COLUMN IF NOT EXISTS mission text;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS vision text;

-- Team and organization
ALTER TABLE companies ADD COLUMN IF NOT EXISTS team jsonb DEFAULT '[]'::jsonb; -- Team members with roles
ALTER TABLE companies ADD COLUMN IF NOT EXISTS teamSize integer;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS foundedYear integer;

-- Professional credentials
ALTER TABLE companies ADD COLUMN IF NOT EXISTS certifications jsonb DEFAULT '[]'::jsonb; -- Company certifications
ALTER TABLE companies ADD COLUMN IF NOT EXISTS awards jsonb DEFAULT '[]'::jsonb; -- Awards and recognition
ALTER TABLE companies ADD COLUMN IF NOT EXISTS licenses jsonb DEFAULT '[]'::jsonb; -- Business licenses
ALTER TABLE companies ADD COLUMN IF NOT EXISTS partnerships jsonb DEFAULT '[]'::jsonb; -- Partner organizations

-- Additional contact and social
ALTER TABLE companies ADD COLUMN IF NOT EXISTS linkedAccounts jsonb DEFAULT '{}'::jsonb; -- LinkedIn, etc.
ALTER TABLE companies ADD COLUMN IF NOT EXISTS languages jsonb DEFAULT '[]'::jsonb; -- Languages supported

-- Education and training (for companies offering educational services)
ALTER TABLE companies ADD COLUMN IF NOT EXISTS education jsonb DEFAULT '[]'::jsonb; -- Training programs offered

-- Work experience (for service companies showcasing past projects)
ALTER TABLE companies ADD COLUMN IF NOT EXISTS workExperience jsonb DEFAULT '[]'::jsonb; -- Past projects/clients

-- Add fanCount to match artists
ALTER TABLE companies ADD COLUMN IF NOT EXISTS fanCount integer DEFAULT 0;

-- Comments
COMMENT ON COLUMN companies.portfolio IS 'Portfolio items: images, videos, case studies';
COMMENT ON COLUMN companies.bio IS 'Detailed company biography (longer than description)';
COMMENT ON COLUMN companies.history IS 'Company timeline and milestones';
COMMENT ON COLUMN companies.mission IS 'Company mission statement';
COMMENT ON COLUMN companies.vision IS 'Company vision statement';
COMMENT ON COLUMN companies.team IS 'Team members with roles and bios';
COMMENT ON COLUMN companies.certifications IS 'Professional certifications and accreditations';
COMMENT ON COLUMN companies.awards IS 'Awards and recognition received';
COMMENT ON COLUMN companies.licenses IS 'Business licenses and permits';
COMMENT ON COLUMN companies.partnerships IS 'Partner organizations and collaborations';
COMMENT ON COLUMN companies.linkedAccounts IS 'Professional social accounts (LinkedIn, etc)';
COMMENT ON COLUMN companies.languages IS 'Languages supported by the company';
COMMENT ON COLUMN companies.education IS 'Educational programs or training offered';
COMMENT ON COLUMN companies.workExperience IS 'Past projects, clients, or case studies';
COMMENT ON COLUMN companies.fanCount IS 'Number of times saved to favorites';
