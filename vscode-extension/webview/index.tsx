import { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import type {
  ExtensionToWebviewMessage,
  ParsedItem,
} from '../src/types';
import { onMessage } from './vscode-api';
import { StepperPanel } from './StepperPanel';
import './stepper.css';

const App = () => {
  const [item, setItem] = useState<ParsedItem | undefined>(undefined);
  const [allItems, setAllItems] = useState<ReadonlyArray<ParsedItem>>([]);

  useEffect(() => {
    return onMessage((msg: ExtensionToWebviewMessage) => {
      if (msg.type === 'showItem') {
        setItem(msg.item);
        setAllItems(msg.allItems);
      }
    });
  }, []);

  if (!item) {
    return (
      <div className="empty-state">
        Select a workflow item to view its lifecycle
      </div>
    );
  }

  return <StepperPanel item={item} allItems={allItems} />;
};

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(<App />);
}
