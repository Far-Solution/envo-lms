import { requireRole } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { BookOpen, FileText, Calendar, TrendingUp, Clock } from "lucide-react"

export default async function StudentDashboardPage() {
  const profile = await requireRole(["student"])
  const supabase = await createClient()

  // Fetch student's courses, assignments, grades, attendance, upcoming sessions
  const [coursesResult, assignmentsResult, gradesResult, attendanceResult, sessionsResult] = await Promise.all([
    supabase
      .from("student_courses")
      .select(
        `
        id,
        course: courses (
          id,
          name,
          code,
          teacher_courses: teacher_courses (
            profiles (
              first_name,
              last_name
            )
          )
        )
      `
      )
      .eq("student_id", profile.id)
      .eq("is_active", true),
    supabase
      .from("assignment_submissions")
      .select(
        `
        id,
        status,
        grade,
        assignments: assignments (
          id,
          title,
          due_date,
          max_points
        )
      `
      )
      .eq("student_id", profile.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("assignment_submissions")
      .select("points_earned, assignments(max_points)")
      .eq("student_id", profile.id)
      .eq("status", "graded"),
    supabase
      .from("student_attendance")
      .select("*")
      .eq("student_id", profile.id)
      .gte("created_at", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()),
    supabase
      .from("lms_sessions")
      .select(
        `
        id,
        title,
        scheduled_start,
        course: courses (
          id,
          name,
          code
        )
      `
      )
      .in(
        "course_id",
        (
          await supabase.from("student_courses").select("course_id").eq("student_id", profile.id)
        ).data?.map((sc) => sc.course_id) || []
      )
      .gte("scheduled_start", new Date().toISOString())
      .order("scheduled_start")
      .limit(5),
  ])

  const courses = coursesResult.data || []
  const assignments = assignmentsResult.data || []
  const grades = gradesResult.data || []
  const attendance = attendanceResult.data || []
  const upcomingSessions = sessionsResult.data || []

  // Statistics calculations
  const pendingAssignments = assignments.filter((a) => a.status === "pending").length
  const totalAttendance = attendance.length
  const presentCount = attendance.filter((a) => a.status === "present").length
  const attendanceRate = totalAttendance > 0 ? Math.round((presentCount / totalAttendance) * 100) : 0

  const totalPoints = grades.reduce((sum, g) => sum + (g.points_earned || 0), 0)
  const maxPoints = grades.reduce((sum, g) => sum + (g.assignments?.grade || 0), 0)
  const averageGrade = maxPoints > 0 ? Math.round((totalPoints / maxPoints) * 100) : 0

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Student Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Welcome back, {profile.first_name}! Here's your academic overview and upcoming activities.
          </p>
        </div>
        <Badge variant="secondary" className="text-sm">
          Student
        </Badge>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Enrolled Courses</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{courses.length}</div>
            <p className="text-xs text-muted-foreground">Active enrollments</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Assignments</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingAssignments}</div>
            <p className="text-xs text-muted-foreground">Need to submit</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Grade</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{averageGrade}%</div>
            <p className="text-xs text-muted-foreground">Overall performance</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Attendance Rate</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{attendanceRate}%</div>
            <p className="text-xs text-muted-foreground">Last 30 days</p>
          </CardContent>
        </Card>
      </div>

      {/* Courses and Upcoming Classes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Courses */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              My Courses
            </CardTitle>
            <CardDescription>Your current course enrollments</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {courses.length > 0 ? (
              courses.map((enrollment: any) => {
                const course = enrollment.course
                const teacher = course.teacher_courses?.[0]?.profiles

                return (
                  <div key={enrollment.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">{course.name}</div>
                      <div className="text-sm text-gray-600">
                        {course.code}
                        {teacher && (
                          <span className="ml-2">
                            • {teacher.first_name} {teacher.last_name}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      {enrollment.final_grade ? (
                        <Badge variant={enrollment.final_grade >= 70 ? "default" : "destructive"} className="text-xs">
                          {enrollment.final_grade}%
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs">
                          In Progress
                        </Badge>
                      )}
                      <div className="mt-1">
                        <a
                          href={`/dashboard/student/courses/${course.id}`}
                          className="text-sm text-blue-600 hover:underline"
                        >
                          View Course
                        </a>
                      </div>
                    </div>
                  </div>
                )
              })
            ) : (
              <div className="text-center py-8 text-gray-500">No courses enrolled</div>
            )}
          </CardContent>
        </Card>

        {/* Upcoming Classes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Upcoming Classes
            </CardTitle>
            <CardDescription>Your scheduled classes and meetings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {upcomingSessions.length > 0 ? (
              upcomingSessions.map((session) => (
                <div key={session.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <div className="font-medium">{session.title}</div>
                    <div className="text-sm text-gray-600">
                      {session.course.code} • {new Date(session.scheduled_start).toLocaleDateString()} at{" "}
                      {new Date(session.scheduled_start).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </div>
                  </div>
                  <Badge variant="default" className="text-xs">
                    Scheduled
                  </Badge>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">No upcoming classes</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Assignments */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Recent Assignments
          </CardTitle>
          <CardDescription>Your latest assignment submissions and grades</CardDescription>
        </CardHeader>
        <CardContent>
          {assignments.length > 0 ? (
            <div className="space-y-4">
              {assignments.slice(0, 5).map((submission) => {
                const assignment = submission.assignments
                const isOverdue = new Date(assignment.due_date) < new Date() && submission.status === "pending"

                return (
                  <div key={submission.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <div className="font-medium">{assignment.title}</div>
                      <div className="text-sm text-gray-600">
                        Due: {new Date(assignment.due_date).toLocaleDateString()}
                        {submission.points_earned !== null && (
                          <span className="ml-2">
                            • {submission.points_earned}/{assignment.grade} points
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {submission.status === "graded" && (
                        <Badge
                          variant={
                            (submission.points_earned / assignment.grade) * 100 >= 70 ? "default" : "destructive"
                          }
                          className="text-xs"
                        >
                          {Math.round((submission.points_earned / assignment.grade) * 100)}%
                        </Badge>
                      )}
                      <Badge
                        variant={
                          submission.status === "graded"
                            ? "default"
                            : submission.status === "submitted"
                              ? "secondary"
                              : isOverdue
                                ? "destructive"
                                : "outline"
                        }
                        className="text-xs"
                      >
                        {submission.status === "pending" && isOverdue
                          ? "Overdue"
                          : submission.status === "pending"
                            ? "Not Submitted"
                            : submission.status === "submitted"
                              ? "Submitted"
                              : "Graded"}
                      </Badge>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">No assignments yet</div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
