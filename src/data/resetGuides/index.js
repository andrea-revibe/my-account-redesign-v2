import appleMobile from './appleMobile'
import android from './android'
import windows from './windows'
import mac from './mac'
import watch from './watch'
import airpods from './airpods'
import playstation from './playstation'
import noReset from './noReset'

export { ACCOUNT_RECOVERY, NEVER_ASK } from './recovery'

// Ordered by claim share — the sandbox panel lists them in this order.
export const RESET_GUIDES = [
  appleMobile,
  android,
  windows,
  mac,
  watch,
  airpods,
  playstation,
  noReset,
]

export const RESET_GUIDE_BY_ID = Object.fromEntries(
  RESET_GUIDES.map((g) => [g.id, g]),
)
