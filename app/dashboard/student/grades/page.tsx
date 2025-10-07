import { requireRole } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { TrendingUp, BookOpen, Award } from "lucide-react"

export default async function StudentGradesPage() {
  const profile = await requireRole(["student"])
  const supabase = await createClient()

  // Fetch student's grades
  const { data: grades, error } = await supabase
    .from("assignment_submissions")
    .select(
      `
      id,
      points_earned,
      submitted_at,
      graded_at,
      feedback,
      assignments (
        id,
        title,
        max_points,
        due_date,
        courses (
          id,
          name,
          code
        )
      )
    `,
    )
    .eq("student_id", profile.id)
    .eq("status", "graded")
    .order("graded_at", { ascending: false })

  if (error) {
    console.error("Error fetching grades:", error)
  }

  // Calculate overall statistics
  const totalPoints = grades?.reduce((sum, g) => sum + (g.points_earned || 0), 0) || 0
  const maxPoints = grades?.reduce((sum, g) => sum + (g.assignments?.max_points || 0), 0) || 0
  const overallGrade = maxPoints > 0 ? Math.round((totalPoints / maxPoints) * 100) : 0

  // Group grades by course
  const gradesByCourse = grades?.reduce(
    (acc, grade) => {
      const courseId = grade.assignments.courses.id
      if (!acc[courseId]) {
        acc[courseId] = {
          course: grade.assignments.courses,
          grades: [],
          totalPoints: 0,
          maxPoints: 0,
        }
      }
      acc[courseId].grades.push(grade)
      acc[courseId].totalPoints += grade.points_earned || 0
      acc[courseId].maxPoints += grade.assignments.max_points || 0
      return acc
    },
    {} as Record<string, any>,
  )

  const courseGrades = Object.values(gradesByCourse || {})

  const getGradeColor = (percentage: number) => {
    if (percentage >= 90) return "text-green-600"
    if (percentage >= 80) return "text-blue-600"
    if (percentage >= 70) return "text-yellow-600"
    return "text-red-600"
  }

  const getGradeBadgeVariant = (percentage: number) => {
    if (percentage >= 70) return "default"
    return "destructive"
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">My Grades</h1>
        <p className="text-gray-600 mt-1">View your academic performance and assignment grades</p>
      </div>

      {/* Overall Performance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            Overall Performance
          </CardTitle>
          <CardDescription>Your cumulative academic performance across all courses</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-6 bg-blue-50 rounded-lg">
              <div className={`text-3xl font-bold ${getGradeColor(overallGrade)}`}>{overallGrade}%</div>
              <div className="text-sm text-gray-600 mt-1">Overall Grade</div>
            </div>
            <div className="text-center p-6 bg-green-50 rounded-lg">
              <div className="text-3xl font-bold text-green-600">{grades?.length || 0}</div>
              <div className="text-sm text-gray-600 mt-1">Graded Assignments</div>
            </div>
            <div className="text-center p-6 bg-purple-50 rounded-lg">
              <div className="text-3xl font-bold text-purple-600">{totalPoints}</div>
              <div className="text-sm text-gray-600 mt-1">Total Points Earned</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Grades by Course */}
      <div className="space-y-6">
        <h2 className="text-xl font-semibold text-gray-900">Grades by Course</h2>
        {courseGrades.map((courseData) => {
          const courseGrade = Math.round((courseData.totalPoints / courseData.maxPoints) * 100)

          return (
            <Card key={courseData.course.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <BookOpen className="h-5 w-5" />
                      {courseData.course.name}
                    </CardTitle>
                    <CardDescription>
                      <Badge variant="outline" className="text-xs">
                        {courseData.course.code}
                      </Badge>
                    </CardDescription>
                  </div>
                  <Badge variant={getGradeBadgeVariant(courseGrade)} className="text-sm">
                    {courseGrade}%
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Course Progress */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Course Progress</span>
                    <span className="font-medium">
                      {courseData.totalPoints}/{courseData.maxPoints} points
                    </span>
                  </div>
                  <Progress value={courseGrade} className="h-2" />
                </div>

                {/* Assignment Grades */}
                <div className="space-y-3">
                  <div className="text-sm font-medium text-gray-900">Recent Assignments</div>
                  {courseData.grades.slice(0, 5).map((grade: any) => {
                    const percentage = Math.round((grade.points_earned / grade.assignments.max_points) * 100)

                    return (
                      <div key={grade.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex-1">
                          <div className="font-medium">{grade.assignments.title}</div>
                          <div className="text-sm text-gray-600">
                            Graded: {new Date(grade.graded_at).toLocaleDateString()}
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge variant={getGradeBadgeVariant(percentage)} className="text-xs">
                            {percentage}%
                          </Badge>
                          <div className="text-sm text-gray-600 mt-1">
                            {grade.points_earned}/{grade.assignments.max_points}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                  {courseData.grades.length > 5 && (
                    <div className="text-center text-sm text-gray-500">
                      +{courseData.grades.length - 5} more assignments
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}

        {/* Empty State */}
        {courseGrades.length === 0 && (
          <Card className="text-center py-12">
            <CardContent>
              <TrendingUp className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <div className="text-gray-500 mb-4">No grades available yet</div>
              <p className="text-sm text-gray-400">Grades will appear here once your assignments are graded.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
