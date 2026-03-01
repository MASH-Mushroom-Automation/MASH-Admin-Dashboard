# Vercel Deployment Checklist

## Pre-Deployment Setup

### 1. Vercel Account & Project
- [ ] Vercel account created and logged in
- [ ] GitHub account connected to Vercel
- [ ] Access to MASH-Mushroom-Automation organization on Vercel
- [ ] New project created in Vercel dashboard
- [ ] Project name: `mash-admin-dashboard` (or similar)
- [ ] Repository imported: `MASH-Mushroom-Automation/MASH-Admin-Dashboard`

### 2. Vercel Credentials Obtained
- [ ] `VERCEL_TOKEN` - Personal access token with "Full Account" scope
- [ ] `VERCEL_ORG_ID` - Team/Organization ID from settings
- [ ] `VERCEL_PROJECT_ID` - Project ID from project settings

### 3. GitHub Secrets Configured
Navigate to: Repository Settings → Secrets and variables → Actions

- [ ] `VERCEL_TOKEN` added
- [ ] `VERCEL_ORG_ID` added
- [ ] `VERCEL_PROJECT_ID` added
- [ ] All secrets verified (no typos)

### 4. Vercel Project Configuration
In Vercel Dashboard → Project Settings:

**Build & Development Settings:**
- [ ] Framework Preset: Next.js
- [ ] Build Command: `npm run build`
- [ ] Output Directory: `.next`
- [ ] Install Command: `npm ci`
- [ ] Development Command: `npm run dev`
- [ ] Node.js Version: 20.x

**Environment Variables:**
- [ ] `NEXT_PUBLIC_API_URL` added
- [ ] Value: `https://mash-backend-api-production.up.railway.app`
- [ ] Exposed to: Production, Preview, Development

---

## Deployment Testing

### 5. Test Production Deployment
- [ ] Push to `main` branch completed
- [ ] GitHub Actions workflow triggered
- [ ] Workflow status: ✅ Success
- [ ] Vercel deployment status: Ready
- [ ] Production URL accessible
- [ ] Application loads without errors

**Production URL to verify:**
```
https://[your-vercel-project].vercel.app
```

### 6. Test Preview Deployment
- [ ] Test branch created
- [ ] Pull request to `main` created
- [ ] GitHub Actions workflow triggered for PR
- [ ] Preview deployment successful
- [ ] Preview URL posted as PR comment
- [ ] Preview URL accessible
- [ ] Changes visible in preview

---

## Functional Testing

### 7. Authentication Flow
- [ ] Login page loads
- [ ] Hardcoded admin login works (`mash.mushroom.automation@gmail.com`)
- [ ] Backend login works
- [ ] Tokens stored correctly (check cookies)
- [ ] Dashboard accessible after login
- [ ] Logout works properly

### 8. API Integration
- [ ] `/api/proxy` routes work
- [ ] Backend API calls successful
- [ ] Dashboard data loads
- [ ] Environment variable accessible
- [ ] No CORS errors in console

### 9. Core Features (Spot Check)

**MASH Market:**
- [ ] User management page loads
- [ ] Seller page displays data
- [ ] Product page functional
- [ ] Order page accessible

**MASH Grow:**
- [ ] Devices page loads
- [ ] Registered users page works
- [ ] CMS page accessible

**Other:**
- [ ] Settings page loads
- [ ] Forgot password flow works
- [ ] Registration flow works

### 10. Performance & Errors
- [ ] No console errors in browser DevTools
- [ ] No 404 errors for assets
- [ ] Page load time acceptable (<3s)
- [ ] Images load correctly
- [ ] API responses within reasonable time

---

## Post-Deployment

### 11. Monitoring Setup
- [ ] Vercel Analytics enabled (optional)
- [ ] Error tracking configured (if applicable)
- [ ] Performance metrics reviewed
- [ ] Deployment notifications configured

### 12. Documentation
- [ ] Team notified of deployment
- [ ] Production URL shared with stakeholders
- [ ] Deployment process documented
- [ ] Known issues documented (if any)

### 13. Access Management
- [ ] Team members added to Vercel project
- [ ] Proper roles/permissions assigned
- [ ] GitHub repository access verified
- [ ] Secrets access restricted to admins

---

## Rollback Plan (If Needed)

### 14. Emergency Rollback
If deployment fails or critical issues occur:

- [ ] Identify previous working deployment in Vercel dashboard
- [ ] Click "Promote to Production" on previous deployment
- [ ] Verify rollback successful
- [ ] Investigate issues in failed deployment
- [ ] Document issue for resolution

**Rollback Command (if needed):**
```bash
# Revert to previous commit
git revert HEAD
git push origin main
```

---

## Success Criteria

✅ **Deployment is successful when ALL of the following are true:**

1. GitHub Actions workflow completes without errors
2. Vercel dashboard shows "Ready" status
3. Production URL loads the application
4. Authentication works (login/logout)
5. API calls work through proxy
6. All main pages are accessible
7. No critical console errors
8. PR previews generate automatically
9. Team can access and use the application
10. Performance is acceptable

---

## Deployment Timeline

| Phase | Estimated Time | Status |
|-------|---------------|--------|
| Get Vercel credentials | 5 min | ⬜ |
| Add GitHub secrets | 2 min | ⬜ |
| Configure Vercel project | 5 min | ⬜ |
| Test production deploy | 3 min | ⬜ |
| Test preview deploy | 3 min | ⬜ |
| Functional testing | 10 min | ⬜ |
| Documentation | 5 min | ⬜ |
| **Total** | **~30-35 min** | |

---

## Notes & Issues

**Date:** _____________  
**Deployed By:** _____________  
**Production URL:** _____________  
**Preview URL (test):** _____________  

**Issues Encountered:**
```
(Record any issues here)
```

**Resolution Steps:**
```
(Document solutions here)
```

---

## Resources

- **Workflow File:** `.github/workflows/deploy-vercel.yml`
- **Quick Start:** `VERCEL_QUICK_START.md`
- **Full Plan:** `VERCEL_DEPLOYMENT_PLAN.md`
- **Build Status:** `BUILD_STATUS.md`
- **Deployment Guide:** `DEPLOYMENT_GUIDE.md`

- **GitHub Actions:** https://github.com/MASH-Mushroom-Automation/MASH-Admin-Dashboard/actions
- **Vercel Dashboard:** https://vercel.com/mash-mushroom-automation
- **Repository Settings:** https://github.com/MASH-Mushroom-Automation/MASH-Admin-Dashboard/settings

---

**Last Updated:** November 16, 2025  
**Version:** 1.0  
**Status:** Ready for deployment
