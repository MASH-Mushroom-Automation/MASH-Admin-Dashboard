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
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"

type SettingsForm = {
  fullName: string
  email: string
  company: string
  contactNumber: string
  receiveEmails: boolean
  receiveSms: boolean
  twoFactor: boolean
  roles: { superAdmin: boolean; admin: boolean; viewer: boolean }
  password?: string
  confirmPassword?: string
  brandingText?: string
}

const LOCAL_KEY = "superadmin_settings_v1"

export default function SettingsPage() {
  const defaultValues: SettingsForm = {
    fullName: "Super Admin",
    email: "admin@example.com",
    company: "MASH Automation",
    contactNumber: "",
    receiveEmails: true,
    receiveSms: false,
    twoFactor: true,
    roles: { superAdmin: true, admin: true, viewer: false },
    password: "",
    confirmPassword: "",
    brandingText: "",
  }

  const form = useForm<SettingsForm>({ defaultValues })
  const { handleSubmit, reset, control, watch, setValue, getValues } = form
  const [savedAt, setSavedAt] = useState<string | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)

  useEffect(() => {
    try {
      const raw = localStorage.getItem(LOCAL_KEY)
      if (raw) {
        const parsed = JSON.parse(raw)
        reset(parsed)
        if (parsed._logoPreview) setLogoPreview(parsed._logoPreview)
      }
    } catch (e) {
      // ignore
    }
  }, [reset])

  const onSave = (data: SettingsForm) => {
    const payload = { ...data, _logoPreview: logoPreview }
    localStorage.setItem(LOCAL_KEY, JSON.stringify(payload))
    setSavedAt(new Date().toLocaleString())
    setValue("password", "")
    setValue("confirmPassword", "")
  }

  const handleLogo = (file?: File | null) => {
    if (!file) return setLogoPreview(null)
    const url = URL.createObjectURL(file)
    setLogoPreview(url)
  }

  const password = watch("password")
  const confirmPassword = watch("confirmPassword")

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-4">
        <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:underline">
          <ArrowLeft className="w-4 h-4" />
          Back
        </Link>
      </div>

      <div className="bg-background border border-border rounded-lg p-6">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold">Settings</h1>
            <p className="text-sm text-muted-foreground">Manage your account settings and preferences.</p>
          </div>
          <div className="text-sm text-muted-foreground">{savedAt ? `Last saved: ${savedAt}` : "Not saved yet"}</div>
        </div>

        <Tabs defaultValue="general">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <aside className="md:col-span-1">
              <TabsList className="flex flex-col space-y-2 mt-20">
                <TabsTrigger value="general" className="text-left">General</TabsTrigger>
                <TabsTrigger value="security" className="text-left">Security</TabsTrigger>
                <TabsTrigger value="roles" className="text-left">Roles</TabsTrigger>
                <TabsTrigger value="notifications" className="text-left">Notifications</TabsTrigger>
                <TabsTrigger value="branding" className="text-left">Branding</TabsTrigger>
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

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormItem>
                        <FormLabel>Organization</FormLabel>
                        <FormControl>
                          <Controller control={control} name="company" render={({ field }) => <Input {...field} />} />
                        </FormControl>
                      </FormItem>

                      <FormItem>
                        <FormLabel>Contact</FormLabel>
                        <FormControl>
                          <Controller control={control} name="contactNumber" render={({ field }) => <Input {...field} />} />
                        </FormControl>
                      </FormItem>
                    </div>

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
                      <Button variant="outline" type="button" onClick={() => { setValue("password", ""); setValue("confirmPassword", "") }}>Clear</Button>
                    </div>
                  </form>
                </Form>
              </TabsContent>

              <TabsContent value="roles">
                <Form {...form}>
                  <form onSubmit={handleSubmit(onSave)} className="space-y-4">
                    <FormLabel className="mb-2">Roles</FormLabel>
                    <div className="flex flex-col gap-2">
                      <Controller control={control} name="roles" render={({ field }) => (
                        <>
                          <label className="flex items-center gap-2">
                            <Checkbox checked={field.value.superAdmin} onCheckedChange={(v) => field.onChange({ ...field.value, superAdmin: !!v })} />
                            <span>Super Admin</span>
                          </label>
                          <label className="flex items-center gap-2">
                            <Checkbox checked={field.value.admin} onCheckedChange={(v) => field.onChange({ ...field.value, admin: !!v })} />
                            <span>Admin</span>
                          </label>
                          <label className="flex items-center gap-2">
                            <Checkbox checked={field.value.viewer} onCheckedChange={(v) => field.onChange({ ...field.value, viewer: !!v })} />
                            <span>Viewer</span>
                          </label>
                        </>
                      )} />
                    </div>

                    <div className="flex items-center gap-3 pt-2">
                      <Button type="submit">Save</Button>
                      <Button variant="outline" onClick={() => reset({ ...getValues(), roles: { superAdmin: true, admin: true, viewer: false } })}>Reset</Button>
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

              <TabsContent value="branding">
                <Form {...form}>
                  <form onSubmit={handleSubmit(onSave)} className="space-y-4">
                    <FormItem>
                      <FormLabel>Branding text</FormLabel>
                      <FormControl>
                        <Controller control={control} name="brandingText" render={({ field }) => <Textarea {...field} /> } />
                      </FormControl>
                      <FormDescription className="mb-0">Text used in reports and emails.</FormDescription>
                      <FormMessage />
                    </FormItem>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                      <div className="col-span-2">
                        <FormLabel>Upload logo (preview)</FormLabel>
                        <input
                          aria-label="Upload logo"
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const f = e.target.files?.[0] ?? null
                            handleLogo(f ?? null)
                          }}
                          className="mt-2"
                        />
                      </div>

                      <div className="h-20 w-20 rounded-md bg-muted flex items-center justify-center overflow-hidden">
                        {logoPreview ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={logoPreview} alt="logo preview" className="h-full w-full object-contain" />
                        ) : (
                          <div className="text-sm text-muted-foreground">No logo</div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 pt-2">
                      <Button type="submit">Save</Button>
                      <Button variant="outline" type="button" onClick={() => { setLogoPreview(null); setValue("brandingText", "") }}>Reset</Button>
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

