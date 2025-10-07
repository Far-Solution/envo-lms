import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { requireRole } from "@/lib/auth"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, FileText, Users, ArrowLeft } from "lucide-react"

export default async function CourseDetailPage({ params }: { params: { courseId: string } }) {
  const profile = await requireRole(["teacher"])
  const supabase = await createClient()

  // Fetch course info
  const { data: course, error: courseError } = await supabase
    .from("courses")
    .select("*")
    .eq("id", params.courseId)
    .single()

  if (courseError || !course) {
    return <div className="p-6 text-gray-500">Course not found.</div>
  }

  // Fetch upcoming classes
  const { data: upcomingClasses } = await supabase
    .from("lms_sessions")
    .select("id, title, start_time, end_time, type")
    .eq("course_id", params.courseId)
    .eq("type", "class")
    .gt("start_time", new Date().toISOString())
    .order("start_time", { ascending: true })

  // Fetch related stats
  const [{ count: studentCount }, { count: assignmentCount }, { count: classCount }] = await Promise.all([
    supabase.from("student_courses").select("*", { count: "exact", head: true }).eq("course_id", params.courseId),
    supabase.from("assignments").select("*", { count: "exact", head: true }).eq("course_id", params.courseId),
    supabase
      .from("lms_sessions")
      .select("*", { count: "exact", head: true })
      .eq("course_id", params.courseId)
      .eq("type", "class"),
  ])

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <div>
        <Link href="/dashboard/teacher/courses">
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
      <div className="grid grid-cols-3 gap-4">
        <Card className="text-center">
          <CardContent className="p-4">
            <Users className="h-5 w-5 mx-auto mb-1 text-blue-600" />
            <div className="text-lg font-semibold">{studentCount || 0}</div>
            <div className="text-xs text-gray-600">Students</div>
          </CardContent>
        </Card>
        <Card className="text-center">
          <CardContent className="p-4">
            <FileText className="h-5 w-5 mx-auto mb-1 text-green-600" />
            <div className="text-lg font-semibold">{assignmentCount || 0}</div>
            <div className="text-xs text-gray-600">Assignments</div>
          </CardContent>
        </Card>
        <Card className="text-center">
          <CardContent className="p-4">
            <Calendar className="h-5 w-5 mx-auto mb-1 text-purple-600" />
            <div className="text-lg font-semibold">{classCount || 0}</div>
            <div className="text-xs text-gray-600">Classes</div>
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
