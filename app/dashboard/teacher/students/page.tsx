import { requireRole } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"
import StudentList from "./studentList"

export default async function StudentsPage() {
  const profile = await requireRole(["teacher"]) // ✅ sirf teacher allow

  const supabase = await createClient()

  // 1. Fetch all students in the same institute
  const { data: students, error: studentsError } = await supabase
    .from("profiles")
    .select(`
      id,
      first_name,
      last_name,
      email,
      phone,
      role,
      institute_id,
      created_at,
      profile_picture_url,
      student_courses (
        course_id,
        courses ( id, name, code )
      )
    `)
    .eq("institute_id", profile.institute_id)
    .eq("role", "student") // ✅ students only
    .order("created_at", { ascending: false })

  if (studentsError) {
    console.error("Error fetching students:", studentsError)
  }

  // 2. Fetch teacher’s assigned courses
  const { data: teacherCourses, error: coursesError } = await supabase
    .from("teacher_courses")
    .select(`
      course_id,
      courses (
        id,
        name,
        code,
        institute_id,
        created_at
      )
    `)
    .eq("profile_id", profile.id)
    .order("courses(created_at)", { ascending: false })

  if (coursesError) {
    console.error("Error fetching teacher courses:", coursesError)
  }

  // 3. Format teacherCourses → array of courses only
  const formattedCourses = teacherCourses?.map((tc) => tc.courses) || []

  return (
    <div className="space-y-6">
      <StudentList
        students={students || []}
        teacherCourses={formattedCourses} // ✅ pass only teacher’s courses
      />
    </div>
  )
}
