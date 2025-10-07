import { requireRole } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Plus, Mail, Phone, Calendar } from "lucide-react"
import Link from "next/link"
import TeacherGrid from "./teacherGrid"

export default async function TeachersPage() {
  const profile = await requireRole(["admin"])
  const supabase = await createClient()


  // Fetch all teachers in the institute
  const { data: teachers, error } = await supabase
    .from("profiles")
    .select(`
    id,
    first_name,
    last_name,
    email,
    phone,
    role,
    institute_id,
    created_at,
    profile_picture_url,
    teacher_courses (
      course_id,
      courses ( id, name, code )
    )
  `)
    .eq("institute_id", profile.institute_id)
    .eq("role", "teacher")
    .order("created_at", { ascending: false })
  


  if (error) {
    console.error("Error fetching teachers:", error)
  }

  return (
    <div className="space-y-6">


      {/* Teachers Grid */}
      <TeacherGrid teachers={teachers ?? []} />


    </div>
  )
}
