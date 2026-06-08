// Step-transition keyframes + the slide-animation shorthand, shared by the
// guided-reset shell (ResetGuideSheet) and its carousel mocks (resetGuideMocks).
export const STEP_ANIM_CSS = `
@keyframes gSlideR { from { opacity: 0; transform: translateX(26px); } to { opacity: 1; transform: none; } }
@keyframes gSlideL { from { opacity: 0; transform: translateX(-26px); } to { opacity: 1; transform: none; } }
`

export const stepAnim = (dir) =>
  `${dir < 0 ? 'gSlideL' : 'gSlideR'} 0.34s cubic-bezier(0.32,0.72,0,1)`
