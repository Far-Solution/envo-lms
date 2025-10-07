import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { requireRole } from "@/lib/auth"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, FileText, Users, ArrowLeft } from "lucide-react"

export default async function StudentCourseDetailPage({ params }: { params: { courseId: string } }) {
  const profile = await requireRole(["student"])
  const supabase = await createClient()

  // 1️⃣ Fetch student enrollment for this course
  const { data: enrollment, error: enrollmentError } = await supabase
    .from("student_courses")
    .select(`
      id,
      created_at,
      course: courses (
        id,
        name,
        code,
        description,
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
    .eq("course_id", params.courseId)
    .single()

  if (enrollmentError || !enrollment || !enrollment.course) {
    return <div className="p-6 text-gray-500">Course not found or you are not enrolled.</div>
  }

  const course = enrollment.course


  // 2️⃣ Fetch upcoming classes for this course
  const { data: upcomingClasses } = await supabase
    .from("lms_sessions")
    .select("id, title, start_time, end_time, type")
    .eq("course_id", course.id)
    .eq("type", "class")
    .gt("start_time", new Date().toISOString())
    .order("start_time", { ascending: true })

  // 3️⃣ Fetch assignment stats for this student
  const { data: assignmentsData } = await supabase
    .from("assignments")
    .select(`
      id,
      course_id,
      assignment_submissions!inner (
        id,
        status,
        student_id
      )
    `)
    .eq("course_id", course.id)
    .eq("assignment_submissions.student_id", profile.id)

  const totalAssignments = assignmentsData?.length || 0
  const submittedAssignments = assignmentsData?.filter(a => a.assignment_submissions?.[0]?.status !== "pending").length || 0
  const gradedAssignments = assignmentsData?.filter(a => a.assignment_submissions?.[0]?.status === "graded").length || 0

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <div>
        <Link href="/dashboard/student/courses">
          <Button variant="ghost" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Courses
          </Button>
        </Link>
      </div>

      {/* Course Header */}
      <div>
        <h1 className="text-3xl font-bold">{course.name}</h1>
        <Badge variant="outline" className="mt-2">{course.code}</Badge>
        <p className="text-gray-600 mt-3">{course.description}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="text-center">
          <CardContent className="p-4">
            <FileText className="h-5 w-5 mx-auto mb-1 text-green-600" />
            <div className="text-lg font-semibold">{gradedAssignments}</div>
            <div className="text-xs text-gray-600">Graded</div>
          </CardContent>
        </Card>
        <Card className="text-center">
          <CardContent className="p-4">
            <Calendar className="h-5 w-5 mx-auto mb-1 text-purple-600" />
            <div className="text-lg font-semibold">{upcomingClasses?.length || 0}</div>
            <div className="text-xs text-gray-600">Upcoming Classes</div>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Classes */}
      <Card>
        <CardHeader>
          <CardTitle>Upcoming Classes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {upcomingClasses && upcomingClasses.length > 0 ? (
            upcomingClasses.map((cls) => (
              <div key={cls.id}>
                <div className="font-semibold">{cls.title}</div>
                <div className="text-xs text-gray-600">
                  {new Date(cls.start_time).toLocaleString()}
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-gray-500">No upcoming classes for this course.</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
