import { requireRole } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Calendar, MapPin, User, BookOpen } from "lucide-react"
import ProfileForm from "@/app/dashboard/profile/ProfileForm"

export default async function StudentProfilePage() {
  const profile = await requireRole(["student"])
  const supabase = await createClient()

  const { data: studentCourses } = await supabase
    .from("student_courses")
    .select("courses(id, name, code)")
    .eq("student_id", profile.id)

  const courses = studentCourses?.map((sc) => sc.courses) || []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">My Profile</h1>
        <p className="text-gray-600 mt-1">Manage your personal information</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
          <CardDescription>Update your details</CardDescription>
        </CardHeader>
        <CardContent>
          <ProfileForm profile={profile} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Enrolled Courses</CardTitle>
          <CardDescription>Courses you’re currently enrolled in</CardDescription>
        </CardHeader>
        <CardContent>
          {courses.length ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {courses.map((c) => (
                <div key={c.id} className="p-3 border rounded-md">
                  <div className="font-medium flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-gray-500" /> {c.name}
                  </div>
                  <div className="text-sm text-gray-500">{c.code}</div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">No enrolled courses yet</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Account Details</CardTitle>
          <CardDescription>Overview of your account</CardDescription>
        </CardHeader>
        <CardContent className="grid md:grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-gray-500" />
            <span>Joined:</span>
            <span className="font-medium">
              {new Date(profile.created_at).toLocaleDateString()}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-gray-500" />
            <span>Institute:</span>
            <span className="font-medium">{profile.institutes?.name}</span>
          </div>
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-gray-500" />
            <span>Role:</span>
            <span className="capitalize">{profile.role}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
