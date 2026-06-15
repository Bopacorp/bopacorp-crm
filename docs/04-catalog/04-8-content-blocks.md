# 4.8 — Content blocks (CMS)

## Goal

Build a simple content block management page for CMS landing content. Each block has a unique `contentKey`, a content type, title, body, and sort order.

## Page

`src/modules/catalog/pages/ContentBlocksPage.tsx`

Route: `/catalogo/contenido`

## Layout

Standard CRUD list per `docs/09-crud-standards.md`:

### SectionHeader
- Title: "Contenido"
- Description: "Bloques de contenido para el sitio web"
- Actions: "Nuevo bloque" button (permission: `content_blocks.create`)

### FilterBar

| Filter | Type | Options |
|--------|------|---------|
| Search | text | Placeholder: "Buscar por clave o título..." |
| Tipo de contenido | select | From `useContentTypeOptions()` + "Todos" |

### EntityTable

| Column | Accessor |
|--------|----------|
| Clave | `contentKey` — monospace |
| Tipo | `contentType.name` or "—" |
| Título | `title` or "—" |
| Orden | `sortOrder` |

Row click → opens detail sheet.

### Detail Sheet

`ContentBlockSheet.tsx` — standard view/edit sheet:

**View mode:**
- Content key (read-only identifier)
- Content type name
- Title
- Body (rendered as text, possibly with markdown preview)
- Sort order

**Edit mode:**
- `contentKey` — text, required, read-only on edit
- `contentTypeId` — select from content types
- `title` — text, optional
- `body` — textarea (large), optional
- `sortOrder` — number, default 0

### Delete

Hard delete (not soft). Confirmation dialog with content key.

## Verification

- `npm run check` passes
- List loads, filters work
- Create/edit/delete content blocks
- Permission gating
