type Props = {
  kind?: 'start' | 'milestone' | 'finish'
  status: 'reached' | 'unreached' | 'temporarilyLost' | 'pending'
  icon: string
}

export function RoadmapNodeBadge({ kind = 'milestone', status, icon }: Props) {
  return (
    <div className={`roadmap-node ${status === 'reached' ? 'is-reached' : 'is-unreached'} ${status === 'temporarilyLost' ? 'is-temporarily-lost' : ''} ${kind === 'start' ? 'is-start' : ''}`}>
      <span className="roadmap-node-icon material-symbols-outlined" aria-hidden="true">
        {icon}
      </span>
    </div>
  )
}
