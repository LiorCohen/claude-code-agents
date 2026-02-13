# Shadcn UI

Shadcn UI provides copy-paste React components built on Radix UI primitives, styled with TailwindCSS and `cva`. Components live in `src/components/ui/` and are owned by the project (not an npm dependency).

---

## Component Hierarchy (D6)

When building UI, follow this decision order:

1. **Use Shadcn component if it exists** — check `components/ui/` first
2. **Build on a Radix primitive following Shadcn patterns** — if Shadcn doesn't have it but Radix does
3. **Fully custom component** — only when no Radix primitive applies

Never re-implement what Shadcn or Radix already provides.

---

## Component Anatomy

Every `components/ui/` file follows this structure:

```typescript
import * as React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { cn } from '@/lib';

const Dialog = DialogPrimitive.Root;
const DialogTrigger = DialogPrimitive.Trigger;

const DialogContent = React.forwardRef<
  React.ComponentRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <DialogPrimitive.Portal>
    <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/80" />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        'fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2',
        'w-full max-w-lg rounded-lg bg-background p-6 shadow-lg',
        className,
      )}
      {...props}
    >
      {children}
    </DialogPrimitive.Content>
  </DialogPrimitive.Portal>
));
DialogContent.displayName = DialogPrimitive.Content.displayName;

export { Dialog, DialogTrigger, DialogContent };
```

### Key patterns

- **`forwardRef`** — all components forward refs for composition
- **`className` prop** — always accepted, always merged via `cn()`
- **Spread `...props`** — remaining props passed through to the primitive
- **`displayName`** — set for DevTools (mirrors the primitive name)
- **`cn()` merging** — base styles + external `className` merged with tailwind-merge

---

## TS Standards Exceptions for `components/ui/` (D24)

The following patterns are **allowed only in `components/ui/` files** and forbidden elsewhere:

| Pattern | Why allowed in `ui/` |
|---------|----------------------|
| `React.forwardRef` | Required by Radix composition model |
| `ComponentName.displayName = ...` | Required for DevTools with forwardRef |
| `import * as React from 'react'` | Needed for `React.forwardRef`, `React.ComponentRef` etc. |

Outside `components/ui/`, these patterns remain forbidden per TypeScript standards.

---

## `cva` for Variants

Use `cva` (class-variance-authority) to define variant styles. This is the standard pattern for Shadcn-style components.

```typescript
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib';

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-primary text-primary-foreground',
        secondary: 'border-transparent bg-secondary text-secondary-foreground',
        destructive: 'border-transparent bg-destructive text-destructive-foreground',
        outline: 'text-foreground',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

type BadgeProps = React.HTMLAttributes<HTMLDivElement> &
  VariantProps<typeof badgeVariants>;

export const Badge = ({ className, variant, ...props }: BadgeProps) => (
  <div className={cn(badgeVariants({ variant }), className)} {...props} />
);
```

### `cva` rules

- Define a `*Variants` const with `cva(baseClasses, { variants, defaultVariants })`
- Derive the props type with `VariantProps<typeof *Variants>`
- Always merge with `cn(variantsFn({ ...variantProps }), className)`
- Export the variants const if consumers need to reuse the styles (e.g., `buttonVariants` for link-styled buttons)

---

## `components/ui/` Structure

Shadcn components live in a **flat** directory — no subdirectories:

```text
src/components/ui/
├── index.ts          # Barrel: re-exports all ui components
├── button.tsx
├── card.tsx
├── dialog.tsx
├── dropdown_menu.tsx
├── input.tsx
├── label.tsx
├── select.tsx
├── sheet.tsx
├── table.tsx
└── tooltip.tsx
```

- File names use `lowercase_with_underscores` (e.g., `dropdown_menu.tsx`, not `dropdown-menu.tsx`)
- One component family per file (a file may export multiple related parts like `Dialog`, `DialogContent`, `DialogTrigger`)
- The `index.ts` barrel re-exports everything so consumers import from `@/components/ui`

---

## Radix vs Shadcn vs Custom Decision Tree

```text
Need a UI element?
│
├─ Does Shadcn have it? (check components/ui/)
│  └─ YES → Use it directly. Customize via className/variants.
│
├─ Does Radix have a primitive? (e.g., Popover, Tooltip, Accordion)
│  └─ YES → Build a Shadcn-style wrapper:
│           - forwardRef
│           - className + cn() merging
│           - cva if multiple variants
│           - Place in components/ui/
│
└─ Neither?
   └─ Build a fully custom component.
      - Still use forwardRef + className + cn() if it's a ui/ primitive.
      - If it's a domain component, put it in components/<name>/ instead.
```

---

## Usage in Application Components

Application components consume Shadcn primitives from the barrel:

```typescript
// src/pages/settings/settings_page.tsx
import { Button } from '@/components/ui';
import { Card } from '@/components/ui';
import { useSettingsViewModel } from './use_settings_view_model';

export const SettingsPage = () => {
  const { settings, handleSave, isSaving } = useSettingsViewModel();

  return (
    <Card className="max-w-2xl mx-auto mt-8 p-6">
      <h1 className="text-2xl font-bold mb-4">Settings</h1>
      {/* ... form fields ... */}
      <Button onClick={handleSave} disabled={isSaving}>
        {isSaving ? 'Saving...' : 'Save Changes'}
      </Button>
    </Card>
  );
};
```

---

## Living Examples

The scaffold's `components/ui/` files are the canonical reference for Shadcn patterns. When in doubt about anatomy, naming, or style conventions, refer to those files directly rather than external documentation.
