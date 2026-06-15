# Postmortem: Sheet de detalle de aplicación no hacía scroll

## Metadatos

| Campo | Valor |
|-------|-------|
| **Fecha del incidente** | 2026-06-15 |
| **Descubierto por** | Equipo de producto (screenshot de UI) |
| **Componente afectado** | `src/modules/employability/components/ApplicationDetailSheet.tsx` |
| **Severidad** | Media-Alta (bloqueo parcial de información en móvil / viewport pequeño) |
| **Estado** | Resuelto |
| **PR / commit** | Cambio local aplicado, pendiente de commit por el equipo |

---

## 1. Resumen ejecutivo

El panel lateral (Sheet) que muestra el detalle de una aplicación de empleabilidad no permitía hacer scroll de su contenido interno cuando la suma de tarjetas (`Card`) excedía la altura disponible. Visualmente, las tarjetas inferiores quedaban cortadas y no había forma de desplazarse para verlas.

La causa raíz fue una combinación de tres factores:

1. **El contenedor scrolleable era al mismo tiempo un flex container con `gap-6`.**
2. **`Card` (el componente base de tarjetas) aplica `overflow-hidden`**, lo que permite a un flex item encogerse por debajo de su altura natural de contenido.
3. **`SheetContent` no tenía `overflow-hidden` ni una altura explícita suficientemente robusta**, por lo que el `flex-1` del contenedor scrolleable dependía de un contexto flex padre que, aunque teóricamente funcionaba, interactuaba mal con el punto anterior.

El resultado neto es que los `Card` se comprimían para caber en la altura disponible en lugar de desbordarla, haciendo que `overflow-y-auto` nunca activara el scroll.

---

## 2. Síntomas observados

- En el Sheet "Detalle de aplicación", las tarjetas `CANDIDATO`, `VACANTE`, `APLICACIÓN` y `HOJA DE VIDA` se renderizaban una debajo de otra.
- Cuando el contenido no cabía en la pantalla, la última tarjeta se cortaba en el borde inferior del viewport.
- No aparecía scrollbar ni respondía a gestos de scroll / rueda del ratón.
- El problema se manifestaba especialmente en viewports pequeños o cuando la tarjeta `APLICACIÓN` contenía `reviewNotes` o `coverLetter` extensos.

---

## 3. Timeline

| Hora (aprox.) | Acción |
|---------------|--------|
| 2026-06-15 | Reporte vía screenshot: "los cards internos no tienen scroll". |
| 2026-06-15 | Revisión de código de `ApplicationDetailSheet.tsx` y `sheet.tsx`. |
| 2026-06-15 | Creación de ruta temporal `/__test-sheet` con datos mock para reproducir el bug. |
| 2026-06-15 | Medición con Playwright: `scrollHeight === clientHeight` (528 px), confirmando que el contenido no desbordaba. |
| 2026-06-15 | Aplicación del fix: separar el contenedor scrolleable del contenedor de layout flex. |
| 2026-06-15 | Re-verificación: `scrollHeight = 1284 px`, `clientHeight = 528 px`; scroll funcional. |
| 2026-06-15 | `npm run build`, `npm run lint`, `npm run check` pasan correctamente. |
| 2026-06-15 | Limpieza de archivos temporales y redacción de este postmortem. |

---

## 4. Contexto técnico

### 4.1 Estructura del Sheet

```tsx
<Sheet open={open} onOpenChange={onOpenChange}>
  <SheetContent className="sm:max-w-xl">
    <SheetHeader>
      <SheetTitle>Detalle de aplicación</SheetTitle>
    </SheetHeader>

    {/* Estado de carga / error / contenido */}
    <div className="flex flex-1 flex-col gap-6 overflow-y-auto min-h-0 p-4">
      {/* tarjetas */}
    </div>
  </SheetContent>
</Sheet>
```

### 4.2 Clases relevantes de `SheetContent`

El componente base (`src/components/ui/sheet.tsx`) aplica:

```txt
fixed z-50 flex flex-col gap-4 bg-popover ...
data-[side=right]:inset-y-0 data-[side=right]:right-0
data-[side=right]:h-full data-[side=right]:w-3/4
```

Esto convierte al Sheet en un contenedor flex de columna con altura de viewport, separando verticalmente el `SheetHeader` del cuerpo scrolleable mediante `gap-4`.

### 4.3 Implementación de `Card`

```tsx
<div
  data-slot="card"
  className="group/card flex flex-col gap-(--card-spacing) overflow-hidden rounded-xl ..."
>
```

La clase `overflow-hidden` es clave: le dice al navegador que el contenido sobrante del `Card` debe recortarse. En un contexto flex, esto hace que el item **pueda encogerse por debajo de su `min-content`**, porque el contenido no tiene por qué ser visible.

---

## 5. Análisis de la causa raíz

### 5.1 El antipatrón: `display: flex` + `overflow-y: auto` en el mismo nodo

Cuando un elemento es simultáneamente:

```css
.scrollable {
  display: flex;
  flex-direction: column;
  flex: 1 1 0%;
  min-height: 0;
  overflow-y: auto;
}
```

y sus hijos son flex items con `overflow-hidden` (como `Card`), el algoritmo de flexbox puede decidir encoger esos hijos para que quepan en la altura asignada al contenedor. Como los hijos tienen `overflow: hidden`, el navegador los recorta en lugar de desbordarlos. Por tanto:

- `scrollHeight` del contenedor scrolleable ≈ `clientHeight`.
- `overflow-y: auto` no detecta desbordamiento.
- No hay scrollbar ni scroll gestual.

### 5.2 ¿Por qué los demás Sheets funcionaban?

`BusinessClientSheet` usa el patrón correcto:

```tsx
<div className="flex-1 overflow-y-auto p-4">   {/* scrolleable, NO flex */}
  <div className="flex flex-col gap-5">        {/* layout flex interno */}
    {/* cards */}
  </div>
</div>
```

Aquí:

1. El nodo scrolleable **no es un flex container**; simplemente tiene `overflow-y: auto` y una altura fijada por `flex-1`.
2. El layout flex vive en un nodo interno cuya altura es `auto`.
3. Los `Card` dentro de ese nodo interno no están siendo forzados a encogerse para respetar la altura del viewport; en su lugar, su altura total natural desborda al padre scrolleable.
4. `overflow-y: auto` detecta el desbordamiento y activa el scroll.

Los formularios dentro de Sheets (`VacancyForm`, `NegotiationForm`, `BusinessClientForm`) usan una variante aún más explícita:

```tsx
<form className="flex min-h-0 flex-1 flex-col">
  <div className="flex-1 overflow-y-auto p-4">
    {/* campos */}
  </div>
  <SheetFooter>...</SheetFooter>
</form>
```

El form es el flex item que ocupa el espacio restante; el div interno es el único scrolleable.

### 5.3 ¿Por qué no falló siempre?

El bug solo era visible cuando la suma de alturas de las tarjetas superaba la altura disponible del viewport. En datos con:

- Nombres cortos,
- Sin `reviewNotes`,
- Sin `coverLetter`,
- O en pantallas grandes,

el contenido cabía y no se percibía la falta de scroll. Además, el efecto visual del corte inferior podía confundirse con un diseño intencional de "más contenido debajo" si el usuario no intentaba desplazarse.

### 5.4 El rol de `overflow-hidden` en `Card`

Sin `overflow-hidden` en `Card`, los flex items no podrían encogerse por debajo de su contenido mínimo (regla de `min-height: auto` en flex items). El navegador respetaría la altura natural del contenido y el desbordamiento activaría el scroll aunque el padre fuera flex.

Sin embargo, `overflow-hidden` es intencional en `Card` para:

- Recortar imágenes con bordes redondeados.
- Evitar desbordes accidentales de contenido largo.
- Mantener la forma visual de la tarjeta.

Por eso la solución no es quitar `overflow-hidden` de `Card`, sino no poner a los `Card` en una situación donde el layout flex padre los fuerce a encogerse.

---

## 6. Reproducción del bug

### 6.1 Datos de prueba

Se creó una aplicación mock con `reviewNotes` y `coverLetter` largos para forzar desbordamiento.

### 6.2 Medición antes del fix

```txt
scrollable: {
  scrollHeight: 528,
  clientHeight: 528
}
```

`scrollHeight === clientHeight` indica que el contenido no desborda y, por tanto, no hay scroll.

### 6.3 Medición después del fix

```txt
scrollable: {
  scrollHeight: 1284,
  clientHeight: 528
}
```

El contenido ahora desborda correctamente y el scroll está activo.

---

## 7. Solución aplicada

### 7.1 Cambio en `ApplicationDetailSheet.tsx`

**Antes:**

```tsx
<div className="flex flex-1 flex-col gap-6 overflow-y-auto min-h-0 p-4">
  {/* status + cards */}
</div>
```

**Después:**

```tsx
<div className="flex-1 overflow-y-auto min-h-0 p-4">
  <div className="flex flex-col gap-6">
    {/* status + cards */}
  </div>
</div>
```

### 7.2 Principio general

> **El contenedor que lleva `overflow-y: auto` no debe ser un flex container que distribuya el espacio vertical entre sus hijos.** El layout flex debe vivir en un nodo interno cuya altura sea `auto`, permitiendo que el padre scrolleable detecte el desbordamiento real.

### 7.3 Otras alternativas consideradas y descartadas

| Alternativa | Motivo de descarte |
|-------------|---------------------|
| Quitar `overflow-hidden` de `Card` | Rompería el diseño visual y el recorte de imágenes en todo el sistema. |
| Añadir `shrink-0` a cada `Card` | Funcionaría, pero es más frágil: cualquier nuevo hijo dentro del flex scrolleable necesitaría la misma clase, y no previene el antipatrón en futuros desarrollos. |
| Añadir `overflow-hidden` a `SheetContent` | Ayuda a contener desbordes, pero no resuelve el encogimiento de los cards; el contenido seguiría recortado sin scroll. |
| Usar `h-dvh` en `SheetContent` | Mejora la robustez en móviles, pero no era la causa raíz del bug. Se puede considerar como mejora separada. |

---

## 8. Impacto

### 8.1 Impacto directo

- Los usuarios no podían ver la información completa de una aplicación cuando esta excedía la altura de la pantalla.
- En móviles el problema era casi garantizado debido a la menor altura de viewport.
- Campos como `Notas de revisión`, `Carta de presentación` o el botón `Descargar CV` podían quedar inaccesibles.

### 8.2 Impacto indirecto

- Riesgo de decisiones erróneas por información incompleta.
- Posible confusión del usuario al pensar que la aplicación no tenía más datos.

---
## 9. Lecciones aprendidas

1. **`overflow-y: auto` y `display: flex` en el mismo nodo son peligrosos cuando los hijos tienen `overflow: hidden`.** El navegador puede encoger los hijos en lugar de desbordarlos, silenciando el scroll.
2. **La consistencia de patrones importa.** `BusinessClientSheet` ya tenía el patrón correcto; `ApplicationDetailSheet` se desvió sin razón funcional.
3. **Los componentes base (`Card`) con `overflow-hidden` deben usarse dentro de scrollports que no sean flex containers de columna.** Esto debe documentarse en las directrices de UI.
4. **El bug es silencioso:** solo se manifiesta con contenido suficientemente largo. Las pruebas visuales deben incluir datos realistas y viewports pequeños.

---

## 10. Acciones de seguimiento

### 10.1 Inmediatas (ya realizadas)

- [x] Corregir `ApplicationDetailSheet.tsx`.
- [x] Verificar build, lint y typecheck.
- [x] Limpiar rutas y componentes temporales de prueba.
- [x] Redactar este postmortem.

### 10.2 Corto plazo

- [ ] Auditar otros Sheets / Drawers / Dialogs con contenido scrolleable para detectar el mismo antipatrón.
- [ ] Evaluar `src/modules/negotiations/components/NegotiationKanbanBoard.tsx`, que usa `flex flex-1 flex-col gap-2 overflow-y-auto p-2` dentro de las columnas del kanban. Aunque las tarjetas son pequeñas y el riesgo es menor, comparte la misma causa raíz potencial.
- [ ] Añadir una nota en `DESIGN.md` o `CLAUDE.md` sobre el patrón correcto para contenido scrolleable dentro de Sheets.

### 10.3 Medio plazo

- [ ] Considerar un componente auxiliar `ScrollableSheetBody` o similar que encapsule el patrón correcto y evite repeticiones.
- [ ] Incluir en el checklist de PR una verificación de scroll en viewports móviles para componentes con contenido variable.
- [ ] Evaluar si `SheetContent` debería incluir `overflow-hidden` por defecto para contener mejor desbordes accidentales.

---

## 11. Patrón recomendado

Para cualquier Sheet/Drawer/Dialog con contenido scrolleable, usar una de estas dos estructuras:

### Opción A: cuerpo scrolleable simple (detalles, vistas de solo lectura)

```tsx
<div className="flex-1 overflow-y-auto min-h-0 p-4">
  <div className="flex flex-col gap-6">
    {/* contenido */}
  </div>
</div>
```

### Opción B: formulario con footer (formularios, edición)

```tsx
<form className="flex min-h-0 flex-1 flex-col">
  <div className="flex-1 overflow-y-auto p-4">
    {/* campos */}
  </div>
  <SheetFooter>
    <Button type="submit">Guardar</Button>
  </SheetFooter>
</form>
```

### Anti-patrón a evitar

```tsx
<!-- NO hacer esto si los hijos pueden tener overflow:hidden -->
<div class="flex flex-1 flex-col gap-6 overflow-y-auto min-h-0 p-4">
  <!-- cards con overflow-hidden -->
</div>
```

---

## 12. Apéndice: comportamiento de CSS implicado

### `min-height: auto` en flex items

Por defecto, un flex item tiene `min-height: auto` (en eje vertical). Esto significa que no puede encogerse por debajo de la altura mínima de su contenido, **a menos que** tenga `overflow` distinto de `visible`.

### `overflow: hidden` rompe `min-height: auto`

Cuando un flex item tiene `overflow: hidden`, `min-height: auto` se comporta como `0`. El item puede encogerse arbitrariamente y recortar su contenido.

### En el bug

```css
.scrollable {
  display: flex;
  flex-direction: column;
  flex: 1 1 0%;      /* altura = espacio restante del Sheet */
  min-height: 0;     /* permite que este flex item sea menor que su contenido */
  overflow-y: auto;
}

.card {
  overflow: hidden;  /* dentro del flex column, puede encogerse */
}
```

El navegador distribuye la altura disponible entre los cards. Como cada card puede recortarse (`overflow: hidden`), el total de altura se ajusta exactamente al viewport. `overflow-y: auto` no ve desbordamiento.

### Con el fix

```css
.scrollable {
  flex: 1 1 0%;
  min-height: 0;
  overflow-y: auto;
  /* NO es flex container */
}

.inner {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  /* altura = auto, crece con el contenido */
}

.card {
  overflow: hidden;
  /* ahora su altencia natural se suma a .inner */
}
```

`.inner` crece libremente con el contenido. Si `.inner` supera la altura de `.scrollable`, el desbordamiento es real y `overflow-y: auto` activa el scroll.

---

## 13. Referencias

- Archivo corregido: `src/modules/employability/components/ApplicationDetailSheet.tsx`
- Componente base del Sheet: `src/components/ui/sheet.tsx`
- Componente base de Card: `src/components/ui/card.tsx`
- Sheet de referencia con patrón correcto: `src/modules/clients/components/BusinessClientSheet.tsx`
- Formularios de referencia con patrón correcto: `src/modules/employability/components/VacancyForm.tsx`, `src/modules/negotiations/components/NegotiationForm.tsx`
- Posible riesgo similar: `src/modules/negotiations/components/NegotiationKanbanBoard.tsx` (columnas del kanban)
