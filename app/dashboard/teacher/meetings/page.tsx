"use client"

import { useEffect, useMemo, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { SessionCard } from "./components/SessionCard"
import { Button } from "@/components/ui/button"
import Link from "next/link"


export default function MeetingsPage() {
  const supabase = createClient()
  const [sessions, setSessions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchSessions = async () => {
      setLoading(true)

      const { data, error } = await supabase
        .from("lms_sessions")
        .select(`
          id,
          title,
          description,
          start_time,
          end_time,
          type,
          mode,
          meeting_url,
          status,
          session_notes ( notes ),
          session_participants (
            profiles ( id, full_name )
          )
        `)
        .order("start_time", { ascending: true })

      if (error) {
        console.error("Error fetching sessions:", error)
      } else {
        // Normalize data into same shape as mock
        const normalized = data.map((s: any) => ({
          id: s.id,
          title: s.title,
          description: s.description,
          start_time: s.start_time,
          end_time: s.end_time,
          type: s.type,
          mode: s.mode,
          meeting_url: s.meeting_url || "",
          status: s.status,
          participants: s.session_participants?.map((p: any) => ({
            id: p.profiles?.id,
            name: p.profiles?.full_name,
          })) || [],
          notes: s.session_notes?.[0]?.notes || "",
        }))
        setSessions(normalized)
      }

      setLoading(false)
    }

    fetchSessions()
  }, [supabase])

  const { upcoming, past } = useMemo(() => {
    const now = new Date().toISOString()
    return {
      upcoming: sessions.filter((s) => s.start_time > now),
      past: sessions.filter((s) => s.start_time <= now),
    }
  }, [sessions])

  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading sessions...</p>
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Sessions</h1>
        <Button asChild>
          <Link href="/dashboard/teacher/meetings/create">
            Create Session
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Upcoming Sessions</CardTitle>
        </CardHeader>
        <CardContent className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {upcoming.length > 0 ? (
            upcoming.map((s) => <SessionCard key={s.id} {...s} />)
          ) : (
            <p className="text-sm text-muted-foreground">No upcoming sessions</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Past Sessions</CardTitle>
        </CardHeader>
        <CardContent className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {past.length > 0 ? (
            past.map((s) => <SessionCard key={s.id} {...s} />)
          ) : (
            <p className="text-sm text-muted-foreground">No past sessions</p>
          )}
        </CardContent>
      </Card>
    </div>
  )

}
