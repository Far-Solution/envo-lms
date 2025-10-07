import { requireRole } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { BookOpen, User, Calendar, TrendingUp, FileText, Clock } from "lucide-react"
import Link from "next/link"

export default async function StudentCoursesPage() {
  const profile = await requireRole(["student"])
  const supabase = await createClient()

  // 1️⃣ Fetch student's courses with teacher info
  const { data: studentCoursesRaw, error: scError } = await supabase
    .from("student_courses")
    .select(`
      id,
      created_at,
      course: courses (
        id,
        name,
        code,
        description,
        credits,
        semester,
        teacher_courses (
          profiles (
            id,
            first_name,
            last_name
          )
        )
      )
    `)
    .eq("profile_id", profile.id)

  if (scError) {
    console.error("Error fetching student courses:", scError)
  }

  const studentCourses = (studentCoursesRaw || []).filter(sc => sc.course && sc.course.id)

  const courseIds = studentCourses.map(sc => sc.course.id)

  // 2️⃣ Fetch assignments for these courses
  const { data: assignmentsData } = await supabase
    .from("assignments")
    .select(`
    id,
    course_id,
    assignment_submissions!left (
      id,
      status,
      student_id
    )
  `)
    .in("course_id", courseIds)
    .eq("assignment_submissions.student_id", profile.id)

  // Stats helper
  const getStatsForCourse = (courseId: string) => {
    const courseAssignments = assignmentsData?.filter(a => a.course_id === courseId) || []

    const total = courseAssignments.length
    const submitted = courseAssignments.filter(a => a.assignment_submissions?.length && a.assignment_submissions[0].status !== 'pending').length
    const graded = courseAssignments.filter(a => a.assignment_submissions?.length && a.assignment_submissions[0].status === 'graded').length
    const pending = total - submitted

    return { total, submitted, graded, pending }
  }


  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">My Courses</h1>
        <p className="text-gray-600 mt-1">Your current course enrollments and progress</p>
      </div>

      {/* Courses Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {studentCourses.length > 0 ? (
          studentCourses.map(enrollment => {
            const course = enrollment.course
            // Take first teacher if multiple
            const teacher = course.teacher_courses?.[0]?.profiles || null
            const stats = getStatsForCourse(course.id)
            const completionRate = stats.total > 0 ? Math.round((stats.submitted / stats.total) * 100) : 0

            return (
              <Card key={enrollment.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-xl">{course.name}</CardTitle>
                      <CardDescription className="mt-2">
                        <Badge variant="outline" className="text-xs mr-2">{course.code}</Badge>
                        <span className="text-sm">{course.credits} Credits • {course.semester}</span>
                      </CardDescription>
                    </div>
                    <Badge variant="outline" className="text-sm">In Progress</Badge>
                  </div>
                  {course.description && <p className="text-sm text-gray-600 mt-3 line-clamp-2">{course.description}</p>}
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Teacher Info */}
                  {teacher && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <User className="h-4 w-4" />
                      <span>{teacher.first_name} {teacher.last_name}</span>
                    </div>
                  )}

                  {/* Enrollment Date */}
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar className="h-4 w-4" />
                    <span>Enrolled: {enrollment.created_at ? new Date(enrollment.created_at).toLocaleDateString() : "N/A"}</span>
                  </div>

                  {/* Assignment Progress */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Assignment Progress</span>
                      <span className="font-medium">{stats.submitted}/{stats.total} completed</span>
                    </div>
                    <Progress value={completionRate} className="h-2" />
                  </div>

                  {/* Course Statistics */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                      <FileText className="h-5 w-5 mx-auto mb-1 text-blue-600" />
                      <div className="text-lg font-bold text-blue-600">{stats.total}</div> {/* Total assignments */}
                      <div className="text-xs text-gray-600">Assignments</div>
                    </div>
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                      <TrendingUp className="h-5 w-5 mx-auto mb-1 text-green-600" />
                      <div className="text-lg font-bold text-orange-600">{stats.pending}</div> {/* Pending */}
                      <div className="text-xs text-gray-600">Graded</div>
                    </div>
                    <div className="text-center p-3 bg-orange-50 rounded-lg">
                      <Clock className="h-5 w-5 mx-auto mb-1 text-orange-600" />
                      <div className="text-lg font-bold text-green-600">{stats.graded}</div> {/* Graded */}
                      <div className="text-xs text-gray-600">Pending</div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-2">
                    <Button asChild size="sm" className="flex-1">
                      <Link href={`/dashboard/student/courses/${course.id}`}>
                        <BookOpen className="h-4 w-4 mr-2" />
                        View Course
                      </Link>
                    </Button>
                    <Button asChild variant="outline" size="sm" className="flex-1 bg-transparent">
                      <Link href={`/dashboard/student/courses/${course.id}/assignments`}>
                        <FileText className="h-4 w-4 mr-2" />
                        Assignments
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })
        ) : (
          <div className="col-span-full">
            <Card className="text-center py-12">
              <CardContent>
                <BookOpen className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <div className="text-gray-500 mb-2">No courses enrolled</div>
                <p className="text-sm text-gray-400">Contact your administrator to enroll in courses.</p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
