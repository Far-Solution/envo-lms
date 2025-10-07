// app/dashboard/admin/teachers/TeacherGrid.tsx
"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Plus, Mail, Phone, Calendar, Check, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
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
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover"
import {
    Command,
    CommandInput,
    CommandEmpty,
    CommandGroup,
    CommandItem,
} from "@/components/ui/command"
import { format } from "date-fns"

// tiny `cn` helper in case you don't have one
function cn(...classes: (string | false | null | undefined)[]) {
    return classes.filter(Boolean).join(" ")
}

export default function TeacherGrid({ teachers }: { teachers: any[] }) {
    // Keep a local, editable copy of teachers so updates reflect immediately
    const [teacherList, setTeacherList] = useState(teachers ?? [])

    const handleUpdateLocal = (id: string, updates: any) => {
        setTeacherList((prev) => prev.map((t) => (t.id === id ? { ...t, ...updates } : t)))
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Teacher Management</h1>
                    <p className="text-gray-600 mt-1">Manage faculty members and their course assignments</p>
                </div>
                <Button asChild>
                    <Link href="/dashboard/admin/teachers/add">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Teacher
                    </Link>
                </Button>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {teacherList?.map((teacher) => (
                    <Card key={teacher.id} className="hover:shadow-md transition-shadow">
                        <CardHeader className="pb-4">
                            <div className="flex items-center gap-4">
                                <Avatar className="h-12 w-12">
                                    <AvatarImage src={teacher.profile_picture_url || "/placeholder.svg"} />
                                    <AvatarFallback>
                                        {(teacher.first_name?.[0] ?? "").toUpperCase()}
                                        {(teacher.last_name?.[0] ?? "").toUpperCase()}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="flex-1">
                                    <CardTitle className="text-lg">
                                        {teacher.first_name} {teacher.last_name}
                                    </CardTitle>
                                    <CardDescription>
                                        <Badge variant="secondary" className="text-xs">Teacher</Badge>
                                    </CardDescription>
                                </div>
                            </div>
                        </CardHeader>

                        <CardContent className="flex flex-col h-full">
                            <div className="space-y-4 flex-1">
                                {/* Contact Info */}
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                        <Mail className="h-4 w-4" />
                                        {teacher.email || <span className="text-gray-400">No email</span>}
                                    </div>
                                    {teacher.phone ? (
                                        <div className="flex items-center gap-2 text-sm text-gray-600">
                                            <Phone className="h-4 w-4" />
                                            {teacher.phone}
                                        </div>
                                    ) : null}
                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                        <Calendar className="h-4 w-4" />
                                        Joined {format(new Date(teacher.created_at), "dd/MM/yyyy")}
                                    </div>
                                </div>

                                {/* Assigned Courses */}
                                <div>
                                    <div className="text-sm font-medium text-gray-900 mb-2">Assigned Courses</div>
                                    {teacher.teacher_courses && teacher.teacher_courses.length > 0 ? (
                                        <div className="flex flex-wrap gap-2">
                                            {teacher.teacher_courses.map((tc: any) => (
                                                <Badge key={tc.course_id} variant="outline">
                                                    {tc.courses?.name} ({tc.courses?.code})
                                                </Badge>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-sm text-gray-500">No courses assigned</div>
                                    )}
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-2 pt-2 mt-auto">
                                <ViewDialog teacher={teacher} />
                                <EditDialog teacher={teacher} onUpdate={handleUpdateLocal} />
                                <DeleteDialog teacher={teacher} onDelete={(id) => {
                                    // Remove from local list immediately
                                    setTeacherList(prev => prev.filter((t) => t.id !== id))

                                    // TODO: backend delete API call
                                    fetch("/api/admin/delete-teacher", {
                                        method: "POST",
                                        headers: { "Content-Type": "application/json" },
                                        body: JSON.stringify({ teacherId: teacher.id }),
                                    })
                                }} />
                            </div>
                        </CardContent>
                    </Card>
                ))}

                {/* Empty state */}
                {(!teacherList || teacherList.length === 0) && (
                    <div className="col-span-full">
                        <Card className="text-center py-12">
                            <CardContent>
                                <div className="text-gray-500 mb-4">No teachers found</div>
                                <Button asChild>
                                    <Link href="/dashboard/admin/teachers/add">
                                        <Plus className="h-4 w-4 mr-2" />
                                        Add First Teacher
                                    </Link>
                                </Button>
                            </CardContent>
                        </Card>
                    </div>
                )}
            </div>
        </div>
    )
}

/* ---------- ViewDialog (shows courses) ---------- */
function ViewDialog({ teacher }: { teacher: any }) {
    const [open, setOpen] = useState(false)

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="flex-1 bg-transparent">View Details</Button>
            </DialogTrigger>

            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>{teacher.first_name} {teacher.last_name}</DialogTitle>
                </DialogHeader>

                <div className="space-y-3 text-sm text-gray-700">
                    <p><strong>Email:</strong> {teacher.email ?? "—"}</p>
                    <p><strong>Phone:</strong> {teacher.phone ?? "—"}</p>
                    <p><strong>Joined:</strong> {teacher.created_at ? new Date(teacher.created_at).toLocaleDateString() : "—"}</p>

                    <div>
                        <strong>Courses:</strong>
                        {teacher.teacher_courses && teacher.teacher_courses.length > 0 ? (
                            <div className="flex flex-wrap gap-2 mt-2">
                                {teacher.teacher_courses.map((tc: any) => (
                                    <Badge key={tc.course_id} variant="outline">
                                        {tc.courses?.name} ({tc.courses?.code})
                                    </Badge>
                                ))}
                            </div>
                        ) : (
                            <div className="text-gray-500">No courses assigned</div>
                        )}
                    </div>
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


/* ---------- EditDialog (fetches course list on open; uses MultiSelect) ---------- */
/* ---------- EditDialog (fetches course list on open; simple checkbox selector) ---------- */
function EditDialog({
    teacher,
    onUpdate,
}: {
    teacher: any
    onUpdate: (id: string, updates: any) => void
}) {
    const [open, setOpen] = useState(false)
    const [firstName, setFirstName] = useState(teacher.first_name ?? "")
    const [lastName, setLastName] = useState(teacher.last_name ?? "")
    const [phone, setPhone] = useState(teacher.phone ?? "")
    const [selectedCourses, setSelectedCourses] = useState<string[]>([])

    const [allCourses, setAllCourses] = useState<
        { id: string; name: string; code: string }[]
    >([])
    const [loadingCourses, setLoadingCourses] = useState(false)

    // Fetch all courses when modal opens
    useEffect(() => {
        if (!open) return
        const fetchCourses = async () => {
            setLoadingCourses(true)
            try {
                const res = await fetch("/api/admin/courses")
                const data = await res.json()
                if (res.ok && Array.isArray(data)) {
                    setAllCourses(
                        data.map((c: any) => ({
                            id: String(c.id),
                            name: c.name,
                            code: c.code,
                        }))
                    )
                } else {
                    setAllCourses([])
                }
            } catch {
                setAllCourses([])
            } finally {
                setLoadingCourses(false)
            }
        }
        fetchCourses()
    }, [open])

    // Pre-select teacher’s existing courses when opening
    useEffect(() => {
        if (open && teacher?.teacher_courses) {
            setSelectedCourses(
                teacher.teacher_courses.map((tc: any) => String(tc.course_id))
            )
        }
    }, [open, teacher])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        const updatedTeacherCourses = allCourses
            .filter((c) => selectedCourses.includes(String(c.id)))
            .map((c) => ({ course_id: c.id, courses: c }))

        // Update UI instantly
        onUpdate(teacher.id, {
            first_name: firstName,
            last_name: lastName,
            phone,
            teacher_courses: updatedTeacherCourses,
        })

        // TODO: persist via API
        await fetch("/api/admin/update-teacher", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                id: teacher.id,
                first_name: firstName,
                last_name: lastName,
                phone,
                course_ids: selectedCourses,
            }),
        })

        setOpen(false)
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 bg-transparent"
                >
                    Edit
                </Button>
            </DialogTrigger>

            <DialogContent className="sm:max-w-[600px] p-6"> {/* p-6 added for padding */}
                <DialogHeader>
                    <DialogTitle>Edit Teacher</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="grid gap-4">
                    <div className="grid gap-3">
                        <Label htmlFor={`first_name_${teacher.id}`}>First Name</Label>
                        <Input
                            id={`first_name_${teacher.id}`}
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                        />
                    </div>

                    <div className="grid gap-3">
                        <Label htmlFor={`last_name_${teacher.id}`}>Last Name</Label>
                        <Input
                            id={`last_name_${teacher.id}`}
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
                        />
                    </div>

                    <div className="grid gap-3">
                        <Label htmlFor={`phone_${teacher.id}`}>Phone</Label>
                        <Input
                            id={`phone_${teacher.id}`}
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                        />
                    </div>

                    {/* Assigned Courses (checkbox list) */}
                    <div className="grid gap-3">
                        <Label>Assigned Courses</Label>
                        <div className="max-h-60 overflow-y-auto border rounded-md p-3 space-y-2">
                            {allCourses.length === 0 ? (
                                <p className="text-sm text-gray-500">
                                    {loadingCourses ? "Loading courses..." : "No courses available"}
                                </p>
                            ) : (
                                allCourses.map((course) => (
                                    <label
                                        key={course.id}
                                        className="flex items-center gap-2 cursor-pointer"
                                    >
                                        <input
                                            type="checkbox"
                                            className="h-4 w-4"
                                            checked={selectedCourses.includes(course.id)}
                                            onChange={() => {
                                                if (selectedCourses.includes(course.id)) {
                                                    setSelectedCourses(
                                                        selectedCourses.filter((c) => c !== course.id)
                                                    )
                                                } else {
                                                    setSelectedCourses([...selectedCourses, course.id])
                                                }
                                            }}
                                        />
                                        <span className="text-sm">
                                            {course.name} ({course.code})
                                        </span>
                                    </label>
                                ))
                            )}
                        </div>
                    </div>

                    <DialogFooter>
                        <DialogClose asChild>
                            <Button variant="outline" type="button">
                                Cancel
                            </Button>
                        </DialogClose>
                        <Button type="submit">Save</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}


/* ---------- DeleteDialog (confirmation for removing teacher) ---------- */
function DeleteDialog({
    teacher,
    onDelete,
}: {
    teacher: any
    onDelete: (id: string) => void
}) {
    const [open, setOpen] = useState(false)

    const handleDelete = () => {
        // Call parent handler
        onDelete(teacher.id)
        // TODO: persist via /api/admin/delete-teacher
        setOpen(false)
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="destructive" size="sm" className="flex-1">
                    Delete
                </Button>
            </DialogTrigger>

            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Delete Teacher</DialogTitle>
                    <DialogDescription>
                        Are you sure you want to remove{" "}
                        <span className="font-semibold">
                            {teacher.first_name} {teacher.last_name}
                        </span>{" "}
                        from this institute? This action cannot be undone.
                    </DialogDescription>
                </DialogHeader>

                <DialogFooter>
                    <DialogClose asChild>
                        <Button variant="outline">Cancel</Button>
                    </DialogClose>
                    <Button variant="destructive" onClick={handleDelete}>
                        Confirm Delete
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}