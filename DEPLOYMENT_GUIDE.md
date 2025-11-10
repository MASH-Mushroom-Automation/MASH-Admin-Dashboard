# 🚀 MASH Admin Dashboard - Login Configuration & Deployment Guide

## ✅ Current Status

Your login system is now properly configured with the following components:

### Backend Configuration

- **Backend API**: `https://mash-backend-api-production.up.railway.app`
- **Login Endpoint**: `POST /api/v1/auth/login`
- **Test Credentials**:
  ```json
  {
    "email": "mash.mushroom.automation@gmail.com",
    "password": "PP@Namias99"
  }
  ```

### Fixed Issues

1. ✅ Added runtime configuration to API routes (`runtime = 'nodejs'`)
2. ✅ Created `vercel.json` for proper API route deployment
3. ✅ Fixed backend response parsing (removed `.data` wrapper)
4. ✅ Added CORS headers for cross-origin requests
5. ✅ Created diagnostic tools at `/diagnostics`

---

## 📋 Vercel Deployment Steps

### Step 1: Set Environment Variables

1. Go to [Vercel Dashboard](https://vercel.com)
2. Navigate to your project: `mash-admin-dashboard-ashy`
3. Click **Settings** → **Environment Variables**
4. Add the following:
   - **Name**: `NEXT_PUBLIC_API_URL`
   - **Value**: `https://mash-backend-api-production.up.railway.app`
   - **Environment**: Select **Production** ✓ (and Preview if needed)
5. Click **Save**

### Step 2: Deploy to Vercel

Option A: **Automatic (from Git)**

```bash
git add .
git commit -m "fix: configure login API routes for Vercel deployment"
git push origin main
```

Vercel will auto-deploy on push.

Option B: **Manual Deploy**

```bash
npm run build  # Test locally first
vercel --prod  # Deploy to production
```

### Step 3: Verify Deployment

After deployment completes:

1. Visit: `https://mash-admin-dashboard-ashy.vercel.app/diagnostics`
2. Check all green checkmarks ✓
3. Click "Test Login" button
4. Expected result: `{ status: 200, success: true, user: {...} }`

### Step 4: Test Login Page

1. Go to: `https://mash-admin-dashboard-ashy.vercel.app/login`
2. Enter credentials:
   - **Email**: `mash.mushroom.automation@gmail.com`
   - **Password**: `PP@Namias99`
3. Click **Login**
4. You should be redirected to `/dashboard`

---

## 🔍 Troubleshooting

### Issue: "404 Not Found" on `/api/auth/login`

**Solution**: API routes not deployed

- Ensure `vercel.json` exists in project root
- Redeploy after adding runtime config
- Check Vercel build logs for errors

### Issue: "NEXT_PUBLIC_API_URL not configured"

**Solution**: Environment variable missing

- Add env var in Vercel dashboard
- Must start with `NEXT_PUBLIC_` to be available client-side
- Redeploy after adding

### Issue: "CORS Error" or "Credentials not included"

**Solution**: Cookie/CORS configuration

- Check `vercel.json` has CORS headers
- Ensure `withCredentials: true` in API calls
- Verify cookies are HttpOnly and Secure

### Issue: "Invalid credentials" or "Login failed"

**Solution**: Backend connection issue

- Test backend directly: Visit diagnostics page
- Check Railway backend is running
- Verify credentials are correct

---

## 🧪 Testing Checklist

### Local Testing

- [ ] `npm run dev` - Server starts without errors
- [ ] Visit `http://localhost:3000/api/test-backend` - Returns JSON
- [ ] Visit `http://localhost:3000/diagnostics` - All checks pass
- [ ] Test login at `http://localhost:3000/login` - Successfully logs in

### Production Testing

- [ ] Environment variable set in Vercel
- [ ] Deployed successfully (no build errors)
- [ ] Visit `/diagnostics` - Backend reachable ✓
- [ ] Test login button works - Returns user object
- [ ] Login page works - Redirects to dashboard
- [ ] Dashboard loads - Shows user info

---

## 📁 Key Files Modified

```
MASH-Admin-Dashboard/
├── .env                                  # ✅ Backend URL configured
├── vercel.json                          # ✅ NEW: API route config
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── auth/
│   │   │   │   └── login/
│   │   │   │       └── route.ts        # ✅ Added runtime config
│   │   │   └── test-backend/
│   │   │       └── route.ts            # ✅ NEW: Backend test
│   │   ├── diagnostics/
│   │   │   └── page.tsx                # ✅ NEW: Diagnostic page
│   │   └── login/
│   │       └── login-form.tsx          # ✅ Working login form
│   └── store/
│       └── authStore.ts                 # ✅ Zustand auth store
└── middleware.ts                        # ✅ Route protection
```

---

## 🔐 Authentication Flow

```
User enters credentials
        ↓
LoginForm → /api/auth/login (Next.js API route)
        ↓
POST → https://mash-backend-api-production.up.railway.app/api/v1/auth/login
        ↓
Backend validates & returns:
{
  success: true,
  accessToken: "...",
  refreshToken: "...",
  user: { id, email, firstName, lastName }
}
        ↓
Next.js API route sets HttpOnly cookies:
- authToken (1 day)
- refreshToken (30 days)
        ↓
Returns user object to client
        ↓
Zustand stores user in localStorage
        ↓
Redirect to /dashboard
        ↓
Middleware checks authToken cookie
        ↓
Dashboard loads ✓
```

---

## 🎯 Next Steps

1. **Deploy to Vercel** using steps above
2. **Test at** `/diagnostics` page
3. **Verify login** at `/login` page
4. **Monitor logs** in Vercel dashboard
5. **Check Railway** backend logs if issues persist

---

## 📞 Support

If issues persist after following this guide:

1. Check Vercel build logs
2. Check Railway backend logs
3. Review browser console for errors
4. Test backend directly with curl/Postman

---

**Last Updated**: November 6, 2025
**Status**: ✅ Ready for Deployment
