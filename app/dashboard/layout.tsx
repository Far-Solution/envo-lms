import type React from "react"
import { getUser, getUserProfile } from "@/lib/auth"
import { DashboardLayout } from "@/components/layout/dashboard-layout"

export default async function Layout({ children }: { children: React.ReactNode }) {
  const user = await getUser()
  const profile = await getUserProfile()

  return (
    <DashboardLayout user={user} profile={profile}>
      {children}
    </DashboardLayout>
  )
}
