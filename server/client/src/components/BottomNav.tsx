import { NavLink } from 'react-router-dom'
import { Home, BookOpen, Search, Bookmark, MoreHorizontal } from 'lucide-react'
import { clsx } from 'clsx'

const tabs = [
  { href: '/',          label: 'Home',      icon: Home        },
  { href: '/read',      label: 'Read',      icon: BookOpen    },
  { href: '/search',    label: 'Search',    icon: Search      },
  { href: '/bookmarks', label: 'Saved',     icon: Bookmark    },
  { href: '/more',      label: 'More',      icon: MoreHorizontal },
]

export default function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-cream-300 safe-area-bottom">
      <div className="flex">
        {tabs.map((tab) => (
          <NavLink
            key={tab.href}
            to={tab.href}
            end={tab.href === '/'}
            className={({ isActive }) =>
              clsx(
                'flex-1 flex flex-col items-center py-2 gap-0.5 text-xs font-medium',
                isActive ? 'text-maroon-700' : 'text-gray-500'
              )
            }
          >
            <tab.icon className="h-5 w-5" />
            {tab.label}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
