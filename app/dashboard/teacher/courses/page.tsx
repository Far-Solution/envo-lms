import { requireRole } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Users, FileText, Calendar, BookOpen } from "lucide-react"
import Link from "next/link"

export default async function TeacherCoursesPage() {
  const profile = await requireRole(["teacher"])
  const supabase = await createClient()

  // 🎯 Fetch teacher's assigned courses
  const { data: teacherCourses, error } = await supabase
    .from("teacher_courses")
    .select(`
      id,
      courses (
        id,
        name,
        code,
        description,
        credits,
        semester
      )
    `)
    .eq("profile_id", profile.id)

  if (error) {
    console.error("Error fetching teacher courses:", error)
    return <div>Error loading courses</div>
  }

  // 🚀 For each course, fetch counts: students, assignments, classes
  const courseStats = await Promise.all(
    (teacherCourses || []).map(async (tc) => {
      const course = tc.courses

      const [{ count: studentCount }, { count: assignmentCount }, { count: sessionCount }] = await Promise.all([
        supabase.from("student_courses").select("*", { count: "exact", head: true }).eq("course_id", course.id),
        supabase.from("assignments").select("*", { count: "exact", head: true }).eq("course_id", course.id),
        supabase.from("lms_sessions").select("*", { count: "exact", head: true }).eq("course_id", course.id),
      ])

      return {
        course,
        stats: {
          students: studentCount || 0,
          assignments: assignmentCount || 0,
          sessions: sessionCount || 0,
        },
      }
    })
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">My Courses</h1>
        <p className="text-gray-600 mt-1">Courses you're currently teaching</p>
      </div>

      {/* Courses Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {courseStats.map(({ course, stats }) => (
          <Card key={course.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-xl">{course.name}</CardTitle>
                  <CardDescription className="mt-2">
                    <Badge variant="outline" className="text-xs mr-2">
                      {course.code}
                    </Badge>
                    <span className="text-sm">
                      {course.credits} Credits • {course.semester}
                    </span>
                  </CardDescription>
                </div>
              </div>
              {course.description && (
                <p className="text-sm text-gray-600 mt-3 line-clamp-2">{course.description}</p>
              )}
            </CardHeader>

            <CardContent className="space-y-4">
              {/* 📊 Course Statistics */}
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <Users className="h-5 w-5 mx-auto mb-1 text-blue-600" />
                  <div className="text-lg font-bold text-blue-600">{stats.students}</div>
                  <div className="text-xs text-gray-600">Students</div>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <FileText className="h-5 w-5 mx-auto mb-1 text-green-600" />
                  <div className="text-lg font-bold text-green-600">{stats.assignments}</div>
                  <div className="text-xs text-gray-600">Assignments</div>
                </div>
                <div className="text-center p-3 bg-purple-50 rounded-lg">
                  <Calendar className="h-5 w-5 mx-auto mb-1 text-purple-600" />
                  <div className="text-lg font-bold text-purple-600">{stats.sessions}</div>
                  <div className="text-xs text-gray-600">Classes</div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <Button asChild size="sm" className="flex-1">
                  <Link href={`/dashboard/teacher/courses/${course.id}`}>
                    <BookOpen className="h-4 w-4 mr-2" />
                    View Course
                  </Link>
                </Button>
                <Button asChild variant="outline" size="sm" className="flex-1 bg-transparent">
                  <Link href={`/dashboard/teacher/courses/${course.id}/students`}>
                    <Users className="h-4 w-4 mr-2" />
                    Students
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}

        {/* Empty State */}
        {(!teacherCourses || teacherCourses.length === 0) && (
          <div className="col-span-full">
            <Card className="text-center py-12">
              <CardContent>
                <BookOpen className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <div className="text-gray-500 mb-2">No courses assigned</div>
                <p className="text-sm text-gray-400">
                  Contact your administrator to get course assignments.
                </p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
