# Dashboard Advanced Features — Design Spec
**Date:** 2026-04-23  
**Project:** Leveez Agency  
**Scope:** User Dashboard + Team Dashboard new features + Admin control panel  

---

## Overview

Add 6 genuinely useful features across User and Team dashboards, all controllable by Admin via a feature-flag toggle panel. Every feature is backed by a real DB model and API — nothing is mocked.

---

## Feature 1 — Project Milestones & Timeline (User Dashboard)

### What it does
Users see a visual timeline of milestones for each of their projects. Milestones are created and managed by Admin/Team; the user is read-only. Each milestone shows title, due date, description, and status.

### Model — `Milestone`
File: `server/src/models/usersModels/Milestone.model.js`

| Field | Type | Notes |
|---|---|---|
| `project` | ref Project | required |
| `title` | String | required |
| `description` | String | optional |
| `dueDate` | Date | required |
| `completedAt` | Date | set when status → completed |
| `status` | enum | `pending / in_progress / completed / blocked` |
| `order` | Number | for sorting |
| `createdBy` | ref User | admin or team member |

### API Routes — `/api/v1/milestones`
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/:projectId` | user/team/admin | List milestones for a project |
| POST | `/` | admin/team | Create milestone |
| PUT | `/:id` | admin/team | Update milestone |
| PATCH | `/:id/status` | admin/team | Update status only |
| DELETE | `/:id` | admin/team | Delete milestone |

### Real-time
After create/update/delete: `emitDataUpdate(io, 'milestones', ['admin:global', 'team:global', 'user:{projectOwnerId}'])`

### Frontend
- `client/src/api/milestones.api.ts`
- User: Milestones tab inside `UserProjectDetail.tsx` — vertical timeline with colored status dots, progress bar at top showing X/total completed
- Team/Admin: Milestone manager panel in project detail — add/edit/delete/reorder, status dropdown per milestone
- `useDataRealtime('milestones', refetch)` on all milestone-consuming pages

---

## Feature 2 — Deliverables & File Handoff (User + Team + Admin)

### What it does
Team/Admin uploads deliverable files per project (designs, documents, builds). User reviews each file and clicks "Approve" or "Request Revision" with an optional comment. Each revision creates a new version entry.

### Model — `Deliverable`
File: `server/src/models/usersModels/Deliverable.model.js`

| Field | Type | Notes |
|---|---|---|
| `project` | ref Project | required |
| `title` | String | required |
| `description` | String | optional |
| `fileUrl` | String | Cloudinary URL |
| `filePublicId` | String | for Cloudinary delete |
| `fileType` | String | mime type |
| `fileName` | String | original filename |
| `uploadedBy` | ref User | admin or team |
| `status` | enum | `pending_review / approved / revision_requested` |
| `clientComment` | String | user's feedback on revision |
| `reviewedAt` | Date | when user reviewed |
| `version` | Number | default 1, increments on re-upload |

### API Routes — `/api/v1/deliverables`
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/:projectId` | user/team/admin | List deliverables |
| POST | `/` | admin/team | Upload file (multipart) |
| PATCH | `/:id/review` | user | Approve or request revision |
| DELETE | `/:id` | admin/team | Delete + remove from Cloudinary |

### Notifications
- Upload → notify project owner: `deliverable_uploaded` notification type (add to enum)
- User reviews → notify `admin:global` + assigned team: `deliverable_reviewed` notification type

### Frontend
- `client/src/api/deliverables.api.ts`
- User: "Deliverables" tab in `UserProjectDetail.tsx` — file cards with preview icon, status badge, Approve/Request Revision buttons, comment textarea
- Team/Admin: Upload panel in project detail — drag-drop or file picker, version history per deliverable
- `useDataRealtime('deliverables', refetch)`

---

## Feature 3 — Invoice PDF Download (User Dashboard)

### What it does
On the Billing page, each project row has a "Download Invoice" button. A print-friendly invoice modal renders with agency branding, project details, cost breakdown, and payment status. User can print or save as PDF via browser.

### No new model needed
Uses existing `Project` fields: `projectName`, `totalCost`, `paidAmount`, `paymentStatus`, `deadline`, `requestedBy` (populated with user name/email), `createdAt`.

### API Route
`GET /api/v1/projects/:id/invoice` — returns structured invoice JSON:
```json
{
  "invoiceNumber": "INV-2026-0001",
  "issuedAt": "2026-04-23",
  "project": { "name", "type", "deadline" },
  "client": { "name", "email" },
  "amount": { "total", "paid", "due", "paymentStatus" },
  "agency": { "name": "Leveez Agency", "email": "hello@leveez.com" }
}
```

### Frontend
- `InvoiceModal.tsx` component — full-page printable layout, hidden from screen via `@media print` toggle
- `UserBilling.tsx` — "Invoice" button per project row opens modal
- Print triggered via `window.print()` with `@media print` CSS isolating just the invoice

---

## Feature 4 — Time Tracker (Team Dashboard)

### What it does
Team members log time against tasks or projects. Has a live start/stop timer and manual entry. Daily log table, weekly bar chart, and CSV export.

### Model — `TimeLog`
File: `server/src/models/usersModels/TimeLog.model.js`

| Field | Type | Notes |
|---|---|---|
| `teamMember` | ref User | required |
| `project` | ref Project or AdminProject | optional |
| `task` | ref Task | optional |
| `description` | String | what was worked on |
| `startTime` | Date | ISO timestamp |
| `endTime` | Date | ISO timestamp |
| `duration` | Number | minutes, computed on save |
| `date` | Date | date only (for grouping) |
| `isManual` | Boolean | true if manually entered |

### API Routes — `/api/v1/timelogs`
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/` | team/admin | Own logs (team) or filtered (admin) |
| POST | `/` | team/admin | Create log entry |
| PUT | `/:id` | team/admin | Edit entry (own only for team) |
| DELETE | `/:id` | team/admin | Delete entry |
| GET | `/summary` | team/admin | `?period=week\|month` aggregated hours |
| GET | `/admin/all` | admin | All team members' logs |
| GET | `/export` | team/admin | CSV export (streams response) |

### Frontend
- New page: `client/src/pages/team/TeamTimeTracker.tsx`
- Two sections: Live Timer (project/task selector, start/stop, running display) + Log Table (date-grouped entries, edit/delete inline)
- Weekly summary bar chart using existing chart library
- "Export CSV" button
- Route: `/team/time-tracker`
- Add to `TeamSidebar.tsx` and `DashboardSearch.tsx` TEAM_ITEMS

---

## Feature 5 — Leave Requests (Team + Admin)

### What it does
Team members submit leave requests (type, date range, reason). Admin approves or rejects with a note. Both sides get notifications. Admin sees all requests in a table with approve/reject actions.

### Model — `LeaveRequest`
File: `server/src/models/usersModels/LeaveRequest.model.js`

| Field | Type | Notes |
|---|---|---|
| `requestedBy` | ref User | required |
| `leaveType` | enum | `sick / vacation / personal / other` |
| `startDate` | Date | required |
| `endDate` | Date | required |
| `totalDays` | Number | computed: endDate - startDate + 1 |
| `reason` | String | required |
| `status` | enum | `pending / approved / rejected` (default: pending) |
| `reviewedBy` | ref User | admin who reviewed |
| `reviewNote` | String | admin's note |
| `reviewedAt` | Date | when reviewed |

### API Routes — `/api/v1/leave-requests`
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/` | team → own, admin → all | List requests |
| POST | `/` | team | Submit request |
| PUT | `/:id/review` | admin | Approve/reject with note |
| DELETE | `/:id` | team (pending only) | Cancel own request |

### Notifications
- Submit → notify `admin:global`: `leave_requested` type
- Approve/Reject → notify `user:{requestedById}`: `leave_reviewed` type
- Add both types to `Notification.model.js` enum

### Frontend
- New page: `client/src/pages/team/TeamLeaveRequests.tsx` — submit form + own history table with status badges
- New page/tab: `client/src/pages/admin/AdminLeaveRequests.tsx` — full table, approve/reject dialog with note field, filter by status/type, leave calendar overview
- Route: `/team/leave-requests`, admin tab in TeamManagement or new route `/admin/leave-requests`
- Add to both sidebars and DashboardSearch

---

## Feature 6 — Personal Performance Stats (Team Dashboard)

### What it does
Enhances `TeamReports.tsx` with a "My Performance" section: tasks completed this week/month, on-time delivery rate, average task completion time, current streak (consecutive days with completed tasks), and top project by time logged.

### No new model
Computed from existing `Task` and `TimeLog` data.

### API Route
`GET /api/v1/tasks/my-stats?period=week|month`

Returns:
```json
{
  "tasksCompleted": 12,
  "onTimeRate": 83,
  "avgCompletionHours": 4.2,
  "streak": 5,
  "topProject": { "name": "...", "hours": 18 }
}
```

### Frontend
- Add "My Performance" tab or top section in `TeamReports.tsx`
- Stat cards with trend indicators (vs previous period)
- Streak display with flame icon

---

## Feature 7 — Admin Dashboard Config (Feature Flags)

### What it does
Admin sees a "Dashboard Config" tab in Settings. Toggles control which features are visible in User and Team dashboards. When a feature is OFF, its sidebar link and page are hidden from that role.

### Model — `DashboardConfig` (singleton)
File: `server/src/models/usersModels/DashboardConfig.model.js`

| Field | Type | Default |
|---|---|---|
| `singleton` | String | `'main'` (unique) |
| `userFeatures.milestones` | Boolean | true |
| `userFeatures.deliverables` | Boolean | true |
| `userFeatures.invoiceDownload` | Boolean | true |
| `teamFeatures.timeTracker` | Boolean | true |
| `teamFeatures.leaveRequests` | Boolean | true |
| `teamFeatures.performanceStats` | Boolean | true |

### API Routes — `/api/v1/dashboard-config`
| Method | Path | Auth |
|---|---|---|
| GET | `/` | public (any auth) |
| PUT | `/` | admin only |

### Frontend Integration
- `DashboardConfigContext.tsx` — fetches config on mount, provides `userFeatures` and `teamFeatures` objects
- Used in `UserSidebar.tsx`, `TeamSidebar.tsx`, `DashboardSearch.tsx` to conditionally render links
- Used in each feature page to guard rendering
- Admin: new "Dashboard Config" tab in `Settings.tsx` — toggle switches per feature, auto-save on change

---

## Real-time Events Summary

| Action | Rooms | Section |
|---|---|---|
| Milestone CRUD | `admin:global`, `team:global`, `user:{ownerId}` | `milestones` |
| Deliverable upload/review | `admin:global`, `team:global`, `user:{ownerId}` | `deliverables` |
| Leave request submit | `admin:global` | `leave` |
| Leave request reviewed | `user:{requestedById}` | `leave` |
| Dashboard config update | `/public` | `dashboardConfig` |

---

## New Notification Types (add to enum)
- `deliverable_uploaded`
- `deliverable_reviewed`
- `leave_requested`
- `leave_reviewed`

---

## File Checklist

### Backend (server/src/)
- [ ] `models/usersModels/Milestone.model.js`
- [ ] `models/usersModels/Deliverable.model.js`
- [ ] `models/usersModels/TimeLog.model.js`
- [ ] `models/usersModels/LeaveRequest.model.js`
- [ ] `models/usersModels/DashboardConfig.model.js`
- [ ] `controllers/usersControllers/milestone.controller.js`
- [ ] `controllers/usersControllers/deliverable.controller.js`
- [ ] `controllers/usersControllers/timeLog.controller.js`
- [ ] `controllers/usersControllers/leaveRequest.controller.js`
- [ ] `controllers/usersControllers/dashboardConfig.controller.js`
- [ ] `routes/userRoutes/milestone.route.js`
- [ ] `routes/userRoutes/deliverable.route.js`
- [ ] `routes/userRoutes/timeLog.route.js`
- [ ] `routes/userRoutes/leaveRequest.route.js`
- [ ] `routes/userRoutes/dashboardConfig.route.js`
- [ ] Mount all routes in `src/app.js`
- [ ] Add invoice endpoint to `project.controller.js`
- [ ] Add `my-stats` endpoint to `task.controller.js`
- [ ] Add new notification types to `Notification.model.js`

### Frontend (client/src/)
- [ ] `api/milestones.api.ts`
- [ ] `api/deliverables.api.ts`
- [ ] `api/timelogs.api.ts`
- [ ] `api/leaveRequests.api.ts`
- [ ] `api/dashboardConfig.api.ts`
- [ ] `contexts/DashboardConfigContext.tsx`
- [ ] `pages/user/UserProjectDetail.tsx` (new — milestones + deliverables tabs)
- [ ] `pages/user/UserInvoice.tsx` (InvoiceModal component)
- [ ] `pages/team/TeamTimeTracker.tsx`
- [ ] `pages/team/TeamLeaveRequests.tsx`
- [ ] `pages/admin/AdminLeaveRequests.tsx`
- [ ] Enhance `pages/team/TeamReports.tsx` (performance stats)
- [ ] Enhance `pages/user/UserBilling.tsx` (invoice button)
- [ ] Enhance `pages/admin/Settings.tsx` (dashboard config tab)
- [ ] Update `components/UserSidebar.tsx` (feature-gated links)
- [ ] Update `components/TeamSidebar.tsx` (feature-gated links)
- [ ] Update `components/DashboardSearch.tsx` (new items)
- [ ] Update `App.tsx` routes
