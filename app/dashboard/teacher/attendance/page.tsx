import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { requireRole } from "@/lib/auth"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, Clock, CheckCircle, Users, Plus, UserCheck } from "lucide-react"

export default async function TeacherAttendanceDashboard() {
  const profile = await requireRole(["teacher"])
  const supabase = await createClient()

  // 🧠 Fetch teacher self-attendance (last 10 days)
  const { data: teacherAttendance, error: teacherError } = await supabase
    .from("teacher_attendance")
    .select("date, status, notes, teacher_id")
    .eq("teacher_id", profile.id)
    .order("date", { ascending: false })
    .limit(10)

  if (teacherError) console.error("Error fetching teacher attendance:", teacherError)

  // 🧑‍🏫 Fetch student attendance sessions by this teacher
  const { data: studentAttendance, error } = await supabase
  .from("student_attendance")
  .select(`
    id,
    status,
    marked_date,
    remarks,
    is_self_marked,
    courses ( id, name, code )
  `)
  .eq("marked_by", profile.id)
  .order("marked_date", { ascending: false })
  .limit(10)


  if (error) console.error("Error fetching student sessions:", error)


  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Attendance Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Track your own attendance and manage student attendance records
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href="/dashboard/teacher/attendance/mark">
              <Users className="h-4 w-4 mr-2" />
              Mark Student Attendance
            </Link>
          </Button>
          <Button
            asChild
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            <Link href="/dashboard/teacher/attendance/mark-self">
              <UserCheck className="h-4 w-4 mr-2" />
              Mark My Attendance
            </Link>
          </Button>
        </div>
      </div>

      {/* SECTION 1 — Teacher Self Attendance */}
      <Card>
        <CardHeader>
          <CardTitle>My Attendance</CardTitle>
          <CardDescription>Your recent attendance records</CardDescription>
        </CardHeader>
        <CardContent>
          {teacherAttendance && teacherAttendance.length > 0 ? (
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
              {teacherAttendance.map((record) => (
                <Card
                  key={record.date}
                  className="p-4 flex flex-col justify-between hover:shadow-md transition"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-600" />
                      <span className="font-medium">
                        {new Date(record.date).toLocaleDateString()}
                      </span>
                    </div>
                    <Badge
                      variant={
                        record.status === "present"
                          ? "default"
                          : record.status === "late"
                            ? "secondary"
                            : "destructive"
                      }
                    >
                      {record.status}
                    </Badge>
                  </div>
                  {record.notes && (
                    <p className="text-sm text-gray-600 mt-2">{record.notes}</p>
                  )}
                  {/* {record.is_self_marked && (
                    <span className="text-xs text-green-600 mt-2">
                      ✅ Self-marked
                    </span>
                  )} */}
                </Card>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">No attendance marked yet.</p>
          )}
        </CardContent>
      </Card>

      {/* SECTION 2 — Student Attendance Sessions */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Student Attendance</CardTitle>
          <CardDescription>Overview of your last marked sessions</CardDescription>
        </CardHeader>
        <CardContent>
          {studentAttendance && studentAttendance.length > 0 ? (
            <div className="space-y-4">
              {studentAttendance.map((session) => (
                <Card
                  key={`${session.courses}-${session.marked_date}`}
                  className="hover:shadow-sm transition"
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg flex items-center gap-2">
                          <Calendar className="h-5 w-5" />
                          {session.courses?.name || "Unknown Course"}
                        </CardTitle>
                        <CardDescription className="mt-1 text-sm">
                          <Badge variant="outline">{session.courses?.code || "N/A"}</Badge>{" "}
                          {new Date(session.marked_date).toLocaleDateString()}
                        </CardDescription>
                      </div>
                      <Badge
                        variant={
                          session.status === "present"
                            ? "default"
                            : session.status === "late"
                              ? "secondary"
                              : "destructive"
                        }
                      >
                        {session.status}
                      </Badge>
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">
              No student attendance sessions yet.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
