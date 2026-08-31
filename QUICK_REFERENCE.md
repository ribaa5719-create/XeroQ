# XeroQ Admin Shop Management - Quick Reference Guide

## 🚀 Quick Start

### Access the Feature
1. Navigate to `/admin/dashboard`
2. Click the **"Shop Management"** button
3. You'll see the `/admin/shops` page

### What You See
- List of all shops with their details
- Color-coded status badges:
  - 🟡 Yellow = Pending (awaiting approval)
  - 🟢 Green = Approved
  - 🔴 Red = Rejected

---

## 📋 Shop Details Display

Each shop shows:
```
Shop Name          │ Details Section      │ Status    │ Actions
─────────────────────────────────────────────────────────────
PrintHub Campus    │ Phone: 9876543210    │ ⏳ Pending│ ✅ Reject
Mumbai             │ B/W Price: ₹5/page   │           │ ❌ Reject
123 Main St        │ Color: ₹10/page      │           │ 
                   │ Hours: 09:00-18:00   │           │
                   │ Availability: busy   │           │
                   │ Added: Aug 15, 2024  │           │
```

---

## 🔍 Filtering Shops

### By Status
Click the **Status** dropdown to filter:
- **All Shops**: Show all shops (default)
- **Pending**: Show only pending approvals
- **Approved**: Show only approved shops
- **Rejected**: Show only rejected shops

### By Search
Type in the search box to find by:
- **Shop Name**: "PrintHub" matches "PrintHub Campus"
- **City**: "Mumbai" shows all Mumbai shops
- **Case-insensitive**: "PRINTERMALL" finds "PrinterMall"

### Combining Filters
- Filter status AND search at the same time
- Example: Show pending shops in Mumbai
  1. Set Status filter to "Pending"
  2. Type "Mumbai" in search box
  3. Results update instantly

---

## ✅ Approving a Shop

### Steps
1. Look for a shop with status badge 🟡 (Pending)
2. Click the green **"Approve"** button
3. Button shows spinning icon and becomes disabled
4. Wait for the action to complete
5. Success message appears: "Shop approved successfully!"
6. List automatically refreshes
7. Shop status changes to 🟢 (Approved)

### What Happens
- Shop approval status saved to database
- Becomes visible to students searching for shops
- Shop owner notified (if notification system active)
- Shop availability reset to "available" (if was closed)

---

## ❌ Rejecting a Shop

### Steps
1. Look for a shop with status badge 🟡 (Pending)
2. Click the red **"Reject"** button
3. Button shows spinning icon and becomes disabled
4. Wait for the action to complete
5. Success message appears: "Shop rejected successfully!"
6. List automatically refreshes
7. Shop status changes to 🔴 (Rejected)

### What Happens
- Shop approval status saved as "rejected"
- Not visible to students
- Shop owner notified (if notification system active)
- Shop can be approved later if needed

---

## 📱 Mobile Usage

### On Mobile Devices
- Shop information stacked vertically
- Full-width buttons for easy tapping
- All filters still accessible
- Search bar scrolls into view as needed
- Everything remains fully functional

### Recommended Actions
- Use landscape mode for better view
- Swipe to see action buttons if needed
- Use search to quickly find specific shops

---

## ⚠️ Error Handling

### Authorization Error
**Message**: "You do not have permission to manage shops."
- ✅ You're logged in but not as admin
- 🔧 Solution: Log in as admin user

### Login Error  
**Message**: "Please log in as an administrator."
- ✅ Session expired
- 🔧 Solution: Log back in

### Network Error
**Message**: "Unable to load shops. Please try again."
- ✅ Backend not responding
- 🔧 Solution: Click "Retry" or refresh page
- ⚠️ Check if backend is running: `npm start`

### Action Failed
**Message**: "Failed to approve shop. Please try again."
- ✅ Shop data incomplete or invalid
- 🔧 Solution: Try again or contact support

---

## 🎯 Common Tasks

### Task: Approve All Pending Shops
1. Set Status filter to "Pending"
2. See all pending shops
3. Click approve on each shop
4. Wait for each to complete
5. All shops will change to green ✅

### Task: Find Shops in a Specific City
1. Leave Status filter as "All Shops"
2. Type city name in search box
3. Only shops from that city shown
4. Browse filtered results

### Task: Verify a Newly Registered Shop
1. Filter by "Pending" status
2. Look for the newest (search by date mentally)
3. Review shop details
4. Click Approve if details are valid
5. Click Reject if something looks wrong

### Task: See All Rejected Shops
1. Set Status filter to "Rejected"
2. See all rejected shops
3. Review rejection decisions
4. Can approve later if needed

---

## 📊 Status Meanings

### 🟡 Pending
- Shop registered but not yet reviewed
- Admin approval required
- Not visible to students yet
- Can be approved or rejected

### 🟢 Approved
- Shop verified and approved
- Visible to students
- Can accept orders
- Read-only (can't change status from here)

### 🔴 Rejected
- Shop rejected after review
- Not visible to students
- Cannot accept orders
- Read-only (can't change status from here)

---

## 🔐 Access Control

### Who Can Access This Feature
- ✅ Admin users only
- ❌ Students cannot access
- ❌ Shop owners cannot access

### If You See "403 Forbidden"
- Your account doesn't have admin role
- Contact system administrator
- You should be redirected to home page

---

## 💡 Tips & Tricks

### Tip 1: Use Search First
Instead of scrolling through all shops, use search to quickly find what you need.

### Tip 2: Status Filter for Organization  
Group shops by status to process them efficiently:
- Review all pending first
- Then check approved
- Then review rejected

### Tip 3: Combine Filters
Save time by combining status filter + search
Example: Filter "Pending" + Search "Mumbai" = pending shops in Mumbai only

### Tip 4: Watch for Success Messages
Green success message confirms the action was saved to database.

### Tip 5: Action Buttons Disabled During Processing
If button seems stuck, wait for response. Don't click again.

### Tip 6: Check Details Before Approving
Review all shop information before approving:
- Valid phone number
- Proper opening/closing hours
- Reasonable pricing
- Full address provided

### Tip 7: Refresh for Latest Data
After long inactivity, refresh page to get latest shop data.

---

## 🆘 Troubleshooting

### Problem: Page Won't Load
**Solution**: 
- Check if backend is running (`npm start` in backend folder)
- Check internet connection
- Try refreshing page
- Clear browser cache

### Problem: Shops Not Showing
**Solution**:
- Check if filters are too restrictive
- Try "All Shops" filter
- Clear search box
- Refresh page

### Problem: Approve/Reject Button Not Responding
**Solution**:
- Wait for existing action to complete
- Don't click button multiple times
- Check network connection
- Try refresh if still stuck

### Problem: Can't See Shop Details
**Solution**:
- Use mobile view on desktop (developer tools)
- Scroll right on table view
- Widen browser window
- Details always visible on mobile

### Problem: Got 403 Error
**Solution**:
- Log out and log back in as admin
- Check user role in database
- Contact administrator

---

## 📞 Support

For issues not covered here:
1. Check browser console for error messages
2. Note the exact error message
3. Contact: support@xeroq.local
4. Provide:
   - Screenshot of error
   - Exact shop name (if applicable)
   - Steps to reproduce

---

## 🔄 Workflow Example

### Scenario: Review and Approve New Shops
```
1. Navigate to /admin/shops
   → Shows all shops by default
   
2. Filter by "Pending"
   → Display only pending shops: 3 shops
   
3. Review first shop "PrintHub Campus"
   → Check address, phone, pricing
   → Looks valid
   
4. Click Approve
   → Button shows spinner
   → "Shop approved successfully!" message
   → Status changes to green ✅
   
5. Repeat for remaining pending shops
   → All now showing green status
   
6. Filter by "Approved"
   → Confirm all 3 new shops approved
   → Show alongside existing approved shops
   
7. Switch to dashboard
   → See updated shop count in metrics
```

---

## 📈 Key Metrics to Monitor

- **Pending Shops Count**: How many awaiting approval
- **Approval Rate**: How quickly shops get approved
- **Rejection Rate**: Quality of shop registrations
- **New Shops/Day**: Platform growth metric

---

**Last Updated**: August 28, 2026
**Version**: 1.0
**Status**: Production Ready ✅
