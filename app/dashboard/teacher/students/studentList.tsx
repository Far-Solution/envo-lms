"use client"

import { useState, useRef } from "react"
import Link from "next/link"
import { Plus, Phone, Calendar } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { format } from "date-fns"

export default function StudentList({
    students,
    teacherCourses,   // ⬅️ allCourses → teacherCourses
}: {
    students: any[]
    teacherCourses: any[]
}) {
    const [studentList, setStudentList] = useState(students ?? [])

    const handleUpdateLocal = (id: string, updates: any) => {
        setStudentList((prev) =>
            prev.map((s) => (s.id === id ? { ...s, ...updates } : s)),
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Students</h1>
                    <p className="text-gray-600 mt-1">List of enrolled students</p>
                </div>
                <Button asChild>
                    <Link href="/dashboard/teacher/students/add">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Student
                    </Link>
                </Button>
            </div>

            {/* List */}
            <Card>
                <CardContent className="divide-y">
                    {studentList?.length > 0 ? (
                        studentList.map((student) => (
                            <div
                                key={student.id}
                                className="flex items-center justify-between py-4"
                            >
                                {/* Left side */}
                                <div className="flex items-center gap-4">
                                    <Avatar className="h-10 w-10">
                                        <AvatarImage
                                            src={student.profile_picture_url || "/placeholder.svg"}
                                        />
                                        <AvatarFallback>
                                            {(student.first_name?.[0] ?? "").toUpperCase()}
                                            {(student.last_name?.[0] ?? "").toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <div className="font-medium text-gray-900">
                                            {student.first_name} {student.last_name}
                                        </div>
                                        <div className="text-sm text-gray-500">
                                            {student.email || "No email"}
                                        </div>
                                        <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-gray-600">
                                            {student.phone && (
                                                <div className="flex items-center gap-1">
                                                    <Phone className="h-3 w-3" /> {student.phone}
                                                </div>
                                            )}
                                            <div className="flex items-center gap-1">
                                                <Calendar className="h-3 w-3" />
                                                {student.created_at
                                                    ? format(new Date(student.created_at), "dd/MM/yyyy")
                                                    : "—"}
                                            </div>
                                            <Badge variant="secondary">Student</Badge>
                                        </div>

                                        {/* Courses Badges */}
                                        {student.student_courses?.length > 0 && (
                                            <div className="mt-2 flex flex-wrap gap-2">
                                                {student.student_courses
                                                    .filter((sc: any) =>
                                                        teacherCourses.some((tc) => tc.id === sc.course_id) // ✅ sirf teacher ke courses
                                                    )
                                                    .map((sc: any) => (
                                                        <Badge
                                                            key={sc.course_id}
                                                            variant="outline"
                                                            className="px-2 py-1"
                                                        >
                                                            {sc.courses?.name ?? "—"}
                                                        </Badge>
                                                    ))}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex gap-2">
                                    <ViewDialog student={student} />
                                    <EditDialog
                                        student={student}
                                        teacherCourses={teacherCourses}   // ⬅️ pass teacherCourses
                                        onUpdate={handleUpdateLocal}
                                    />
                                    <DeleteDialog
                                        student={student}
                                        onDelete={(id) =>
                                            setStudentList((prev) => prev.filter((s) => s.id !== id))
                                        }
                                    />
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="py-12 text-center text-gray-500">
                            No students found
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}

/* ---------- ViewDialog ---------- */
function ViewDialog({ student }: { student: any }) {
    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                    View
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>
                        {student.first_name} {student.last_name}
                    </DialogTitle>
                    <DialogDescription>Student details</DialogDescription>
                </DialogHeader>
                <div className="space-y-2 text-sm">
                    <p>
                        <strong>Email:</strong> {student.email ?? "—"}
                    </p>
                    <p>
                        <strong>Phone:</strong> {student.phone ?? "—"}
                    </p>
                    <p>
                        <strong>Joined:</strong>{" "}
                        {student.created_at
                            ? new Date(student.created_at).toLocaleDateString()
                            : "—"}
                    </p>
                </div>
                <DialogFooter>
                    <DialogClose asChild>
                        <Button variant="outline">Close</Button>
                    </DialogClose>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

/* ---------- EditDialog ---------- */
function EditDialog({
    student,
    onUpdate,
    teacherCourses,
}: {
    student: any
    onUpdate: (id: string, updates: any) => void
    teacherCourses: any[]
}) {
    const [firstName, setFirstName] = useState(student.first_name ?? "")
    const [lastName, setLastName] = useState(student.last_name ?? "")
    const [phone, setPhone] = useState(student.phone ?? "")
    const [selectedCourses, setSelectedCourses] = useState<string[]>(
        student.student_courses?.map((sc: any) => sc.course_id) || []
    )

    const [saving, setSaving] = useState(false)

    const { toast } = useToast()
    const closeRef = useRef<HTMLButtonElement>(null) // ✅ for auto-close

    const toggleCourse = (courseId: string) => {
        setSelectedCourses((prev) =>
            prev.includes(courseId)
                ? prev.filter((id) => id !== courseId)
                : [...prev, courseId],
        )
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSaving(true)
        try {
            const updatedCourses = teacherCourses.filter((c) =>
                selectedCourses.includes(c.id),
            )

            // Local update
            onUpdate(student.id, {
                first_name: firstName,
                last_name: lastName,
                phone,
                student_courses: selectedCourses.map((cid) => ({
                    course_id: cid,
                    courses: teacherCourses.find((c) => c.id === cid), // ✅ course object bhi attach
                })),
            })

            // 🔥 API call
            const res = await fetch("/api/teacher/update-student", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    id: student.id,
                    first_name: firstName,
                    last_name: lastName,
                    phone,
                    course_ids: selectedCourses,
                }),
            })

            const data = await res.json()
            if (!res.ok) {
                console.error("Update failed:", data.error)
                toast({
                    title: "Update failed",
                    description: data.error || "Something went wrong",
                    variant: "destructive",
                })
            } else {
                console.log("✅ Student updated successfully:", data)
                toast({
                    title: "Student updated",
                    description: "The student was updated successfully.",
                })
                // ✅ Close dialog automatically
                closeRef.current?.click()
            }
        } catch (err) {
            console.error("❌ Update error:", err)
            toast({
                title: "Error",
                description: "Unexpected error occurred.",
                variant: "destructive",
            })
        } finally {
            setSaving(false)
        }
    }

    return (
        <Dialog>
            {/* Trigger Button */}
            <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                    Edit
                </Button>
            </DialogTrigger>

            {/* Dialog Content */}
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Edit Student</DialogTitle>
                    <DialogDescription>
                        Update student details and assign courses
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* First Name */}
                    <div>
                        <Label>First Name</Label>
                        <Input
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                            required
                        />
                    </div>

                    {/* Last Name */}
                    <div>
                        <Label>Last Name</Label>
                        <Input
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
                            required
                        />
                    </div>

                    {/* Phone */}
                    <div>
                        <Label>Phone</Label>
                        <Input
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                        />
                    </div>

                    {/* Courses */}
                    <div>
                        <Label>Assign Courses</Label>
                        <div className="flex flex-wrap gap-2 mt-2">
                            {teacherCourses.map((course) => (
                                <Button
                                    key={course.id}
                                    type="button"
                                    variant={
                                        selectedCourses.includes(course.id)
                                            ? "default"
                                            : "outline"
                                    }
                                    size="sm"
                                    onClick={() => toggleCourse(course.id)}
                                >
                                    {course.name}
                                </Button>
                            ))}
                        </div>
                    </div>

                    <DialogFooter>
                        <DialogClose asChild>
                            <Button type="button" variant="outline">
                                Cancel
                            </Button>
                        </DialogClose>
                        {/* hidden close btn ref for auto-close */}
                        <DialogClose asChild>
                            <button ref={closeRef} className="hidden" />
                        </DialogClose>
                        <Button type="submit" disabled={saving}>
                            {saving ? "Saving..." : "Save Changes"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}

/* ---------- DeleteDialog ---------- */
function DeleteDialog({
    student,
    onDelete,
}: {
    student: any
    onDelete: (id: string) => void
}) {
    const [deleting, setDeleting] = useState(false)

    const handleDelete = async () => {
        setDeleting(true)
        try {
            const res = await fetch("/api/teacher/delete-student", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ studentId: student.id }),
            })
            if (res.ok) {
                onDelete(student.id)
            }
        } finally {
            setDeleting(false)
        }
    }

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="destructive" size="sm">
                    Delete
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[400px]">
                <DialogHeader>
                    <DialogTitle>Delete Student</DialogTitle>
                    <DialogDescription>
                        Are you sure you want to delete{" "}
                        <span className="font-semibold">
                            {student.first_name} {student.last_name}
                        </span>
                        ?
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <DialogClose asChild>
                        <Button variant="outline">Cancel</Button>
                    </DialogClose>
                    <Button
                        variant="destructive"
                        onClick={handleDelete}
                        disabled={deleting}
                    >
                        {deleting ? "Deleting..." : "Confirm Delete"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
