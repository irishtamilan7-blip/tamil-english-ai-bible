import { Link } from 'react-router-dom'
import {
  FileText, Highlighter, BookOpen, Settings, Info, ChevronRight, Sparkles, CalendarDays
} from 'lucide-react'

const items = [
  { href: '/ai',         icon: Sparkles,     label: 'Bible AI Chat',    desc: 'Ask anything about the Bible',    color: 'bg-maroon-100 text-maroon-700'  },
  { href: '/plan',       icon: CalendarDays, label: 'Reading Plan',     desc: 'Read the Bible in 365 days',      color: 'bg-green-100 text-green-700'    },
  { href: '/notes',      icon: FileText,     label: 'Notes',            desc: 'Your personal verse notes',       color: 'bg-blue-100 text-blue-700'      },
  { href: '/highlights', icon: Highlighter,  label: 'Highlights',       desc: 'Highlighted verses',              color: 'bg-yellow-100 text-yellow-700'  },
  { href: '/topics',     icon: BookOpen,     label: 'Weekly Topics',    desc: "Pastor's sermon topics & verses", color: 'bg-orange-100 text-orange-700'  },
  { href: '/settings',   icon: Settings,     label: 'Settings',         desc: 'App preferences',                 color: 'bg-gray-100 text-gray-700'      },
  { href: '/about',      icon: Info,         label: 'About',            desc: 'App info & contact',              color: 'bg-red-50 text-maroon-700'      },
]

export default function MorePage() {
  return (
    <div className="max-w-lg mx-auto px-4 py-5">
      <h1 className="text-xl font-bold text-maroon-700 font-serif mb-5">More</h1>
      <div className="space-y-2">
        {items.map((item) => (
          <Link
            key={item.href}
            to={item.href}
            className="flex items-center gap-4 bg-white border border-cream-300 rounded-xl px-4 py-3.5 hover:border-maroon-300 transition-colors"
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${item.color}`}>
              <item.icon className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-900">{item.label}</p>
              <p className="text-xs text-gray-500">{item.desc}</p>
            </div>
            <ChevronRight className="h-4 w-4 text-gray-400 shrink-0" />
          </Link>
        ))}
      </div>

      <div className="mt-8 text-center px-4">
        <p className="text-sm italic text-gray-500 font-serif leading-relaxed">
          "Thy word is a lamp unto my feet, and a light unto my path."
        </p>
        <p className="text-xs text-gold-600 mt-1">— Psalm 119:105</p>
        <p className="text-xs text-gray-400 font-tamil mt-1">
          "உம்முடைய வசனம் என் காலுக்கு தீபமும் என் பாதைக்கு வெளிச்சமுமாயிருக்கிறது."
        </p>
      </div>
    </div>
  )
}
