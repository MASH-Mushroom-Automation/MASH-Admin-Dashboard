# Vercel Deployment Plan for MASH Admin Dashboard

## 📋 Overview
This document outlines the complete setup process for deploying the MASH Admin Dashboard to Vercel with automated CI/CD through GitHub Actions, optimized for organization repositories.

---

## 🎯 Prerequisites

### 1. Vercel Account Setup
- [ ] Create/login to Vercel account at https://vercel.com
- [ ] Connect your GitHub account to Vercel
- [ ] Ensure you have access to the `MASH-Mushroom-Automation` organization on Vercel

### 2. Repository Access
- [ ] Ensure repository is public (✅ Already public)
- [ ] Admin access to repository settings for adding secrets
- [ ] Write access to `.github/workflows/` directory

---

## 🔑 Step 1: Obtain Vercel Credentials

### A. Get Vercel Token
1. Go to https://vercel.com/account/tokens
2. Click **"Create Token"**
3. Name it: `MASH-Admin-Dashboard-Deploy`
4. Set scope: **Full Account** (required for organization deployments)
5. Set expiration: **No Expiration** (or your preference)
6. Copy the token immediately (you won't see it again!)
7. Save as: `VERCEL_TOKEN`

### B. Get Organization ID
1. Go to https://vercel.com/teams/[your-org-name]/settings
2. Or navigate to: Vercel Dashboard → Team Settings → General
3. Scroll to **"Team ID"** section
4. Copy the Organization/Team ID
5. Save as: `VERCEL_ORG_ID`

**Alternative method using CLI:**
```bash
npx vercel login
npx vercel teams ls
```

### C. Get Project ID

**Option 1: Create Project First (Recommended)**
1. Go to https://vercel.com
2. Click **"Add New..."** → **"Project"**
3. Import `MASH-Mushroom-Automation/MASH-Admin-Dashboard`
4. Configure project:
   - **Framework Preset:** Next.js
   - **Root Directory:** `./` (default)
   - **Build Command:** `npm run build`
   - **Output Directory:** `.next` (default)
   - **Install Command:** `npm ci`
   - **Development Command:** `npm run dev`
5. Add Environment Variable:
   - Key: `NEXT_PUBLIC_API_URL`
   - Value: `https://mash-backend-api-production.up.railway.app`
   - Environment: Production, Preview, Development
6. Click **"Deploy"**
7. After deployment, go to Project Settings → General
8. Copy **"Project ID"**
9. Save as: `VERCEL_PROJECT_ID`

**Option 2: Using Vercel CLI**
```bash
cd /path/to/MASH-Admin-Dashboard
npx vercel login
npx vercel link
# Follow prompts, then check .vercel/project.json
cat .vercel/project.json
```

---

## 🔐 Step 2: Configure GitHub Secrets

### Add Secrets to Repository
1. Go to: https://github.com/MASH-Mushroom-Automation/MASH-Admin-Dashboard/settings/secrets/actions
2. Click **"New repository secret"** for each:

| Secret Name | Value | Description |
|------------|-------|-------------|
| `VERCEL_TOKEN` | `[your-token-from-step-1A]` | Vercel personal access token |
| `VERCEL_ORG_ID` | `[your-org-id-from-step-1B]` | Vercel organization/team ID |
| `VERCEL_PROJECT_ID` | `[your-project-id-from-step-1C]` | Vercel project ID |

**Note:** `GITHUB_TOKEN` is automatically provided by GitHub Actions (no need to add)

### Verify Secrets
After adding all secrets:
```bash
# Check secrets are added (names only, not values)
gh secret list --repo MASH-Mushroom-Automation/MASH-Admin-Dashboard
```

---

## 📝 Step 3: Workflow Configuration

### Current Workflow File
The updated `.github/workflows/deploy-vercel.yml` includes:

✅ **Production Deployment**
- Triggers on push to `main` branch
- Deploys to production environment
- Uses `PRODUCTION: true` flag

✅ **Preview Deployment**
- Triggers on pull requests to `main`
- Deploys to preview environment
- Adds deployment URL as PR comment
- Uses `PRODUCTION: false` flag

✅ **Organization Support**
- Uses `VERCEL_ORG_ID` for organization deployments
- Works with both personal and organization accounts
- Properly scoped permissions

### Workflow Features
- **Automated Deployments:** Every push to `main` auto-deploys
- **PR Previews:** Every PR gets a unique preview URL
- **Status Comments:** Deployment URLs posted as PR comments
- **Fast Deployments:** Uses `BetaHuhn/deploy-to-vercel-action@v1` for optimized builds

---

## 🚀 Step 4: Test the Deployment

### Test Production Deployment
1. Make a small change to the repository
2. Commit and push to `main` branch:
   ```bash
   git checkout main
   git pull origin main
   echo "# Deployment Test" >> README.md
   git add README.md
   git commit -m "test: trigger Vercel production deployment"
   git push origin main
   ```
3. Monitor deployment:
   - GitHub: Go to **Actions** tab → Watch workflow run
   - Vercel: Go to project dashboard → View deployment logs
4. Verify deployment at: `https://mash-admin-dashboard-ashy.vercel.app`

### Test Preview Deployment
1. Create a new branch:
   ```bash
   git checkout -b test/deployment-preview
   echo "# Preview Test" >> README.md
   git add README.md
   git commit -m "test: trigger Vercel preview deployment"
   git push origin test/deployment-preview
   ```
2. Create a Pull Request to `main`
3. Check PR for deployment comment with preview URL
4. Visit preview URL to verify changes

---

## 🔧 Step 5: Vercel Project Settings

### Essential Environment Variables
Configure in Vercel Dashboard → Project → Settings → Environment Variables:

| Variable | Value | Environments |
|----------|-------|--------------|
| `NEXT_PUBLIC_API_URL` | `https://mash-backend-api-production.up.railway.app` | Production, Preview, Development |

### Build & Development Settings
- **Framework Preset:** Next.js
- **Build Command:** `npm run build`
- **Output Directory:** `.next`
- **Install Command:** `npm ci`
- **Development Command:** `npm run dev`
- **Node.js Version:** 20.x (matches workflow)

### Domain Settings (Optional)
1. Go to Project Settings → Domains
2. Add custom domain if desired
3. Configure DNS records as instructed

---

## 🐛 Troubleshooting

### Common Issues

#### 1. "Project not found" Error
**Cause:** `VERCEL_PROJECT_ID` is incorrect or project doesn't exist in the organization
**Solution:**
- Verify project exists in Vercel dashboard
- Re-check Project ID from project settings
- Ensure project is under the correct organization

#### 2. "Insufficient permissions" Error
**Cause:** `VERCEL_TOKEN` doesn't have organization access
**Solution:**
- Regenerate token with **Full Account** scope
- Ensure token creator has admin access to organization
- Update `VERCEL_TOKEN` secret in GitHub

#### 3. "Organization ID invalid" Error
**Cause:** Using personal account ID instead of organization ID
**Solution:**
- Go to Team Settings (not personal settings)
- Copy the Team ID (starts with `team_...`)
- Update `VERCEL_ORG_ID` secret

#### 4. Build Fails in Vercel
**Cause:** Missing dependencies or environment variables
**Solution:**
- Check build logs in Vercel dashboard
- Verify all environment variables are set
- Test build locally: `npm run build`
- Check `next.config.ts` for any issues

#### 5. Preview Deployment Not Commenting on PR
**Cause:** Permissions issue or GitHub token expired
**Solution:**
- Verify workflow has `pull-requests: write` permission (✅ Already set)
- Check Actions logs for errors
- Ensure `GITHUB_TOKEN` has proper scopes

---

## 📊 Monitoring & Maintenance

### Check Deployment Status
- **GitHub Actions:** https://github.com/MASH-Mushroom-Automation/MASH-Admin-Dashboard/actions
- **Vercel Dashboard:** https://vercel.com/mash-mushroom-automation/mash-admin-dashboard
- **Production URL:** https://mash-admin-dashboard-ashy.vercel.app

### Regular Maintenance
- [ ] Review deployment logs weekly
- [ ] Monitor build times and optimize if needed
- [ ] Rotate `VERCEL_TOKEN` every 6-12 months
- [ ] Update Node.js version in workflow when upgrading locally
- [ ] Review and clean up old preview deployments in Vercel

### Performance Optimization
- Use Vercel Analytics (enable in project settings)
- Monitor Core Web Vitals
- Set up Vercel Speed Insights
- Configure caching headers in `next.config.ts` if needed

---

## 🔄 Deployment Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│  Developer pushes to main / creates PR                       │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│  GitHub Actions Workflow Triggered                           │
│  - Checkout code                                             │
│  - Setup Node.js 20                                          │
│  - Install Vercel CLI                                        │
└─────────────────┬───────────────────────────────────────────┘
                  │
          ┌───────┴────────┐
          │                │
          ▼                ▼
┌──────────────────┐  ┌──────────────────┐
│  Push to main    │  │  Pull Request    │
│  (Production)    │  │  (Preview)       │
└────────┬─────────┘  └────────┬─────────┘
         │                     │
         ▼                     ▼
┌──────────────────┐  ┌──────────────────┐
│  Deploy to       │  │  Deploy to       │
│  Production      │  │  Preview         │
│  PRODUCTION=true │  │  PRODUCTION=false│
└────────┬─────────┘  └────────┬─────────┘
         │                     │
         ▼                     ▼
┌──────────────────┐  ┌──────────────────┐
│  Production URL  │  │  Preview URL +   │
│  Live            │  │  PR Comment      │
└──────────────────┘  └──────────────────┘
```

---

## ✅ Post-Deployment Checklist

After successful deployment:

- [ ] Verify production URL loads correctly
- [ ] Test authentication flow (login/logout)
- [ ] Check all dashboard pages render
- [ ] Verify API proxy is working (check `/api/proxy/*` routes)
- [ ] Test MASH Market pages (users, sellers, products, orders)
- [ ] Test MASH Grow pages (devices, registered users)
- [ ] Verify environment variable is accessible (`NEXT_PUBLIC_API_URL`)
- [ ] Test preview deployment by creating a test PR
- [ ] Confirm PR comment appears with preview URL
- [ ] Check Vercel dashboard for successful deployment status
- [ ] Set up custom domain (if needed)
- [ ] Configure Vercel Analytics (optional)
- [ ] Add team members to Vercel project (if needed)

---

## 📞 Support & Resources

### Documentation
- **Vercel Docs:** https://vercel.com/docs
- **GitHub Actions Docs:** https://docs.github.com/en/actions
- **Next.js Deployment:** https://nextjs.org/docs/deployment
- **Deploy Action:** https://github.com/BetaHuhn/deploy-to-vercel-action

### MASH Admin Dashboard Specific
- **Build Status:** See `BUILD_STATUS.md`
- **Deployment Guide:** See `DEPLOYMENT_GUIDE.md`
- **Backend Integration:** See `BACKEND_INTEGRATION_PLAN.md`
- **Production URL:** https://mash-admin-dashboard-ashy.vercel.app

### Getting Help
- Check GitHub Actions logs for detailed error messages
- Review Vercel deployment logs in dashboard
- Test locally with `npm run build` before deploying
- Consult `DEPLOYMENT_GUIDE.md` for troubleshooting tips

---

## 🎉 Success Criteria

Your deployment is successful when:

✅ GitHub Actions workflow completes without errors  
✅ Vercel dashboard shows "Ready" status  
✅ Production URL loads the application  
✅ All pages are accessible and functional  
✅ API calls work correctly through `/api/proxy/*`  
✅ PR previews are generated automatically  
✅ Preview URLs are posted as PR comments  
✅ Environment variables are properly configured  
✅ No console errors in browser DevTools  
✅ Authentication flow works end-to-end  

---

**Last Updated:** November 16, 2025  
**Workflow Version:** v2.0 (Organization-optimized)  
**Maintainer:** MASH Development Team
