"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

type Course = {
  id: string
  name: string
  code: string
}

export default function AddStudentPage() {
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [phone, setPhone] = useState("")
  const [courseId, setCourseId] = useState("")
  const [loadingCourses, setLoadingCourses] = useState(true)
  const [courses, setCourses] = useState<Course[]>([])

  const [error, setError] = useState<string | null>(null)
  const [successEmail, setSuccessEmail] = useState<string | null>(null)
  const [successPassword, setSuccessPassword] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [copied, setCopied] = useState<null | "email" | "password" | "both">(null)

  const router = useRouter()

  useEffect(() => {
    const fetchCourses = async () => {
      setLoadingCourses(true)
      try {
        const res = await fetch("/api/teacher/courses")
        const data = await res.json()
        if (res.ok) {
          setCourses(data || [])
        } else {
          setError(data.error || "Failed to fetch courses")
        }
      } catch (err: any) {
        setError("Could not load courses")
      } finally {
        setLoadingCourses(false)
      }
    }
    fetchCourses()
  }, [])

  const generateEmail = (first: string, last: string) => {
    if (!first || !last) return ""
    return `${first.toLowerCase()}.${last.toLowerCase()}@domain.envo-lms.com`
  }

  const handleCopy = async (text: string, key: "email" | "password" | "both") => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(key)
      setTimeout(() => setCopied(null), 2000)
    } catch {
      alert("Could not copy — please select and copy manually.")
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setSuccessEmail(null)
    setSuccessPassword(null)

    try {
      if (!courseId) {
        throw new Error("Please select a course to assign the student.")
      }

      const res = await fetch("/api/teacher/add-student", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ firstName, lastName, phone, courseId }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to add student")

      setSuccessEmail(data.email)
      setSuccessPassword(data.tempPassword)

      setFirstName("")
      setLastName("")
      setPhone("")
      setCourseId("")
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" asChild>
          <Link href="/dashboard/admin/students">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Students
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Add New Student</h1>
          <p className="text-gray-600 mt-1">
            Create a new student account with auto-generated email
          </p>
        </div>
      </div>

      <div className="max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Student Information</CardTitle>
            <CardDescription>
              Enter student details. Email will be auto-generated as
              firstname.lastname@domain.envo-lms.com
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loadingCourses ? (
              <Alert className="mb-4">
                <AlertDescription>Loading courses...</AlertDescription>
              </Alert>
            ) : !loadingCourses && courses.length === 0 ? (
              <Alert variant="destructive" className="mb-4">
                <AlertDescription>
                  No courses available. Please{" "}
                  <Link href="/dashboard/admin/courses" className="underline">
                    add a course
                  </Link>{" "}
                  before assigning a student.
                </AlertDescription>
              </Alert>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      type="text"
                      required
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      type="text"
                      required
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                    />
                  </div>
                </div>

                {firstName && lastName && (
                  <div className="space-y-2">
                    <Label>Generated Email</Label>
                    <div className="p-3 bg-gray-50 rounded-md text-sm text-gray-700">
                      {generateEmail(firstName, lastName)}
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number (Optional)</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="course">Assign Course</Label>
                  <select
                    id="course"
                    className="w-full border rounded-md p-2 text-sm"
                    value={courseId}
                    onChange={(e) => setCourseId(e.target.value)}
                    required
                  >
                    <option value="">-- Select a course --</option>
                    {courses.map((course) => (
                      <option key={course.id} value={course.id}>
                        {course.name} ({course.code})
                      </option>
                    ))}
                  </select>
                </div>

                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                {successEmail && successPassword && (
                  <Alert>
                    <AlertDescription className="space-y-3">
                      <p className="font-medium">
                        Student added successfully! Share these credentials securely:
                      </p>

                      <div className="flex items-center gap-2">
                        <div className="flex-1">
                          <div className="text-sm font-medium">Email</div>
                          <code className="block break-all">{successEmail}</code>
                        </div>
                        <Button size="sm" onClick={() => handleCopy(successEmail, "email")}>
                          {copied === "email" ? "Copied" : "Copy"}
                        </Button>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="flex-1">
                          <div className="text-sm font-medium">Temporary Password</div>
                          <code className="block break-all">{successPassword}</code>
                        </div>
                        <Button size="sm" onClick={() => handleCopy(successPassword, "password")}>
                          {copied === "password" ? "Copied" : "Copy"}
                        </Button>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() =>
                            handleCopy(
                              `Email: ${successEmail}\nPassword: ${successPassword}`,
                              "both"
                            )
                          }
                        >
                          {copied === "both" ? "Copied Both" : "Copy Both"}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => router.push("/dashboard/admin/students")}
                        >
                          Go to Students Page
                        </Button>
                      </div>
                    </AlertDescription>
                  </Alert>
                )}

                <div className="flex gap-4">
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? "Adding Student..." : "Add Student"}
                  </Button>
                  <Button type="button" variant="outline" asChild>
                    <Link href="/dashboard/admin/students">Cancel</Link>
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

