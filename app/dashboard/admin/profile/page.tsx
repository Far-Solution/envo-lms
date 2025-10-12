import { requireRole } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Calendar, MapPin, User, Users, Layers } from "lucide-react"
import ProfileForm from "@/app/dashboard/profile/ProfileForm"

export default async function AdminProfilePage() {
  const profile = await requireRole(["admin"])
  const supabase = await createClient()

  // Fetch total counts (optional analytics for admin)
  const [{ count: totalTeachers }, { count: totalStudents }, { count: totalCourses }] = await Promise.all([
    supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "teacher"),
    supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "student"),
    supabase.from("courses").select("id", { count: "exact", head: true }),
  ])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Admin Profile</h1>
        <p className="text-gray-600 mt-1">Manage your profile and view system overview</p>
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
          <CardTitle>Institute Overview</CardTitle>
          <CardDescription>Quick stats for your institute</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="flex items-center gap-2 p-3 border rounded-md">
            <Users className="h-4 w-4 text-gray-500" />
            <div>
              <div className="text-sm text-gray-500">Teachers</div>
              <div className="font-medium">{totalTeachers ?? 0}</div>
            </div>
          </div>
          <div className="flex items-center gap-2 p-3 border rounded-md">
            <User className="h-4 w-4 text-gray-500" />
            <div>
              <div className="text-sm text-gray-500">Students</div>
              <div className="font-medium">{totalStudents ?? 0}</div>
            </div>
          </div>
          <div className="flex items-center gap-2 p-3 border rounded-md">
            <Layers className="h-4 w-4 text-gray-500" />
            <div>
              <div className="text-sm text-gray-500">Courses</div>
              <div className="font-medium">{totalCourses ?? 0}</div>
            </div>
          </div>
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
