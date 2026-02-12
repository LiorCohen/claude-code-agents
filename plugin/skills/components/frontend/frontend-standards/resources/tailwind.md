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

## Component Variants with clsx

```typescript
import clsx from 'clsx';

interface ButtonProps {
  readonly variant?: 'primary' | 'secondary' | 'danger';
}

export const Button = ({ variant = 'primary', children }: ButtonProps) => {
  return (
    <button
      className={clsx(
        'px-4 py-2 rounded-lg transition-colors',
        variant === 'primary' && 'bg-blue-500 hover:bg-blue-600 text-white',
        variant === 'secondary' && 'bg-gray-200 hover:bg-gray-300 text-gray-900',
        variant === 'danger' && 'bg-red-500 hover:bg-red-600 text-white'
      )}
    >
      {children}
    </button>
  );
};
```

## Styling Rules

- **NO inline styles** (`style={{ ... }}` is forbidden)
- **NO CSS files** (no .css, .scss, .less files except for global Tailwind setup)
- **NO CSS-in-JS libraries** (no styled-components, emotion, etc.)
- Use Tailwind utility classes only
- Use `clsx` for conditional classes
- Extract repeated patterns into reusable components, not CSS classes
