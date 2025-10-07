import { requireRole } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Calendar, Clock, CheckCircle, XCircle, AlertCircle, BookOpen } from "lucide-react"

export default async function StudentAttendancePage() {
  const profile = await requireRole(["student"])
  const supabase = await createClient()

  // Fetch student's attendance with course info
  const { data: attendance, error } = await supabase
    .from("student_attendance")
    .select(
      `
        id,
        status,
        marked_at,
        marked_date,
        remarks,
        courses (
          id,
          name,
          code
        )
      `
    )
    .eq("student_id", profile.id)
    .order("marked_date", { ascending: false })

  if (error) {
    console.error("Error fetching attendance:", error)
  }

  // Attendance statistics
  const totalSessions = attendance?.length || 0
  const presentCount = attendance?.filter((a) => a.status === "present").length || 0
  const lateCount = attendance?.filter((a) => a.status === "late").length || 0
  const absentCount = attendance?.filter((a) => a.status === "absent").length || 0
  const attendanceRate = totalSessions > 0 ? Math.round((presentCount / totalSessions) * 100) : 0

  // Group by course
  const attendanceByCourse = attendance?.reduce((acc, record) => {
    const courseId = record.courses?.id || "unknown"
    if (!acc[courseId]) {
      acc[courseId] = {
        course: record.courses || { id: "unknown", name: "Unassigned Course", code: "N/A" },
        records: [],
        present: 0,
        late: 0,
        absent: 0,
      }
    }
    acc[courseId].records.push(record)
    acc[courseId][record.status]++
    return acc
  }, {} as Record<string, any>)

  const courseAttendance = Object.values(attendanceByCourse || {})

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "present":
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case "late":
        return <AlertCircle className="h-4 w-4 text-yellow-600" />
      case "absent":
        return <XCircle className="h-4 w-4 text-red-600" />
      default:
        return <Clock className="h-4 w-4 text-gray-400" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "present":
        return (
          <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">
            Present
          </Badge>
        )
      case "late":
        return (
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-yellow-200">
            Late
          </Badge>
        )
      case "absent":
        return (
          <Badge variant="destructive" className="bg-red-100 text-red-800 border-red-200">
            Absent
          </Badge>
        )
      default:
        return <Badge variant="outline">Unknown</Badge>
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">My Attendance</h1>
        <p className="text-gray-600 mt-1">Track your class attendance and participation</p>
      </div>

      {/* Overall Attendance Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Overall Attendance
          </CardTitle>
          <CardDescription>Your attendance summary across all courses</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center p-6 bg-blue-50 rounded-lg">
              <div className="text-3xl font-bold text-blue-600">{attendanceRate}%</div>
              <div className="text-sm text-gray-600 mt-1">Attendance Rate</div>
            </div>
            <div className="text-center p-6 bg-green-50 rounded-lg">
              <div className="text-3xl font-bold text-green-600">{presentCount}</div>
              <div className="text-sm text-gray-600 mt-1">Present</div>
            </div>
            <div className="text-center p-6 bg-yellow-50 rounded-lg">
              <div className="text-3xl font-bold text-yellow-600">{lateCount}</div>
              <div className="text-sm text-gray-600 mt-1">Late</div>
            </div>
            <div className="text-center p-6 bg-red-50 rounded-lg">
              <div className="text-3xl font-bold text-red-600">{absentCount}</div>
              <div className="text-sm text-gray-600 mt-1">Absent</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Attendance by Course */}
      <div className="space-y-6">
        <h2 className="text-xl font-semibold text-gray-900">Attendance by Course</h2>
        {courseAttendance.map((courseData) => {
          const total = courseData.records.length
          const courseAttendanceRate = total > 0 ? Math.round((courseData.present / total) * 100) : 0

          return (
            <Card key={courseData.course.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <BookOpen className="h-5 w-5" />
                      {courseData.course.name}
                    </CardTitle>
                    <CardDescription>
                      <Badge variant="outline" className="text-xs">
                        {courseData.course.code}
                      </Badge>
                    </CardDescription>
                  </div>
                  <Badge
                    variant={courseAttendanceRate >= 80 ? "default" : "destructive"}
                    className="text-sm"
                  >
                    {courseAttendanceRate}%
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Course Attendance Progress */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Attendance Rate</span>
                    <span className="font-medium">
                      {courseData.present}/{total} sessions
                    </span>
                  </div>
                  <Progress value={courseAttendanceRate} className="h-2" />
                </div>

                {/* Course Statistics */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <CheckCircle className="h-5 w-5 mx-auto mb-1 text-green-600" />
                    <div className="text-lg font-bold text-green-600">{courseData.present}</div>
                    <div className="text-xs text-gray-600">Present</div>
                  </div>
                  <div className="text-center p-3 bg-yellow-50 rounded-lg">
                    <AlertCircle className="h-5 w-5 mx-auto mb-1 text-yellow-600" />
                    <div className="text-lg font-bold text-yellow-600">{courseData.late}</div>
                    <div className="text-xs text-gray-600">Late</div>
                  </div>
                  <div className="text-center p-3 bg-red-50 rounded-lg">
                    <XCircle className="h-5 w-5 mx-auto mb-1 text-red-600" />
                    <div className="text-lg font-bold text-red-600">{courseData.absent}</div>
                    <div className="text-xs text-gray-600">Absent</div>
                  </div>
                </div>

                {/* Recent Attendance Records */}
                <div className="space-y-3">
                  <div className="text-sm font-medium text-gray-900">Recent Sessions</div>
                  {courseData.records.slice(0, 5).map((record: any) => (
                    <div key={record.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(record.status)}
                        <div>
                          <div className="font-medium">
                            {new Date(record.marked_date).toLocaleDateString()}
                            {record.marked_at && (
                              <span className="ml-2 text-sm text-gray-600">
                                at {new Date(record.marked_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                              </span>
                            )}
                          </div>
                          {record.remarks && (
                            <div className="text-sm text-gray-600">{record.remarks}</div>
                          )}
                        </div>
                      </div>
                      <div className="text-right">{getStatusBadge(record.status)}</div>
                    </div>
                  ))}
                  {courseData.records.length > 5 && (
                    <div className="text-center text-sm text-gray-500">
                      +{courseData.records.length - 5} more sessions
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}

        {/* Empty State */}
        {courseAttendance.length === 0 && (
          <Card className="text-center py-12">
            <CardContent>
              <Clock className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <div className="text-gray-500 mb-4">No attendance records found</div>
              <p className="text-sm text-gray-400">
                Attendance records will appear here once classes begin.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
  