import { QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from '@tanstack/react-router';
import { useAppQueryClient, useAppRouter, AppConfigProvider } from '@/hooks';
import type { WebappConfig } from '{{CONFIG_PACKAGE}}';

type AppProps = {
  readonly config: WebappConfig;
};

export const App = ({ config }: AppProps): React.JSX.Element => {
  const queryClient = useAppQueryClient();
  const router = useAppRouter();

  return (
    <AppConfigProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </AppConfigProvider>
  );
};
