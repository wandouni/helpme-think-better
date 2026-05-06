import { Share2, MessageSquare } from 'lucide-react'

interface Props {
  active: 'left' | 'right'
  onChange: (panel: 'left' | 'right') => void
}

export default function MobileNav({ active, onChange }: Props) {
  return (
    <nav className="mobile-nav">
      <button
        className={`mobile-nav-tab ${active === 'left' ? 'active' : ''}`}
        onClick={() => onChange('left')}
      >
        <Share2 size={18} />
        <span>导图</span>
      </button>
      <button
        className={`mobile-nav-tab ${active === 'right' ? 'active' : ''}`}
        onClick={() => onChange('right')}
      >
        <MessageSquare size={18} />
        <span>解释</span>
      </button>
    </nav>
  )
}
