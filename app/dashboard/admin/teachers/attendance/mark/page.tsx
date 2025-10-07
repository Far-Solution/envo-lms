"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ArrowLeft, Check, X, Clock } from "lucide-react"
import Link from "next/link"

interface Teacher {
  id: string
  first_name: string
  last_name: string
  email: string
  profile_picture_url?: string
}

interface AttendanceRecord {
  teacher_id: string
  status: "present" | "absent" | "late"
  notes?: string
  check_in_time?: string
  check_out_time?: string
}

export default function MarkTeacherAttendancePage() {
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0])
  const [attendance, setAttendance] = useState<Record<string, AttendanceRecord>>({})
  const [adminProfile, setAdminProfile] = useState<{ institute_id: string } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    fetchTeachers()
  }, [])

  useEffect(() => {
    if (teachers.length > 0) {
      fetchExistingAttendance()
    }
  }, [selectedDate, teachers])

  const fetchTeachers = async () => {
    const supabase = createClient()

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) throw new Error("Not logged in")

      const { data: profile, error: adminError } = await supabase
        .from("profiles")
        .select("institute_id")
        .eq("id", user.id)
        .single()

      if (adminError) throw adminError
      setAdminProfile(profile)

      const { data: teachers, error: teachersError } = await supabase
        .from("profiles")
        .select("id, first_name, last_name, email, profile_picture_url")
        .eq("role", "teacher")
        .eq("institute_id", profile.institute_id)
        .order("first_name")

      if (teachersError) throw teachersError

      console.log("Fetched teachers:", teachers)
      setTeachers(teachers || [])
    } catch (err: unknown) {
      console.error("Error fetching teachers:", err)
      setError(err instanceof Error ? err.message : "Failed to fetch teachers")
    }
  }

  const fetchExistingAttendance = async () => {
    const supabase = createClient()

    try {
      if (!adminProfile) return

      const { data: attendanceRows, error: attendanceError } = await supabase
        .from("teacher_attendance")
        .select("teacher_id, status, notes, check_in_time, check_out_time")
        .eq("date", selectedDate)
        .eq("institute_id", adminProfile.institute_id)

      if (attendanceError) throw attendanceError

      const existingAttendance: Record<string, AttendanceRecord> = {}
      teachers.forEach((t) => {
        const found = attendanceRows?.find((a) => a.teacher_id === t.id)
        existingAttendance[t.id] = {
          teacher_id: t.id,
          status: found?.status || "absent",
          notes: found?.notes || "",
          check_in_time: found?.check_in_time || undefined,
          check_out_time: found?.check_out_time || undefined,
        }
      })

      console.log("Attendance fetched:", existingAttendance)
      setAttendance(existingAttendance)
    } catch (err) {
      console.error("Error fetching teacher attendance:", err)
    }
  }

  const updateAttendance = (teacherId: string, status: "present" | "absent" | "late", notes?: string) => {
    setAttendance((prev) => ({
      ...prev,
      [teacherId]: {
        ...prev[teacherId],
        teacher_id: teacherId,
        status,
        notes: notes || prev[teacherId]?.notes || "",
      },
    }))
  }

  const updatenotes = (teacherId: string, notes: string) => {
    setAttendance((prev) => ({
      ...prev,
      [teacherId]: {
        ...prev[teacherId],
        notes,
      },
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setSuccess(null)

    if (!adminProfile) {
      setError("Admin profile not loaded")
      setIsLoading(false)
      return
    }

    const supabase = createClient()

    try {
      const { error: upsertError } = await supabase.from("teacher_attendance").upsert(
        Object.values(attendance).map((record) => ({
          teacher_id: record.teacher_id,
          date: selectedDate,
          status: record.status,
          notes: record.notes || null,
          institute_id: adminProfile.institute_id,
          check_in_time: record.check_in_time || new Date().toISOString(),
        })),
        { onConflict: "teacher_id,date,institute_id" }
      )

      if (upsertError) throw upsertError

      setSuccess("Teacher attendance saved successfully!")
    } catch (err: unknown) {
      console.error("Error saving teacher attendance:", err)
      setError(err instanceof Error ? err.message : "Failed to save attendance")
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
          <Link href="/dashboard/admin/teachers/attendance">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Attendance
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Mark Teacher Attendance</h1>
          <p className="text-gray-600 mt-1">Record daily attendance for all teachers</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Attendance for {new Date(selectedDate).toLocaleDateString()}</CardTitle>
          <CardDescription>Mark attendance status for each teacher</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
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

            <div className="space-y-4">
              <h3 className="text-lg font-medium">Teachers</h3>
              <div className="space-y-4">
                {teachers.map((teacher) => {
                  const teacherAttendance = attendance[teacher.id]
                  return (
                    <Card key={teacher.id} className="p-4">
                      <div className="flex items-center gap-4">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={teacher.profile_picture_url || "/placeholder.svg"} />
                          <AvatarFallback>
                            {teacher.first_name[0]}
                            {teacher.last_name[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="font-medium">
                            {teacher.first_name} {teacher.last_name}
                          </div>
                          <div className="text-sm text-gray-600">{teacher.email}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            type="button"
                            variant={teacherAttendance?.status === "present" ? "default" : "outline"}
                            size="sm"
                            onClick={() => updateAttendance(teacher.id, "present")}
                            className={teacherAttendance?.status === "present" ? "bg-green-600 hover:bg-green-700" : ""}
                          >
                            <Check className="h-4 w-4 mr-1" />
                            Present
                          </Button>
                          <Button
                            type="button"
                            variant={teacherAttendance?.status === "late" ? "default" : "outline"}
                            size="sm"
                            onClick={() => updateAttendance(teacher.id, "late")}
                            className={teacherAttendance?.status === "late" ? "bg-yellow-600 hover:bg-yellow-700" : ""}
                          >
                            <Clock className="h-4 w-4 mr-1" />
                            Late
                          </Button>
                          <Button
                            type="button"
                            variant={teacherAttendance?.status === "absent" ? "default" : "outline"}
                            size="sm"
                            onClick={() => updateAttendance(teacher.id, "absent")}
                            className={teacherAttendance?.status === "absent" ? "bg-red-600 hover:bg-red-700" : ""}
                          >
                            <X className="h-4 w-4 mr-1" />
                            Absent
                          </Button>
                        </div>
                      </div>
                      {teacherAttendance && (
                        <div className="mt-3 space-y-2">
                          <Badge className={getStatusColor(teacherAttendance.status)}>
                            {teacherAttendance.status}
                          </Badge>
                          <Textarea
                            placeholder="Add notes (optional)"
                            value={teacherAttendance.notes || ""}
                            onChange={(e) => updatenotes(teacher.id, e.target.value)}
                            rows={2}
                          />
                        </div>
                      )}
                    </Card>
                  )
                })}
              </div>
            </div>

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
              <Button type="submit" disabled={isLoading || Object.keys(attendance).length === 0}>
                {isLoading ? "Saving..." : "Save Attendance"}
              </Button>
              <Button type="button" variant="outline" asChild>
                <Link href="/dashboard/admin/teachers/attendance">Cancel</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
