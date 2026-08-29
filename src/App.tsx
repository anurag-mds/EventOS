import { useState } from 'react';
import './App.css';
import type { Role } from './state/types';
import { OrganizerView } from './views/organizer/OrganizerView';
import { ParticipantView } from './views/participant/ParticipantView';
import { JudgeView } from './views/judge/JudgeView';

const ROLES: { id: Role; label: string; emoji: string }[] = [
  { id: 'organizer',   label: 'Organizer',   emoji: '🎯' },
  { id: 'participant', label: 'Participant',  emoji: '💻' },
  { id: 'judge',       label: 'Judge',        emoji: '⚖️' },
];

function App() {
  const [role, setRole] = useState<Role>('organizer');

  return (
    <div className="app">
      {/* ── Top Navigation ── */}
      <nav className="top-nav" role="navigation" aria-label="EVENTOS navigation">
        <a href="/" className="top-nav__brand" aria-label="EVENTOS home">
          <div className="top-nav__logo" aria-hidden="true">E</div>
          <span className="top-nav__name">EVENTOS</span>
        </a>

        <div
          className="top-nav__role-switcher"
          role="tablist"
          aria-label="Switch role view"
        >
          {ROLES.map(({ id, label, emoji }) => (
            <button
              key={id}
              id={`role-btn-${id}`}
              role="tab"
              aria-selected={role === id}
              aria-controls={`view-${id}`}
              className={`role-btn ${role === id ? 'role-btn--active' : ''}`}
              onClick={() => setRole(id)}
            >
              <span aria-hidden="true">{emoji}</span> {label}
            </button>
          ))}
        </div>
      </nav>

      {/* ── Active View ── */}
      <div
        id={`view-${role}`}
        role="tabpanel"
        aria-labelledby={`role-btn-${role}`}
      >
        {role === 'organizer'   && <OrganizerView />}
        {role === 'participant' && <ParticipantView />}
        {role === 'judge'       && <JudgeView />}
      </div>
    </div>
  );
}

export default App;
