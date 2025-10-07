import { requireRole } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"

export default async function StudentsPage() {
  const profile = await requireRole(["admin"])
  const supabase = await createClient()

  // Fetch all students in the institute
  const { data: students, error } = await supabase
    .from("profiles")
    .select(
      `
      *,
      student_courses (
        id,
        courses (
          id,
          name,
          code
        )
      )
    `,
    )
    .eq("institute_id", profile.institute_id)
    .eq("role", "student")
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching students:", error)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Students</h1>
        <p className="text-gray-600 mt-1">
          View all student profiles and course enrollments
        </p>
      </div>

      {/* Students Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Enrolled Courses</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {students && students.length > 0 ? (
              students.map((student) => (
                <TableRow key={student.id}>
                  <TableCell className="font-medium">
                    {student.first_name} {student.last_name}{" "}
                    <Badge variant="secondary" className="ml-2">
                      Student
                    </Badge>
                  </TableCell>
                  <TableCell>{student.email}</TableCell>
                  <TableCell>{student.phone || "-"}</TableCell>
                  <TableCell>
                    {student.student_courses?.length > 0 ? (
                      <div className="space-y-1">
                        {student.student_courses
                          .slice(0, 2)
                          .map((sc: any) => (
                            <div key={sc.id} className="text-sm text-gray-600">
                              {sc.courses.code} - {sc.courses.name}
                            </div>
                          ))}
                        {student.student_courses.length > 2 && (
                          <div className="text-sm text-gray-500">
                            +{student.student_courses.length - 2} more
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-sm text-gray-500">
                        No courses
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    {new Date(student.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/dashboard/admin/students/${student.id}`}>
                        View
                      </Link>
                    </Button>
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/dashboard/admin/students/${student.id}/edit`}>
                        Edit
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-6 text-gray-500">
                  No students found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
