import { useState } from 'react';
import { QueryClient } from '@tanstack/react-query';

export const useAppQueryClient = () => {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000,
            retry: 1,
          },
        },
      }),
  );

  return queryClient;
};
