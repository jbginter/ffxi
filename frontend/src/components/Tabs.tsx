import type { TabId } from '../types';

interface Tab { id: TabId; label: string }
interface Props { tabs: Tab[]; active: TabId; onChange: (id: TabId) => void }

export function Tabs({ tabs, active, onChange }: Props) {
  return (
    <div className="tabs">
      {tabs.map(tab => (
        <button
          key={tab.id}
          className={`tab${active === tab.id ? ' on' : ''}`}
          onClick={() => onChange(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
