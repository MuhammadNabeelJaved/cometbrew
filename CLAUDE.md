# Project: Nabeel Agency Website

## Overview
Full-stack Agency Website & CMS. Monorepo with `client/` (React 18 + TypeScript) and `server/` (Express 5 + MongoDB).

## Tech Stack

### Frontend (client/)
- React 18 + **TypeScript** — Vite, port 5173 (proxy → 8000)
- React Router DOM v6 (BrowserRouter)
- Tailwind CSS + **shadcn/ui** components at `src/components/ui/`
- Framer Motion (all animations), Lucide React (icons), Sonner (toasts)

### Backend (server/)
- Express 5 + MongoDB Atlas (Mongoose), port 8000, prefix `/api/v1/`
- JWT auth (access + refresh tokens), roles: `admin | team | user`
- OTP email verification via **Resend SDK**, file uploads via **Multer + Cloudinary**
- `uploadFile(filePath, folder)` in `server/src/middlewares/Cloudinary.js` — use `resource_type: 'auto'` for PDF/DOC/DOCX uploads (not just images)
- Seed file: `server/src/seed.js` — run `node src/seed.js` to populate initial data

## Key Contexts (`client/src/contexts/`)
| Context | Key exports | Storage |
|---|---|---|
| AuthContext.tsx | `user, isAuthenticated, login, logout, updateUser` | localStorage |
| ThemeContext.tsx | `theme, setTheme` | localStorage |
| ContentContext.tsx | `logoUrl`, `pageStatuses`, `setPageStatuses`, `announcements`, `hasActiveAnnouncements`, `tickerDuration`, CMS data | fetched from backend |
| LanguageContext.tsx | `lang, setLang, t()` | localStorage (EN/ES/FR/DE/JP) |

## Auth & Routing
- Login → JWT in localStorage → role-based dashboard redirect
- `admin` → `/admin`, `team` → `/team`, `user` → `/user-dashboard`
- Unverified users → redirected to `/verification` (OTP page)
- `ProtectedRoute` handles all guard logic

## Layouts (`client/src/layouts/`)
- `PublicLayout.tsx` — AnnouncementBar + Navbar + Footer + Chatbot + ScrollToTop; `pt` shifts to `pt-[6.5rem]` when bar is visible
- `AdminLayout.tsx`, `TeamLayout.tsx`, `UserLayout.tsx` — sidebar layouts

## Important Components
| Component | Location | Notes |
|---|---|---|
| Navbar | components/Navbar.tsx | Glass scroll effect; `top-10` when AnnouncementBar visible else `top-0`; profile dropdown or Get Started |
| AnnouncementBar | components/AnnouncementBar.tsx | `fixed top-0 z-[70] h-10`; infinite ticker; duplicates items 2× for seamless loop; admin "Manage" shortcut |
| PageStatusGate | components/PageStatusGate.tsx | Wraps `<Outlet>` in PublicLayout; checks pageStatuses from ContentContext; admin sees real page + warning banner; others see Maintenance/ComingSoon pages |
| Hero | components/Hero.tsx | Full-screen, translatable via `t()`, `pb-40` to push content up |
| ScrollToTop | components/ScrollToTop.tsx | `fixed bottom-[6.5rem] right-6`, `useScroll+useSpring` |
| Chatbot | components/Chatbot.tsx | `fixed bottom-6 right-6 h-16` |
| ShareWidget | components/ShareWidget.tsx | Popover with copy link, LinkedIn, Twitter, Facebook share buttons |

## Translation Pattern
```tsx
const { t } = useLanguage();
// then use: t('nav.services'), t('hero.title'), etc.
// All keys defined in LanguageContext.tsx translations object
```

## Styling Conventions
- Glass cards: `bg-white/5 backdrop-blur-xl border border-white/10`
- Buttons: `rounded-full` (pills), `rounded-2xl` (cards)
- Primary color via CSS var `--primary` (violet family)
- Scroll reveals: `whileInView`, mount/unmount: `AnimatePresence`

---

## Models

### Two Project Models — Do Not Confuse
| Model | File | Purpose | API prefix |
|---|---|---|---|
| `Project` | `server/src/models/usersModels/Project.model.js` | **Client project requests** submitted by users | `/api/v1/projects` |
| `AdminProject` | `server/src/models/adminModels/AdminProject.model.js` | **Agency portfolio** projects managed by admin | `/api/v1/admin/projects` |

### Client Project Requests (`Project` model)
- Fields: `projectName`, `projectType`, `budgetRange`, `projectDetails`, `status` (pending→in_review→approved/rejected→completed), `progress`, `deadline`, `totalCost`, `paidAmount`, `paymentStatus` (auto via pre-save hook), `attachments[]`, `requestedBy` (ref User), `assignedTeam[]` (ref User[]), `isArchived`
- Role-based filtering in `getAllProjects`: admin sees all, team sees `assignedTeam` contains their ID, user sees `requestedBy` equals their ID
- File uploads via Multer + Cloudinary; `deleteAttachment` removes from Cloudinary + DB

### JobPosting model (`server/src/models/usersModels/JobPosting.model.js`)
- Fields: `jobTitle`, `department` (enum: Engineering/Design/Marketing/Sales/HR/Finance/Operations/Product/Other), `employmentType`, `workMode`, `location`, `experienceLevel` (enum: 'Entry Level'/'Mid Level'/'Senior Level'/'Lead'/'Executive'), `salaryRange: { min, max, currency }`, `salaryDisplay` (optional override string), `description`, `responsibilities[]`, `requirements[]`, `benefits[]`, `status` (Active/Draft/Closed/Filled/Paused)
- API: `GET /api/v1/jobs` (all, admin), `GET /api/v1/jobs/active` (public), `GET /api/v1/jobs/:id` (public)
- `getAllJobs` returns `{ jobs, pagination }` — always use `data?.jobs || (Array.isArray(data) ? data : [])` to parse
- `getActiveJobs` returns array directly

### JobApplication model (`server/src/models/usersModels/JobApplication.model.js`)
- Fields: `job` (ref JobPosting), `firstName`, `lastName`, `email`, `phone`, `desiredRole`, `experienceLevel`, `resumeUrl` (Cloudinary), `coverLetter`, `status` (pending/reviewing/shortlisted/rejected/hired), `adminNotes`
- Submit: `POST /api/v1/job-applications` (public, multipart/form-data with `resume` file)
- On submit: resume uploaded to Cloudinary via `uploadFile()`, confirmation email sent to applicant + admin notification (both via `Promise.allSettled` — non-blocking)
- `GET /api/v1/job-applications/my` — authenticated user sees their own applications (matched by email)
- `PUT /api/v1/job-applications/:id/status` — admin only; when status = `'hired'`, user role is automatically upgraded to `'team'`

### PageStatus model (`server/src/models/usersModels/PageStatus.model.js`)
- Fields: `key` (unique), `label`, `path`, `matchPrefix`, `status` (active/maintenance/coming-soon), `category` (public/admin/user/team), `isCustom`, `updatedBy`
- `PAGE_REGISTRY` in `pageStatus.controller.js` defines **36 built-in pages** across 4 categories
- Auto-seeds on first load; migrates missing pages on subsequent loads (migration-safe)
- Built-in pages cannot be deleted; `isCustom: true` pages can be deleted by admin
- API: `GET /api/v1/page-status` (public), `PUT /:key`, `POST /`, `DELETE /:key` (admin only)

### Announcement model (`server/src/models/usersModels/Announcement.model.js`)
- Fields: `text`, `emoji`, `link`, `linkLabel`, `bgColor`, `textColor`, `isActive`, `order`, `createdBy`
- **Singleton settings** stored as a special document with `_meta: true` in the same collection — holds `tickerDuration` (Number, default 30s). All `getAll`/`getActive` queries filter out `_meta: true` docs.
- API: `GET /api/v1/announcements` (public, active only), `GET /api/v1/announcements/settings` (public), `GET /api/v1/announcements/all` (admin), `PUT /api/v1/announcements/settings` (admin, clamps 5–120s), `POST/PUT/DELETE /api/v1/announcements/:id` (admin)

---

## API Files (`client/src/api/`)
| File | Base path | Key methods |
|---|---|---|
| `projects.api.ts` | `/projects` | `getAll`, `getStats`, `getById`, `create` (FormData), `delete` |
| `adminProjects.api.ts` | `/admin/projects` | CRUD for portfolio projects |
| `jobs.api.ts` | `/jobs` | `getAll` (admin), `getActive` (public), `getById`, `create`, `update`, `delete` |
| `jobApplications.api.ts` | `/job-applications` | `getAll`, `getStats`, `getById`, `updateStatus`, `delete`, `getMyApplications`, `submitJobApplication` (FormData) |
| `pageStatus.api.ts` | `/page-status` | `getAll`, `update(key, status)`, `create(payload)`, `delete(key)` |
| `announcements.api.ts` | `/announcements` | `getActive`, `getAll`, `create`, `update`, `delete`, `getSettings`, `updateSettings(tickerDuration)` |
| `users.api.ts` | `/users` | `update` (FormData or JSON), `updatePassword` |
| `auth.api.ts` | `/auth` | login, register, refresh |

---

## Dashboard Pages

### User Dashboard (`/user-dashboard`)
| Page | File | Notes |
|---|---|---|
| Overview | `pages/user/UserDashboardHome.tsx` | Live stats from `projectsApi.getStats()`, recent 3 projects |
| My Projects | `pages/user/UserProjects.tsx` | Full CRUD — create with file upload, list, delete (pending/rejected only) |
| Applied Jobs | `pages/user/UserAppliedJobs.tsx` | Shows all job applications by the logged-in user; status badges, resume link, admin notes, view job button |
| Profile | `pages/user/UserProfile.tsx` | Avatar upload, password change via `usersApi.updatePassword` |
| Support | `pages/user/UserSupport.tsx` | Client-facing: ticket list, FAQ accordion (project/billing/account), New Ticket dialog with success state |

### Admin Dashboard (`/admin`)
| Page | File | Notes |
|---|---|---|
| Client Requests | `pages/admin/ClientProjectRequests.tsx` | Approve/reject/delete requests; assign team members (checkbox picker with stacked avatar display) |
| Job Management | `pages/admin/JobManagement.tsx` | Full CRUD for job postings; department uses Select with enum values; salary uses min/max number inputs; `getAllJobs` returns `{ jobs, pagination }` |
| Job Applications | `pages/admin/AdminJobApplications.tsx` | Stats cards; table with hire/reject/delete actions; hire upgrades applicant user role to 'team' |
| Page Manager | `pages/admin/PageManager.tsx` | 5 collapsible categories (Public, Admin, User, Team, Custom); 36 built-in pages + custom URLs; 3-button status toggle per page |
| Announcement Manager | `pages/admin/AnnouncementManager.tsx` | Full CRUD for ticker bar items; 10 color presets + custom hex pickers; live preview; speed control (slider 5–120s + presets); singleton settings via `_meta` doc |

### Team Dashboard (`/team`)
| Page | File | Notes |
|---|---|---|
| Projects | `pages/team/TeamProjects.tsx` | Two tabs: "Client Requests" (assigned via `assignedTeam`) + "Portfolio Projects" (AdminProject); fetches both in parallel |
| Client Request Detail | `pages/team/TeamClientRequestDetail.tsx` | Full detail view: description, attachments (clickable links), assigned team list, client info, payment info; route: `/team/client-requests/:id` |
| Project Detail | `pages/team/TeamProjectDetail.tsx` | Detail view for AdminProject portfolio items; route: `/team/projects/:id` |
| Support | `pages/team/TeamSupport.tsx` | Internal help: IT/HR/Admin contact cards, internal ticket list, FAQ accordion; New Ticket dialog |

---

## Public Pages (Careers)
| Page | File | Notes |
|---|---|---|
| Careers | `pages/public/Careers.tsx` | Uses `jobsApi.getActive()` — returns array directly (not paginated). Field names: `job.jobTitle`, `job.employmentType`, `job.salaryRange` (object). Format salary with helper: `$3k – $6k` |
| Job Detail | `pages/public/JobDetail.tsx` | Uses `jobsApi.getById(id)`. Salary display: `job.salaryDisplay \|\| (job.salaryRange?.min ? ...)` — never render the object directly. Includes Share widget and Job Privacy Policy link |
| Job Application | `pages/public/JobApplication.tsx` | Multipart/form-data with `resume` file. Experience level values must match DB enum exactly (e.g. 'Senior Level' not 'Senior') |
| Job Application Success | `pages/public/JobApplicationSuccess.tsx` | Shown after successful submit |
| Job Privacy Policy | `pages/public/JobPrivacyPolicy.tsx` | Linked from JobDetail apply card |

---

## Announcement Bar — Layout & Positioning
- `AnnouncementBar` renders at `fixed top-0 z-[70] h-10` — **above** the navbar (`z-50`)
- Navbar shifts: `top-10` when `hasActiveAnnouncements === true`, `top-0` otherwise
- `PublicLayout` main content padding: `pt-[6.5rem]` with bar, `pt-16` without
- Ticker uses `@keyframes announcement-ticker` in `GlobalStyles.tsx`: `translateX(0) → translateX(-50%)`
- Items duplicated 2× so the loop point is invisible (50% translateX trick)
- `--ticker-duration` CSS variable controls speed; set by `tickerDuration` from ContentContext

## Page Manager — Status Gate
- `PageStatusGate` wraps `<Outlet>` inside `PublicLayout`
- Matches current `pathname` against `pageStatuses` from ContentContext (prefix or exact match)
- **Admin bypass**: always sees the real page + amber warning banner (status) or slate banner (hidden)
- **Non-admin**: `maintenance` → `<Maintenance />` page, `coming-soon` → `<UnderConstruction />` page
- `isHidden` flag: non-admin redirected away; admin still sees page with banner

---

## shadcn/ui `Select` — Important Gotcha
The `Select` component in this codebase is a **native `<select>` wrapper**, NOT Radix UI.
- **Wrong**: wrapping with `<SelectTrigger>`, `<SelectContent>`, `<SelectValue>` → causes `<div> cannot appear as child of <select>` DOM error
- **Correct**: use `<SelectItem>` (renders `<option>`) directly as children of `<Select>`

## `Tabs` Component — `onTabChange` Gotcha
`Tabs` passes `onTabChange` via `React.cloneElement` to ALL children. `TabsContent` must destructure `onTabChange` from props to prevent it being spread to the DOM `<div>`.

## Email System (Resend)
- Transactional emails sent via Resend SDK from `server/src/utils/emails/`
- Job application flow: `sendJobApplicationConfirmation` (to applicant) + `sendJobApplicationAdminNotification` (to admin)
- All email sends wrapped in `Promise.allSettled` — submission succeeds even if email fails
- OTP verification also uses Resend

## Git Rules
- Branch: `main` → remote: `github.com/MuhammadNabeelJaved/nabeel-javed-agency`
- **Never** stage `server/.claude/settings.local.json`
- Commit message format: `feat/fix/refactor: short description`
