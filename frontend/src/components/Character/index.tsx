import { useState, useEffect } from 'react';
import { fetchCharacter, fetchServers } from '../../lib/api';
import type { AHSale, CharacterJob, CharacterProfile, FFXIAHCharacter } from '../../types';

const JOBS = [
  'WAR','MNK','WHM','BLM','RDM','THF','PLD','DRK','BST','BRD',
  'RNG','SAM','NIN','DRG','SMN','BLU','COR','PUP','DNC','SCH','GEO','RUN',
];

const STORAGE_KEY = 'ffxi_character';

function loadProfile(): CharacterProfile | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as CharacterProfile) : null;
  } catch {
    return null;
  }
}

function saveProfile(p: CharacterProfile) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
}

function formatDate(unix: number) {
  return new Date(unix * 1000).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatGil(n: number) {
  return n.toLocaleString() + ' gil';
}

export function Character({ onJobsChange }: { onJobsChange: (jobs: CharacterJob[]) => void }) {
  const [servers, setServers] = useState<string[]>([]);
  const [profile, setProfile] = useState<CharacterProfile>(
    loadProfile() ?? { name: '', server: 'Asura', jobs: [] }
  );
  const [lookup, setLookup] = useState<FFXIAHCharacter | null>(null);
  const [lookupError, setLookupError] = useState('');
  const [lookupLoading, setLookupLoading] = useState(false);
  const [newJob, setNewJob] = useState('WAR');
  const [newLevel, setNewLevel] = useState(99);

  useEffect(() => {
    fetchServers().then(setServers).catch(() => {});
  }, []);

  useEffect(() => {
    onJobsChange(profile.jobs);
  }, [profile.jobs, onJobsChange]);

  const updateProfile = (patch: Partial<CharacterProfile>) => {
    const next = { ...profile, ...patch };
    setProfile(next);
    saveProfile(next);
  };

  const addJob = () => {
    if (profile.jobs.find(j => j.job === newJob)) return;
    updateProfile({ jobs: [...profile.jobs, { job: newJob, level: newLevel }] });
  };

  const removeJob = (job: string) => {
    updateProfile({ jobs: profile.jobs.filter(j => j.job !== job) });
  };

  const updateJobLevel = (job: string, level: number) => {
    updateProfile({ jobs: profile.jobs.map(j => j.job === job ? { ...j, level } : j) });
  };

  const handleLookup = async () => {
    if (!profile.name.trim() || !profile.server) return;
    setLookupLoading(true);
    setLookupError('');
    setLookup(null);
    try {
      const data = await fetchCharacter(profile.server, profile.name.trim());
      setLookup(data);
    } catch (e) {
      setLookupError((e as Error).message);
    } finally {
      setLookupLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <div className="sec-title">Character</div>
        <div className="sec-sub">
          Your character profile is saved locally. Add jobs to filter weapon skills in the Chain Builder.
        </div>
      </div>

      {/* Profile inputs */}
      <div className="card" style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 180 }}>
            <label style={labelStyle}>Character Name</label>
            <input
              style={inputStyle}
              placeholder="e.g. Zeidan"
              value={profile.name}
              onChange={e => updateProfile({ name: e.target.value })}
              onKeyDown={e => e.key === 'Enter' && handleLookup()}
            />
          </div>
          <div style={{ minWidth: 160 }}>
            <label style={labelStyle}>Server</label>
            <select
              style={inputStyle}
              value={profile.server}
              onChange={e => updateProfile({ server: e.target.value })}
            >
              {(servers.length ? servers : ['Asura']).map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end' }}>
            <button
              style={lookupBtnStyle}
              onClick={handleLookup}
              disabled={lookupLoading || !profile.name.trim()}
            >
              {lookupLoading ? 'Looking up…' : 'Look Up on FFXIAH'}
            </button>
          </div>
        </div>

        {lookupError && (
          <div style={{ color: '#e85d04', fontSize: '.82rem' }}>{lookupError}</div>
        )}
      </div>

      {/* FFXIAH result */}
      {lookup && (
        <div className="card" style={{ padding: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--gold)' }}>
              {lookup.name}
            </div>
            <div style={{ fontSize: '.78rem', color: 'var(--text-1)' }}>{lookup.server}</div>
            {lookup.id && (
              <div style={{ fontSize: '.72rem', color: 'var(--text-2)' }}>ID #{lookup.id}</div>
            )}
            <a
              href={lookup.url}
              target="_blank"
              rel="noreferrer"
              style={{ marginLeft: 'auto', fontSize: '.75rem', color: 'var(--gold)', textDecoration: 'none' }}
            >
              View on FFXIAH ↗
            </a>
          </div>

          {lookup.sales.length === 0 ? (
            <div style={{ color: 'var(--text-2)', fontSize: '.82rem' }}>No recent AH transactions found.</div>
          ) : (
            <>
              <div style={{ fontSize: '.72rem', color: 'var(--text-1)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 8 }}>
                Recent AH Transactions
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '.78rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border)' }}>
                      <th style={thStyle}>Date</th>
                      <th style={thStyle}>Seller</th>
                      <th style={thStyle}>Buyer</th>
                      <th style={{ ...thStyle, textAlign: 'right' }}>Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(lookup.sales as AHSale[]).map((s, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={tdStyle}>{formatDate(s.saleon)}</td>
                        <td style={tdStyle}>{s.seller_name}</td>
                        <td style={tdStyle}>{s.buyer_name}</td>
                        <td style={{ ...tdStyle, textAlign: 'right', color: '#7ab3e0', fontWeight: 600 }}>
                          {formatGil(s.price)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div style={{ fontSize: '.68rem', color: 'var(--text-2)', marginTop: 8 }}>
                Note: job levels, equipment, and character stats are no longer available via any public API
                (Square Enix shut down the Linkshell Community service in 2016).
              </div>
            </>
          )}
        </div>
      )}

      {/* Jobs */}
      <div className="card" style={{ padding: 18 }}>
        <div style={{ fontWeight: 600, color: 'var(--gold)', marginBottom: 12 }}>Jobs</div>
        <div style={{ fontSize: '.8rem', color: 'var(--text-1)', marginBottom: 14 }}>
          Add your jobs and levels. The Chain Builder will filter weapon skills to only those your character can use.
        </div>

        {/* Add job row */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
          <select style={{ ...inputStyle, width: 80 }} value={newJob} onChange={e => setNewJob(e.target.value)}>
            {JOBS.map(j => <option key={j} value={j}>{j}</option>)}
          </select>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: '.78rem', color: 'var(--text-1)' }}>Lv</span>
            <input
              type="number"
              min={1}
              max={99}
              style={{ ...inputStyle, width: 60 }}
              value={newLevel}
              onChange={e => setNewLevel(Math.min(99, Math.max(1, +e.target.value)))}
            />
          </div>
          <button style={addBtnStyle} onClick={addJob}>+ Add Job</button>
        </div>

        {/* Job list */}
        {profile.jobs.length === 0 ? (
          <div style={{ color: 'var(--text-2)', fontSize: '.82rem' }}>No jobs added yet.</div>
        ) : (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {profile.jobs.map(({ job, level }) => (
              <div key={job} style={jobChipStyle}>
                <span style={{ fontWeight: 700, color: 'var(--text-0)' }}>{job}</span>
                <input
                  type="number"
                  min={1}
                  max={99}
                  value={level}
                  onChange={e => updateJobLevel(job, Math.min(99, Math.max(1, +e.target.value)))}
                  style={{ width: 38, background: 'none', border: 'none', color: 'var(--gold)', fontWeight: 600, fontSize: '.8rem', outline: 'none', textAlign: 'center' }}
                />
                <button
                  onClick={() => removeJob(job)}
                  style={{ background: 'none', border: 'none', color: 'var(--text-2)', cursor: 'pointer', padding: '0 2px', fontSize: '.75rem', lineHeight: 1 }}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: '.72rem', color: 'var(--text-1)',
  textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 5,
};

const inputStyle: React.CSSProperties = {
  padding: '8px 10px', background: 'var(--bg-1)', border: '1px solid var(--border)',
  borderRadius: 6, color: 'var(--text-0)', fontSize: '.82rem', outline: 'none', width: '100%',
};

const lookupBtnStyle: React.CSSProperties = {
  padding: '8px 16px', background: 'rgba(212,175,55,.12)', border: '1px solid var(--gold-dim)',
  borderRadius: 6, color: 'var(--gold)', fontSize: '.82rem', cursor: 'pointer', whiteSpace: 'nowrap',
};

const addBtnStyle: React.CSSProperties = {
  padding: '7px 14px', background: 'rgba(212,175,55,.1)', border: '1px solid var(--gold-dim)',
  borderRadius: 6, color: 'var(--gold)', fontSize: '.82rem', cursor: 'pointer',
};

const jobChipStyle: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 4,
  padding: '5px 10px', background: 'var(--bg-3)', border: '1px solid var(--border)',
  borderRadius: 6, fontSize: '.8rem',
};

const thStyle: React.CSSProperties = {
  padding: '6px 10px', textAlign: 'left', color: 'var(--text-1)',
  fontWeight: 600, fontSize: '.72rem', textTransform: 'uppercase',
};

const tdStyle: React.CSSProperties = {
  padding: '6px 10px', color: 'var(--text-0)',
};
