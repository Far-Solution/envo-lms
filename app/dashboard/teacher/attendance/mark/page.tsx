"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ArrowLeft, Check, X, Clock } from "lucide-react"
import Link from "next/link"

interface Student {
  id: string
  first_name: string
  last_name: string
  email: string
  profile_picture_url?: string
}

interface Course {
  id: string
  name: string
  code: string
}

interface AttendanceRecord {
  student_id: string
  course_id: string
  status: "present" | "absent" | "late"
  remarks?: string
}

export default function MarkStudentAttendancePage() {
  const [courses, setCourses] = useState<Course[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [selectedCourse, setSelectedCourse] = useState("")
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0])
  const [attendance, setAttendance] = useState<Record<string, AttendanceRecord>>({})
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    fetchCourses()
  }, [])

  useEffect(() => {
    if (selectedCourse) {
      fetchStudents()
      fetchExistingAttendance()
    }
  }, [selectedCourse, selectedDate])

  const fetchCourses = async () => {
    const supabase = createClient()

    try {
      const { data, error } = await supabase
        .from("teacher_courses")
        .select(`
          courses (
            id,
            name,
            code
          )
        `)
        .order("courses(name)")

      if (error) throw error
      const mappedCourses = data?.map((tc: any) => tc.courses) || []
      const uniqueCourses = Array.from(new Map(mappedCourses.map(c => [c.id, c])).values())

      setCourses(uniqueCourses)
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "Failed to fetch courses")
    }
  }

  const fetchStudents = async () => {
    const supabase = createClient()

    try {
      const { data, error } = await supabase
        .from("student_courses")
        .select(`
          profiles (
            id,
            first_name,
            last_name,
            email,
            profile_picture_url
          )
        `)
        .eq("course_id", selectedCourse)
        .order("profiles(first_name)")

      if (error) throw error
      setStudents(data?.map((enrollment: any) => enrollment.profiles) || [])
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "Failed to fetch students")
    }
  }

  const fetchExistingAttendance = async () => {
    const supabase = createClient()

    try {
      const { data, error } = await supabase
        .from("student_attendance")
        .select("student_id, status, remarks")
        .eq("course_id", selectedCourse)
        .eq("marked_date", selectedDate)

      if (error) throw error

      const existingAttendance: Record<string, AttendanceRecord> = {}
      data?.forEach((record) => {
        existingAttendance[record.student_id] = {
          student_id: record.student_id,
          course_id: selectedCourse,
          status: record.status,
          remarks: record.remarks || "",
        }
      })

      setAttendance(existingAttendance)
    } catch (error: unknown) {
      console.error("Error fetching existing attendance:", error)
    }
  }

  const updateAttendance = (studentId: string, status: "present" | "absent" | "late", notes?: string) => {
    setAttendance((prev) => ({
      ...prev,
      [studentId]: {
        student_id: studentId,
        course_id: selectedCourse,
        status,
        remarks: notes || prev[studentId]?.remarks || "",
      },
    }))
  }

  const updateRemarks = (studentId: string, remarks: string) => {
    setAttendance((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        student_id: studentId,
        course_id: selectedCourse,
        status: prev[studentId]?.status || "present",
        remarks,
      },
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault()
  setIsLoading(true)
  setError(null)
  setSuccess(null)

  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    setError("User not authenticated")
    setIsLoading(false)
    return
  }

  try {
    // ✅ Check if attendance already marked for this course/date
    const { data: existing, error: existingError } = await supabase
      .from("student_attendance")
      .select("id")
      .eq("course_id", selectedCourse)
      .eq("marked_date", selectedDate)
      .eq("marked_by", user.id) // same teacher
      .limit(1)

    if (existingError) throw existingError

    if (existing && existing.length > 0) {
      setError("Attendance for this course has already been marked today.")
      setIsLoading(false)
      return
    }

    // ✅ If not already marked, proceed to insert
    const attendanceRecords = Object.values(attendance).map((record) => ({
      student_id: record.student_id,
      course_id: record.course_id,
      marked_date: selectedDate,
      marked_at: new Date().toISOString(),
      marked_by: user.id,
      is_self_marked: false,
      session_id: null,
      status: record.status,
      remarks: record.remarks || null,
    }))

    const { error: insertError } = await supabase.from("student_attendance").insert(attendanceRecords)
    if (insertError) throw insertError

    setSuccess("Student attendance saved successfully!")
  } catch (error: unknown) {
    console.error(error)
    setError(error instanceof Error ? error.message : "Failed to save attendance")
  } finally {
    setIsLoading(false)
  }
}


  const getStatusColor = (status: string) => {
    switch (status) {
      case "present":
        return "bg-green-100 text-green-800 border-green-200"
      case "absent":
        return "bg-red-100 text-red-800 border-red-200"
      case "late":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" asChild>
          <Link href="/dashboard/teacher/attendance">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Attendance
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Mark Student Attendance</h1>
          <p className="text-gray-600 mt-1">Record daily attendance for your students</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Student Attendance</CardTitle>
          <CardDescription>Select a course and date to mark attendance</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="course">Course</Label>
                <Select value={selectedCourse} onValueChange={setSelectedCourse} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a course" />
                  </SelectTrigger>
                  <SelectContent>
                    {courses.map((course) => (
                      <SelectItem key={course.id} value={course.id}>
                        {course.code} - {course.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  max={new Date().toISOString().split("T")[0]}
                />
              </div>
            </div>

            {selectedCourse && students.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium">
                  Students ({students.length}) - {new Date(selectedDate).toLocaleDateString()}
                </h3>
                <div className="space-y-4">
                  {students.map((student) => {
                    const studentAttendance = attendance[student.id]
                    return (
                      <Card key={student.id} className="p-4">
                        <div className="flex items-center gap-4">
                          <Avatar className="h-12 w-12">
                            <AvatarImage src={student.profile_picture_url || "/placeholder.svg"} />
                            <AvatarFallback>
                              {student.first_name[0]}
                              {student.last_name[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="font-medium">
                              {student.first_name} {student.last_name}
                            </div>
                            <div className="text-sm text-gray-600">{student.email}</div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              type="button"
                              variant={studentAttendance?.status === "present" ? "default" : "outline"}
                              size="sm"
                              onClick={() => updateAttendance(student.id, "present")}
                              className={
                                studentAttendance?.status === "present" ? "bg-green-600 hover:bg-green-700" : ""
                              }
                            >
                              <Check className="h-4 w-4 mr-1" />
                              Present
                            </Button>
                            <Button
                              type="button"
                              variant={studentAttendance?.status === "late" ? "default" : "outline"}
                              size="sm"
                              onClick={() => updateAttendance(student.id, "late")}
                              className={
                                studentAttendance?.status === "late" ? "bg-yellow-600 hover:bg-yellow-700" : ""
                              }
                            >
                              <Clock className="h-4 w-4 mr-1" />
                              Late
                            </Button>
                            <Button
                              type="button"
                              variant={studentAttendance?.status === "absent" ? "default" : "outline"}
                              size="sm"
                              onClick={() => updateAttendance(student.id, "absent")}
                              className={studentAttendance?.status === "absent" ? "bg-red-600 hover:bg-red-700" : ""}
                            >
                              <X className="h-4 w-4 mr-1" />
                              Absent
                            </Button>
                          </div>
                        </div>
                        {studentAttendance && (
                          <div className="mt-3 space-y-2">
                            <Badge className={getStatusColor(studentAttendance.status)}>
                              {studentAttendance.status}
                            </Badge>
                            <Textarea
                              placeholder="Add remarks (optional)"
                              value={studentAttendance.remarks || ""}
                              onChange={(e) => updateRemarks(student.id, e.target.value)}
                              rows={2}
                            />
                          </div>
                        )}
                      </Card>
                    )
                  })}
                </div>
              </div>
            )}

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert>
                <AlertDescription>{success}</AlertDescription>
              </Alert>
            )}

            <div className="flex gap-4">
              <Button type="submit" disabled={isLoading || !selectedCourse || Object.keys(attendance).length === 0}>
                {isLoading ? "Saving..." : "Save Attendance"}
              </Button>
              <Button type="button" variant="outline" asChild>
                <Link href="/dashboard/teacher/attendance">Cancel</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

    </div>
  )
}
