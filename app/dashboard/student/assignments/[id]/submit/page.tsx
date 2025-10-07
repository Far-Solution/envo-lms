"use client"

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
import { ArrowLeft, Upload, Clock, FileText } from "lucide-react"
import Link from "next/link"

interface Assignment {
  id: string
  title: string
  description: string
  max_points: number
  due_date: string
  courses: {
    name: string
    code: string
  }
}

interface Submission {
  id: string
  file_url: string
  grade: number | null
  feedback: string | null
  submitted_at: string
}

export default function SubmitAssignmentPage() {
  const [assignment, setAssignment] = useState<Assignment | null>(null)
  const [existingSubmission, setExistingSubmission] = useState<Submission | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [feedback, setfeedback] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const params = useParams()
  const supabase = createClient()

  useEffect(() => {
    fetchAssignmentAndSubmission()
  }, [])

  const fetchAssignmentAndSubmission = async () => {
    try {
      // Fetch assignment details
      const { data: assignmentData, error: assignmentError } = await supabase
        .from("assignments")
        .select(`
          *,
          courses (
            name,
            code
          )
        `)
        .eq("id", params.id)
        .single()

      if (assignmentError) throw assignmentError
      setAssignment(assignmentData)

      // Get current user
      const { data: userRes } = await supabase.auth.getUser()
      const user = userRes?.user
      if (!user) throw new Error("User not authenticated")

      // Fetch existing submission from correct table
      const { data: submissionData } = await supabase
        .from("assignment_submissions")
        .select("*")
        .eq("assignment_id", params.id)
        .eq("student_id", user.id)
        .maybeSingle()

      if (submissionData) setExistingSubmission(submissionData)
    } catch (error: any) {
      setError(error.message)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file && !existingSubmission) {
      setError("Please select a file to submit")
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const { data: userRes } = await supabase.auth.getUser()
      const user = userRes?.user
      if (!user) throw new Error("User not authenticated")

      let fileUrl = existingSubmission?.file_url

      // Upload file if new one is selected
      if (file) {
        const fileName = `submissions/${params.id}/${user.id}/${file.name}`
        const { error: uploadError } = await supabase.storage
          .from("assignment-files")
          .upload(fileName, file, { upsert: true })

        if (uploadError) throw uploadError

        const { data: urlData } = supabase.storage.from("assignment-files").getPublicUrl(fileName)
        fileUrl = urlData.publicUrl
      }

      if (existingSubmission) {
        // Update existing record
        const { error: updateError } = await supabase
          .from("assignment_submissions")
          .update({
            file_url: fileUrl,
            feedback: feedback || null,
            submitted_at: new Date().toISOString(),
            status: "submitted"
          })
          .eq("id", existingSubmission.id)

        if (updateError) throw updateError
      } else {
        // Create new submission
        const { error: insertError } = await supabase.from("assignment_submissions").insert({
          assignment_id: params.id,
          student_id: user.id,
          file_url: fileUrl,
          feedback: feedback || null,
          status: "submitted",
          submitted_at: new Date().toISOString()
        })

        if (insertError) throw insertError
      }

      router.push("/dashboard/student/assignments")
    } catch (error: any) {
      setError(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  const isOverdue = assignment && new Date() > new Date(assignment.due_date)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" asChild>
          <Link href="/dashboard/student/assignments">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Assignments
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Submit Assignment</h1>
          <p className="text-gray-600 mt-1">{assignment?.title}</p>
        </div>
      </div>

      <div className="max-w-2xl">
        {/* Assignment Details */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>{assignment?.title}</CardTitle>
              <div className="flex items-center gap-2">
                <Badge variant={isOverdue ? "destructive" : "secondary"}>
                  {assignment?.max_points} points
                </Badge>
                {isOverdue && <Badge variant="destructive">Overdue</Badge>}
              </div>
            </div>
            <CardDescription>
              {assignment?.courses.code} - {assignment?.courses.name}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Description</h4>
                <p className="text-gray-600">{assignment?.description}</p>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Clock className="h-4 w-4" />
                Due: {assignment && new Date(assignment.due_date).toLocaleString()}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Existing Submission */}
        {existingSubmission && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg">Current Submission</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  <span className="text-sm">
                    Submitted on {new Date(existingSubmission.submitted_at).toLocaleString()}
                  </span>
                </div>
                {existingSubmission.grade !== null ? (
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="font-medium text-green-800">
                      Grade: {existingSubmission.grade}/{assignment?.max_points}
                    </div>
                    {existingSubmission.feedback && (
                      <div className="text-sm text-green-700 mt-1">
                        Feedback: {existingSubmission.feedback}
                      </div>
                    )}
                  </div>
                ) : (
                  <Badge variant="outline">Pending Review</Badge>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Upload Form */}
        <Card>
          <CardHeader>
            <CardTitle>
              {existingSubmission ? "Resubmit Assignment" : "Submit Assignment"}
            </CardTitle>
            <CardDescription>
              {existingSubmission
                ? "Upload a new file to replace your previous submission"
                : "Upload your completed assignment file"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="file">Assignment File</Label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <div className="text-sm text-gray-600 mb-2">
                    Click to upload your assignment file
                  </div>
                  <Input
                    id="file"
                    type="file"
                    onChange={handleFileChange}
                    className="hidden"
                    accept=".pdf,.doc,.docx,.txt,.zip,.rar,.xlsx,.pptx,.png,.jpg,.jpeg,.PNG"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => document.getElementById("file")?.click()}
                  >
                    Choose File
                  </Button>
                </div>
                {file && <div className="text-sm text-gray-600">Selected: {file.name}</div>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="feedback">Feedback (Optional)</Label>
                <Textarea
                  id="feedback"
                  placeholder="Any additional feedback about your submission..."
                  rows={3}
                  value={feedback}
                  onChange={(e) => setfeedback(e.target.value)}
                />
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {isOverdue && (
                <Alert variant="destructive">
                  <AlertDescription>
                    This assignment is overdue. Late submissions may receive reduced points.
                  </AlertDescription>
                </Alert>
              )}

              <div className="flex gap-4">
                <Button type="submit" disabled={isLoading || (!file && !existingSubmission)}>
                  {isLoading
                    ? "Submitting..."
                    : existingSubmission
                    ? "Resubmit"
                    : "Submit Assignment"}
                </Button>
                <Button type="button" variant="outline" asChild>
                  <Link href="/dashboard/student/assignments">Cancel</Link>
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
