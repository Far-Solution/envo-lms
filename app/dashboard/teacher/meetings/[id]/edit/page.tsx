"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { SessionForm } from "../../components/SessionForm"
import { createClient } from "@/lib/supabase/client"

interface Session {
  id: string
  title: string
  description?: string
  type: "class" | "meeting"
  status: "upcoming" | "live" | "completed"
  course_id?: string | null
  participants?: { id: string; name: string }[]
  mode: "online" | "offline"
  start_time: string
  end_time: string
  notes?: string
  meeting_url?: string | null
  location?: string | null
}

export default function EditSessionPage() {
  const { id } = useParams()
  const router = useRouter()
  const supabase = createClient()
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  // 🔹 Fetch session data
  useEffect(() => {
    async function fetchSession() {
      try {
        const { data, error } = await supabase
          .from("sessions")
          .select(
            `
            id,
            title,
            description,
            type,
            status,
            course_id,
            mode,
            scheduled_start,
            scheduled_end,
            meeting_url,
            location,
            session_notes ( notes ),
            session_participants (
              profiles ( id, full_name )
            )
          `
          )
          .eq("id", id)
          .single()

        if (error) {
          console.error("Error fetching session:", error.message)
          setSession(null)
        } else {
          setSession({
            id: data.id,
            title: data.title,
            description: data.description,
            type: data.type,
            status: data.status,
            course_id: data.course_id,
            mode: data.mode,
            start_time: data.scheduled_start,
            end_time: data.scheduled_end,
            notes: data.session_notes?.[0]?.notes || "",
            meeting_url: data.meeting_url,
            location: data.location,
            participants:
              data.session_participants?.map((p: any) => ({
                id: p.profiles?.id,
                name: p.profiles?.full_name,
              })) || [],
          })
        }
      } catch (err) {
        console.error("Error fetching session:", err)
      } finally {
        setLoading(false)
      }
    }
    fetchSession()
  }, [id, supabase])

  if (loading) return <p>Loading...</p>
  if (!session) return <p>Session not found</p>

  // 🔹 Handle update
  async function handleSubmit(updatedData: any) {
    try {
      const { error } = await supabase
        .from("sessions")
        .update({
          title: updatedData.title,
          description: updatedData.description,
          type: updatedData.type,
          course_id: updatedData.course_id,
          mode: updatedData.mode,
          meeting_url: updatedData.meeting_url,
          location: updatedData.location,
          scheduled_start: updatedData.scheduled_start,
          scheduled_end: updatedData.scheduled_end,
        })
        .eq("id", id)

      if (error) throw error

      // TODO: update session_participants + session_notes if needed

      // Redirect after success
      router.push(`/dashboard/teacher/meetings/${id}`)
    } catch (err) {
      console.error("Error updating session:", err)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-semibold mb-4">Edit Session</h1>
      <SessionForm initialData={session} onSubmit={handleSubmit} />
    </div>
  )
}
