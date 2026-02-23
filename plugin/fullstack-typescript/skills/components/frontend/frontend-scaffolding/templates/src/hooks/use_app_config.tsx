import { createContext, useContext, type ReactNode } from 'react';
import type { WebappConfig } from '{{CONFIG_PACKAGE}}';

const AppConfigContext = createContext<WebappConfig | null>(null);

type AppConfigProviderProps = {
  readonly config: WebappConfig;
  readonly children: ReactNode;
};

export const AppConfigProvider = ({ config, children }: AppConfigProviderProps): React.JSX.Element => (
  <AppConfigContext.Provider value={config}>{children}</AppConfigContext.Provider>
);

export const useAppConfig = (): WebappConfig => {
  const config = useContext(AppConfigContext);
  if (config === null) {
    throw new Error('useAppConfig must be used within an AppConfigProvider');
  }
  return config;
};
