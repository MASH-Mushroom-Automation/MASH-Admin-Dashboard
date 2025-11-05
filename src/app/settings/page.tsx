"use client"

import React, { useEffect, useState } from "react"
import { useForm, Controller } from "react-hook-form"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import {
  Form,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"


type SettingsForm = {
  fullName: string
  email: string
  company: string
  contactNumber: string
  receiveEmails: boolean
  receiveSms: boolean
  twoFactor: boolean
  currentPassword?: string
  password?: string
  confirmPassword?: string
}

export default function SettingsPage() {
  const defaultValues: SettingsForm = {
    fullName: "Super Admin",
    email: "admin@example.com",
    company: "MASH Automation",
    contactNumber: "0909273625",
    receiveEmails: true,
    receiveSms: false,
    twoFactor: true,
    password: "",
    currentPassword: "",
    confirmPassword: "",
  }

  const form = useForm<SettingsForm>({ defaultValues })
  const { handleSubmit, reset, control, watch, setValue, getValues } = form
  const [savedAt, setSavedAt] = useState<string | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)

  const onSave = (data: SettingsForm) => {
    // require current password when changing to a new password
    if (data.password && !data.currentPassword) {
      alert('Please enter your current password to change to a new password');
      return
    }
    const payload = { ...data, _logoPreview: logoPreview }
    setValue("password", "")
    setValue("confirmPassword", "")
    setValue("currentPassword", "")
  }

  const handleLogo = (file?: File | null) => {
    if (!file) return setLogoPreview(null)
    const url = URL.createObjectURL(file)
    setLogoPreview(url)
  }

  const password = watch("password")
  const confirmPassword = watch("confirmPassword")
  const currentPassword = watch("currentPassword")

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-4">
        <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:underline">
          <ArrowLeft className="w-4 h-4" />
          Back
        </Link>
      </div>

      <div className="border border-border rounded-lg p-6">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold">Settings</h1>
            <p className="text-sm text-muted-foreground">Manage your account settings and preferences.</p>
          </div>
        </div>

        <Tabs defaultValue="general">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <aside className="md:col-span-1">
              <TabsList className="flex flex-col space-y-4 mt-10">
                <TabsTrigger value="general" className="text-left">General</TabsTrigger>
                <TabsTrigger value="security" className="text-left">Security</TabsTrigger>
                <TabsTrigger value="notifications" className="text-left">Notifications</TabsTrigger>
              </TabsList>
            </aside>

            <main className="md:col-span-3">
              <div className="min-h-[420px]">
                <TabsContent value="general">
                <Form {...form}>
                  <form onSubmit={handleSubmit(onSave)} className="space-y-4">
                    <FormItem>
                      <FormLabel>Full name</FormLabel>
                      <FormControl>
                        <Controller control={control} name="fullName" render={({ field }) => <Input {...field} />} />
                      </FormControl>
                      <FormDescription>Visible name for the super admin.</FormDescription>
                      <FormMessage />
                    </FormItem>

                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Controller control={control} name="email" rules={{ required: "Email is required" }} render={({ field }) => <Input {...field} type="email" />} />
                      </FormControl>
                      <FormDescription>Primary contact email for the account.</FormDescription>
                      <FormMessage />
                    </FormItem>
                      <FormItem>
                        <FormLabel>Contact</FormLabel>
                        <FormControl>
                          <Controller control={control} name="contactNumber" render={({ field }) => <Input {...field} />} />
                        </FormControl>
                      </FormItem>

                    <div className="flex items-center gap-3 pt-2">
                      <Button type="submit">Save</Button>
                      <Button variant="outline" type="button" onClick={() => reset()}>
                        Cancel
                      </Button>
                    </div>
                  </form>
                </Form>
              </TabsContent>

              <TabsContent value="security">
                <Form {...form}>
                  <form onSubmit={handleSubmit(onSave)} className="space-y-4">
                    <FormItem>
                      <FormLabel>Current password</FormLabel>
                      <FormControl>
                        <Controller control={control} name="currentPassword" render={({ field }) => <Input {...field} type="password" />} />
                      </FormControl>
                      <FormDescription>Enter your current password before setting a new one.</FormDescription>
                    </FormItem>

                    <FormItem>
                      <FormLabel>New password</FormLabel>
                      <FormControl>
                        <Controller control={control} name="password" render={({ field }) => <Input {...field} type="password" />} />
                      </FormControl>
                      <FormDescription>Leave empty to keep current password.</FormDescription>
                    </FormItem>

                    <FormItem>
                      <FormLabel>Confirm password</FormLabel>
                      <FormControl>
                        <Controller control={control} name="confirmPassword" render={({ field }) => <Input {...field} type="password" />} />
                      </FormControl>
                      {password && confirmPassword && password !== confirmPassword && (
                        <p className="text-destructive text-sm">Passwords do not match</p>
                      )}
                    </FormItem>

                    <div className="flex items-center justify-between">
                      <div>
                        <FormLabel>Two-factor authentication</FormLabel>
                        <FormDescription className="mb-0">Enable TOTP for this account.</FormDescription>
                      </div>
                      <Controller control={control} name="twoFactor" render={({ field }) => (<FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>)} />
                    </div>

                    <div className="flex items-center gap-3 pt-2">
                      <Button type="submit" disabled={!!(password && password !== confirmPassword)}>Save</Button>
                      <Button variant="outline" type="button" onClick={() => { setValue("password", ""); setValue("confirmPassword", ""); setValue("currentPassword", "") }}>Clear</Button>
                    </div>
                  </form>
                </Form>
              </TabsContent>

              <TabsContent value="notifications">
                <Form {...form}>
                  <form onSubmit={handleSubmit(onSave)} className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <FormLabel>Receive emails</FormLabel>
                        <FormDescription className="mb-0">System and alert emails.</FormDescription>
                      </div>
                      <Controller control={control} name="receiveEmails" render={({ field }) => (<FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>)} />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <FormLabel>Receive SMS</FormLabel>
                        <FormDescription className="mb-0">Critical SMS alerts.</FormDescription>
                      </div>
                      <Controller control={control} name="receiveSms" render={({ field }) => (<FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>)} />
                    </div>

                    <div className="flex items-center gap-3 pt-2">
                      <Button type="submit">Save</Button>
                      <Button variant="outline" onClick={() => reset({ ...getValues(), receiveEmails: true, receiveSms: false })}>Reset</Button>
                    </div>
                  </form>
                </Form>
              </TabsContent>

              </div>
            </main>
          </div>
        </Tabs>
      </div>
    </div>
  )
}

