import { QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from '@tanstack/react-router';
import { useAppQueryClient, useAppRouter } from '@/hooks';

export const App = () => {
  const queryClient = useAppQueryClient();
  const router = useAppRouter();

  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  );
};
