"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { Clock } from "lucide-react"

interface AttendanceMarkingFormProps {
  teacherId: string
  currentStatus: string
  currentAttendance?: any
}

export function AttendanceMarkingForm({
  teacherId,
  currentStatus,
  currentAttendance,
}: AttendanceMarkingFormProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [status, setStatus] = useState(currentStatus === "not_marked" ? "present" : currentStatus)
  const [checkInTime, setCheckInTime] = useState(currentAttendance?.check_in_time || "")
  const [checkOutTime, setCheckOutTime] = useState(currentAttendance?.check_out_time || "")
  const [notes, setNotes] = useState(currentAttendance?.notes || "")
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    const supabase = createClient()
    const today = new Date().toISOString().split("T")[0]

    // convert time string -> full timestamp
    const toTime = (time: string | null) => {
      if (!time) return null
      return `${time}:00` // "13:52" -> "13:52:00"
    }


    try {
      const attendanceData = {
        teacher_id: teacherId,
        date: today,
        status,
        check_in_time: toTime(checkInTime),
        check_out_time: toTime(checkOutTime),
        notes: notes || null,
      }


      if (currentAttendance) {
        const { error } = await supabase
          .from("teacher_attendance")
          .update(attendanceData)
          .eq("id", currentAttendance.id)

        if (error) throw error
      } else {
        const { error } = await supabase.from("teacher_attendance").insert(attendanceData)
        if (error) throw error
      }

      setIsOpen(false)
      router.refresh()
    } catch (error) {
      console.error("Error marking attendance:", error)
    } finally {
      setIsLoading(false)
    }
  }


  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Clock className="h-4 w-4 mr-2" />
          {currentStatus === "not_marked" ? "Mark" : "Edit"}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Mark Teacher Attendance</DialogTitle>
          <DialogDescription>Update attendance status and timing information</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="status">Attendance Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="present">Present</SelectItem>
                <SelectItem value="absent">Absent</SelectItem>
                <SelectItem value="late">Late</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {status !== "absent" && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="checkInTime">Check In Time</Label>
                <Input
                  id="checkInTime"
                  type="time"
                  value={checkInTime}
                  onChange={(e) => setCheckInTime(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="checkOutTime">Check Out Time</Label>
                <Input
                  id="checkOutTime"
                  type="time"
                  value={checkOutTime}
                  onChange={(e) => setCheckOutTime(e.target.value)}
                />
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              placeholder="Add any additional notes..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Saving..." : "Save Attendance"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
