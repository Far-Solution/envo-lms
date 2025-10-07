"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface NotesBlockProps {
  notes?: string
}

export function NotesBlock({ notes }: NotesBlockProps) {
  if (!notes?.trim()) {
    return (
      <p className="text-sm text-muted-foreground">
        No notes available for this session.
      </p>
    )
  }

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle>Session Notes</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="prose prose-sm max-w-none dark:prose-invert">
          {notes.split("\n").map((line, i) => (
            <p key={i}>{line}</p>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
