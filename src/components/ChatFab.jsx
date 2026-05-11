import { MessageSquareText } from 'lucide-react'

export default function ChatFab() {
  return (
    <button
      aria-label="Chat with support"
      className="fixed bottom-5 right-5 w-14 h-14 rounded-full bg-accent text-white shadow-lg grid place-items-center"
      style={{ right: 'max(20px, calc((100vw - 430px) / 2 + 20px))' }}
    >
      <MessageSquareText size={24} strokeWidth={2} />
    </button>
  )
}
