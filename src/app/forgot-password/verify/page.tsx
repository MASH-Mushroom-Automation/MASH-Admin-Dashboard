"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"

const otpSchema = z.object({
  otp: z.string().regex(/^\d{6}$/, "OTP must be 6 digits"),
})

type OTPFormData = z.infer<typeof otpSchema>

export default function VerifyOTPPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [resendLoading, setResendLoading] = useState(false)
  const [timeLeft, setTimeLeft] = useState(60)
  const [email, setEmail] = useState("")

  useEffect(() => {
    // Get email from sessionStorage
    const storedEmail = sessionStorage.getItem("resetEmail")
    if (!storedEmail) {
      router.push("/forgot-password")
      return
    }
    setEmail(storedEmail)
  }, [router])

  useEffect(() => {
    if (timeLeft <= 0) return

    const timer = setTimeout(() => {
      setTimeLeft(timeLeft - 1)
    }, 1000)

    return () => clearTimeout(timer)
  }, [timeLeft])

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<OTPFormData>({
    resolver: zodResolver(otpSchema),
  })

  const onSubmit = async (_data: OTPFormData) => {
    setIsLoading(true)
    try {
      // Simulate successful OTP verification
      await new Promise((resolve) => setTimeout(resolve, 1500))
      toast.success("OTP verified successfully. Proceed to reset your password.")
      router.push("/forgot-password/reset")
    } catch {
      toast.error("Something went wrong")
    } finally {
      setIsLoading(false)
    }
  }

  const handleResendOTP = async () => {
    setResendLoading(true)
    try {
      // Simulate resend delay
      await new Promise((resolve) => setTimeout(resolve, 1500))
      toast.success("OTP resent to your email.")
      setTimeLeft(60)
    } catch {
      toast.error("Failed to resend OTP")
    } finally {
      setResendLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-center my-15.5">
      <Card className="w-full max-w-md p-10">
        <CardHeader className="space-y-2">
          <CardTitle className="text-2xl">Verify OTP</CardTitle>
          <CardDescription>Enter the 6-digit code sent to {email}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="otp" className="text-sm font-medium">
                OTP Code
              </label>
              <Input
                id="otp"
                type="text"
                placeholder="000000"
                maxLength={6}
                {...register("otp")}
                disabled={isLoading}
                aria-invalid={!!errors.otp}
                className="text-center text-2xl tracking-widest mt-2"
              />
              <div className="min-h-5">
              {errors.otp && <p className="text-sm text-destructive">{errors.otp.message}</p>}
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isLoading ? "Verifying..." : "Verify OTP"}
            </Button>

            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                {timeLeft > 0 ? `Resend in ${timeLeft}s` : "Code expired?"}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleResendOTP}
                disabled={timeLeft > 0 || resendLoading}
              >
                {resendLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Resend OTP
              </Button>
            </div>

            <div className="text-center text-sm">
              <a href="/forgot-password" className="text-primary hover:underline">
                Back to email
              </a>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
