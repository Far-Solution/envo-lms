"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Check, Clock, X, Calendar } from "lucide-react"
import Link from "next/link"

type AttendanceStatus = "present" | "absent" | "late"

export default function TeacherSelfAttendancePage() {
  const supabase = createClient()
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0])
  const [status, setStatus] = useState<AttendanceStatus>("present")
  const [remarks, setRemarks] = useState("")
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [alreadyMarked, setAlreadyMarked] = useState<boolean>(false)

  // ✅ Fetch existing self attendance
  useEffect(() => {
    const fetchExisting = async () => {
      setLoading(true)
      setError(null)
      setSuccess(null)
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (!user) throw new Error("User not found")

        const { data, error } = await supabase
          .from("teacher_attendance")
          .select("id, status, notes")
          .eq("teacher_id", user.id)
          .eq("date", selectedDate)
          .maybeSingle()

        if (error) throw error

        if (data) {
          setAlreadyMarked(true)
          setStatus(data.status)
          setRemarks(data.notes || "")
        } else {
          setAlreadyMarked(false)
          setStatus("present")
          setRemarks("")
        }
      } catch (err) {
        console.error(err)
        setError(err instanceof Error ? err.message : "Failed to load attendance")
      } finally {
        setLoading(false)
      }
    }

    fetchExisting()
  }, [selectedDate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) throw new Error("User not found")

      const { error: upsertError } = await supabase.from("teacher_attendance").upsert({
        teacher_id: user.id,
        date: selectedDate,
        status,
        notes: remarks,
      })

      if (upsertError) throw upsertError

      setSuccess("Attendance marked successfully ✅")
      setAlreadyMarked(true)
    } catch (err) {
      console.error(err)
      setError(err instanceof Error ? err.message : "Failed to mark attendance")
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: AttendanceStatus) => {
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
            <X className="h-4 w-4 mr-2" />
            Back
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Mark Your Attendance</h1>
          <p className="text-gray-600 mt-1">Teachers can self-mark daily attendance here.</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            <Calendar className="inline h-5 w-5 mr-2" /> Self Attendance
          </CardTitle>
          <CardDescription>Select your attendance status and add remarks if needed.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Date</Label>
                <Input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  max={new Date().toISOString().split("T")[0]}
                />
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant={status === "present" ? "default" : "outline"}
                    onClick={() => setStatus("present")}
                    className={status === "present" ? "bg-green-600 hover:bg-green-700" : ""}
                  >
                    <Check className="h-4 w-4 mr-1" /> Present
                  </Button>
                  <Button
                    type="button"
                    variant={status === "late" ? "default" : "outline"}
                    onClick={() => setStatus("late")}
                    className={status === "late" ? "bg-yellow-600 hover:bg-yellow-700" : ""}
                  >
                    <Clock className="h-4 w-4 mr-1" /> Late
                  </Button>
                  <Button
                    type="button"
                    variant={status === "absent" ? "default" : "outline"}
                    onClick={() => setStatus("absent")}
                    className={status === "absent" ? "bg-red-600 hover:bg-red-700" : ""}
                  >
                    <X className="h-4 w-4 mr-1" /> Absent
                  </Button>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Remarks</Label>
              <Textarea
                placeholder="Optional remarks (e.g., arrived late due to class duty)"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                rows={3}
              />
            </div>

            {alreadyMarked && (
              <Alert>
                <AlertDescription>
                  You already marked attendance for{" "}
                  <strong>{new Date(selectedDate).toLocaleDateString()}</strong>.
                </AlertDescription>
              </Alert>
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

            <div className="flex gap-4 items-center">
              <Button type="submit" disabled={loading}>
                {loading ? "Saving..." : alreadyMarked ? "Update Attendance" : "Mark Attendance"}
              </Button>
              <Badge className={getStatusColor(status)}>{status}</Badge>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
