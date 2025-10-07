"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { SessionForm } from "../components/SessionForm"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"

export default function CreateSessionPage() {
  const supabase = createClient()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [teacher, setTeacher] = useState<any>(null)

  // Fetch logged-in teacher’s profile
  useEffect(() => {
    const fetchTeacher = async () => {
      const { data: { user }, error: userError } = await supabase.auth.getUser()

      if (userError || !user) {
        toast.error("Not logged in")
        router.push("/login")
        return
      }

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("id, first_name, last_name, role")
        .eq("id", user.id)
        .single()

      if (profileError || !profile) {
        toast.error("Failed to load profile")
        return
      }

      if (profile.role !== "teacher") {
        toast.error("Access denied")
        router.push("/dashboard")
        return
      }

      setTeacher(profile)
    }

    fetchTeacher()
  }, [router, supabase])

  const handleSubmit = async (formData: any) => {
    try {
      if (!teacher) return
      setLoading(true)

      const { data, error } = await supabase
        .from("lms_sessions")
        .insert([
          {
            title: formData.title,
            description: formData.description,
            start_time: formData.start_time,
            end_time: formData.end_time,
            type: formData.type,           // class | meeting
            mode: formData.mode,           // <-- FIX: save mode
            status: "upcoming",
            created_by: teacher.id,
            meeting_url: formData.meeting_url || null,
            location: formData.location || null,
            course_id: formData.course_id
          },
        ])
        .select()
        .single()

      if (error) {
        console.error("Error creating session:", error)
        toast.error("Failed to create session")
        return
      }

      toast.success("Session created successfully ✅")
      router.push("/dashboard/teacher/meetings")
    } catch (err) {
      console.error(err)
      toast.error("Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create New Session</CardTitle>
      </CardHeader>
      <CardContent>
        <SessionForm onSubmit={handleSubmit} disabled={loading} />
      </CardContent>
    </Card>
  )
}
