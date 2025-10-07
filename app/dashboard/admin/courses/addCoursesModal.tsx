"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient as createBrowserClient } from "@/lib/supabase/client"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Plus, Eye, Pencil, Trash2 } from "lucide-react"

/* ---------------- View Dialog ---------------- */
export function ViewCourseDialog({ course }: { course: any }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <Eye className="h-4 w-4 mr-1" /> View
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{course.name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-2">
          <p><strong>Code:</strong> {course.code}</p>
          <p><strong>Semester:</strong> {course.semester}</p>
          <p><strong>Credits:</strong> {course.credits}</p>
          <p><strong>Description:</strong> {course.description || "—"}</p>
          <p><strong>Status:</strong> {course.is_active ? "Active" : "Inactive"}</p>
        </div>
      </DialogContent>
    </Dialog>
  )
}

/* ---------------- Edit Dialog (self-contained update) ---------------- */
export function EditCourseDialog({
  course,
  onUpdated,
}: {
  course: any
  onUpdated?: () => void
}) {
  const supabase = createBrowserClient()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  // local form — initialize from course when opened
  const [form, setForm] = useState<any>({
    id: course?.id,
    name: course?.name ?? "",
    code: course?.code ?? "",
    description: course?.description ?? "",
    credits: course?.credits ?? "",
    semester: course?.semester ?? "",
    is_active: course?.is_active ?? true,
  })

  // Ensure form is refreshed when modal opens with a (possibly new) course
  useEffect(() => {
    if (open) {
      setForm({
        id: course?.id,
        name: course?.name ?? "",
        code: course?.code ?? "",
        description: course?.description ?? "",
        credits: course?.credits ?? "",
        semester: course?.semester ?? "",
        is_active: course?.is_active ?? true,
      })
    }
  }, [open, course])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    if (name === "is_active") {
      setForm((p: any) => ({ ...p, [name]: value === "true" }))
    } else if (name === "credits") {
      // keep as string for controlled input; cast when submitting
      setForm((p: any) => ({ ...p, [name]: value }))
    } else {
      setForm((p: any) => ({ ...p, [name]: value }))
    }
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form?.id) {
      alert("Missing course id.")
      return
    }
    setLoading(true)
    const { error } = await supabase
      .from("courses")
      .update({
        name: form.name,
        code: form.code,
        description: form.description,
        credits: Number(form.credits),
        semester: form.semester,
        is_active: Boolean(form.is_active),
      })
      .eq("id", form.id)

    setLoading(false)
    if (!error) {
      // close modal, refresh lists
      setOpen(false)
      if (onUpdated) onUpdated()
      router.refresh()
      // small success hint
      // replace with your toast if available
      alert("Course updated successfully.")
    } else {
      console.error(error)
      alert("Failed to update course. Check console for details.")
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="secondary" onClick={() => setOpen(true)}>
          <Pencil className="h-4 w-4 mr-1" /> Edit
        </Button>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Course</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleUpdate} className="space-y-4">
          <div>
            <Label htmlFor="name">Course Name</Label>
            <Input id="name" name="name" value={form.name} onChange={handleChange} required />
          </div>

          <div>
            <Label htmlFor="code">Course Code</Label>
            <Input id="code" name="code" value={form.code} onChange={handleChange} required />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" name="description" value={form.description || ""} onChange={handleChange} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="credits">Credits</Label>
              <Input id="credits" name="credits" type="number" value={form.credits} onChange={handleChange} required />
            </div>
            <div>
              <Label htmlFor="semester">Semester</Label>
              <Input id="semester" name="semester" value={form.semester} onChange={handleChange} required />
            </div>
          </div>

          <div>
            <Label htmlFor="is_active">Status</Label>
            <select
              id="is_active"
              name="is_active"
              value={String(form.is_active)}
              onChange={handleChange}
              className="w-full rounded-md border px-3 py-2"
            >
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </div>

          <DialogFooter>
            <Button type="submit" disabled={loading}>
              {loading ? "Updating..." : "Update Course"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
/* ---------------- Manage Courses ---------------- */
export function ManageCourses({ instituteId }: { instituteId: string }) {
  const supabase = createBrowserClient()
  const router = useRouter()

  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [courses, setCourses] = useState<any[]>([])

  const [form, setForm] = useState({ name: "", code: "", description: "", credits: "", semester: "" })

  const fetchCourses = async () => {
    const { data, error } = await supabase
      .from("courses")
      .select("id, name, code, semester, credits, description, is_active")
      .eq("institute_id", instituteId)
      .order("created_at", { ascending: false })

    if (!error && data) setCourses(data)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const { error } = await supabase.from("courses").insert({
      ...form,
      credits: Number(form.credits),
      institute_id: instituteId,
      is_active: true,
    })
    setLoading(false)
    if (!error) {
      setForm({ name: "", code: "", description: "", credits: "", semester: "" })
      fetchCourses()
      router.refresh()
    } else {
      console.error(error)
    }
  }

  useEffect(() => {
    if (open) fetchCourses()
  }, [open])

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Manage Courses
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Manage Courses</DialogTitle>
        </DialogHeader>

        {/* Add course form */}
        <form onSubmit={handleSubmit} className="space-y-4 border-b pb-4 mb-4">
          <div className="grid grid-cols-2 gap-4">
            <div> <Label htmlFor="name">Course Name</Label>
              <Input id="name" name="name" value={form.name} onChange={handleChange} required />
            </div>
            <div>
              <Label htmlFor="code">Course Code</Label>
              <Input id="code" name="code" value={form.code} onChange={handleChange} required />
            </div>
          </div>
          <div> <Label htmlFor="description">Description</Label>
            <Textarea id="description" name="description" value={form.description} onChange={handleChange} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="credits">Credits</Label>
              <Input id="credits" name="credits" type="number" value={form.credits} onChange={handleChange} required />
            </div>
            <div>
              <Label htmlFor="semester">Semester</Label>
              <Input id="semester" name="semester" value={form.semester} onChange={handleChange} required />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="submit"
              disabled={loading}> {loading ? "Saving..." : "Save Course"}
            </Button>
          </DialogFooter>
        </form>

        {/* List view of existing courses (scrollable) */}
        <div>
          <h3 className="text-lg font-semibold mb-2">Existing Courses</h3>
          {courses.length === 0 ? (
            <p className="text-sm text-gray-500">No courses found for this institute.</p>
          ) : (
            <ul className="divide-y max-h-64 overflow-y-auto pr-2">
              {courses.map((course) => (
                <li key={course.id} className="flex items-center justify-between py-2">
                  <div>
                    <p className="font-medium">
                      {course.name} ({course.code})
                    </p>
                    <p className="text-sm text-gray-600">
                      Semester {course.semester} • {course.credits} credits
                    </p>
                    <p className="text-sm text-gray-500">
                      Status: {course.is_active ? "Active" : "Inactive"}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <ViewCourseDialog course={course} />
                    <EditCourseDialog course={course} onUpdated={() => fetchCourses()} />
                    {/* use DeleteCourseButton here */}
                    <DeleteCourseButton courseId={course.id}
                      onDeleted={() => setCourses((prev) => prev.filter((c) => c.id !== course.id))}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

/* ---------------- DeleteCourseButton ---------------- */
export function DeleteCourseButton({ courseId, onDeleted }: { courseId: string; onDeleted?: () => void }) {
  const supabase = createBrowserClient()
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this course?")) return
    setLoading(true)
    const { error } = await supabase.from("courses").delete().eq("id", courseId)
    setLoading(false)

    if (error) {
      console.error(error)
      alert("Failed to delete course.")
    } else {
      if (onDeleted) onDeleted()
      router.refresh()
    }
  }

  return (
    <Button size="sm" variant="destructive" onClick={handleDelete} disabled={loading}>
      <Trash2 className="h-4 w-4 mr-1" />
      {loading ? "Deleting..." : "Delete"}
    </Button>
  )
}
