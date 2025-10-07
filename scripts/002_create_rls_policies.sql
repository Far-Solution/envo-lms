-- Row Level Security Policies for Envo LMS

-- Helper function to get user's institute
CREATE OR REPLACE FUNCTION get_user_institute_id(user_uuid UUID)
RETURNS UUID AS $$
BEGIN
    RETURN (SELECT institute_id FROM profiles WHERE id = user_uuid);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to get user's role
CREATE OR REPLACE FUNCTION get_user_role(user_uuid UUID)
RETURNS user_role AS $$
BEGIN
    RETURN (SELECT role FROM profiles WHERE id = user_uuid);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Institutes policies
CREATE POLICY "Users can view their own institute" ON institutes
    FOR SELECT USING (id = get_user_institute_id(auth.uid()));

CREATE POLICY "Admins can update their institute" ON institutes
    FOR UPDATE USING (
        id = get_user_institute_id(auth.uid()) AND 
        get_user_role(auth.uid()) = 'admin'
    );

-- Profiles policies
CREATE POLICY "Users can view profiles in their institute" ON profiles
    FOR SELECT USING (institute_id = get_user_institute_id(auth.uid()));

CREATE POLICY "Users can view their own profile" ON profiles
    FOR SELECT USING (id = auth.uid());

CREATE POLICY "Users can update their own profile" ON profiles
    FOR UPDATE USING (id = auth.uid());

CREATE POLICY "Admins can manage all profiles in their institute" ON profiles
    FOR ALL USING (
        institute_id = get_user_institute_id(auth.uid()) AND 
        get_user_role(auth.uid()) = 'admin'
    );

-- Courses policies
CREATE POLICY "Users can view courses in their institute" ON courses
    FOR SELECT USING (institute_id = get_user_institute_id(auth.uid()));

CREATE POLICY "Admins can manage courses in their institute" ON courses
    FOR ALL USING (
        institute_id = get_user_institute_id(auth.uid()) AND 
        get_user_role(auth.uid()) = 'admin'
    );

-- Teacher-Course assignments policies
CREATE POLICY "Users can view teacher-course assignments in their institute" ON teacher_courses
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles p 
            WHERE p.id = teacher_courses.teacher_id 
            AND p.institute_id = get_user_institute_id(auth.uid())
        )
    );

CREATE POLICY "Admins can manage teacher-course assignments" ON teacher_courses
    FOR ALL USING (
        get_user_role(auth.uid()) = 'admin' AND
        EXISTS (
            SELECT 1 FROM profiles p 
            WHERE p.id = teacher_courses.teacher_id 
            AND p.institute_id = get_user_institute_id(auth.uid())
        )
    );

-- Student-Course enrollments policies
CREATE POLICY "Users can view enrollments in their institute" ON student_courses
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles p 
            WHERE p.id = student_courses.student_id 
            AND p.institute_id = get_user_institute_id(auth.uid())
        )
    );

CREATE POLICY "Students can view their own enrollments" ON student_courses
    FOR SELECT USING (student_id = auth.uid());

CREATE POLICY "Teachers and admins can manage enrollments" ON student_courses
    FOR ALL USING (
        get_user_role(auth.uid()) IN ('admin', 'teacher') AND
        EXISTS (
            SELECT 1 FROM profiles p 
            WHERE p.id = student_courses.student_id 
            AND p.institute_id = get_user_institute_id(auth.uid())
        )
    );

-- Assignments policies
CREATE POLICY "Users can view assignments for their courses" ON assignments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM courses c 
            WHERE c.id = assignments.course_id 
            AND c.institute_id = get_user_institute_id(auth.uid())
        )
    );

CREATE POLICY "Teachers can manage their assignments" ON assignments
    FOR ALL USING (
        teacher_id = auth.uid() OR
        (get_user_role(auth.uid()) = 'admin' AND
         EXISTS (
             SELECT 1 FROM courses c 
             WHERE c.id = assignments.course_id 
             AND c.institute_id = get_user_institute_id(auth.uid())
         ))
    );

-- Assignment submissions policies
CREATE POLICY "Students can view and manage their submissions" ON assignment_submissions
    FOR ALL USING (student_id = auth.uid());

CREATE POLICY "Teachers can view submissions for their assignments" ON assignment_submissions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM assignments a 
            WHERE a.id = assignment_submissions.assignment_id 
            AND a.teacher_id = auth.uid()
        )
    );

CREATE POLICY "Teachers can grade submissions for their assignments" ON assignment_submissions
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM assignments a 
            WHERE a.id = assignment_submissions.assignment_id 
            AND a.teacher_id = auth.uid()
        )
    );

-- Attendance sessions policies
CREATE POLICY "Users can view attendance sessions for their courses" ON attendance_sessions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM courses c 
            WHERE c.id = attendance_sessions.course_id 
            AND c.institute_id = get_user_institute_id(auth.uid())
        )
    );

CREATE POLICY "Teachers can manage attendance sessions for their courses" ON attendance_sessions
    FOR ALL USING (
        teacher_id = auth.uid() OR
        (get_user_role(auth.uid()) = 'admin' AND
         EXISTS (
             SELECT 1 FROM courses c 
             WHERE c.id = attendance_sessions.course_id 
             AND c.institute_id = get_user_institute_id(auth.uid())
         ))
    );

-- Student attendance policies
CREATE POLICY "Users can view student attendance in their institute" ON student_attendance
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles p 
            WHERE p.id = student_attendance.student_id 
            AND p.institute_id = get_user_institute_id(auth.uid())
        )
    );

CREATE POLICY "Students can view their own attendance" ON student_attendance
    FOR SELECT USING (student_id = auth.uid());

CREATE POLICY "Teachers and admins can manage student attendance" ON student_attendance
    FOR ALL USING (
        get_user_role(auth.uid()) IN ('admin', 'teacher') AND
        EXISTS (
            SELECT 1 FROM profiles p 
            WHERE p.id = student_attendance.student_id 
            AND p.institute_id = get_user_institute_id(auth.uid())
        )
    );

-- Teacher attendance policies
CREATE POLICY "Teachers can view their own attendance" ON teacher_attendance
    FOR SELECT USING (teacher_id = auth.uid());

CREATE POLICY "Admins can manage teacher attendance in their institute" ON teacher_attendance
    FOR ALL USING (
        get_user_role(auth.uid()) = 'admin' AND
        institute_id = get_user_institute_id(auth.uid())
    );

-- Meetings policies
CREATE POLICY "Users can view meetings for their courses" ON meetings
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM courses c 
            WHERE c.id = meetings.course_id 
            AND c.institute_id = get_user_institute_id(auth.uid())
        )
    );

CREATE POLICY "Teachers can manage meetings for their courses" ON meetings
    FOR ALL USING (
        teacher_id = auth.uid() OR
        (get_user_role(auth.uid()) = 'admin' AND
         EXISTS (
             SELECT 1 FROM courses c 
             WHERE c.id = meetings.course_id 
             AND c.institute_id = get_user_institute_id(auth.uid())
         ))
    );

-- Messages policies
CREATE POLICY "Users can view their messages" ON messages
    FOR SELECT USING (sender_id = auth.uid() OR recipient_id = auth.uid());

CREATE POLICY "Users can send messages to users in their institute" ON messages
    FOR INSERT WITH CHECK (
        sender_id = auth.uid() AND
        EXISTS (
            SELECT 1 FROM profiles p 
            WHERE p.id = messages.recipient_id 
            AND p.institute_id = get_user_institute_id(auth.uid())
        )
    );

CREATE POLICY "Users can update their own messages" ON messages
    FOR UPDATE USING (sender_id = auth.uid() OR recipient_id = auth.uid());

-- Notifications policies
CREATE POLICY "Users can view their own notifications" ON notifications
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update their own notifications" ON notifications
    FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "System can create notifications for users" ON notifications
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles p 
            WHERE p.id = notifications.user_id 
            AND p.institute_id = get_user_institute_id(auth.uid())
        )
    );

-- File uploads policies
CREATE POLICY "Users can view files they uploaded" ON file_uploads
    FOR SELECT USING (uploader_id = auth.uid());

CREATE POLICY "Users can upload files" ON file_uploads
    FOR INSERT WITH CHECK (uploader_id = auth.uid());

CREATE POLICY "Users can view files in their institute context" ON file_uploads
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles p 
            WHERE p.id = file_uploads.uploader_id 
            AND p.institute_id = get_user_institute_id(auth.uid())
        )
    );
