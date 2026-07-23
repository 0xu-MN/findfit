ALTER TABLE ai_reports DROP CONSTRAINT ai_reports_project_id_fkey;
ALTER TABLE ai_reports ADD CONSTRAINT ai_reports_project_id_fkey
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE;

ALTER TABLE distributions DROP CONSTRAINT distributions_project_id_fkey;
ALTER TABLE distributions ADD CONSTRAINT distributions_project_id_fkey
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE;
