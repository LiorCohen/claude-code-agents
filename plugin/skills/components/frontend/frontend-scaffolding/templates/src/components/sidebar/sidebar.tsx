import { Link, useRouterState } from '@tanstack/react-router';
import { Button } from '../ui';
import { cn } from '@/lib';

type NavItem = {
  readonly path: string;
  readonly label: string;
};

const navItems: readonly NavItem[] = [
  { path: '/', label: 'Home' },
  // Add navigation items here as pages are implemented
];

export const Sidebar = (): React.JSX.Element => {
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;

  return (
    <aside className="w-64 border-r bg-muted/40 min-h-screen p-4">
      <div className="mb-8">
        <h1 className="text-xl font-bold px-2">{'{{PROJECT_NAME}}'}</h1>
      </div>
      <nav>
        <ul className="space-y-1">
          {navItems.map((item) => (
            <li key={item.path}>
              <Button
                variant={currentPath === item.path ? 'secondary' : 'ghost'}
                className={cn('w-full justify-start')}
                asChild
              >
                <Link to={item.path}>{item.label}</Link>
              </Button>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
};
