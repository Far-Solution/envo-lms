import { createClient } from "@/lib/supabase/server"
import { requireRole } from "@/lib/auth"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, FileText } from "lucide-react"

export default async function StudentCourseAssignmentsPage({ params }: { params: { courseId: string } }) {
  const profile = await requireRole(["student"])
  const supabase = await createClient()

  // Fetch assignments for this student in this course
  const { data: assignments, error } = await supabase
    .from("assignments")
    .select(`
      id,
      title,
      due_date,
      assignment_submissions!left ( 
        id,
        status,
        grade,
        student_id
      )
    `)
    .eq("course_id", params.courseId)
    .eq("assignment_submissions.student_id", profile.id)
    .order("due_date", { ascending: true })

  if (error) {
    console.error("Error fetching assignments:", error)
    return <div className="p-6 text-gray-500">Error loading assignments.</div>
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold mb-4">My Assignments</h1>

      {assignments && assignments.length > 0 ? (
        <div className="grid gap-4">
          {assignments.map((assignment) => {
            const submission = assignment.assignment_submissions?.[0]
            const status = submission?.status || "pending"
            const points = submission?.grade

            return (
              <Card key={assignment.id}>
                <CardHeader className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                  <div>
                    <CardTitle>{assignment.title}</CardTitle>
                    <CardDescription className="flex items-center gap-2 text-sm text-gray-600">
                      <Calendar className="h-4 w-4" />
                      <span>Due: {assignment.due_date ? new Date(assignment.due_date).toLocaleDateString() : "N/A"}</span>
                    </CardDescription>
                  </div>
                  <Badge
                    variant={
                      status === "graded" ? "default" :
                      status === "submitted" ? "secondary" :
                      "destructive"
                    }
                    className="text-sm"
                  >
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </Badge>
                </CardHeader>
                {points != null && (
                  <CardContent>
                    <div className="text-sm text-gray-700">Points Earned: {points}</div>
                  </CardContent>
                )}
              </Card>
            )
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="text-center py-8 text-gray-500">
            No assignments available.
          </CardContent>
        </Card>
      )}  
    </div>
  )
}
