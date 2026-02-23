import { Outlet } from '@tanstack/react-router';
import { Sidebar } from '../sidebar';

export const Layout = (): React.JSX.Element => {
  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
};
