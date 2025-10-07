import { requireRole } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { FileText, Calendar, Clock, Search, Upload } from "lucide-react"
import Link from "next/link"

export default async function StudentAssignmentsPage() {
  const profile = await requireRole(["student"])
  const supabase = await createClient()

  // 1️⃣ Get student's enrolled courses
  const { data: studentCourses, error: courseError } = await supabase
    .from("student_courses")
    .select(`
      course_id,
      courses (
        id,
        name,
        code
      )
    `)
    .eq("profile_id", profile.id)

  if (courseError) {
    console.error("Error fetching student courses:", courseError)
    return <div className="p-6 text-gray-500">Error loading courses.</div>
  }

  const courseIds = (studentCourses?.map((sc) => sc.course_id) || []).filter(
    (id): id is string => !!id
  )

  const courses =
    studentCourses?.map((sc) => sc.courses).filter(Boolean) || []

  if (courseIds.length === 0) {
    return (
      <div className="p-6 text-gray-500">
        You are not enrolled in any courses.
      </div>
    )
  }

  // 2️⃣ Fetch published assignments for those courses
  const { data: assignments, error } = await supabase
    .from("assignments")
    .select(`
      id,
      title,
      description,
      due_date,
      max_points,
      course_id,
      assignment_submissions!left (
        id,
        status,
        grade,
        submitted_at,
        feedback,
        student_id
      ),
      courses (
        id,
        name,
        code
      )
    `)
    .in("course_id", courseIds)
    .eq("is_published", true)
    .order("due_date", { ascending: true })

  if (error) {
    console.error("Error fetching assignments:", error)
    return <div className="p-6 text-gray-500">Error loading assignments.</div>
  }

  // 🎯 Badge helper for submission status
  const getStatusBadge = (submission: any, assignment: any) => {
    const now = new Date()
    const dueDate = new Date(assignment?.due_date)
    const isOverdue = dueDate < now && !submission

    if (!submission) {
      return (
        <Badge variant={isOverdue ? "destructive" : "outline"} className="text-xs">
          {isOverdue ? "Overdue" : "Not Submitted"}
        </Badge>
      )
    }

    if (submission.status === "graded") {
      const percentage = assignment?.max_points
        ? (submission.grade / assignment.max_points) * 100
        : 0
      return (
        <Badge
          variant={percentage >= 70 ? "default" : "destructive"}
          className="text-xs"
        >
          {Math.round(percentage)}% ({submission.grade}/{assignment.max_points})
        </Badge>
      )
    }

    if (submission.status === "submitted") {
      return (
        <Badge variant="secondary" className="text-xs">
          Submitted
        </Badge>
      )
    }

    return (
      <Badge variant="outline" className="text-xs">
        Not Submitted
      </Badge>
    )
  }

  // 🎨 Urgency color (for left border)
  const getUrgencyColor = (assignment: any, submission: any) => {
    if (submission?.status === "graded") return "border-l-green-500"
    if (submission?.status === "submitted") return "border-l-blue-500"

    const now = new Date()
    const dueDate = new Date(assignment?.due_date)
    const daysUntilDue = Math.ceil(
      (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    )

    if (daysUntilDue < 0) return "border-l-red-500"
    if (daysUntilDue <= 2) return "border-l-orange-500"
    if (daysUntilDue <= 7) return "border-l-yellow-500"
    return "border-l-gray-300"
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Assignments</h1>
          <p className="text-gray-600 mt-1">
            Track your assignments, submissions, and grades
          </p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filter Assignments</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <Input placeholder="Search assignments..." className="w-full" />
            </div>
            <Select>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="All Courses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Courses</SelectItem>
                {courses.map((course) => (
                  <SelectItem key={course.id} value={course.id}>
                    {course.code} - {course.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Not Submitted</SelectItem>
                <SelectItem value="submitted">Submitted</SelectItem>
                <SelectItem value="graded">Graded</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" className="bg-transparent">
              <Search className="h-4 w-4 mr-2" />
              Search
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Assignments List */}
      <div className="space-y-4">
        {assignments?.length ? (
          assignments.map((assignment) => {
            const submission = assignment.assignment_submissions?.[0] || null
            const course = assignment.courses
            const urgencyColor = getUrgencyColor(assignment, submission)

            return (
              <Card
                key={assignment.id}
                className={`hover:shadow-md transition-shadow border-l-4 ${urgencyColor}`}
              >
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">
                        {assignment.title}
                      </CardTitle>
                      <CardDescription className="mt-2">
                        {course && (
                          <Badge variant="outline" className="text-xs mr-2">
                            {course.code}
                          </Badge>
                        )}
                        <span className="text-sm">{course?.name}</span>
                      </CardDescription>
                    </div>
                    {getStatusBadge(submission, assignment)}
                  </div>
                  {assignment.description && (
                    <p className="text-sm text-gray-600 mt-3 line-clamp-2">
                      {assignment.description}
                    </p>
                  )}
                </CardHeader>

                <CardContent className="space-y-4 flex-1 flex flex-col">
                  {/* Assignment Details */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Calendar className="h-4 w-4" />
                        Due:{" "}
                        {assignment?.due_date
                          ? new Date(
                            assignment.due_date
                          ).toLocaleDateString()
                          : "N/A"}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <FileText className="h-4 w-4" />
                        {assignment?.max_points || 0} points
                      </div>
                    </div>
                    <div className="space-y-2">
                      {submission?.submitted_at && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Clock className="h-4 w-4" />
                          Submitted:{" "}
                          {new Date(
                            submission.submitted_at
                          ).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Feedback */}
                  {submission?.feedback && (
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <div className="text-sm font-medium text-blue-900 mb-1">
                        Teacher Feedback
                      </div>
                      <div className="text-sm text-blue-800">
                        {submission.feedback}
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 pt-2 mt-auto">
                    <Button
                      asChild
                      variant="outline"
                      size="sm"
                      className="flex-1 bg-transparent"
                    >
                      <Link
                        href={`/dashboard/student/assignments/${assignment.id}`}
                      >
                        View Details
                      </Link>
                    </Button>
                    {!submission && (
                      <Button asChild size="sm" className="flex-1">
                        <Link
                          href={`/dashboard/student/assignments/${assignment.id}/submit`}
                        >
                          <Upload className="h-4 w-4 mr-2" />
                          Submit
                        </Link>
                      </Button>
                    )}
                    {submission?.status === "submitted" && (
                      <Button
                        asChild
                        variant="outline"
                        size="sm"
                        className="flex-1 bg-transparent"
                      >
                        <Link
                          href={`/dashboard/student/assignments/${assignment.id}/edit`}
                        >
                          Edit Submission
                        </Link>
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })
        ) : (
          <Card className="text-center py-12">
            <CardContent>
              <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <div className="text-gray-500 mb-4">No assignments found</div>
              <p className="text-sm text-gray-400">
                Assignments will appear here once your teachers create them.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
