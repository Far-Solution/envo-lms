"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Save, Upload } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"

export default function ProfileForm({ profile }: { profile: any }) {
  const [formData, setFormData] = useState({
    first_name: profile.first_name || "",
    last_name: profile.last_name || "",
    phone: profile.phone || "",
    address: profile.address || "",
    date_of_birth: profile.date_of_birth?.split("T")[0] || "",
  })
  const [loading, setLoading] = useState(false)

  const handleChange = (e: any) => {
    const { id, value } = e.target
    setFormData((prev) => ({ ...prev, [id]: value }))
  }

  const handleSubmit = async () => {
    try {
      setLoading(true)
      const supabase = createClient()
      const { error } = await supabase
        .from("profiles")
        .update(formData)
        .eq("id", profile.id)
      if (error) throw error
      toast.success("Profile updated successfully!")
    } catch (err: any) {
      console.error(err)
      toast.error("Failed to update profile.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Avatar className="h-20 w-20">
          {profile.profile_picture_url ? (
            <AvatarImage src={profile.profile_picture_url} alt="Profile" />
          ) : (
            <AvatarFallback>
              {profile.first_name?.[0]?.toUpperCase()}{profile.last_name?.[0]?.toUpperCase()}
            </AvatarFallback>
          )}
        </Avatar>
        <Button variant="outline" className="flex items-center gap-2">
          <Upload className="h-4 w-4" /> Change Picture
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="first_name">First Name</Label>
          <Input id="first_name" value={formData.first_name} onChange={handleChange} />
        </div>
        <div>
          <Label htmlFor="last_name">Last Name</Label>
          <Input id="last_name" value={formData.last_name} onChange={handleChange} />
        </div>
      </div>

      <div>
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" value={profile.email} disabled />
      </div>

      <div>
        <Label htmlFor="phone">Phone</Label>
        <Input id="phone" value={formData.phone} onChange={handleChange} />
      </div>

      <div>
        <Label htmlFor="address">Address</Label>
        <Textarea id="address" value={formData.address} onChange={handleChange} />
      </div>

      <div>
        <Label htmlFor="date_of_birth">Date of Birth</Label>
        <Input
          id="date_of_birth"
          type="date"
          value={formData.date_of_birth}
          onChange={handleChange}
        />
      </div>

      <Button onClick={handleSubmit} disabled={loading} className="w-full">
        <Save className="h-4 w-4 mr-2" /> {loading ? "Saving..." : "Save Changes"}
      </Button>
    </div>
  )
}
