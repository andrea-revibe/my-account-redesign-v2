import { Menu, Search, Bell } from 'lucide-react'

// Condensed topbar: replaces the previous PromoBar + Header + SearchBar +
// FiltersRow stack with a single sticky row. Search is moved into the
// filters section directly underneath the page title (see OrderFilters).
export default function Header({ initials = 'AG' }) {
  return (
    <header className="sticky top-0 z-30 flex items-center gap-2 px-4 py-2.5 bg-surface border-b border-line">
      <button
        aria-label="Menu"
        className="w-9 h-9 rounded-full grid place-items-center text-ink hover:bg-line-2"
      >
        <Menu size={20} strokeWidth={1.75} />
      </button>
      <a href="#" className="flex items-center" aria-label="Revibe home">
        <img src="/revibe-logo.svg" alt="Revibe" className="h-[18px]" />
      </a>
      <div className="flex-1" />
      <button
        aria-label="Search"
        className="w-9 h-9 rounded-full grid place-items-center text-ink hover:bg-line-2"
      >
        <Search size={20} strokeWidth={1.75} />
      </button>
      <button
        aria-label="Notifications"
        className="w-9 h-9 rounded-full grid place-items-center text-ink hover:bg-line-2"
      >
        <Bell size={20} strokeWidth={1.75} />
      </button>
      <button
        aria-label="Account"
        className="w-8 h-8 rounded-full grid place-items-center text-white text-[12px] font-bold bg-credits-pill"
      >
        {initials}
      </button>
    </header>
  )
}
