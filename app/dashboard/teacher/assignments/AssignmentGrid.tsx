"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Plus, FileText, Calendar, Users, Clock, Edit, Trash } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import Link from "next/link"

// ================= MAIN COMPONENT =================
export default function AssignmentGrid({ assignments }: { assignments: any[] }) {
  const [items, setItems] = useState(assignments)

  // ---------- HANDLE DELETE ----------
  function handleDelete(id: string) {
    setItems((prev) => prev.filter((a) => a.id !== id))
  }

  // ---------- HANDLE UPDATE ----------
  function handleUpdate(updated: any) {
    setItems((prev) =>
      prev.map((a) => (a.id === updated.id ? { ...a, ...updated } : a))
    )
  }


  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {items.map((assignment) => {
        const submissionCount = assignment.assignment_submissions?.length || 0
        const gradedCount =
          assignment.assignment_submissions?.filter((sub: any) => sub.status === "graded").length || 0

        return (
          <Card key={assignment.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg">{assignment.title}</CardTitle>
                  <CardDescription className="mt-2">
                    <Badge variant="outline" className="text-xs mr-2">
                      {assignment.courses.code}
                    </Badge>
                    {getStatusBadge(assignment)}
                  </CardDescription>
                </div>
              </div>
              {assignment.description && (
                <p className="text-sm text-gray-600 mt-3 line-clamp-2">{assignment.description}</p>
              )}
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Assignment Details */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar className="h-4 w-4" />
                    Due: {new Date(assignment.due_date).toLocaleDateString()}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <FileText className="h-4 w-4" />
                    {assignment.max_points} points
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Users className="h-4 w-4" />
                    {submissionCount} submissions
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Clock className="h-4 w-4" />
                    {gradedCount} graded
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              <div>
                <div className="flex justify-between text-sm text-gray-600 mb-1">
                  <span>Grading Progress</span>
                  <span>
                    {gradedCount}/{submissionCount}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full"
                    style={{
                      width: submissionCount > 0 ? `${(gradedCount / submissionCount) * 100}%` : "0%",
                    }}
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-2 flex-wrap">
                <ViewDetailsBlock assignment={assignment} />
                <SubmissionsBlock assignment={assignment} />
                <PublishBlock assignment={assignment} onUpdate={handleUpdate} />
                <EditBlock assignment={assignment} onUpdate={handleUpdate} />
                <DeleteBlock assignment={assignment} onDelete={handleDelete} />
              </div>
            </CardContent>
          </Card>
        )
      })}

      {/* Empty State */}
      {items.length === 0 && (
        <div className="col-span-full">
          <Card className="text-center py-12">
            <CardContent>
              <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <div className="text-gray-500 mb-4">No assignments created yet</div>
              <Button asChild>
                <Link href="/dashboard/teacher/assignments/create">
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Assignment
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

// ================== HELPERS & BLOCKS ==================

// ---------- STATUS BADGE ----------
function getStatusBadge(assignment: any) {
  const now = new Date()
  const dueDate = new Date(assignment.due_date)
  const isOverdue = dueDate < now

  if (!assignment.is_published) {
    return <Badge variant="outline" className="text-xs">Draft</Badge>
  }
  if (isOverdue) {
    return <Badge variant="destructive" className="text-xs">Overdue</Badge>
  }
  return <Badge variant="default" className="text-xs">Active</Badge>
}

// ---------- VIEW DETAILS BLOCK ----------
function ViewDetailsBlock({ assignment }: { assignment: any }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="flex-1 bg-transparent">
          View Details
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{assignment.title}</DialogTitle>
          <DialogDescription>{assignment.description || "No description provided"}</DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <p><b>Due:</b> {new Date(assignment.due_date).toLocaleDateString()}</p>
          <p><b>Points:</b> {assignment.max_points}</p>
          <p><b>Status:</b> {assignment.is_published ? "Published" : "Draft"}</p>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ---------- SUBMISSIONS BLOCK ----------
function SubmissionsBlock({ assignment }: { assignment: any }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="flex-1 bg-transparent">
          Submissions
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Submissions</DialogTitle>
          <DialogDescription>Student submissions for this assignment</DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          {assignment.assignment_submissions?.length > 0 ? (
            assignment.assignment_submissions.map((sub: any) => (
              <div key={sub.id} className="border rounded p-2 text-sm">
                {sub.profiles.first_name} {sub.profiles.last_name} -{" "}
                <b>{sub.status}</b> ({new Date(sub.submitted_at).toLocaleDateString()})
              </div>
            ))
          ) : (
            <p>No submissions yet.</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ---------- EDIT BLOCK ----------
function EditBlock({ assignment, onUpdate }: { assignment: any; onUpdate: (updated: any) => void }) {
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault()
    const form = e.target as HTMLFormElement
    const data = {
      id: assignment.id,
      title: (form.elements.namedItem("title") as HTMLInputElement).value,
      description: (form.elements.namedItem("description") as HTMLTextAreaElement).value,
      due_date: (form.elements.namedItem("due_date") as HTMLInputElement).value,
      max_points: (form.elements.namedItem("max_points") as HTMLInputElement).value,
    }

    try {
      setLoading(true)

      const res = await fetch("/api/teacher/update-assignment", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      const result = await res.json()
      if (!res.ok) throw new Error(result.error || "Failed to update assignment")

      console.log("✅ Assignment updated:", result.assignment)

      // 🔵 Local state update trigger
      onUpdate(result.assignment)

      // ✅ Dialog close
      setOpen(false)
    } catch (err) {
      console.error("❌ Error updating assignment:", err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="flex-1 bg-transparent text-blue-600">
          <Edit className="h-4 w-4 mr-1" /> Edit
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Assignment</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleEdit} className="space-y-3">
          <Input name="title" defaultValue={assignment.title} placeholder="Title" />
          <Textarea name="description" defaultValue={assignment.description} placeholder="Description" />
          <Input type="date" name="due_date" defaultValue={assignment.due_date?.split("T")[0]} />
          <Input type="number" name="max_points" defaultValue={assignment.max_points} placeholder="Max Points" />
          <DialogFooter>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}


// ---------- PUBLISH BLOCK ----------
function PublishBlock({ assignment, onUpdate }: { assignment: any; onUpdate: (updated: any) => void }) {
  const [loading, setLoading] = useState(false)

  async function handlePublish() {
    try {
      setLoading(true)
      const res = await fetch("/api/teacher/publish-assignment", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: assignment.id }),
      })

      const result = await res.json()
      if (!res.ok) throw new Error(result.error || "Failed to publish assignment")

      console.log("✅ Assignment published:", result.assignment)
      onUpdate(result.assignment)
    } catch (err) {
      console.error("❌ Error publishing assignment:", err)
    } finally {
      setLoading(false)
    }
  }

  // If already published → hide this button
  if (assignment.is_published) return null

  return (
    <Button
      variant="default"
      size="sm"
      className="flex-1 bg-green-600 hover:bg-green-700 text-white"
      onClick={handlePublish}
      disabled={loading}
    >
      {loading ? "Publishing..." : "Publish"}
    </Button>
  )
}


// ---------- DELETE BLOCK ----------
function DeleteBlock({ assignment, onDelete }: { assignment: any; onDelete: (id: string) => void }) {
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)

  async function handleDelete() {
    try {
      setLoading(true)

      const res = await fetch(`/api/teacher/delete-assignment?id=${assignment.id}`, {
        method: "DELETE",
      })

      const result = await res.json()
      if (!res.ok) throw new Error(result.error || "Failed to delete assignment")

      console.log("✅ Assignment deleted:", assignment.id)

      onDelete(assignment.id) // 🔵 UI turant update
      setOpen(false) // ✅ dialog close
    } catch (err) {
      console.error("❌ Error deleting assignment:", err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="flex-1 bg-transparent text-red-600">
          <Trash className="h-4 w-4 mr-1" /> Delete
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Assignment</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete <b>{assignment.title}</b>? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleDelete} disabled={loading}>
            {loading ? "Deleting..." : "Delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
