import { createClient } from "@/lib/supabase/server"
import { requireRole } from "@/lib/auth"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Calendar, FileText, Download } from "lucide-react"

export default async function AssignmentDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const profile = await requireRole(["student"])
  const supabase = await createClient()

  // 🧠 1️⃣ Fetch assignment + related course
  const { data: assignment, error: assignmentError } = await supabase
    .from("assignments")
    .select(
      `
      id,
      title,
      description,
      due_date,
      max_points,
      course_id,
      courses (
        id,
        name,
        code
      )
    `
    )
    .eq("id", params.id)
    .single()

  if (assignmentError || !assignment) {
    console.error("Error fetching assignment:", assignmentError)
    return <div className="p-6 text-gray-500">Assignment not found.</div>
  }

  // 🧠 2️⃣ Fetch attached files (uploaded by teacher)
  const { data: files } = await supabase
    .from("file_uploads")
    .select("id, file_url, file_name, created_at")
    .eq("related_type", "assignment")
    .eq("related_id", assignment.id)

  // 🧠 3️⃣ Fetch student submission (if any)
  const { data: submission } = await supabase
    .from("assignment_submissions")
    .select("id, status, grade, submitted_at, feedback, file_url")
    .eq("assignment_id", assignment.id)
    .eq("student_id", profile.id)
    .maybeSingle()

  const dueDate = new Date(assignment.due_date).toLocaleDateString()

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold">
            {assignment.title}
          </CardTitle>
          <div className="text-gray-500">
            {assignment.courses?.code} — {assignment.courses?.name}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Calendar className="h-4 w-4" /> Due: {dueDate}
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <FileText className="h-4 w-4" /> Max Points: {assignment.max_points}
          </div>
          <p className="text-gray-700 mt-2">{assignment.description}</p>

          {/* Attachments */}
          {files && files.length > 0 && (
            <div className="mt-4 space-y-2">
              <h3 className="font-semibold text-sm text-gray-800">
                Attachments:
              </h3>
              {files.map((file) => (
                <div
                  key={file.id}
                  className="flex justify-between items-center border p-2 rounded-lg"
                >
                  <span className="text-sm truncate">{file.file_name || "Attachment"}</span>
                  <Button
                    asChild
                    size="sm"
                    variant="outline"
                    className="flex items-center gap-1"
                  >
                    <a
                      href={file.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Download className="h-4 w-4" /> Download
                    </a>
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Submission Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Your Submission</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {submission ? (
            <>
              <div className="flex items-center justify-between">
                <Badge
                  variant={
                    submission.status === "graded"
                      ? "default"
                      : submission.status === "submitted"
                      ? "secondary"
                      : "outline"
                  }
                >
                  {submission.status}
                </Badge>
                {submission.grade && (
                  <span className="text-sm text-gray-600">
                    Grade: {submission.grade}/{assignment.max_points}
                  </span>
                )}
              </div>

              {submission.submitted_at && (
                <p className="text-sm text-gray-500">
                  Submitted on:{" "}
                  {new Date(submission.submitted_at).toLocaleDateString()}
                </p>
              )}

              {submission.feedback && (
                <div className="p-3 bg-blue-50 rounded-lg text-sm text-blue-900">
                  <strong>Teacher Feedback:</strong> {submission.feedback}
                </div>
              )}

              {submission.file_url && (
                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <a
                    href={submission.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Download className="h-4 w-4" /> Download Your Submission
                  </a>
                </Button>
              )}
            </>
          ) : (
            <div className="text-gray-500">
              You haven’t submitted this assignment yet.
              <div className="mt-4">
                <Button asChild>
                  <Link
                    href={`/dashboard/student/assignments/${assignment.id}/submit`}
                  >
                    Submit Assignment
                  </Link>
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
