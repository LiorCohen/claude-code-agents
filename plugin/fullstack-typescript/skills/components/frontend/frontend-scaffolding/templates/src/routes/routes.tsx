import { createRootRoute, createRoute, createRouter } from '@tanstack/react-router';
import { Layout } from '@/components';
import { HomePage } from '@/pages';

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types -- AppRouter derives via ReturnType<>; explicit annotation would be circular
export const createAppRouter = () => {
  const rootRoute = createRootRoute({
    component: Layout,
  });

  const homeRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/',
    component: HomePage,
  });

  const routeTree = rootRoute.addChildren([homeRoute]);

  return createRouter({ routeTree });
};

export type AppRouter = ReturnType<typeof createAppRouter>;

// Register the router for type-safe route paths in Link, useNavigate, useParams, etc.
declare module '@tanstack/react-router' {
  interface Register {
    router: AppRouter;
  }
}
