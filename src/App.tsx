import { useState } from 'react';
import { Target, Laptop, Scale, type LucideIcon } from 'lucide-react';
import './App.css';
import type { Role } from './state/types';
import { OrganizerView } from './views/organizer/OrganizerView';
import { ParticipantView } from './views/participant/ParticipantView';
import { JudgeView } from './views/judge/JudgeView';

const ROLES: { id: Role; label: string; icon: LucideIcon }[] = [
  { id: 'organizer',   label: 'Organizer',   icon: Target },
  { id: 'participant', label: 'Participant', icon: Laptop },
  { id: 'judge',       label: 'Judge',       icon: Scale },
];

function App() {
  const [role, setRole] = useState<Role>('organizer');

  return (
    <div className="app">
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
          {ROLES.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              id={`role-btn-${id}`}
              role="tab"
              aria-selected={role === id}
              aria-controls={`view-${id}`}
              className={`role-btn ${role === id ? 'role-btn--active' : ''}`}
              onClick={() => setRole(id)}
            >
              <Icon className="role-btn__icon" aria-hidden="true" />
              {label}
            </button>
          ))}
        </div>
      </nav>

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
