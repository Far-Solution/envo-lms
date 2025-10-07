import { requireRole } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { User, MapPin, Calendar, Save } from "lucide-react"

export default async function TeacherProfilePage() {
  const profile = await requireRole(["teacher"])
  const supabase = await createClient()

  // Fetch teacher's course assignments
  const { data: teacherCourses } = await supabase
    .from("teacher_courses")
    .select(
      `
      courses (
        id,
        name,
        code
      )
    `,
    )
    .eq("teacher_id", profile.id)

  const courses = teacherCourses?.map((tc) => tc.courses) || []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
        <p className="text-gray-600 mt-1">Manage your personal information and preferences</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Picture & Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Profile Picture
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <Avatar className="h-24 w-24 mx-auto">
              <AvatarImage src={profile.profile_picture_url || "/placeholder.svg"} />
              <AvatarFallback className="text-lg">
                {profile.first_name[0]}
                {profile.last_name[0]}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="font-medium text-lg">
                {profile.first_name} {profile.last_name}
              </div>
              <div className="text-sm text-gray-600">{profile.email}</div>
              <div className="text-sm text-gray-600 mt-1">Teacher</div>
            </div>
            <Button variant="outline" className="w-full bg-transparent">
              Change Picture
            </Button>
          </CardContent>
        </Card>

        {/* Personal Information */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Personal Information
            </CardTitle>
            <CardDescription>Update your personal details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input id="firstName" defaultValue={profile.first_name} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input id="lastName" defaultValue={profile.last_name} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" defaultValue={profile.email} disabled />
              <p className="text-xs text-gray-500">Email cannot be changed. Contact admin if needed.</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" type="tel" defaultValue={profile.phone || ""} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Textarea id="address" defaultValue={profile.address || ""} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dateOfBirth">Date of Birth</Label>
              <Input
                id="dateOfBirth"
                type="date"
                defaultValue={profile.date_of_birth ? profile.date_of_birth.split("T")[0] : ""}
              />
            </div>
            <Button className="w-full">
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Course Assignments */}
      <Card>
        <CardHeader>
          <CardTitle>Course Assignments</CardTitle>
          <CardDescription>Courses you're currently teaching</CardDescription>
        </CardHeader>
        <CardContent>
          {courses.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {courses.map((course) => (
                <div key={course.id} className="p-4 border rounded-lg">
                  <div className="font-medium">{course.name}</div>
                  <div className="text-sm text-gray-600">{course.code}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">No courses assigned</div>
          )}
        </CardContent>
      </Card>

      {/* Account Information */}
      <Card>
        <CardHeader>
          <CardTitle>Account Information</CardTitle>
          <CardDescription>Your account details and status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-gray-500" />
                <span className="text-gray-600">Member since:</span>
                <span className="font-medium">{new Date(profile.created_at).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="h-4 w-4 text-gray-500" />
                <span className="text-gray-600">Institute:</span>
                <span className="font-medium">{profile.institutes?.name}</span>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm">
                <User className="h-4 w-4 text-gray-500" />
                <span className="text-gray-600">Role:</span>
                <span className="font-medium capitalize">{profile.role}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <div className={`h-2 w-2 rounded-full ${profile.is_active ? "bg-green-500" : "bg-red-500"}`}></div>
                <span className="text-gray-600">Status:</span>
                <span className="font-medium">{profile.is_active ? "Active" : "Inactive"}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
