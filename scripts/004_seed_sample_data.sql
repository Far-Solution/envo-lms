-- Sample data for Envo LMS (for testing purposes)

-- Insert sample institute
INSERT INTO institutes (id, name, domain, address, phone, email) VALUES
('550e8400-e29b-41d4-a716-446655440000', 'Tech University', 'envo-lms.com', '123 Education St, Learning City', '+1-555-0123', 'admin@envo-lms.com')
ON CONFLICT (domain) DO NOTHING;

-- Note: Profiles will be auto-created when users sign up via the trigger
-- But we can insert some sample data for testing

-- Sample courses
INSERT INTO courses (id, institute_id, name, description, code, credits, semester, academic_year) VALUES
('550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440000', 'Introduction to Computer Science', 'Basic concepts of programming and computer science', 'CS101', 3, 'Fall', '2024-2025'),
('550e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440000', 'Data Structures and Algorithms', 'Advanced programming concepts and algorithms', 'CS201', 4, 'Fall', '2024-2025'),
('550e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440000', 'Web Development', 'Modern web development with React and Node.js', 'CS301', 3, 'Fall', '2024-2025')
ON CONFLICT (institute_id, code, academic_year) DO NOTHING;

-- Sample assignments (will be created after teachers are assigned)
-- Sample attendance sessions (will be created by teachers)
-- Sample meetings (will be created by teachers)

-- Create some sample notifications types for reference
-- These will be created dynamically by the application
