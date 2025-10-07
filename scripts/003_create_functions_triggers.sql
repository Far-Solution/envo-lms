-- Functions and Triggers for Envo LMS

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at triggers to relevant tables
CREATE TRIGGER update_institutes_updated_at BEFORE UPDATE ON institutes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_courses_updated_at BEFORE UPDATE ON courses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_assignments_updated_at BEFORE UPDATE ON assignments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_assignment_submissions_updated_at BEFORE UPDATE ON assignment_submissions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_meetings_updated_at BEFORE UPDATE ON meetings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_messages_updated_at BEFORE UPDATE ON messages
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to auto-create profile when user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    user_email TEXT;
    institute_domain TEXT;
    institute_record RECORD;
    user_role user_role;
    first_name TEXT;
    last_name TEXT;
BEGIN
    -- Get user email from auth.users
    user_email := NEW.email;
    
    -- Extract domain from email
    institute_domain := split_part(user_email, '@', 2);
    
    -- Find institute by domain
    SELECT * INTO institute_record FROM institutes WHERE domain = institute_domain;
    
    -- If no institute found, create a default one (for demo purposes)
    IF institute_record IS NULL THEN
        INSERT INTO institutes (name, domain, email)
        VALUES ('Default Institute', institute_domain, user_email)
        RETURNING * INTO institute_record;
    END IF;
    
    -- Extract first and last name from metadata or email
    first_name := COALESCE(NEW.raw_user_meta_data ->> 'first_name', split_part(split_part(user_email, '@', 1), '.', 1));
    last_name := COALESCE(NEW.raw_user_meta_data ->> 'last_name', split_part(split_part(user_email, '@', 1), '.', 2));
    
    -- Determine role based on email or metadata
    user_role := COALESCE(
        (NEW.raw_user_meta_data ->> 'role')::user_role,
        'student'::user_role
    );
    
    -- Create profile
    INSERT INTO public.profiles (
        id,
        institute_id,
        role,
        first_name,
        last_name,
        email
    ) VALUES (
        NEW.id,
        institute_record.id,
        user_role,
        INITCAP(first_name),
        INITCAP(COALESCE(last_name, '')),
        user_email
    );
    
    RETURN NEW;
END;
$$;

-- Create trigger for new user profile creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- Function to generate auto email format
CREATE OR REPLACE FUNCTION generate_user_email(
    p_first_name TEXT,
    p_last_name TEXT,
    p_institute_domain TEXT
) RETURNS TEXT AS $$
DECLARE
    base_email TEXT;
    final_email TEXT;
    counter INTEGER := 1;
BEGIN
    -- Create base email: firstname.lastname@domain
    base_email := LOWER(p_first_name) || '.' || LOWER(p_last_name) || '@' || p_institute_domain;
    final_email := base_email;
    
    -- Check if email exists and increment if needed
    WHILE EXISTS (SELECT 1 FROM profiles WHERE email = final_email) LOOP
        final_email := LOWER(p_first_name) || '.' || LOWER(p_last_name) || counter || '@' || p_institute_domain;
        counter := counter + 1;
    END LOOP;
    
    RETURN final_email;
END;
$$ LANGUAGE plpgsql;

-- Function to create notification
CREATE OR REPLACE FUNCTION create_notification(
    p_user_id UUID,
    p_title TEXT,
    p_message TEXT,
    p_type TEXT,
    p_related_id UUID DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
    notification_id UUID;
BEGIN
    INSERT INTO notifications (user_id, title, message, type, related_id)
    VALUES (p_user_id, p_title, p_message, p_type, p_related_id)
    RETURNING id INTO notification_id;
    
    RETURN notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to calculate attendance percentage
CREATE OR REPLACE FUNCTION calculate_attendance_percentage(
    p_student_id UUID,
    p_course_id UUID
) RETURNS DECIMAL AS $$
DECLARE
    total_sessions INTEGER;
    present_sessions INTEGER;
    percentage DECIMAL;
BEGIN
    -- Count total sessions for the course
    SELECT COUNT(*) INTO total_sessions
    FROM attendance_sessions
    WHERE course_id = p_course_id;
    
    -- Count sessions where student was present
    SELECT COUNT(*) INTO present_sessions
    FROM student_attendance sa
    JOIN attendance_sessions ats ON sa.session_id = ats.id
    WHERE ats.course_id = p_course_id
    AND sa.student_id = p_student_id
    AND sa.status = 'present';
    
    -- Calculate percentage
    IF total_sessions = 0 THEN
        RETURN 0;
    END IF;
    
    percentage := (present_sessions::DECIMAL / total_sessions::DECIMAL) * 100;
    RETURN ROUND(percentage, 2);
END;
$$ LANGUAGE plpgsql;

-- Function to get student's courses
CREATE OR REPLACE FUNCTION get_student_courses(p_student_id UUID)
RETURNS TABLE (
    course_id UUID,
    course_name TEXT,
    course_code TEXT,
    teacher_name TEXT,
    attendance_percentage DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.id,
        c.name,
        c.code,
        CONCAT(tp.first_name, ' ', tp.last_name) as teacher_name,
        calculate_attendance_percentage(p_student_id, c.id) as attendance_percentage
    FROM courses c
    JOIN student_courses sc ON c.id = sc.course_id
    LEFT JOIN teacher_courses tc ON c.id = tc.course_id
    LEFT JOIN profiles tp ON tc.teacher_id = tp.id
    WHERE sc.student_id = p_student_id
    AND sc.is_active = true;
END;
$$ LANGUAGE plpgsql;
