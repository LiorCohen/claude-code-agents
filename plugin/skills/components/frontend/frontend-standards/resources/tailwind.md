# TailwindCSS (Mandatory)

**All styling MUST use TailwindCSS utility classes.**

## Basic Usage

```typescript
export const Button = ({ children, onClick }: ButtonProps) => {
  return (
    <button
      onClick={onClick}
      className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 active:bg-blue-700 transition-colors duration-200"
    >
      {children}
    </button>
  );
};
```

## Responsive Design

```typescript
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {/* Responsive grid */}
</div>
```

## Dark Mode Support

```typescript
<div className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">
  {/* Automatic dark mode */}
</div>
```

## Class Merging with `cn()`

Use `cn()` from `@/lib` for all conditional or merged class names. `cn()` wraps `clsx` + `tailwind-merge`, so Tailwind class conflicts are resolved correctly.

```typescript
import { cn } from '@/lib';

type CardProps = {
  readonly variant?: 'default' | 'outlined';
  readonly className?: string;
  readonly children: React.ReactNode;
};

export const Card = ({ variant = 'default', className, children }: CardProps) => {
  return (
    <div
      className={cn(
        'rounded-lg p-4 transition-shadow',
        variant === 'default' && 'bg-white shadow-sm hover:shadow-md',
        variant === 'outlined' && 'border border-gray-200',
        className,
      )}
    >
      {children}
    </div>
  );
};
```

**Why `cn()` instead of raw `clsx`:** Raw `clsx` concatenates classes but does not resolve conflicts. `cn()` uses `tailwind-merge` under the hood, so `cn('p-4', 'p-2')` correctly resolves to `'p-2'` instead of keeping both.

### `cn()` implementation

```typescript
// src/lib/cn.ts
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));
```

## Component Variants with `cva`

Use `cva` (class-variance-authority) for components with multiple variant axes. This replaces manual conditional class logic.

```typescript
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib';

const buttonVariants = cva(
  // Base classes (always applied)
  'inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90',
        destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
        outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 rounded-md px-3',
        lg: 'h-11 rounded-md px-8',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants> & {
    readonly className?: string;
  };

export const Button = ({ className, variant, size, ...props }: ButtonProps) => {
  return (
    <button
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  );
};
```

**When to use `cva` vs `cn()`:**

| Scenario | Use |
|----------|-----|
| Simple conditional class (1-2 conditions) | `cn()` |
| Component with multiple variant axes | `cva` |
| Merging external `className` prop | `cn()` (always) |
| Shadcn-style component definitions | `cva` + `cn()` together |

## Styling Rules

- **NO inline styles** (`style={{ ... }}` is forbidden)
- **NO CSS files** (no .css, .scss, .less files except for global Tailwind setup)
- **NO CSS-in-JS libraries** (no styled-components, emotion, etc.)
- Use Tailwind utility classes only
- Use `cn()` for conditional/merged classes (not raw `clsx`)
- Use `cva` for multi-variant component definitions
- Extract repeated patterns into reusable components, not CSS classes
