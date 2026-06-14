# Phase 8 — Notifications & Polish

Final phase. Notification system, cross-cutting UX improvements, and quality hardening.

## 8.1 Notification system

### Service layer

Create `src/services/notifications.service.ts`:
- `listNotifications(params)` → `GET /notifications` → paginated
  - Params: recipientId, isRead
- `getNotification(id)` → `GET /notifications/:id`
- `updateNotification(id, data)` → `PUT /notifications/:id`
  - data: `{ isRead: boolean }`
- `markAllRead()` → `PUT /notifications/mark-all-read`
- `getUnreadCount()` → `GET /notifications/unread-count`

### Data hook

**`useNotifications()`** — manages notification state app-wide.
- Fetches unread count on mount and at interval (polling every 60s or on focus)
- Provides: `{ unreadCount, notifications, markAsRead, markAllRead, loading }`

### UI — Notification bell

Add to app header (MainLayout top bar):
- Bell icon with unread count badge (red dot or number)
- Click opens notification popover/sheet
- Popover shows recent notifications list:
  - Title, message preview, time ago
  - Unread items highlighted (bold or dot indicator)
  - Click marks as read + navigates to related entity if referenceType/referenceId exist
- "Marcar todo como leído" action
- "Ver todas" link (optional full notifications page)

### Navigation from notifications

Map `referenceType` + `referenceId` to routes:
- `negotiation` → `/negociaciones/:referenceId`
- `document` → `/documentacion` (with filter)
- `matrix` → `/catalogo/matrices/:referenceId`
- `application` → `/empleabilidad/aplicantes`

## 8.2 Sidebar navigation improvements

- Permission-based nav item visibility: hide sections user can't access
- Active route highlighting refinement
- Notification badge on relevant sections (e.g., pending count on Documentación)
- Mobile responsive: hamburger menu + overlay sidebar on small screens

## 8.3 Error handling improvements

- Global error boundary component wrapping main content
- 401 errors → auto-redirect to login (already in API layer, verify UX)
- 403 errors → show "Sin permisos" inline state (not full page redirect)
- Network errors → toast with retry suggestion
- Error code mapping in Spanish for all ApiError codes

## 8.4 Loading states refinement

- Skeleton components per module (not just generic PageLoader)
- Button loading states during form submissions (prevent double-submit)
- Optimistic UI for simple updates (toggle read, mark attended)

## 8.5 Empty states per module

Customize EmptyState per section with contextual message and action:
- Negociaciones: "No hay negociaciones. Crea una para comenzar." + create button
- Documentación: "No hay documentos pendientes." (no action — good state)
- Catálogo: "No hay matrices de oferta." + create button
- Reportes: "No hay objetivos definidos." + create button
- Aplicantes: "No hay aplicaciones." + create vacancy button
- Mensajes: "No hay mensajes de contacto."

## 8.6 Date formatting

Standardize date display across all modules:
- Use `Intl.DateTimeFormat` or lightweight formatter
- Dates: "13 jun 2026" (short month, Spanish locale)
- Datetimes: "13 jun 2026, 14:30"
- Relative: "hace 2 horas", "hace 3 días" for recent activity
- Create shared `formatDate()`, `formatDateTime()`, `formatRelative()` utilities in `src/lib/formatters.ts`

## 8.7 Pagination component

Standardize pagination across all list pages:
- Use shadcn Pagination component
- Show: page numbers, prev/next, items per page info
- Sync with URL query params (optional but nice for shareable links)

## 8.8 Confirm dialogs for destructive actions

Standardize confirmation for:
- Delete operations (client, negotiation, document, matrix, vacancy)
- State changes that can't be undone
- Use shadcn AlertDialog with clear action description

## 8.9 StateBadge enhancement

Update StateBadge to handle all state types consistently:
- Negotiation states (dynamic from API, map by code)
- Document states (PENDING_APPROVAL, ACCEPTED, REJECTED)
- Matrix states (DRAFT, PENDING_APPROVAL, APPROVED, REJECTED)
- Application states (DRAFT, PENDING, ACCEPTED, REJECTED)
- Visit verification (verified/unverified)
- Contact request (attended/pending)

## 8.10 Accessibility

- All interactive elements keyboard-navigable
- ARIA labels on icon-only buttons
- Focus management in dialogs and sheets
- Color contrast meeting WCAG 2.1 AA (already handled by design tokens)
- Screen reader text for StateBadge states

## 8.11 Types consumed

From `@bopacorp/shared/notifications`:
- `NotificationResponse`, `NotificationListItemResponse`
- `CreateNotificationRequest`, `UpdateNotificationRequest`
- `ListNotificationsQuery`

## Deliverable

After this phase: notification bell with unread count, polished error/loading/empty states, consistent date formatting, accessibility compliance, permission-aware navigation, confirmation dialogs. CRM is production-ready.
