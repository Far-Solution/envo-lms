"use client"

import { Badge } from "@/components/ui/badge"

interface StatusBadgeProps {
  status: "upcoming" | "live" | "completed"
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const getVariant = () => {
    switch (status) {
      case "live":
        return "destructive" // red
      case "completed":
        return "secondary" // gray
      default:
        return "default" // blue (upcoming)
    }
  }

  const getLabel = () => {
    switch (status) {
      case "live":
        return "Live Now"
      case "completed":
        return "Completed"
      default:
        return "Upcoming"
    }
  }

  return (
    <Badge variant={getVariant()} className="capitalize">
      {getLabel()}
    </Badge>
  )
}
