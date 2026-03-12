# Dashboard Store Diagnostic Logging Guide

## 📊 Comprehensive Logging Added

All dashboard store fetch functions now include extensive diagnostic logging to trace execution flow and identify data source issues.

---

## 🔍 What's Logged

### For Every Fetch Function

Each function (`fetchOverview`, `fetchSales`, `fetchChambers`, `fetchUsersStats`, `fetchUsers`, `fetchCards`) now logs:

#### 1. **Function Start** 🚀

```
========================================
[debug:fetchOverview] 🚀 STARTING fetchOverview
========================================
```

#### 2. **Token Status** 🔐

```
[debug:fetchOverview] 🔐 Access token status: {
  hasToken: true,
  tokenLength: 847,
  tokenPreview: "eyJhbGciOiJIUzI1NiIs..."
}
```

**This tells you:**

- Whether an access token exists in memory
- Token length (should be > 0)
- First 20 characters of token

#### 3. **API Call Details** 📡

```
[debug:fetchOverview] 📡 Preparing API call...
[debug:fetchOverview] 📍 Endpoint: v1/super-admin/dashboard/overview
[debug:fetchOverview] 🔧 Method: GET
[debug:fetchOverview] 📦 Using api instance (automatic token injection)
[debug:fetchOverview] ⏳ Sending request to backend...
```

#### 4. **Response Status** ✅

```
[debug:fetchOverview] ✅ API call completed successfully
[debug:fetchOverview] 📥 Response status: 200
[debug:fetchOverview] 📥 Response headers: { ... }
```

#### 5. **Full Response Payload** 📦

```
[debug:fetchOverview] 📦 Full response payload:
{
  "success": true,
  "statusCode": 200,
  "data": {
    "cards": {
      "chambers": { "active": 12, "inactive": 3 },
      "orders": { "completed": 145, "pending": 23 }
    }
  }
}
```

#### 6. **Payload Structure Analysis** 🔍

```
[debug:fetchOverview] 🔍 Payload structure analysis: {
  hasSuccess: true,
  successValue: true,
  hasStatusCode: true,
  statusCode: 200,
  hasData: true,
  dataType: "object",
  hasDataCards: true
}
```

#### 7. **Data Extraction Path** 🗺️

```
[debug:fetchOverview] 🔍 Starting data extraction...
[debug:fetchOverview] ✅ Found data at payload.data.cards
[debug:fetchOverview] 📊 Data content: { chambers: {...}, orders: {...} }
[debug:fetchOverview] 📍 Data extracted from: payload.data.cards
```

**Possible paths:**

- `payload.data.cards` (expected)
- `payload.data` (fallback)
- `payload` (last resort)

#### 8. **Normalized Data** 🔧

```
[debug:fetchOverview] 🔧 Normalizing data structure...
[debug:fetchOverview] ✅ Normalized data: {
  "chambers": { "active": 12, "inactive": 3 },
  "orders": { "completed": 145, "pending": 23 },
  "products": { "pending": 8, "approved": 56 },
  "sellerApplications": { "pending": 5, "approved": 34 }
}
```

#### 9. **Data Source Confirmation** 🎯

```
[debug:fetchOverview] 🎯 DATA SOURCE: REAL API RESPONSE (NOT MOCK)
[debug:fetchOverview] 💾 Setting state with real data...
```

#### 10. **State Update Confirmation** ✅

```
[debug:fetchOverview] ✅ State updated successfully with REAL API DATA
========================================
```

---

## ❌ Error Logging

If an error occurs, you'll see:

### 1. **Error Header**

```
❌❌❌ [debug:fetchOverview] ERROR CAUGHT ❌❌❌
```

### 2. **Error Details**

```
[debug:fetchOverview] Error object: AxiosError { ... }
[debug:fetchOverview] Error message: "Network Error"
[debug:fetchOverview] Error stack: Error: Network Error
    at createError (axios.js:123)
    ...
```

### 3. **HTTP Error Details** (if applicable)

```
[debug:fetchOverview] 🔴 HTTP Error Response:
[debug:fetchOverview]   Status: 401
[debug:fetchOverview]   Status Text: "Unauthorized"
[debug:fetchOverview]   Headers: { ... }
[debug:fetchOverview]   Data: {
  "success": false,
  "message": "Invalid token"
}
```

### 4. **Special Case: 401 Unauthorized**

```
[debug:fetchOverview] ⚠️ 401 Unauthorized - Token may be invalid or expired
[debug:fetchOverview] ⚠️ Refresh attempt may have failed
```

### 5. **Network Error**

```
[debug:fetchOverview] 🔴 Network Error - No response received
[debug:fetchOverview]   Request: XMLHttpRequest { ... }
```

### 6. **Final Error State**

```
[debug:fetchOverview] 💾 Setting error state: "Network Error"
[debug:fetchOverview] 🎯 DATA SOURCE: ERROR - NO DATA SET
========================================
```

---

## 🔎 How to Use These Logs

### Scenario 1: "Mock data showing instead of real API data"

**Look for:**

1. ❌ **Token Status Check**

   ```
   [debug:fetchOverview] 🔐 Token status: { hasToken: false }
   ```

   **Problem:** No access token in memory
   **Solution:** Check login flow - ensure `setAccessToken()` is called

2. ❌ **API Call Never Started**

   ```
   [debug:fetchOverview] 🚀 STARTING fetchOverview
   // No subsequent logs
   ```

   **Problem:** Function crashed before API call
   **Solution:** Check for JavaScript errors in console

3. ❌ **401 Error**

   ```
   [debug:fetchOverview] 🔴 HTTP Error: { status: 401 }
   ```

   **Problem:** Token expired or invalid
   **Solution:** Check token refresh flow

4. ❌ **Wrong Data Path**
   ```
   [debug:fetchOverview] ⚠️ Found data at payload (root)
   ```
   **Problem:** Response structure doesn't match expected format
   **Solution:** Check backend API response format

---

### Scenario 2: "API call succeeds but data is empty"

**Look for:**

```
[debug:fetchOverview] ✅ API call completed
[debug:fetchOverview] 📥 Response status: 200
[debug:fetchOverview] 📦 Full response payload: { "success": true, "data": {} }
```

**Problem:** Backend returns empty data
**Solution:**

- Check backend database
- Verify query parameters
- Check backend permissions

---

### Scenario 3: "Network errors or timeouts"

**Look for:**

```
[debug:fetchOverview] 🔴 Network Error - No response received
```

**Problem:** Cannot reach backend
**Solution:**

- Check `NEXT_PUBLIC_API_URL` environment variable
- Verify backend is running
- Check CORS settings
- Check network connectivity

---

### Scenario 4: "Token refresh failing"

**Look for:**

```
[debug:fetchOverview] ⚠️ 401 Unauthorized
[debug:fetchOverview] ⚠️ Refresh attempt may have failed
```

**Then check `/api/auth/refresh` logs:**

```
[PROXY] POST → /api/auth/refresh
```

**Problem:** Refresh token expired or invalid
**Solution:**

- Check refresh token cookie exists
- Verify `/api/auth/refresh` endpoint
- Check backend refresh endpoint

---

## 📋 Log Reading Checklist

When debugging, follow this checklist:

### ✅ Step 1: Find the Function Call

```
[debug:fetchOverview] 🚀 STARTING fetchOverview
```

- [ ] Function was called
- [ ] Timestamp is recent

### ✅ Step 2: Check Token Status

```
[debug:fetchOverview] 🔐 Token status: { hasToken: true }
```

- [ ] Token exists in memory
- [ ] Token has reasonable length (> 100 chars)

### ✅ Step 3: Verify API Call Started

```
[debug:fetchOverview] ⏳ Sending request to backend...
```

- [ ] Request was initiated
- [ ] Correct endpoint logged

### ✅ Step 4: Check Response Success

```
[debug:fetchOverview] ✅ API call completed
[debug:fetchOverview] 📥 Response status: 200
```

- [ ] Response received
- [ ] Status is 200 (or other success code)

### ✅ Step 5: Inspect Response Payload

```
[debug:fetchOverview] 📦 Full response payload: { ... }
```

- [ ] Payload structure looks correct
- [ ] Contains expected data fields
- [ ] No error messages in response

### ✅ Step 6: Verify Data Extraction

```
[debug:fetchOverview] ✅ Found data at payload.data.cards
```

- [ ] Data found at expected path
- [ ] Data content is not empty

### ✅ Step 7: Confirm Data Source

```
[debug:fetchOverview] 🎯 DATA SOURCE: REAL API RESPONSE (NOT MOCK)
```

- [ ] Using real API data (NOT MOCK)

### ✅ Step 8: Verify State Update

```
[debug:fetchOverview] ✅ State updated with REAL API DATA
```

- [ ] State was set successfully
- [ ] No errors after state update

---

## 🎯 Quick Diagnostic Commands

### Check if function was called:

```javascript
// Browser console
"fetchOverview"; // Search in console
```

### Filter logs by function:

```javascript
// Browser console filter
debug: fetchOverview;
```

### Check token status across all functions:

```javascript
// Browser console filter
🔐 Token status
```

### Find errors only:

```javascript
// Browser console filter
❌❌❌ ERROR CAUGHT
```

### Check data source confirmation:

```javascript
// Browser console filter
🎯 DATA SOURCE
```

---

## 📊 Example Log Sequence (Success)

```
========================================
[debug:fetchOverview] 🚀 STARTING fetchOverview
========================================
[debug:fetchOverview] 🔐 Access token status: { hasToken: true, tokenLength: 847 }
[debug:fetchOverview] 📡 Preparing API call...
[debug:fetchOverview] 📍 Endpoint: v1/super-admin/dashboard/overview
[debug:fetchOverview] ⏳ Sending request to backend...
[debug:fetchOverview] ✅ API call completed successfully
[debug:fetchOverview] 📥 Response status: 200
[debug:fetchOverview] 📦 Full response payload: { "success": true, ... }
[debug:fetchOverview] 🔍 Payload structure analysis: { hasSuccess: true, ... }
[debug:fetchOverview] 🔍 Starting data extraction...
[debug:fetchOverview] ✅ Found data at payload.data.cards
[debug:fetchOverview] 📊 Data content: { chambers: {...}, orders: {...} }
[debug:fetchOverview] 🔧 Normalizing data structure...
[debug:fetchOverview] ✅ Normalized data: { chambers: {...}, ... }
[debug:fetchOverview] 🎯 DATA SOURCE: REAL API RESPONSE (NOT MOCK)
[debug:fetchOverview] 💾 Setting state with real data...
[debug:fetchOverview] ✅ State updated successfully with REAL API DATA
========================================
```

---

## 📊 Example Log Sequence (Error)

```
========================================
[debug:fetchOverview] 🚀 STARTING fetchOverview
========================================
[debug:fetchOverview] 🔐 Access token status: { hasToken: false }
[debug:fetchOverview] 📡 Preparing API call...
[debug:fetchOverview] ⏳ Sending request to backend...

❌❌❌ [debug:fetchOverview] ERROR CAUGHT ❌❌❌
[debug:fetchOverview] Error: AxiosError { ... }
[debug:fetchOverview] 🔴 HTTP Error Response:
[debug:fetchOverview]   Status: 401
[debug:fetchOverview]   Data: { "message": "Unauthorized" }
[debug:fetchOverview] ⚠️ 401 Unauthorized - Token may be invalid or expired
[debug:fetchOverview] 💾 Setting error state: "Request failed with status code 401"
[debug:fetchOverview] 🎯 DATA SOURCE: ERROR - NO DATA SET
========================================
```

---

## 🛠️ Troubleshooting Tips

### No logs appearing?

- Check browser console is open
- Verify `NODE_ENV` (logs work in development)
- Check if function is actually being called

### Logs show success but UI shows mock data?

- Check component is reading from correct store
- Verify store selector is correct
- Check if component has local state overriding store

### Token shows `hasToken: false`?

- Check login flow completed
- Verify `setAccessToken()` was called
- Check token wasn't cleared prematurely

### 401 errors after login?

- Check token format (should start with "eyJ")
- Verify backend token validation
- Check token expiry time

---

## 🎓 Log Emoji Legend

| Emoji | Meaning                  |
| ----- | ------------------------ |
| 🚀    | Function started         |
| 🔐    | Token status check       |
| 📡    | API call information     |
| 📍    | Endpoint URL             |
| 🔧    | HTTP method              |
| 📋    | Request parameters       |
| ⏳    | Request in progress      |
| ✅    | Success                  |
| 📥    | Response received        |
| 📦    | Response payload         |
| 🔍    | Data extraction/analysis |
| 📊    | Parsed data              |
| 🎯    | Data source confirmation |
| 💾    | State update             |
| ❌    | Error occurred           |
| 🔴    | HTTP error details       |
| ⚠️    | Warning/special case     |

---

## 📝 Summary

**All fetch functions now provide:**
✅ Complete request/response tracing  
✅ Token status verification  
✅ Payload structure analysis  
✅ Data extraction path logging  
✅ Clear data source identification  
✅ Comprehensive error details  
✅ State update confirmation

**Use these logs to:**
🔍 Identify why mock data appears instead of real data  
🔍 Trace API call failures  
🔍 Verify token management  
🔍 Debug response parsing issues  
🔍 Confirm state updates

**Date Added:** November 13, 2025  
**Functions Updated:** All 6 fetch functions  
**Log Level:** Development (detailed)  
**Production Impact:** None (logs only in development)
