"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"

const emailSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
})

type EmailFormData = z.infer<typeof emailSchema>

export default function ForgotPasswordPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<EmailFormData>({
    resolver: zodResolver(emailSchema),
  })

  const onSubmit = (data: EmailFormData) => {
    setIsLoading(true)

    // Simulate sending OTP for frontend-only demo
    setTimeout(() => {
      toast.success(`A verification code has been sent to ${data.email}.`)
      sessionStorage.setItem("resetEmail", data.email)
      router.push("/forgot-password/verify")
      setIsLoading(false)
    }, 1500)
  }

  return (
    <div className="p-4 my-[13px] flex">
      <Card className="w-full max-w-md py-10 p-10 flex">
        <CardHeader>
          <CardTitle className="text-2xl">Forgot Password</CardTitle>
          <CardDescription>
           Enter your email to receive a reset code.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
            {/* Email Field */}
            <div className="space-y-1 mt-[-10px]">
              <label htmlFor="email" className="text-sm font-medium">
                Email Address
              </label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                {...register("email")}
                disabled={isLoading}
                aria-invalid={!!errors.email}
                className="mt-3"
              />
              <div className="min-h-5">
                {errors.email && (
                  <p className="text-sm text-destructive">{errors.email.message}</p>
                )}
              </div>
            </div>

            {/* Submit Button */}
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isLoading ? "Sending..." : "Send Reset Code"}
            </Button>

            {/* Footer */}
            <div className="text-center text-sm">
              <span className="text-muted-foreground">Remember your password? </span>
              <a href="/login" className="text-primary hover:underline">
                Back to login
              </a>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}