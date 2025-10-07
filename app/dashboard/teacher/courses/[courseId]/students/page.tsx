import { createClient } from "@/lib/supabase/server"
import { requireRole } from "@/lib/auth"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export default async function CourseStudentsPage({ params }: { params: { courseId: string } }) {
  const profile = await requireRole(["teacher"])
  const supabase = await createClient()

  const { data: students, error } = await supabase
    .from("student_courses")
    .select(`
      profiles (
        id,
        full_name,
        email,
        profile_picture_url
      )
    `)
    .eq("course_id", params.courseId)

  if (error) {
    console.error("Error fetching students:", error)
    return <div className="p-6 text-gray-500">Error loading students.</div>
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Enrolled Students</h1>

      {students && students.length > 0 ? (
        <div className="grid gap-4">
          {students.map((s, i) => {
            const student = Array.isArray(s.profiles) ? s.profiles[0] : s.profiles
            return (
              <Card key={student?.id}>
                <CardHeader className="flex flex-row items-center gap-4">
                  <Avatar>
                    <AvatarImage src={student?.profile_picture_url || undefined} />
                    <AvatarFallback>{student?.full_name?.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-base">{student?.full_name}</CardTitle>
                    <p className="text-sm text-gray-500">{student?.email}</p>
                  </div>
                </CardHeader>
              </Card>
            )
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="text-center py-8 text-gray-500">
            No students enrolled yet.
          </CardContent>
        </Card>
      )}
    </div>
  )
}
