# Phase 1 — Foundation & Auth

Everything else depends on this. Real login, permission system, API helpers, and patterns that every other module will reuse.

## 1.1 Upgrade AuthContext

Current CRM AuthContext only has `{ isAuthenticated, logout }`. Needs to match CMS version.

**Target AuthContext interface:**
```ts
interface AuthState {
  user: AuthUser | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  hasPermission: (code: string) => boolean;
}
```

**AuthUser shape** (from JWT + /auth/me):
```ts
interface AuthUser {
  id: string;
  username: string;
  email: string;
  roles: string[];
  permissions: string[];
  profile: ProfileResponse | null;
}
```

**Tasks:**
- Upgrade `AuthContext.tsx` with full AuthState
- On mount: check stored token → call `GET /auth/me` to hydrate user
- On `bopacorp:token-refreshed` event: re-fetch `/auth/me`
- Login: `POST /auth/login` → save tokens + decode JWT for permissions → set user
- Logout: `POST /auth/logout` with refreshToken → clearAll → redirect

## 1.2 JWT decoding utility

Create `src/services/jwt.ts`:
- `decodeJwtPayload(token)` → extracts `{ sub, email, roles, permissions }` from JWT without verification (verification happens server-side)

## 1.3 Auth service file

Create `src/services/auth.service.ts`:
- `login(email, password)` → `POST /auth/login` → returns `LoginResponse`
- `logout(refreshToken)` → `POST /auth/logout`
- `getMe()` → `GET /auth/me` → returns `MeResponse`
- `changePassword(current, new)` → `PATCH /auth/change-password`

## 1.4 Permission utilities

**`usePermission` hook** — `src/modules/auth/hooks/usePermission.ts`:
- `hasPermission(code)` — single permission check against user.permissions
- `hasAnyPermission(codes[])` — OR-logic check

**`<Can>` component** — `src/modules/auth/components/Can.tsx`:
- `<Can permission="negotiations.read">` — renders children only if user has permission
- `<Can any={['negotiations.read', 'negotiations.create']}>` — OR-logic

**`<PermissionRoute>` component** — `src/modules/auth/components/PermissionRoute.tsx`:
- Wraps route content with permission check
- Shows "Sin permisos" fallback if denied

## 1.5 Real LoginPage

Replace mock login with real auth flow:
- Form: email + password with validation
- Call `authService.login()` on submit
- Handle error states (invalid credentials, locked account)
- Show loading state on button during request
- On success: save tokens, set user in context, redirect to `/`

## 1.6 API layer enhancements

Add `requestPaginated<T>()` to `services/api.ts`:
```ts
async function requestPaginated<T>(config): Promise<{ data: T[], meta: PaginationMeta }> {
  const response = await api(config);
  if (!response.data.success) throw new ApiError(...);
  return { data: response.data.data, meta: response.data.meta };
}
```

## 1.7 Sidebar user info

Update `Sidebar.tsx`:
- Show logged-in user name/email at bottom
- Add logout button
- Conditionally show nav items based on permissions (optional, can defer)

## 1.8 Shared component gaps

Components to port from CMS or create:
- **`Can`** — permission render gate (described above)
- **Error code mapping** — add `UNAUTHORIZED`, `FORBIDDEN`, `NOT_FOUND`, `CONFLICT` message map to ErrorState

## Endpoints consumed

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/auth/login` | POST | Authenticate |
| `/auth/logout` | POST | Invalidate session |
| `/auth/refresh` | POST | Refresh token (already in api.ts interceptor) |
| `/auth/me` | GET | Fetch current user |
| `/auth/change-password` | PATCH | Change password |

## Deliverable

After this phase: real login works, user is hydrated with permissions, `<Can>` component gates UI, `requestPaginated` available for all modules, sidebar shows user info.
