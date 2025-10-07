import { requireRole } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Calendar, Clock, CheckCircle, XCircle, AlertCircle } from "lucide-react"
import { AttendanceMarkingForm } from "@/components/admin/attendance-marking-form"

export default async function TeacherAttendancePage() {
  const profile = await requireRole(["admin"])
  const supabase = await createClient()

  const today = new Date().toISOString().split("T")[0]

  // Fetch all teachers and their attendance for today
  const { data: teachers, error } = await supabase
    .from("profiles")
    .select(
      `
      *,
      teacher_attendance!left (
        id,
        date,
        check_in_time,
        check_out_time,
        status,
        notes
      )
    `,
    )
    .eq("institute_id", profile.institute_id)
    .eq("role", "teacher")
    .eq("teacher_attendance.date", today)
    .order("first_name")

  if (error) {
    console.error("Error fetching teacher attendance:", error)
  }

  const getAttendanceStatus = (teacher: any) => {
    const attendance = teacher.teacher_attendance?.[0]
    if (!attendance) return "not_marked"
    return attendance.status
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "present":
        return (
          <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">
            <CheckCircle className="h-3 w-3 mr-1" />
            Present
          </Badge>
        )
      case "absent":
        return (
          <Badge variant="destructive" className="bg-red-100 text-red-800 border-red-200">
            <XCircle className="h-3 w-3 mr-1" />
            Absent
          </Badge>
        )
      case "late":
        return (
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-yellow-200">
            <AlertCircle className="h-3 w-3 mr-1" />
            Late
          </Badge>
        )
      default:
        return (
          <Badge variant="outline" className="text-gray-600">
            <Clock className="h-3 w-3 mr-1" />
            Not Marked
          </Badge>
        )
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Teacher Attendance</h1>
          <p className="text-gray-600 mt-1 flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            {new Date().toLocaleDateString("en-US", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <div className="text-2xl font-bold">
                  {teachers?.filter((t) => getAttendanceStatus(t) === "present").length || 0}
                </div>
                <div className="text-sm text-gray-600">Present</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-red-600" />
              <div>
                <div className="text-2xl font-bold">
                  {teachers?.filter((t) => getAttendanceStatus(t) === "absent").length || 0}
                </div>
                <div className="text-sm text-gray-600">Absent</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-yellow-600" />
              <div>
                <div className="text-2xl font-bold">
                  {teachers?.filter((t) => getAttendanceStatus(t) === "late").length || 0}
                </div>
                <div className="text-sm text-gray-600">Late</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-gray-600" />
              <div>
                <div className="text-2xl font-bold">
                  {teachers?.filter((t) => getAttendanceStatus(t) === "not_marked").length || 0}
                </div>
                <div className="text-sm text-gray-600">Not Marked</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Teacher Attendance List */}
      <Card>
        <CardHeader>
          <CardTitle>Mark Attendance</CardTitle>
          <CardDescription>Mark attendance for all teachers for today</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {teachers?.map((teacher) => {
              const attendance = teacher.teacher_attendance?.[0]
              const status = getAttendanceStatus(teacher)

              return (
                <div key={teacher.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={teacher.profile_picture_url || "/placeholder.svg"} />
                      <AvatarFallback>
                        {teacher.first_name[0]}
                        {teacher.last_name[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">
                        {teacher.first_name} {teacher.last_name}
                      </div>
                      <div className="text-sm text-gray-600">{teacher.email}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    {attendance && (
                      <div className="text-sm text-gray-600">
                        {attendance.check_in_time && <div>In: {attendance.check_in_time}</div>}
                        {attendance.check_out_time && <div>Out: {attendance.check_out_time}</div>}
                      </div>
                    )}
                    {getStatusBadge(status)}
                    <AttendanceMarkingForm
                      teacherId={teacher.id}
                      currentStatus={status}
                      currentAttendance={attendance}
                    />
                  </div>
                </div>
              )
            })}

            {(!teachers || teachers.length === 0) && (
              <div className="text-center py-8 text-gray-500">No teachers found</div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
