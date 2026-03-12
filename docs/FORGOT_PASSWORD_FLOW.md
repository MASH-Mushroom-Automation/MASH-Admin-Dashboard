# Forgot Password Flow Documentation

## Overview

The forgot password feature implements a secure 3-step wizard using 6-digit email verification codes. This flow is configured to use **localhost backend only** (`http://localhost:3000`) while all other application features use the production API.

## Architecture

### Backend Configuration

- **Forgot Password Endpoints**: `http://localhost:3000` (hardcoded)
- **All Other Endpoints**: `https://mash-backend-api-production.up.railway.app` (via `NEXT_PUBLIC_API_URL`)

### Why Localhost?

This configuration allows development and testing of password reset functionality against a local backend instance while keeping the rest of the application connected to production services.

## 3-Step Process Flow

### Step 1: Request Password Reset

**Location**: `/src/app/forgot-password/forgot-pass/page.tsx`

**Endpoint**: `POST http://localhost:3000/api/v1/auth/forgot-password`

**Features**:
- ✅ Rate limiting: 3 requests per 5 minutes
- ✅ Code expires in 10 minutes
- ✅ Does not reveal if email exists (security best practice)
- ✅ Only numeric 6-digit code (mobile-friendly)
- ✅ Enhanced toast notifications with loading states

**Request Body**:
```json
{
  "email": "user@example.com"
}
```

**Success Response**:
```json
{
  "success": true,
  "statusCode": 200,
  "data": {
    "success": true,
    "message": "A 6-digit password reset code has been sent to your email.",
    "expiresIn": "10 minutes",
    "email": "user@example.com",
    "nextStep": "Verify the code using POST /auth/verify-reset-code, then reset password with POST /auth/reset-password"
  }
}
```

**Error Responses**:

400 - Rate limit with countdown:
```json
{
  "success": false,
  "statusCode": 400,
  "error": {
    "type": "BadRequestException",
    "code": "INTERNAL_SERVER_ERROR",
    "message": "Please wait 59 seconds before requesting a new code."
  }
}
```

429 - Too many requests:
```json
{
  "success": false,
  "statusCode": 429,
  "error": {
    "message": "Too many reset requests. Please try again later."
  }
}
```

**Error Handling**:
The frontend extracts error messages from nested structure:
```typescript
const errorMessage = 
  result.error?.message || 
  result.message || 
  result.error?.details?.message ||
  "Failed to send reset code";
```

**Toast Notifications**:
- Loading: "Sending reset code to your email..."
- Success: "Reset Code Sent! A 6-digit code has been sent to {email}. Code expires in 10 minutes."
- Error: Specific error message based on response (rate limiting, server error, etc.)

**State Management**:
```javascript
sessionStorage.setItem('resetEmail', email) // Persist for next step
router.push('/forgot-password/verify')
```

---

### Step 2: Verify Reset Code

**Location**: `/src/app/forgot-password/verify/page.tsx`

**Endpoint**: `POST http://localhost:3000/api/v1/auth/verify-reset-code`

**Features**:
- Optional pre-validation step (recommended for better UX)
- Max 5 verification attempts before code invalidation
- Clear error messages for expired/invalid codes
- Resend functionality with 1-minute cooldown timer
- Rate limiting: 3 resend requests per 5 minutes

**Request Body**:
```json
{
  "email": "user@example.com",
  "code": "123456"
}
```

**Success Response**:
```json
{
  "success": true,
  "message": "Code verified successfully",
  "nextStep": "Reset your password with POST /auth/reset-password"
}
```

**Error Responses**:
- Expired code: "Code has expired. Please request a new one."
- Invalid code: "Invalid code. Please check and try again."
- Too many attempts: "Too many failed attempts. Please request a new code."

**Toast Notifications**:
- Loading: "Verifying your code..."
- Success: "Code Verified! You can now reset your password."
- Error: Specific error message (expired, invalid, attempts exceeded)

**Resend Code Feature**:

**Endpoint**: `POST http://localhost:3000/api/v1/auth/resend-password-reset-code`

**Request Body**:
```json
{
  "email": "user@example.com"
}
```

**UI Behavior**:
- 60-second countdown timer after each send
- Button disabled during cooldown: "Resend Code (45s)"
- Toast: "New Code Sent! A new 6-digit code has been sent to {email}."

**State Management**:
```javascript
const email = sessionStorage.getItem('resetEmail') // From step 1
if (!email) router.push('/forgot-password') // Guard clause

sessionStorage.setItem('resetCode', code) // Store verified code
router.push('/forgot-password/reset')
```

---

### Step 3: Reset Password

**Location**: `/src/app/forgot-password/reset/page.tsx`

**Endpoint**: `POST http://localhost:3000/api/v1/auth/reset-password`

**Features**:
- Single-use code (becomes invalid after successful reset)
- Comprehensive password validation
- Show/hide password toggle
- Password confirmation matching
- Auto-fill verified code from previous step

**Request Body**:
```json
{
  "email": "user@example.com",
  "code": "123456",
  "newPassword": "SecurePass123!"
}
```

**Password Requirements**:
- ✅ Minimum 8 characters
- ✅ At least one uppercase letter
- ✅ At least one lowercase letter
- ✅ At least one number
- ✅ At least one special character

**Success Response**:
```json
{
  "success": true,
  "message": "Password has been reset successfully",
  "nextStep": "You can now log in with your new password"
}
```

**Error Responses**:
- Expired code: "Reset code has expired. Please request a new one."
- Invalid code: "Invalid reset code. Please check and try again."
- Password validation: "Password does not meet security requirements."

**Toast Notifications**:
- Loading: "Resetting your password..."
- Success: "Password Reset Successful! Your password has been changed. Redirecting to login..."
- Error: Specific error message with actionable guidance

**Form Validation** (Zod Schema):
```typescript
const resetSchema = z
  .object({
    newPassword: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Must contain uppercase letter")
      .regex(/[a-z]/, "Must contain lowercase letter")
      .regex(/[0-9]/, "Must contain number")
      .regex(/[^A-Za-z0-9]/, "Must contain special character"),
    confirmPassword: z.string(),
    otp: z.string().regex(/^\d{6}$/, "OTP must be 6 digits"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });
```

**State Management**:
```javascript
const email = sessionStorage.getItem('resetEmail') // From step 1
const code = sessionStorage.getItem('resetCode') // From step 2 (optional)

// After success:
sessionStorage.removeItem('resetEmail')
sessionStorage.removeItem('resetCode')
router.push('/login') // 1.5s delay
```

---

## Security Features

### Rate Limiting
- **3 requests per 5 minutes** for code requests
- **1-minute cooldown** between resend requests
- Prevents brute force attacks

### Code Expiration
- **10-minute expiry** for all codes
- Automatic invalidation after use
- Maximum 5 verification attempts

### Session Management
- Email stored in `sessionStorage` (cleared on tab close)
- Code not exposed to client until verified
- Automatic cleanup after successful reset

### Error Handling
- Generic messages for non-existent emails (security best practice)
- Specific error messages only after email verification
- Clear guidance for rate limiting and cooldowns

---

## Toast Notification System

All pages use **Sonner** for toast notifications with consistent patterns:

### Loading Toasts
```javascript
const loadingToast = toast.loading("Operation in progress...")
// ... perform async operation
toast.dismiss(loadingToast)
```

### Success Toasts
```javascript
toast.success("Operation Successful!", {
  description: "Additional details here",
  duration: 5000, // 5 seconds
})
```

### Error Toasts
```javascript
toast.error("Operation Failed", {
  description: error.message || "Generic error message",
  duration: 5000,
})
```

---

## User Experience Features

### Mobile-Friendly
- Numeric 6-digit codes (auto-triggers numeric keyboard on mobile)
- Large input fields with tracking for easy typing
- Clear error messages with actionable guidance

### Visual Feedback
- Loading spinners on all buttons during async operations
- Countdown timers for resend cooldowns
- Show/hide password toggles with eye icons
- Real-time form validation with error messages

### Accessibility
- `aria-invalid` attributes on error fields
- Semantic HTML with proper labels
- Keyboard navigation support
- Screen reader friendly error messages

---

## Testing the Flow

### Prerequisites
1. Backend running on `http://localhost:3000`
2. Email service configured for sending codes
3. Frontend running on `http://localhost:3001`

### Test Scenarios

#### Happy Path
1. Navigate to `/forgot-password/forgot-pass`
2. Enter valid email → receive code
3. Enter 6-digit code → verify successfully
4. Enter new password (meeting requirements) → reset successful
5. Redirected to login page

#### Rate Limiting
1. Request code 3 times within 5 minutes
2. Should see error: "Please wait X seconds before requesting a new code."

#### Code Expiration
1. Request code
2. Wait 10+ minutes
3. Try to verify → should see "Code has expired"

#### Invalid Code
1. Request code
2. Enter incorrect code 5 times
3. Should see "Too many failed attempts"

#### Session Expiration
1. Start flow → navigate away → close tab
2. Open new tab → try to access `/verify` or `/reset` directly
3. Should redirect to start of flow

---

## Configuration Changes

### To Use Production Backend Instead

If you need to switch forgot password to use production backend:

**Step 1**: Update `forgot-pass/page.tsx`
```typescript
// Change this:
const LOCALHOST_API_URL = "http://localhost:3000";

// To this:
const LOCALHOST_API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
```

**Step 2**: Update `verify/page.tsx`
```typescript
// Change all instances of:
`http://localhost:3000/api/v1/auth/...`

// To:
`${process.env.NEXT_PUBLIC_API_URL}/api/v1/auth/...`
```

**Step 3**: Update `reset/page.tsx`
```typescript
// Same as Step 2
```

---

## Troubleshooting

### "Failed to Send Code"
- ✅ Check backend is running on `http://localhost:3000`
- ✅ Verify email service is configured
- ✅ Check network tab for CORS errors
- ✅ Review backend logs for errors

### "Code has expired"
- Codes expire after 10 minutes
- Request a new code using the resend button

### "Too many failed attempts"
- Maximum 5 verification attempts per code
- Request a new code to reset attempt counter

### "Session expired"
- Browser cleared `sessionStorage`
- User closed and reopened tab/browser
- Start flow from beginning at `/forgot-password/forgot-pass`

### Rate Limiting Issues
- Wait for cooldown period to expire
- Check `X-RateLimit-Reset` header in response
- Backend enforces 3 requests per 5 minutes

---

## Code Files Reference

| File | Purpose | Lines |
|------|---------|-------|
| `/src/app/forgot-password/layout.tsx` | Shared layout wrapper | 15 |
| `/src/app/forgot-password/forgot-pass/page.tsx` | Step 1: Request code | 119 |
| `/src/app/forgot-password/verify/page.tsx` | Step 2: Verify code | 195 |
| `/src/app/forgot-password/reset/page.tsx` | Step 3: Reset password | 244 |

---

## Future Enhancements

### Potential Improvements
- [ ] SMS verification option (in addition to email)
- [ ] Progress indicator showing current step (1 of 3, 2 of 3, etc.)
- [ ] Remember me option (extend session)
- [ ] Password strength indicator with visual bar
- [ ] Support for magic link (passwordless option)
- [ ] Biometric authentication for mobile apps

### Backend Integration
- [ ] Add WebSocket support for real-time code delivery
- [ ] Implement audit logging for password resets
- [ ] Add multi-factor authentication option
- [ ] Support for password history (prevent reuse)

---

## Related Documentation

- **Authentication Architecture**: See `.github/copilot-instructions.md` section "Authentication Architecture"
- **Toast Notifications**: See Sonner documentation at https://sonner.emilkowal.ski/
- **Form Validation**: React Hook Form + Zod at https://react-hook-form.com/
- **Backend API**: See backend swagger docs at `http://localhost:3000/api/docs`
