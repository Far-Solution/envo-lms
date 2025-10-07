import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export async function getUser() {
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    redirect("/auth/login")
  }

  return user
}

export async function getUserProfile() {
  const supabase = await createClient()
  const user = await getUser()

  const { data: profile, error } = await supabase
    .from("profiles")
    .select(`
      *,
      institutes (
        id,
        name,
        domain
      )
    `)
    .eq("id", user.id)
    .single()

  if (error || !profile) {
    throw new Error("Profile not found")
  }

  return profile
}

export async function requireRole(allowedRoles: string[]) {
  const profile = await getUserProfile()

  if (!allowedRoles.includes(profile.role)) {
    redirect("/dashboard")
  }

  return profile
}
