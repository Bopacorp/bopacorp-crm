# Estándar de formularios

Checklist mínimo para que un formulario sea aceptado en este proyecto.

## Stack obligatorio

- **Zod** — schema de validación
- **react-hook-form** — estado del formulario
- **@hookform/resolvers** — `zodResolver` conecta Zod con react-hook-form

## Schema

- [ ] Viene de `@bopacorp/shared/<modulo>` (nunca local, salvo extensiones como validación de `File`)
- [ ] Tipo del formulario derivado del schema: `type FormValues = z.input<typeof Schema>`

## Configuración del form

```tsx
const form = useForm<FormValues>({
  resolver: zodResolver(Schema),
  defaultValues: { /* todos los campos */ },
  mode: 'onTouched',
});
```

- [ ] `mode: 'onTouched'` — valida al perder foco, no antes
- [ ] `defaultValues` explícitos para cada campo

## Componentes UI

- [ ] `FieldGroup` envuelve todos los campos
- [ ] `Field` con `data-invalid` por campo
- [ ] `FieldLabel` con `htmlFor` correcto
- [ ] `FieldError` muestra `form.formState.errors.<campo>.message`
- [ ] `Input` / `Textarea` de `@/components/ui/`
- [ ] Inputs deshabilitados durante submit (`disabled={form.formState.isSubmitting}`)

```tsx
<Field data-invalid={form.formState.errors.nombre ? true : undefined}>
  <FieldLabel htmlFor="nombre">Nombre</FieldLabel>
  <Input id="nombre" disabled={form.formState.isSubmitting} {...form.register('nombre')} />
  {form.formState.errors.nombre && (
    <FieldError>{form.formState.errors.nombre.message}</FieldError>
  )}
</Field>
```

## Botón submit

- [ ] `disabled` incluye validación post-primer intento:

```tsx
<Button
  type="submit"
  disabled={form.formState.isSubmitting || (form.formState.isSubmitted && !form.formState.isValid)}
>
```

- [ ] Muestra spinner (`Loader2`) durante submit

## Errores del servidor

- [ ] Errores de campo mapeados con `form.setError(field, { type: 'manual', message })`
- [ ] Error general mostrado con `FormAlert`

```tsx
if (state.kind === 'error' && state.details?.length) {
  for (const detail of state.details) {
    form.setError(detail.field, { type: 'manual', message: detail.message });
  }
}
```

## Formularios en diálogos

- [ ] `useUnsavedGuard` para prevenir cierre accidental con cambios sin guardar
- [ ] `DiscardChangesDialog` para confirmar descarte
- [ ] Reset del form al cerrar el diálogo

## HTML

- [ ] `noValidate` en `<form>` (Zod maneja validación, no el browser)
- [ ] `autoComplete` en campos relevantes (email, password)
- [ ] `maxLength` en inputs de texto (coincide con `.max()` del schema)

## No hacer

- No crear schemas locales si ya existen en `@bopacorp/shared`
- No usar `useState` para estado de formulario — usar react-hook-form
- No validar manualmente — dejar que `zodResolver` lo haga
- No usar `space-y-*` — usar `gap-*` en contenedores
- No usar `w-X h-X` — usar `size-X`
- No interpolar ternarios en `className` — usar `cn()`
