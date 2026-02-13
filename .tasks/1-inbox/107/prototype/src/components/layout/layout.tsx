import { Outlet } from '@tanstack/react-router';
import { Sidebar } from '@/components/sidebar';

export const Layout = () => {
  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
};
