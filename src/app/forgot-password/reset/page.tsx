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
import { Loader2, Eye, EyeOff } from "lucide-react"

const resetSchema = z
  .object({
    newPassword: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })

type ResetFormData = z.infer<typeof resetSchema>

export default function ResetPasswordPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ResetFormData>({
    resolver: zodResolver(resetSchema),
  })

  const password = watch("newPassword")

  const getPasswordStrength = (pwd: string) => {
    if (!pwd) return { strength: 0, label: "", color: "" }
    let strength = 0
    if (pwd.length >= 8) strength++
    if (pwd.length >= 12) strength++
    if (/[A-Z]/.test(pwd)) strength++
    if (/[0-9]/.test(pwd)) strength++
    if (/[^A-Za-z0-9]/.test(pwd)) strength++

    const levels = [
      { strength: 0, label: "", color: "" },
      { strength: 1, label: "Weak", color: "bg-destructive" },
      { strength: 2, label: "Fair", color: "bg-yellow-500" },
      { strength: 3, label: "Good", color: "bg-blue-500" },
      { strength: 4, label: "Strong", color: "bg-green-500" },
      { strength: 5, label: "Very Strong", color: "bg-green-600" },
    ]

    return levels[Math.min(strength, 5)]
  }

  // Removed: const strength = getPasswordStrength(password) - feature is commented out below

  const onSubmit = async (data: ResetFormData) => {
    setIsLoading(true)
    try {
      const email = sessionStorage.getItem("resetEmail")
      if (!email) {
        throw new Error("Session expired. Please start over.")
      }

      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          newPassword: data.newPassword,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to reset password")
      }

     toast.success("Password successfully reset. Redirecting to login...")


      // Clear session storage
      sessionStorage.removeItem("resetEmail")

      // Redirect to login after a short delay
      setTimeout(() => {
        router.push("/login")
      }, 1500)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to reset password")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-center my-14">
      <Card className="w-full max-w-md p-10">
        <CardHeader>
          <CardTitle className="text-2xl">Create New Password</CardTitle>
          <CardDescription>Enter a strong password to secure your account.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)}>
            {/* New Password */}
            <div className="space-y-2">
              <label htmlFor="newPassword" className="text-sm font-medium">
                New Password
              </label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter new password"
                  {...register("newPassword")}
                  disabled={isLoading}
                  aria-invalid={!!errors.newPassword}
                   className="mt-2"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
               <div className="min-h-5">
              {errors.newPassword && <p className="text-sm text-destructive">{errors.newPassword.message}</p>}
              </div>


              {/* Password Strength Indicator */}
              {/* {password && (
                <div className="space-y-1">
                  <div className="flex gap-1">
                    {[...Array(5)].map((_, i) => (
                      <div
                        key={i}
                        className={`h-1 flex-1 rounded-full ${i < strength.strength ? strength.color : "bg-muted"}`}
                      />
                    ))}
                  </div>
                  {strength.label && (
                    <p className="text-xs text-muted-foreground">
                      Strength: <span className="font-medium">{strength.label}</span>
                    </p>
                  )}
                </div>
              )} */}
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirmPassword" className="text-sm font-medium">
                Confirm Password
              </label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirm ? "text" : "password"}
                  placeholder="Confirm password"
                  {...register("confirmPassword")}
                  disabled={isLoading}
                  aria-invalid={!!errors.confirmPassword}
                  className="mt-2"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label={showConfirm ? "Hide password" : "Show password"}
                >
                  {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
                  <div className="min-h-5">
              {errors.confirmPassword && <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>}
              </div>
            </div>

            <Button type="submit" className="w-full my-4" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isLoading ? "Resetting..." : "Reset Password"}
            </Button>

            <div className="text-center text-sm">
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
