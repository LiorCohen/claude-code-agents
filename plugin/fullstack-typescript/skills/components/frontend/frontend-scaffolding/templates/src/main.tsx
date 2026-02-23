import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './app';
import type { WebappConfig } from '{{CONFIG_PACKAGE}}';

export const mount = (elementId: string, config: WebappConfig): void => {
  if (typeof elementId !== 'string' || elementId.length === 0) {
    throw new Error('mount() requires a non-empty elementId string');
  }
  if (config == null || typeof config !== 'object') {
    throw new Error('mount() requires a non-null config object');
  }

  const root = document.getElementById(elementId);
  if (!root) throw new Error(`Element #${elementId} not found`);

  createRoot(root).render(
    <StrictMode>
      <App config={config} />
    </StrictMode>,
  );
};
