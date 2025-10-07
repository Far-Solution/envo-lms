"use client"

import React, { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"

type SessionType = "class" | "meeting"
type ModeType = "online" | "offline"

export function SessionForm({
  onSubmit,
  disabled,
  onSuccess,
}: {
  onSubmit?: (formData: any) => Promise<void>
  disabled?: boolean
  onSuccess?: () => void
}) {
  const router = useRouter()
  const supabase = createClient()

  const [type, setType] = useState<SessionType>("class")
  const [mode, setMode] = useState<ModeType | null>("online")
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [courseId, setCourseId] = useState<string | null>(null)
  const [selectedStudents, setSelectedStudents] = useState<string[]>([])
  const [startDate, setStartDate] = useState<string>(new Date().toISOString().slice(0, 16))
  const [durationMinutes, setDurationMinutes] = useState<number>(45)
  const [location, setLocation] = useState("")
  const [jitsiRoom, setJitsiRoom] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [courses, setCourses] = useState<any[]>([])
  const [students, setStudents] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)

  // fetch teacher’s courses + all students
  useEffect(() => {
    async function load() {
      const { data: auth } = await supabase.auth.getUser()
      const teacherId = auth.user?.id
      if (!teacherId) return

      // teacher-assigned courses
      const { data: coursesData } = await supabase
        .from("teacher_courses")
        .select("courses(id, name, code)")
        .eq("profile_id", teacherId)

      if (coursesData) setCourses(coursesData.map((c) => c.courses))

      // students fetch (all institute students)
      const { data: studentsData } = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .eq("role", "student")

      if (studentsData) setStudents(studentsData)
    }
    load()
  }, [supabase])

  // auto-generate Jitsi room if mode online
  useEffect(() => {
    if (mode === "online" && !jitsiRoom) setJitsiRoom(makeRandomRoom())
    if (mode === "offline") setJitsiRoom(null)
  }, [mode])

  function makeRandomRoom() {
    return `envo-session-${Math.random().toString(36).slice(2, 9)}`
  }

  function computeEnd(startIso: string, minutes: number) {
    const s = new Date(startIso)
    const end = new Date(s.getTime() + minutes * 60000)
    return end.toISOString()
  }

  async function handleSubmit(e?: React.FormEvent) {
    e?.preventDefault()
    setError(null)

    if (!title.trim()) return setError("Please provide a title")
    if (type === "class" && !courseId) return setError("Please select a course")
    if (!mode) return setError("Please select a mode")

    try {
      setLoading(true)

      const { data: auth } = await supabase.auth.getUser()
      const teacherId = auth.user?.id
      if (!teacherId) {
        setError("Not authenticated")
        setLoading(false)
        return
      }

      const formData = {
        type,
        title,
        description,
        course_id: type === "class" ? courseId : null,
        mode, // ✅ fixed
        meeting_url: mode === "online" && jitsiRoom ? jitsiRoom : null,
        location: mode === "offline" ? location : null,
        start_time: new Date(startDate).toISOString(),
        end_time: computeEnd(startDate, durationMinutes),
        status: "upcoming",
        selectedStudents,
        created_by: teacherId,
      }

      if (onSubmit) {
        await onSubmit(formData)
        if (onSuccess) onSuccess()
        return
      }

      const { data: session, error: sessionError } = await supabase
        .from("lms_sessions")
        .insert([formData])
        .select()
        .single()

      if (sessionError) {
        console.error(sessionError)
        setError("Failed to create session")
        return
      }

      if (type === "meeting" && selectedStudents.length > 0) {
        const participants = selectedStudents.map((sid) => ({
          session_id: session.id,
          profile_id: sid,
          role: "participant",
        }))
        await supabase.from("session_participants").insert(participants)
      }

      toast.success("Session created successfully ✅")
      if (onSuccess) onSuccess()
      else router.push("")
    } catch (err: any) {
      console.error(err)
      setError(err?.message || "Failed to create session")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Type + Mode */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Type</Label>
          <Select value={type} onValueChange={(v) => setType(v as SessionType)}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="class">Class</SelectItem>
              <SelectItem value="meeting">Meeting</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Mode</Label>
          <Select value={mode ?? ""} onValueChange={(v) => setMode(v as ModeType)}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select mode" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="online">Online</SelectItem>
              <SelectItem value="offline">Offline</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Title + Description */}
      <div>
        <Label>Title</Label>
        <Input value={title} onChange={(e) => setTitle(e.target.value)} />
      </div>
      <div>
        <Label>Description</Label>
        <Textarea value={description} onChange={(e) => setDescription(e.target.value)} />
      </div>

      {/* Course OR Participants */}
      {type === "class" ? (
        <div>
          <Label>Course</Label>
          <Select value={courseId ?? ""} onValueChange={(v) => setCourseId(v || null)}>
            <SelectTrigger><SelectValue placeholder="Select course" /></SelectTrigger>
            <SelectContent>
              {courses.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.code} — {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ) : (
        <div>
          <Label>Participants</Label>
          <StudentMultiSelect
            students={students}
            value={selectedStudents}
            onChange={(ids) => setSelectedStudents(ids)}
          />
        </div>
      )}

      {/* Date + Duration */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Start</Label>
          <Input type="datetime-local" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        </div>
        <div>
          <Label>Duration (minutes)</Label>
          <Input type="number" value={durationMinutes} onChange={(e) => setDurationMinutes(Number(e.target.value))} />
        </div>
      </div>

      {/* Online / Offline fields */}
      {mode === "online" && (
        <div>
          <Label>Meeting Link</Label>
          <div className="flex gap-2">
            <Input readOnly value={jitsiRoom ? `${process.env.NEXT_PUBLIC_JITSI_BASE_URL}/${jitsiRoom}` : ""} />
            <Button type="button" onClick={() => setJitsiRoom(makeRandomRoom())}>Regenerate</Button>
          </div>
        </div>
      )}
      {mode === "offline" && (
        <div>
          <Label>Location</Label>
          <Input value={location} onChange={(e) => setLocation(e.target.value)} />
        </div>
      )}

      <div className="flex gap-3">
        <Button type="submit" disabled={loading || disabled}>
          {loading ? "Creating..." : "Create Session"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.refresh()}>Reset</Button>
      </div>

      {error && <p className="text-red-500">{error}</p>}
    </form>
  )
}

// ---------------- Student MultiSelect ----------------
function StudentMultiSelect({ students, value, onChange }: { students: any[]; value: string[]; onChange: (ids: string[]) => void }) {
  const [query, setQuery] = useState("")
  const filtered = query.trim()
    ? students.filter(s => s.full_name.toLowerCase().includes(query.toLowerCase()) || s.email.toLowerCase().includes(query.toLowerCase()))
    : []

  function toggle(id: string) {
    if (value.includes(id)) onChange(value.filter(v => v !== id))
    else onChange([...value, id])
  }

  return (
    <div className="border rounded p-2">
      <Input placeholder="Search students..." value={query} onChange={(e) => setQuery(e.target.value)} />
      {query.trim() && (
        <div className="max-h-40 overflow-auto mt-2 space-y-2">
          {filtered.length === 0 && <p className="text-sm text-muted-foreground">No results</p>}
          {filtered.map(s => (
            <div key={s.id} className="flex items-center justify-between">
              <div>
                <div className="font-medium">{s.full_name}</div>
                <div className="text-xs text-gray-500">{s.email}</div>
              </div>
              <Button type="button" size="sm" variant={value.includes(s.id) ? undefined : "outline"} onClick={() => toggle(s.id)}>
                {value.includes(s.id) ? "Selected" : "Select"}
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
