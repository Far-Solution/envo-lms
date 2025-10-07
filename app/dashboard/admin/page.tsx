import { requireRole } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Users, GraduationCap, BookOpen, TrendingUp, Clock } from "lucide-react"

export default async function AdminDashboardPage() {
  const profile = await requireRole(["admin"])
  const supabase = await createClient()

  // Fetch dashboard statistics
  const [teachersResult, studentsResult, coursesResult, attendanceResult] = await Promise.all([
    supabase.from("profiles").select("id").eq("institute_id", profile.institute_id).eq("role", "teacher"),
    supabase.from("profiles").select("id").eq("institute_id", profile.institute_id).eq("role", "student"),
    supabase.from("courses").select("id").eq("institute_id", profile.institute_id).eq("is_active", true),
    supabase
      .from("teacher_attendance")
      .select("id, status")
      .eq("institute_id", profile.institute_id)
      .eq("date", new Date().toISOString().split("T")[0]),
  ])

  const teacherCount = teachersResult.data?.length || 0
  const studentCount = studentsResult.data?.length || 0
  const courseCount = coursesResult.data?.length || 0
  const todayAttendance = attendanceResult.data || []
  const presentTeachers = todayAttendance.filter((a) => a.status === "present").length

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Welcome back, {profile.first_name}! Here's what's happening at {profile.institutes?.name}.
          </p>
        </div>
        <Badge variant="secondary" className="text-sm">
          Administrator
        </Badge>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Teachers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{teacherCount}</div>
            <p className="text-xs text-muted-foreground">Active faculty members</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{studentCount}</div>
            <p className="text-xs text-muted-foreground">Enrolled students</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Courses</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{courseCount}</div>
            <p className="text-xs text-muted-foreground">This semester</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Attendance</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {presentTeachers}/{teacherCount}
            </div>
            <p className="text-xs text-muted-foreground">Teachers present</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Teacher Management
            </CardTitle>
            <CardDescription>Manage faculty members and their assignments</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <a href="/dashboard/admin/teachers" className="p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                <div className="font-medium">View All Teachers</div>
                <div className="text-sm text-gray-600">Manage faculty profiles</div>
              </a>
              <a
                href="/dashboard/admin/teachers/attendance"
                className="p-4 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="font-medium">Teacher Attendance</div>
                <div className="text-sm text-gray-600">Track daily attendance</div>
              </a>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Course Management
            </CardTitle>
            <CardDescription>Oversee courses and academic programs</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <a href="/dashboard/admin/courses" className="p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                <div className="font-medium">All Courses</div>
                <div className="text-sm text-gray-600">View and manage courses</div>
              </a>
              <a href="/dashboard/admin/students" className="p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                <div className="font-medium">Student Management</div>
                <div className="text-sm text-gray-600">Manage enrollments</div>
              </a>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Recent Activity
          </CardTitle>
          <CardDescription>Latest updates and system activity</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-4 p-3 bg-blue-50 rounded-lg">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <div className="flex-1">
                <div className="font-medium">System initialized</div>
                <div className="text-sm text-gray-600">Database and authentication system set up successfully</div>
              </div>
              <div className="text-sm text-gray-500">Just now</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
