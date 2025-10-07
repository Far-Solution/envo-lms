import { requireRole } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"
import AssignmentGrid from "./AssignmentGrid"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import Link from "next/link"

export default async function TeacherAssignmentsPage() {
  const profile = await requireRole(["teacher"])
  const supabase = await createClient()

  // Fetch teacher's assignments
  const { data: assignments, error } = await supabase
    .from("assignments")
    .select(
      `
      *,
      courses (
        id,
        name,
        code
      ),
      assignment_submissions (
        id,
        status,
        submitted_at,
        profiles (
          id,
          first_name,
          last_name
        )
      )
    `
    )
    .eq("teacher_id", profile.id)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching assignments:", error)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Assignments</h1>
          <p className="text-gray-600 mt-1">
            Manage assignments and track student submissions
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/teacher/assignments/create">
            <Plus className="h-4 w-4 mr-2" />
            Create Assignment
          </Link>
        </Button>
      </div>

      {/* Grid Component */}
      <AssignmentGrid assignments={assignments || []} />
    </div>
  )
}
