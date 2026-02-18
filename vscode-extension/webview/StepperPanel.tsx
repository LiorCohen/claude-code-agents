import React from 'react';
import type {
  ParsedItem,
  ParsedLeafItem,
  ParsedEpicItem,
} from '../src/types';
import { postMessage } from './vscode-api';

type Props = {
  readonly item: ParsedItem;
  readonly allItems: ReadonlyArray<ParsedItem>;
};

const PHASES = ['Spec', 'Plan', 'Implement', 'Review'] as const;

type StepState = 'passed' | 'active' | 'attention' | 'pending';

const getPhaseStates = (item: ParsedLeafItem): readonly [StepState, StepState, StepState, StepState] => {
  const spec: StepState =
    item.specStatus === 'approved'
      ? 'passed'
      : item.specStatus === 'in_progress'
        ? 'active'
        : item.specStatus === 'ready_for_review' ||
            item.specStatus === 'needs_rereview'
          ? 'attention'
          : 'pending';

  const plan: StepState =
    item.planStatus === 'approved'
      ? 'passed'
      : item.planStatus === 'in_progress'
        ? 'active'
        : 'pending';

  const impl: StepState =
    item.implStatus === 'complete'
      ? 'passed'
      : item.implStatus === 'in_progress'
        ? 'active'
        : 'pending';

  const review: StepState =
    item.reviewStatus === 'approved'
      ? 'passed'
      : item.reviewStatus === 'changes_requested'
        ? 'attention'
        : item.reviewStatus === 'ready_for_review'
          ? 'active'
          : 'pending';

  return [spec, plan, impl, review];
};

const getPhaseIcon = (state: StepState): string => {
  const iconMap: Record<StepState, string> = {
    passed: '✓',
    active: '→',
    attention: '!',
    pending: '○',
  };
  return iconMap[state];
};

const needsAttention = (item: ParsedLeafItem): boolean =>
  item.specStatus === 'ready_for_review' ||
  item.specStatus === 'needs_rereview' ||
  item.reviewStatus === 'changes_requested';

const getAttentionMessage = (item: ParsedLeafItem): string => {
  if (item.specStatus === 'ready_for_review') return 'Spec is ready for your review';
  if (item.specStatus === 'needs_rereview') return 'Spec needs re-review after upstream change';
  if (item.reviewStatus === 'changes_requested') return 'Changes were requested during review';
  return '';
};

const LeafView = ({ item, allItems }: { readonly item: ParsedLeafItem; readonly allItems: ReadonlyArray<ParsedItem> }) => {
  const states = getPhaseStates(item);

  const deps = item.dependsOn
    .map((depId) => allItems.find((i) => i.id === depId))
    .filter((i): i is ParsedItem => i !== undefined);

  const blocking = allItems.filter(
    (i) => i.type !== 'epic' && i.dependsOn.includes(item.id),
  );

  return (
    <div className="stepper-panel">
      <div className="stepper-header">
        <h2>{item.changeId}: {item.title}</h2>
        <div className="subtitle">Type: {item.type}</div>
      </div>

      {needsAttention(item) && (
        <div className="attention-banner">
          {getAttentionMessage(item)}
        </div>
      )}

      <div className="stepper">
        {PHASES.map((phase, i) => (
          <React.Fragment key={phase}>
            {i > 0 && (
              <div className={`step-connector ${states[i - 1] === 'passed' ? 'passed' : ''}`} />
            )}
            <div className="stepper-step">
              <div className={`step-indicator ${states[i]}`}>
                {getPhaseIcon(states[i])}
              </div>
              <div className={`step-label ${states[i] === 'active' ? 'active' : ''}`}>
                {phase}
              </div>
            </div>
          </React.Fragment>
        ))}
      </div>

      {deps.length > 0 && (
        <div className="details-section">
          <h3>Dependencies</h3>
          <ul className="dependency-list">
            {deps.map((dep) => (
              <li key={dep.id}>
                {dep.type !== 'epic' ? `${(dep as ParsedLeafItem).changeId}: ` : ''}{dep.title}
              </li>
            ))}
          </ul>
        </div>
      )}

      {blocking.length > 0 && (
        <div className="details-section">
          <h3>Blocking</h3>
          <ul className="blocking-list">
            {blocking.map((b) => (
              <li key={b.id}>
                {b.type !== 'epic' ? `${(b as ParsedLeafItem).changeId}: ` : ''}{b.title}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="details-section">
        <h3>Artifacts</h3>
        <div className="artifact-links">
          <button
            className="artifact-link"
            onClick={() => postMessage({ type: 'openFile', filePath: `${item.location}/SPEC.md` })}
          >
            View Spec
          </button>
          {item.planStatus !== 'pending' && (
            <button
              className="artifact-link"
              onClick={() => postMessage({ type: 'openFile', filePath: `${item.location}/PLAN.md` })}
            >
              View Plan
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

const EpicView = ({ item, allItems }: { readonly item: ParsedEpicItem; readonly allItems: ReadonlyArray<ParsedItem> }) => {
  const children = allItems.filter(
    (i): i is ParsedLeafItem => i.type !== 'epic' && i.parentId === item.id,
  );

  const total = children.length;
  const specDone = children.filter((c) => c.specStatus === 'approved').length;
  const planDone = children.filter((c) => c.planStatus === 'approved').length;
  const implDone = children.filter((c) => c.implStatus === 'complete').length;
  const reviewDone = children.filter((c) => c.reviewStatus === 'approved').length;

  const progressBars = [
    { label: 'Spec', done: specDone },
    { label: 'Plan', done: planDone },
    { label: 'Impl', done: implDone },
    { label: 'Review', done: reviewDone },
  ];

  return (
    <div className="stepper-panel">
      <div className="stepper-header">
        <h2>{item.title}</h2>
        <div className="subtitle">Epic — {total} items</div>
      </div>

      <div className="epic-progress">
        {progressBars.map((bar) => (
          <div className="progress-row" key={bar.label}>
            <span className="progress-label">{bar.label}</span>
            <div className="progress-bar">
              <div
                className="progress-bar-fill"
                style={{ width: total > 0 ? `${(bar.done / total) * 100}%` : '0%' }}
              />
            </div>
            <span className="progress-count">{bar.done}/{total}</span>
          </div>
        ))}
      </div>

      <div className="details-section">
        <h3>Children</h3>
        <ul className="children-list">
          {children.map((child) => {
            const states = getPhaseStates(child);
            const statusSymbols = states.map((s) => getPhaseIcon(s)).join(' ');
            return (
              <li
                key={child.id}
                className="child-item"
                onClick={() => postMessage({ type: 'selectItem', itemId: child.id })}
              >
                <span className="child-status">{statusSymbols}</span>
                <span>{child.changeId}: {child.title}</span>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
};

export const StepperPanel = ({ item, allItems }: Props) => {
  if (item.type === 'epic') {
    return <EpicView item={item as ParsedEpicItem} allItems={allItems} />;
  }
  return <LeafView item={item as ParsedLeafItem} allItems={allItems} />;
};
