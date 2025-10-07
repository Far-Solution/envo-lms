"use client"

import type React from "react"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"

export default function SignupPage() {
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [instituteName, setInstituteName] = useState("")
  const [domainPrefix, setDomainPrefix] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleInstituteNameChange = (name: string) => {
    setInstituteName(name)
    const prefix = name
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "")
      .substring(0, 10)
    setDomainPrefix(prefix)
  }

  const handleSignup = async (e: React.FormEvent) => {
  e.preventDefault()
  const supabase = createClient()
  setIsLoading(true)
  setError(null)

  if (password !== confirmPassword) {
    setError("Passwords do not match")
    setIsLoading(false)
    return
  }

  if (!instituteName || !domainPrefix) {
    setError("Please provide institute details")
    setIsLoading(false)
    return
  }

  try {
    // 🔹 Step 1 — Sign up the admin user, attach metadata
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo:
          process.env.NEXT_PUBLIC_SUPABASE_REDIRECT_URL ||
          `${window.location.origin}/dashboard`,
        data: {
          first_name: firstName,
          last_name: lastName,
          role: "admin",
          institute_name: instituteName,
          domain_prefix: domainPrefix,
        },
      },
    })

    if (error) throw error
    const user = data.user
    if (!user) throw new Error("User signup failed")

    // 🔹 Step 2 — Create institute (if it doesn’t exist)
    const { data: institute, error: instituteError } = await supabase
      .from("institutes")
      .insert([
        {
          name: instituteName,
          domain: `${domainPrefix}.envo-lms.com`,
        },
      ])
      .select()
      .single()

    if (instituteError) throw instituteError

    // 🔹 Step 3 — Create profile row (linked to user + institute)
    const { error: profileError } = await supabase.from("profiles").insert([
      {
        id: user.id, // must match auth.users.id
        first_name: firstName,
        last_name: lastName,
        full_name: `${firstName} ${lastName}`,
        role: "admin", // only admins can sign up
        institute_id: institute.id,
        profile_picture_url: null,
      },
    ])

    if (profileError) throw profileError

    // 🔹 Step 4 — Redirect to success page
    router.push("/auth/signup-success")
  } catch (err: unknown) {
    console.error(err)
    setError(err instanceof Error ? err.message : "Something went wrong")
  } finally {
    setIsLoading(false)
  }
}


  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Envo LMS</h1>
          <p className="text-gray-600 mt-2">Create your institute</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl text-center">Setup Your Institute</CardTitle>
            <CardDescription className="text-center">
              Create an admin account and setup your educational institute
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSignup} className="space-y-4">
              <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                <h3 className="font-medium text-gray-900">Institute Information</h3>
                <div className="space-y-2">
                  <Label htmlFor="instituteName">Institute Name</Label>
                  <Input
                    id="instituteName"
                    type="text"
                    placeholder="e.g., Army Public School"
                    required
                    value={instituteName}
                    onChange={(e) => handleInstituteNameChange(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="domainPrefix">Domain Prefix</Label>
                  <div className="flex items-center">
                    <Input
                      id="domainPrefix"
                      type="text"
                      placeholder="aps"
                      required
                      value={domainPrefix}
                      onChange={(e) => setDomainPrefix(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, ""))}
                      className="rounded-r-none"
                    />
                    <div className="px-3 py-2 bg-gray-100 border border-l-0 rounded-r-md text-sm text-gray-600">
                      .envo-lms.com
                    </div>
                  </div>
                  <p className="text-xs text-gray-500">This will be used for auto-generated email addresses</p>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-medium text-gray-900">Administrator Details</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      type="text"
                      required
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      type="text"
                      required
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Admin Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="admin@yourdomain.com"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Creating institute..." : "Create Institute"}
              </Button>
            </form>

            <div className="mt-6 text-center text-sm">
              <p className="text-gray-600">
                Already have an account?{" "}
                <Link href="/auth/login" className="text-blue-600 hover:underline font-medium">
                  Sign in
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
