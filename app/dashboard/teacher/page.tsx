import { requireRole } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { BookOpen, Users, FileText, Calendar, Clock, TrendingUp } from "lucide-react"

export default async function TeacherDashboardPage() {
  const profile = await requireRole(["teacher"])
  const supabase = await createClient()

  // 1) Fetch teacher_courses (ensure we have course_id + nested course info)
  const { data: teacherCourses = [], error: tcError } = await supabase
    .from("teacher_courses")
    .select(
      `
      id,
      course_id,
      courses (
        id,
        name,
        code,
        description,
        credits,
        semester
      )
        student_courses (
      id,
      student_id
    )
    `
    )
    .eq("profile_id", profile.id)

  if (tcError) {
    console.error("Error fetching teacher courses:", tcError)
  }

  // build courseId list (defensive)
  const courseIds = (teacherCourses || [])
    .map((tc: any) => tc.course_id ?? tc.courses?.id)
    .filter(Boolean)

  // 2) Fetch assignments that belong to this teacher (try both created_by and teacher_id)
  const assignmentsQ = supabase
    .from("assignments")
    .select("id, title, due_date")
    .or(`teacher_id.eq.${profile.id}`)
    .order("due_date", { ascending: true })

  // 3) Fetch students enrolled in the teacher's courses (if any)
  let studentsQ
  if (courseIds.length > 0) {
    studentsQ = supabase
      .from("student_courses")
      .select("profiles(id, first_name, last_name, email)")
      .in("course_id", courseIds)
  } else {
    // empty result shape
    studentsQ = { data: [], error: null }
  }

  // 4) Fetch upcoming sessions (lms_sessions) created by this teacher
  const nowIso = new Date().toISOString()
  const sessionsQ = supabase
    .from("lms_sessions")
    .select("id, title, start_time, end_time, status, type")
    .eq("created_by", profile.id)
    .gte("start_time", nowIso)
    .order("start_time", { ascending: true })
    .limit(5)

  // run in parallel (assignmentsQ and sessionsQ are Postgrest filters so they are built already)
  const [{ data: assignments = [] }, studentsRes, { data: upcomingMeetings = [] }] = await Promise.all([
    assignmentsQ,
    // studentsQ may be a promise or stub above
    (async () => {
      if ((studentsQ as any).from) {
        return await (studentsQ as any)
      } else {
        return studentsQ
      }
    })(),
    sessionsQ,
  ])

  // normalize students list and dedupe by id
  const studentEntries = studentsRes?.data ?? []
  const uniqueStudentsMap = new Map<string, any>()
  for (const enr of studentEntries) {
    const p = enr.profiles
    if (p?.id) uniqueStudentsMap.set(p.id, p)
  }
  const totalStudents = uniqueStudentsMap.size

  // pending assignments: due date in future
  const now = new Date()
  const pendingAssignments = (assignments || []).filter((a: any) => {
    try {
      return a.due_date && new Date(a.due_date) > now
    } catch {
      return false
    }
  }).length

  // counts
  const courses = teacherCourses || []
  const upcomingCount = upcomingMeetings?.length || 0

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Teacher Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Welcome back, {profile.first_name}! Here's an overview of your classes and activities.
          </p>
        </div>
        <Badge variant="secondary" className="text-sm">
          Teacher
        </Badge>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">My Courses</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{courses.length}</div>
            <p className="text-xs text-muted-foreground">Active courses</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalStudents}</div>
            <p className="text-xs text-muted-foreground">Across all courses</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Assignments</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingAssignments}</div>
            <p className="text-xs text-muted-foreground">Pending submissions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upcoming Classes</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{upcomingCount}</div>
            <p className="text-xs text-muted-foreground">This week</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* My Courses */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              My Courses
            </CardTitle>
            <CardDescription>Courses you're currently teaching</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {courses.length > 0 ? (
              (courses as any).map((tc: any) => {
                const course = tc.courses ?? { id: tc.course_id, name: "Unknown", code: "" }
                const studentCount = (course.student_courses && course.student_courses.length) || 0
                return (
                  <div key={tc.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">{course.name}</div>
                      <div className="text-sm text-gray-600">{course.code}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium">{studentCount} students</div>
                      <a href={`/dashboard/teacher/courses/${course.id}`} className="text-sm text-blue-600 hover:underline">
                        View Course
                      </a>
                    </div>
                  </div>
                )
              })
            ) : (
              <div className="text-center py-8 text-gray-500">No courses assigned yet</div>
            )}
          </CardContent>
        </Card>

        {/* Upcoming Meetings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Upcoming Classes
            </CardTitle>
            <CardDescription>Your scheduled classes and meetings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {upcomingMeetings.length > 0 ? (
              upcomingMeetings.map((meeting: any) => (
                <div key={meeting.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <div className="font-medium">{meeting.title}</div>
                    <div className="text-sm text-gray-600">
                      {new Date(meeting.start_time).toLocaleDateString()} at{" "}
                      {new Date(meeting.start_time).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  </div>
                  <Badge variant={meeting.status === "upcoming" || meeting.status === "scheduled" ? "default" : "secondary"} className="text-xs">
                    {meeting.status}
                  </Badge>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">No upcoming classes</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Quick Actions
          </CardTitle>
          <CardDescription>Common tasks and shortcuts</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <a
              href="/dashboard/teacher/assignments/create"
              className="p-4 border rounded-lg hover:bg-gray-50 transition-colors text-center"
            >
              <FileText className="h-8 w-8 mx-auto mb-2 text-blue-600" />
              <div className="font-medium">Create Assignment</div>
              <div className="text-sm text-gray-600">Add new assignment</div>
            </a>
            <a
              href="/dashboard/teacher/attendance"
              className="p-4 border rounded-lg hover:bg-gray-50 transition-colors text-center"
            >
              <Clock className="h-8 w-8 mx-auto mb-2 text-green-600" />
              <div className="font-medium">Mark Attendance</div>
              <div className="text-sm text-gray-600">Track student attendance</div>
            </a>
            <a
              href="/dashboard/teacher/meetings/create"
              className="p-4 border rounded-lg hover:bg-gray-50 transition-colors text-center"
            >
              <Calendar className="h-8 w-8 mx-auto mb-2 text-purple-600" />
              <div className="font-medium">Schedule Class</div>
              <div className="text-sm text-gray-600">Create new meeting</div>
            </a>
            <a
              href="/dashboard/teacher/students"
              className="p-4 border rounded-lg hover:bg-gray-50 transition-colors text-center"
            >
              <Users className="h-8 w-8 mx-auto mb-2 text-orange-600" />
              <div className="font-medium">View Students</div>
              <div className="text-sm text-gray-600">Manage your students</div>
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
