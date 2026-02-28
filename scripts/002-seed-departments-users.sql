-- Seed Departments and Users
-- Based on your actual team structure from the screenshots

-- ============================================
-- DEPARTMENTS
-- ============================================

INSERT INTO departments (id, name, description) VALUES
  ('d1000001-0000-0000-0000-000000000001', 'Production', 'Manages hardware staging, testing, and build processes'),
  ('d1000002-0000-0000-0000-000000000002', 'Administrative', 'Administrative staff including Purchasing, Development, and G&A'),
  ('d1000003-0000-0000-0000-000000000003', 'Support', 'Support staff - useful for viewing historical projects'),
  ('d1000004-0000-0000-0000-000000000004', 'Professional Services', 'Professional Services team taking ownership of project deliverables and execution');

-- ============================================
-- USERS
-- ============================================

-- Production Department (3 members)
INSERT INTO users (id, name, initials, role, department_id) VALUES
  ('e1000001-0000-0000-0000-000000000001', 'Josh Sullivan', 'JS', 'Admin', 'd1000001-0000-0000-0000-000000000001'),
  ('e1000002-0000-0000-0000-000000000002', 'Jon Small', 'JS', 'Technician', 'd1000001-0000-0000-0000-000000000001'),
  ('e1000003-0000-0000-0000-000000000003', 'Sam Huffcut', 'SH', 'Technician', 'd1000001-0000-0000-0000-000000000001');

-- Administrative Department (3 members)
INSERT INTO users (id, name, initials, role, department_id) VALUES
  ('e1000004-0000-0000-0000-000000000004', 'Dan Schley', 'DS', 'Admin', 'd1000002-0000-0000-0000-000000000002'),
  ('e1000005-0000-0000-0000-000000000005', 'Don Breault', 'DB', 'Technician', 'd1000002-0000-0000-0000-000000000002'),
  ('e1000006-0000-0000-0000-000000000006', 'Mish Wenzel', 'MW', 'Technician', 'd1000002-0000-0000-0000-000000000002');

-- Support Department (4 members)
INSERT INTO users (id, name, initials, role, department_id) VALUES
  ('e1000007-0000-0000-0000-000000000007', 'Cher Yang', 'CY', 'Admin', 'd1000003-0000-0000-0000-000000000003'),
  ('e1000008-0000-0000-0000-000000000008', 'Zack Ward', 'ZW', 'Technician', 'd1000003-0000-0000-0000-000000000003'),
  ('e1000009-0000-0000-0000-000000000009', 'Mai Der Thao', 'MT', 'Technician', 'd1000003-0000-0000-0000-000000000003'),
  ('e100000a-0000-0000-0000-00000000000a', 'Islam M', 'IM', 'Technician', 'd1000003-0000-0000-0000-000000000003');

-- Professional Services Department (3 members)
INSERT INTO users (id, name, initials, role, department_id) VALUES
  ('e100000b-0000-0000-0000-00000000000b', 'Kevin Roytek', 'KR', 'PM', 'd1000004-0000-0000-0000-000000000004'),
  ('e100000c-0000-0000-0000-00000000000c', 'Ryan B.', 'RB', 'Technician', 'd1000004-0000-0000-0000-000000000004'),
  ('e100000d-0000-0000-0000-00000000000d', 'Eric Mohr', 'EM', 'Technician', 'd1000004-0000-0000-0000-000000000004');

-- ============================================
-- SET DEPARTMENT LEADS
-- ============================================

UPDATE departments SET lead_user_id = 'e1000001-0000-0000-0000-000000000001' WHERE id = 'd1000001-0000-0000-0000-000000000001'; -- Josh Sullivan leads Production
UPDATE departments SET lead_user_id = 'e100000b-0000-0000-0000-00000000000b' WHERE id = 'd1000004-0000-0000-0000-000000000004'; -- Kevin Roytek leads Professional Services
