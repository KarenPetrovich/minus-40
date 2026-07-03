type Props = {
  kind?: 'start' | 'milestone' | 'finish'
  status: 'reached' | 'unreached' | 'temporarilyLost' | 'pending'
  icon: string
}

function BadgeIcon({ icon }: { icon: string }) {
  if (icon === 'check') {
    return (
      <svg className="roadmap-node-icon" viewBox="0 0 32 32" aria-hidden="true">
        <path d="M8 16.5l5.2 5.2L24 11.8" />
      </svg>
    )
  }

  if (icon === 'lock') {
    return (
      <svg className="roadmap-node-icon" viewBox="0 0 32 32" aria-hidden="true">
        <path d="M11 14v-2.2C11 8.6 13.2 6 16 6s5 2.6 5 5.8V14" />
        <rect x="8.5" y="14" width="15" height="11" rx="3.2" ry="3.2" />
      </svg>
    )
  }

  return (
    <svg className="roadmap-node-icon" viewBox="0 0 32 32" aria-hidden="true">
      <path d="M10 25V7" />
      <path d="M11 8h11l-3.8 4 3.8 4H11z" />
    </svg>
  )
}

export function RoadmapNodeBadge({ kind = 'milestone', status, icon }: Props) {
  return (
    <div className={`roadmap-node ${status === 'reached' ? 'is-reached' : 'is-unreached'} ${status === 'temporarilyLost' ? 'is-temporarily-lost' : ''} ${kind === 'start' ? 'is-start' : ''}`}>
      <BadgeIcon icon={icon} />
    </div>
  )
}
