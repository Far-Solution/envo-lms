"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import {
  Home,
  Users,
  GraduationCap,
  BookOpen,
  Calendar,
  MessageSquare,
  Bell,
  Settings,
  LogOut,
  Menu,
  Clock,
  FileText,
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

interface DashboardLayoutProps {
  children: React.ReactNode
  user: any
  profile: any
}

export function DashboardLayout({ children, user, profile }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/")
  }

  const getNavigationItems = () => {
    const baseItems = [
      { name: "Dashboard", href: `/dashboard/${profile.role}`, icon: Home },
      { name: "Messages", href: `/dashboard/${profile.role}/messages`, icon: MessageSquare },
      { name: "Notifications", href: `/dashboard/${profile.role}/notifications`, icon: Bell },
    ]

    switch (profile.role) {
      case "admin":
        return [
          ...baseItems,
          { name: "Teachers", href: "/dashboard/admin/teachers", icon: Users },
          { name: "Students", href: "/dashboard/admin/students", icon: GraduationCap },
          { name: "Courses", href: "/dashboard/admin/courses", icon: BookOpen },
          { name: "Teacher Attendance", href: "/dashboard/admin/teachers/attendance", icon: Clock },
          { name: "Settings", href: "/dashboard/admin/settings", icon: Settings },
        ]
      case "teacher":
        return [
          ...baseItems,
          { name: "My Courses", href: "/dashboard/teacher/courses", icon: BookOpen },
          { name: "Students", href: "/dashboard/teacher/students", icon: GraduationCap },
          { name: "Assignments", href: "/dashboard/teacher/assignments", icon: FileText },
          { name: "Attendance", href: "/dashboard/teacher/attendance", icon: Clock },
          { name: "Meetings", href: "/dashboard/teacher/meetings", icon: Calendar },
        ]
      case "student":
        return [
          ...baseItems,
          { name: "My Courses", href: "/dashboard/student/courses", icon: BookOpen },
          { name: "Assignments", href: "/dashboard/student/assignments", icon: FileText },
          { name: "Grades", href: "/dashboard/student/grades", icon: GraduationCap },
          { name: "Attendance", href: "/dashboard/student/attendance", icon: Clock },
          { name: "Schedule", href: "/dashboard/student/schedule", icon: Calendar },
        ]
      default:
        return baseItems
    }
  }

  const navigationItems = getNavigationItems()

  const Sidebar = ({ mobile = false }: { mobile?: boolean }) => (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center border-b px-6">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <GraduationCap className="h-6 w-6" />
          <span>Envo LMS</span>
        </Link>
      </div>
      <nav className="flex-1 space-y-1 px-4 py-4">
        {navigationItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${isActive
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                }`}
              onClick={() => mobile && setSidebarOpen(false)}
            >
              <item.icon className="h-4 w-4" />
              {item.name}
            </Link>
          )
        })}
      </nav>
    </div>
  )

  return (
    <div className="flex h-screen bg-background">
      {/* Desktop Sidebar */}
      <div className="hidden w-64 border-r bg-card lg:block">
        <Sidebar />
      </div>

      {/* Mobile Sidebar */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="w-64 p-0">
          <Sidebar mobile />
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <div className="flex flex-1 flex-col">
        {/* Header */}
        <header className="flex h-16 items-center justify-between border-b bg-card px-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>

            <div className="hidden lg:block">
              <h2 className="text-lg font-semibold capitalize">{profile.role} Portal</h2>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon">
              <Bell className="h-5 w-5" />
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button type="button" className="rounded-full focus:outline-none">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={profile?.profile_picture_url || ""} />
                    <AvatarFallback>
                      {profile?.first_name?.[0]?.toUpperCase() || ""}
                      {profile?.last_name?.[0]?.toUpperCase() || ""}
                    </AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>

              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {profile?.first_name} {profile?.last_name}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user?.email}
                    </p>
                  </div>
                </DropdownMenuLabel>

                <DropdownMenuSeparator />

                <DropdownMenuItem asChild>
                  <Link href={`/dashboard/${profile.role}/profile`}>
                    <Settings className="mr-2 h-4 w-4" />
                    Profile Settings
                  </Link>
                </DropdownMenuItem>

                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
    </div>
  )
}
