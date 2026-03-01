# Quick Start: Vercel Deployment Setup

## 🚀 Get Started in 5 Steps

### Step 1: Get Vercel Credentials (5 minutes)

**A. Vercel Token**
```
1. Visit: https://vercel.com/account/tokens
2. Create token with "Full Account" scope
3. Copy token → Save as VERCEL_TOKEN
```

**B. Organization ID**
```
1. Visit: https://vercel.com/teams/[your-org]/settings
2. Copy "Team ID" → Save as VERCEL_ORG_ID
```

**C. Project ID**
```
Option 1 (Recommended):
1. Create new project in Vercel dashboard
2. Import: MASH-Mushroom-Automation/MASH-Admin-Dashboard
3. Add env var: NEXT_PUBLIC_API_URL=https://mash-backend-api-production.up.railway.app
4. Deploy once
5. Go to Settings → General → Copy Project ID → Save as VERCEL_PROJECT_ID

Option 2 (CLI):
npx vercel login
npx vercel link
cat .vercel/project.json
```

---

### Step 2: Add GitHub Secrets (2 minutes)

Go to: https://github.com/MASH-Mushroom-Automation/MASH-Admin-Dashboard/settings/secrets/actions

Add these 3 secrets:
- `VERCEL_TOKEN` → [from Step 1A]
- `VERCEL_ORG_ID` → [from Step 1B]  
- `VERCEL_PROJECT_ID` → [from Step 1C]

---

### Step 3: Verify Workflow File (Already Done ✅)

File: `.github/workflows/deploy-vercel.yml`
- Production deploys on push to `main`
- Preview deploys on pull requests
- Uses organization-compatible action

---

### Step 4: Test Production Deploy (2 minutes)

```bash
git checkout main
git pull origin main
echo "# Test Deploy" >> README.md
git add README.md
git commit -m "test: trigger production deployment"
git push origin main
```

Watch at: https://github.com/MASH-Mushroom-Automation/MASH-Admin-Dashboard/actions

---

### Step 5: Test Preview Deploy (3 minutes)

```bash
git checkout -b test/preview
echo "# Preview Test" >> README.md
git add README.md
git commit -m "test: preview deployment"
git push origin test/preview
```

Create PR → Check for deployment comment with preview URL

---

## ✅ Success Checklist

- [ ] All 3 secrets added to GitHub
- [ ] Production deployment workflow runs successfully
- [ ] Site loads at production URL
- [ ] PR preview deployment works
- [ ] Preview URL comment appears on PR
- [ ] Environment variables accessible in app

---

## 🐛 Quick Troubleshooting

| Issue | Solution |
|-------|----------|
| "Project not found" | Re-check VERCEL_PROJECT_ID |
| "Insufficient permissions" | Regenerate token with "Full Account" scope |
| Build fails | Check environment variables in Vercel |
| No PR comment | Verify workflow has `pull-requests: write` permission |

---

## 📚 Full Documentation

See `VERCEL_DEPLOYMENT_PLAN.md` for:
- Detailed step-by-step instructions
- Complete troubleshooting guide
- Deployment flow diagrams
- Maintenance procedures
- Advanced configuration options

---

**Deployment Time:** ~10-15 minutes total  
**Support:** Check Actions logs or Vercel dashboard for errors
