import { getUserProfile } from "@/lib/auth"
import { redirect } from "next/navigation"

export default async function DashboardPage() {
  const profile = await getUserProfile()

  // Redirect based on user role
  switch (profile.role) {
    case "admin":
      redirect("/dashboard/admin")
    case "teacher":
      redirect("/dashboard/teacher")
    case "student":
      redirect("/dashboard/student")
    default:
      redirect("/auth/login")
  }
}
