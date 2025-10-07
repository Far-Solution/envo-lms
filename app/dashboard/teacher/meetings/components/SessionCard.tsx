"use client"

import Link from "next/link"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { StatusBadge } from "./StatusBadge"
import { Participants } from "./Participants"
import { useState } from "react"
import JitsiEmbed from "./JitsiEmbed"


interface SessionCardProps {
  id: string
  title: string
  type: "class" | "meeting"
  status?: "upcoming" | "live" | "completed"  // DB se aane wala (fallback)
  course?: { id: string; name: string } | null
  participants?: { id: string; name: string; avatar_url?: string }[]
  mode: "online" | "offline"
  start_time: string
  end_time: string
  link?: string
}

function computeStatus(start: string, end: string): "upcoming" | "live" | "completed" {
  const now = new Date()
  const s = new Date(start)
  const e = new Date(end)

  if (now < s) return "upcoming"
  if (now >= s && now <= e) return "live"
  return "completed"
}

export function SessionCard({
  id,
  title,
  type,
  status,
  course,
  participants = [],
  mode,
  start_time,
  end_time,
  link,

}: SessionCardProps) {
  // Compute status dynamically (fallback agar DB se nahi aaya to)
  const computedStatus = computeStatus(start_time, end_time)
  const [showEmbed, setShowEmbed] = useState(false)


  return (
    <Card className="hover:shadow-md transition justify-between">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">{title}</CardTitle>
        <StatusBadge status={computedStatus} />
      </CardHeader>

      <CardContent className="space-y-3 text-sm">
        <p>
          <span className="font-medium">Type:</span>{" "}
          {type === "class" ? "Class" : "Meeting"}
        </p>

        {type === "class" && course ? (
          <p>
            <span className="font-medium">Course:</span> {course.name}
          </p>
        ) : null}

        {type === "meeting" ? (
          <div>
            <span className="font-medium">Participants:</span>
            <Participants participants={participants} />
          </div>
        ) : null}

        <p>
          <span className="font-medium">Mode:</span>{" "}
          {mode === "online" ? "Online" : "Offline"}
        </p>

        <p>
          <span className="font-medium">Start:</span>{" "}
          {new Date(start_time).toLocaleString()}
        </p>

        <p>
          <span className="font-medium">End:</span>{" "}
          {new Date(end_time).toLocaleString()}
        </p>
      </CardContent>

      <CardFooter className="flex flex-wrap gap-2 justify-center">
        {/* View Details */}
        <Link href={`/dashboard/teacher/meetings/${id}`}>
          <Button size="sm" variant="outline">View</Button>
        </Link>

        {/* Join (sirf online aur upcoming/live) */}
        {mode === "online" && link ? (
          <div>
            {showEmbed ? (
              <JitsiEmbed sessionId={id} roomName={link || `lms-session-${id}`} />
            ) : (
              <Button onClick={() => setShowEmbed(true)}>Join</Button>
            )}
          </div>
        ) : null}


        {/* Notes (sirf completed sessions pe) */}
        {computedStatus === "completed" && (
          <Link href={`/dashboard/teacher/meetings/${id}/notes`}>
            <Button size="sm" variant="secondary">Notes</Button>
          </Link>
        )}

        {/* Edit */}
        <Link href={`/dashboard/teacher/meetings/${id}/edit`}>
          <Button size="sm" variant="outline">Edit</Button>
        </Link>

        {/* Delete */}
        <Button
          size="sm"
          variant="destructive"
          onClick={() => console.log("delete session", id)} // yahan API hook karna
        >
          Delete
        </Button>
      </CardFooter>
    </Card>
  )
}
