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
      <header className="shell-header">
        <div className="shell-header__start">
          <a href="/" className="shell-header__brand" aria-label="EventOS home">
            <span className="shell-header__mark" aria-hidden="true" />
            <span className="shell-header__name">EventOS</span>
          </a>
          <span className="shell-header__live" aria-label="System live">
            <span className="shell-header__live-dot" aria-hidden="true" />
            Live
          </span>
        </div>

        <nav
          className="shell-header__tabs"
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
              className={`shell-tab ${role === id ? 'shell-tab--active' : ''}`}
              onClick={() => setRole(id)}
            >
              <Icon className="shell-tab__icon" aria-hidden="true" strokeWidth={1.75} />
              {label}
            </button>
          ))}
        </nav>
      </header>

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
