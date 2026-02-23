import { useState } from 'react';
import { createAppRouter, type AppRouter } from '@/routes';

export const useAppRouter = (): AppRouter => {
  const [router] = useState(createAppRouter);

  return router;
};
