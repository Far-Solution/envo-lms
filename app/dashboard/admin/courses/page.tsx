import { requireRole } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Users, BookOpen, Calendar, Eye, Pencil } from "lucide-react"
import { ManageCourses, ViewCourseDialog, EditCourseDialog, DeleteCourseButton } from "./addCoursesModal"


export default async function CoursesPage() {
  const profile = await requireRole(["admin"])
  const supabase = await createClient()

  // Fetch all courses in the institute with teacher and student counts
    const { data: courses, error } = await supabase
  .from("courses")
  .select(`
    id,
    name,
    code,
    semester,
    credits,
    description,
    is_active,
    teacher_courses (
      profile:profiles!teacher_courses_profile_id_fkey (
        id,
        first_name,
        last_name
      )
    )
  `)
  .eq("institute_id", profile.institute_id)
  .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching courses:", error)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Course Management</h1>
          <p className="text-gray-600 mt-1">Manage courses and academic programs</p>
        </div>
        <ManageCourses instituteId={profile.institute_id} />
      </div>

      {/* Courses List View */}
      <div className="space-y-4">
        {courses?.map((course) => (
          <Card key={course.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between">
              <div className="flex flex-col">
                <CardTitle className="text-lg">{course.name}</CardTitle>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline">{course.code}</Badge>
                  <Badge variant={course.is_active ? "default" : "secondary"}>
                    {course.is_active ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </div>
              <div className="flex gap-2">
                <ViewCourseDialog course={course} />
                <EditCourseDialog course={course} />
                <DeleteCourseButton courseId={course.id} />

              </div>
            </CardHeader>

            <CardContent className="space-y-2 text-sm text-gray-600">
              {/* Description */}
              {course.description && <p className="line-clamp-2">{course.description}</p>}

              {/* Meta info */}
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1">
                  <BookOpen className="h-4 w-4" />
                  {course.credits} Credits
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {course.semester}
                </div>
              </div>

              {/* Teacher */}
              <div>
                <span className="font-medium">Assigned Teacher: </span>
                {course.teacher_courses?.length > 0 &&
                  course.teacher_courses[0].profile ? (
                  <>
                    {course.teacher_courses[0].profile.first_name}{" "}
                    {course.teacher_courses[0].profile.last_name}
                  </>
                ) : (
                  <span className="text-gray-500">No teacher assigned</span>
                )}
              </div>

              {/* Students */}
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-gray-500" />
                {course.student_courses?.length || 0} students enrolled
              </div>
            </CardContent>
          </Card>
        ))}

        {/* Empty State */}
        {(!courses || courses.length === 0) && (
          <Card className="text-center py-12">
            <CardContent>
              <div className="text-gray-500 mb-4">No courses found</div>
              <ManageCourses instituteId={profile.institute_id} />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

