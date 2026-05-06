import { useState, useCallback } from 'react';
import { DataProvider, useData } from './context/DataContext';
import { Header } from './components/Header';
import { Tabs } from './components/Tabs';
import { ChainBuilder } from './components/ChainBuilder';
import { SCPlanner } from './components/SCPlanner';
import { SkillchainReference } from './components/SkillchainReference';
import { MagicBurst } from './components/MagicBurst';
import { WeaponSkills } from './components/WeaponSkills';
import { Character } from './components/Character';
import type { CharacterJob, TabId } from './types';

const TABS: { id: TabId; label: string }[] = [
  { id: 'builder',      label: 'Chain Builder' },
  { id: 'planner',      label: 'SC Planner' },
  { id: 'reference',    label: 'Skillchain Reference' },
  { id: 'magicburst',   label: 'Magic Burst' },
  { id: 'weaponskills', label: 'Weapon Skills' },
  { id: 'character',    label: 'Character' },
];

function AppShell() {
  const [activeTab, setActiveTab] = useState<TabId>('builder');
  const [characterJobs, setCharacterJobs] = useState<CharacterJob[]>([]);
  const { loading, error } = useData();

  const handleJobsChange = useCallback((jobs: CharacterJob[]) => {
    setCharacterJobs(jobs);
  }, []);

  if (loading) {
    return (
      <>
        <Header />
        <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-1)' }}>Loading data…</div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Header />
        <div style={{ padding: 40, textAlign: 'center', color: '#e85d04' }}>
          Failed to load: {error}
          <br />
          <small style={{ color: 'var(--text-2)' }}>Make sure the backend is running on port 8000.</small>
        </div>
      </>
    );
  }

  return (
    <>
      <Header />
      <Tabs tabs={TABS} active={activeTab} onChange={setActiveTab} />
      <div className={`pane${activeTab === 'builder'      ? ' on' : ''}`}>
        <ChainBuilder characterJobs={characterJobs} />
      </div>
      <div className={`pane${activeTab === 'planner'      ? ' on' : ''}`}><SCPlanner /></div>
      <div className={`pane${activeTab === 'reference'    ? ' on' : ''}`}><SkillchainReference /></div>
      <div className={`pane${activeTab === 'magicburst'   ? ' on' : ''}`}><MagicBurst /></div>
      <div className={`pane${activeTab === 'weaponskills' ? ' on' : ''}`}><WeaponSkills /></div>
      <div className={`pane${activeTab === 'character'    ? ' on' : ''}`}>
        <Character onJobsChange={handleJobsChange} />
      </div>
    </>
  );
}

export function App() {
  return (
    <DataProvider>
      <AppShell />
    </DataProvider>
  );
}
