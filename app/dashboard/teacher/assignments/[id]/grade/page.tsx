"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Download, FileText } from "lucide-react"
import Link from "next/link"

interface Submission {
  id: string
  student_id: string
  file_url: string
  grade: number | null
  feedback: string | null
  submitted_at: string
  profiles: {
    first_name: string
    last_name: string
    email: string
  }
}

interface Assignment {
  id: string
  title: string
  description: string
  max_points: number
  due_date: string
}

export default function GradeAssignmentPage() {
  const [assignment, setAssignment] = useState<Assignment | null>(null)
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null)
  const [grade, setGrade] = useState("")
  const [feedback, setFeedback] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const params = useParams()

  useEffect(() => {
    fetchAssignmentAndSubmissions()
  }, [])

  const fetchAssignmentAndSubmissions = async () => {
    const supabase = createClient()

    try {
      // Fetch assignment details
      const { data: assignmentData, error: assignmentError } = await supabase
        .from("assignments")
        .select("*")
        .eq("id", params.id)
        .single()

      if (assignmentError) throw assignmentError
      setAssignment(assignmentData)

      // Fetch submissions
      const { data: submissionsData, error: submissionsError } = await supabase
        .from("submissions")
        .select(`
          *,
          profiles (
            first_name,
            last_name,
            email
          )
        `)
        .eq("assignment_id", params.id)
        .order("submitted_at", { ascending: false })

      if (submissionsError) throw submissionsError
      setSubmissions(submissionsData || [])
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred")
    }
  }

  const handleGradeSubmission = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedSubmission) return

    setIsLoading(true)
    setError(null)

    const supabase = createClient()

    try {
      const { error: updateError } = await supabase
        .from("submissions")
        .update({
          grade: Number.parseInt(grade),
          feedback,
        })
        .eq("id", selectedSubmission.id)

      if (updateError) throw updateError

      // Refresh submissions
      await fetchAssignmentAndSubmissions()
      setSelectedSubmission(null)
      setGrade("")
      setFeedback("")
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  const selectSubmission = (submission: Submission) => {
    setSelectedSubmission(submission)
    setGrade(submission.grade?.toString() || "")
    setFeedback(submission.feedback || "")
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" asChild>
          <Link href="/dashboard/teacher/assignments">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Assignments
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Grade Assignment</h1>
          <p className="text-gray-600 mt-1">{assignment?.title}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Submissions List */}
        <Card>
          <CardHeader>
            <CardTitle>Student Submissions</CardTitle>
            <CardDescription>Click on a submission to grade it</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {submissions.map((submission) => (
                <div
                  key={submission.id}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    selectedSubmission?.id === submission.id
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                  onClick={() => selectSubmission(submission)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">
                        {submission.profiles.first_name} {submission.profiles.last_name}
                      </div>
                      <div className="text-sm text-gray-600">{submission.profiles.email}</div>
                      <div className="text-xs text-gray-500">
                        Submitted: {new Date(submission.submitted_at).toLocaleString()}
                      </div>
                    </div>
                    <div className="text-right">
                      {submission.grade !== null ? (
                        <Badge variant="secondary">
                          {submission.grade}/{assignment?.max_points}
                        </Badge>
                      ) : (
                        <Badge variant="outline">Not Graded</Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {submissions.length === 0 && <div className="text-center py-8 text-gray-500">No submissions yet</div>}
            </div>
          </CardContent>
        </Card>

        {/* Grading Panel */}
        <Card>
          <CardHeader>
            <CardTitle>Grade Submission</CardTitle>
            <CardDescription>
              {selectedSubmission
                ? `Grading ${selectedSubmission.profiles.first_name} ${selectedSubmission.profiles.last_name}`
                : "Select a submission to grade"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {selectedSubmission ? (
              <div className="space-y-4">
                {/* File Download */}
                {selectedSubmission.file_url && (
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <FileText className="h-4 w-4" />
                      <span className="text-sm font-medium">Submitted File</span>
                    </div>
                    <Button variant="outline" size="sm" asChild>
                      <a href={selectedSubmission.file_url} download>
                        <Download className="h-4 w-4 mr-2" />
                        Download Submission
                      </a>
                    </Button>
                  </div>
                )}

                <form onSubmit={handleGradeSubmission} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="grade">Grade (out of {assignment?.max_points})</Label>
                    <Input
                      id="grade"
                      type="number"
                      min="0"
                      max={assignment?.max_points}
                      required
                      value={grade}
                      onChange={(e) => setGrade(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="feedback">Feedback</Label>
                    <Textarea
                      id="feedback"
                      placeholder="Provide feedback to the student..."
                      rows={4}
                      value={feedback}
                      onChange={(e) => setFeedback(e.target.value)}
                    />
                  </div>

                  {error && (
                    <Alert variant="destructive">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? "Saving Grade..." : "Save Grade"}
                  </Button>
                </form>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">Select a submission from the list to start grading</div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
