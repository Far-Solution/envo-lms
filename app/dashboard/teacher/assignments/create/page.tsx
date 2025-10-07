"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ArrowLeft, Upload } from "lucide-react"
import Link from "next/link"

// ✅ Utility: Sanitize file names
function sanitizeFileName(name: string) {
  return name
    .replace(/\s+/g, "_") // spaces -> underscore
    .replace(/[^a-zA-Z0-9_.-]/g, "") // only safe chars
    .toLowerCase()
}

export default function CreateAssignmentPage() {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [courseId, setCourseId] = useState("")
  const [dueDate, setDueDate] = useState("")
  const [maxPoints, setMaxPoints] = useState("")
  const [attachments, setAttachments] = useState<File[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [courses, setCourses] = useState<any[]>([]) // teacher courses
  const router = useRouter()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setAttachments(Array.from(e.target.files))
    }
  }

  // ✅ Fetch teacher courses on mount
  useEffect(() => {
    async function fetchCourses() {
      try {
        const res = await fetch("/api/teacher/courses")
        if (!res.ok) throw new Error("Failed to fetch courses")
        const data = await res.json()
        setCourses(data)
      } catch (err) {
        console.error("Error loading courses:", err)
        setError("Failed to load courses")
      }
    }
    fetchCourses()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    const supabase = createClient()
    const { data: userData } = await supabase.auth.getUser()
    if (!userData?.user) {
      throw new Error("User not authenticated")
    }
    const teacherId = userData.user.id

    try {
      // 1. Create assignment row
      const { data: assignment, error: assignmentError } = await supabase
        .from("assignments")
        .insert({
          title,
          description,
          course_id: courseId,
          due_date: dueDate,
          max_points: Number.parseInt(maxPoints) || 100,
          teacher_id: teacherId,
        })
        .select()
        .single()

      if (assignmentError) throw assignmentError

      // 2. Upload attachments (if any)
      if (attachments.length > 0) {
        for (const file of attachments) {
          const safeName = sanitizeFileName(file.name)
          const filePath = `assignments/${assignment.id}/${Date.now()}_${safeName}`

          const { error: uploadError } = await supabase.storage
            .from("assignment-files")
            .upload(filePath, file, { cacheControl: "3600", upsert: true })

          if (uploadError) throw uploadError

          // 3. Get public URL
          const { data: publicUrlData } = supabase.storage
            .from("assignment-files")
            .getPublicUrl(filePath)

          if (!publicUrlData?.publicUrl) {
            throw new Error("Failed to get public URL for uploaded file")
          }

          // 4. Save file metadata in DB
          const { error: dbError } = await supabase
            .from("file_uploads")
            .insert({
              related_type: "assignment",
              related_id: assignment.id,
              file_url: publicUrlData.publicUrl,
            })

          if (dbError) throw dbError
        }
      }

      // ✅ Redirect after success
      router.push("/dashboard/teacher/assignments")
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
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
          <h1 className="text-3xl font-bold text-gray-900">Create Assignment</h1>
          <p className="text-gray-600 mt-1">Create a new assignment for your students</p>
        </div>
      </div>

      <div className="max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Assignment Details</CardTitle>
            <CardDescription>Fill in the assignment information and requirements</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Assignment Title</Label>
                <Input
                  id="title"
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              {/* ✅ Dynamic Courses */}
              <div className="space-y-2">
                <Label htmlFor="course">Course</Label>
                <Select value={courseId} onValueChange={setCourseId} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a course" />
                  </SelectTrigger>
                  <SelectContent>
                    {courses.length > 0 ? (
                      courses.map((course) => (
                        <SelectItem key={course.id} value={course.id}>
                          {course.name} ({course.code})
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="none" disabled>
                        No courses found
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="dueDate">Due Date</Label>
                  <Input
                    id="dueDate"
                    type="datetime-local"
                    required
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxPoints">Maximum Points</Label>
                  <Input
                    id="maxPoints"
                    type="number"
                    placeholder="100"
                    min="1"
                    value={maxPoints}
                    onChange={(e) => setMaxPoints(e.target.value)}
                  />
                </div>
              </div>

              {/* Attachments */}
              <div className="space-y-2">
                <Label htmlFor="attachments">Attachments (Optional)</Label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <div className="text-sm text-gray-600 mb-2">
                    Click to upload files or drag and drop
                  </div>
                  <Input
                    id="attachments"
                    type="file"
                    multiple
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => document.getElementById("attachments")?.click()}
                  >
                    Choose Files
                  </Button>
                </div>
                {attachments.length > 0 && (
                  <div className="text-sm text-gray-600">
                    {attachments.length} file(s) selected
                  </div>
                )}
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="flex gap-4">
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? "Creating Assignment..." : "Create Assignment"}
                </Button>
                <Button type="button" variant="outline" asChild>
                  <Link href="/dashboard/teacher/assignments">Cancel</Link>
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
