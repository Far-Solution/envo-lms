"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface Participant {
  id: string
  name: string
  avatar_url?: string
}

interface ParticipantsProps {
  participants: Participant[]
}

export function Participants({ participants }: ParticipantsProps) {
  if (!participants?.length) {
    return (
      <p className="text-sm text-muted-foreground">
        No participants added
      </p>
    )
  }

  return (
    <div className="flex flex-wrap gap-2">
      {participants.map((p) => (
        <div
          key={p.id}
          className="flex items-center gap-2 rounded-full border px-3 py-1 text-sm bg-muted/40"
        >
          <Avatar className="h-6 w-6">
            <AvatarImage src={p.avatar_url} alt={p.name} />
            <AvatarFallback>
              {p.name ? p.name.charAt(0).toUpperCase() : "?"}
            </AvatarFallback>
          </Avatar>
          <span className="truncate max-w-[100px]">{p.name}</span>
        </div>
      ))}
    </div>
  )
}
