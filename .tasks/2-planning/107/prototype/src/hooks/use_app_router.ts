import { useState } from 'react';
import { createAppRouter } from '@/routes';

export const useAppRouter = () => {
  const [router] = useState(createAppRouter);

  return router;
};
