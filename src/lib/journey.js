import { useCallback, useEffect, useMemo, useState } from 'react'
import { JOURNEYS } from '../data/journey'
import { DEFAULT_COUNTRY } from './countries'

// Replays a journey from its `initialOrder` along a tracked path of visited
// nodes. The path (rather than a single cursor) is what's persisted in
// state — it lets the replay handle branched journeys cleanly: applying
// node[0..i] in array order would be wrong as soon as a node's predecessor
// in the array isn't on the visited path (e.g. a wallet-refund branch
// node sits before a card-refund branch node in the array, but only one
// is reachable per session).
//
// `validNext` returns up to N next nodes, driven by an explicit `next`
// array on the current node or — when absent — defaulting to the next
// entry in the journey's `nodes` array (keeps linear journeys terse).
// Terminal nodes set `next: []` explicitly if they aren't last in the
// array. The dev panel renders one button per valid next.
//
// `country` (the active country code, default AE) gates per-edge: a `next`
// entry may be a plain id (all countries) or `{ id, countries: [...] }`
// (only when the active country is listed), so one journey can carry a
// country-specific sequence fork without forking the whole graph. This is
// the prescribed mechanism for journey-flow country differences — see
// docs/output/country_split.md §6.
export function useJourney(journeyId, country = DEFAULT_COUNTRY) {
  const journey = useMemo(
    () => JOURNEYS.find((j) => j.id === journeyId) ?? JOURNEYS[0],
    [journeyId],
  )

  const hasNodes = journey.nodes && journey.nodes.length > 0
  const [path, setPath] = useState(() =>
    hasNodes ? [journey.nodes[0].id] : [],
  )

  // Reset cursor when the active journey changes — node ids are
  // namespaced per journey so the previous path is meaningless. Sandbox
  // journeys have no node graph; their state lives in useEddSandbox.
  useEffect(() => {
    setPath(hasNodes ? [journey.nodes[0].id] : [])
  }, [journey, hasNodes])

  const order = useMemo(() => {
    if (!hasNodes) return journey.initialOrder
    let o = journey.initialOrder
    for (const id of path) {
      const node = journey.nodes.find((n) => n.id === id)
      if (!node) break
      o = node.apply(o)
    }
    return o
  }, [journey, path, hasNodes])

  const currentNodeId = path[path.length - 1]
  const currentIndex = path.length - 1

  const validNext = useCallback(() => {
    const node = journey.nodes.find((n) => n.id === currentNodeId)
    if (!node) return []
    if (Array.isArray(node.next)) {
      // An edge is either a plain id string (all countries) or an object
      // { id, countries: [...] } applying only when the active country is
      // listed. Untagged edges always pass, so non-country journeys are
      // unchanged. See docs/output/country_split.md §6.
      return node.next
        .filter(
          (e) =>
            typeof e === 'string' ||
            !e.countries ||
            e.countries.includes(country),
        )
        .map((e) => {
          const id = typeof e === 'string' ? e : e.id
          return journey.nodes.find((n) => n.id === id)
        })
        .filter(Boolean)
    }
    const i = journey.nodes.findIndex((n) => n.id === currentNodeId)
    if (i < 0 || i >= journey.nodes.length - 1) return []
    return [journey.nodes[i + 1]]
  }, [journey, currentNodeId, country])

  const advance = useCallback(
    (nodeId) => {
      setPath((prev) => [...prev, nodeId])
    },
    [],
  )

  const back = useCallback(() => {
    setPath((prev) => (prev.length > 1 ? prev.slice(0, -1) : prev))
  }, [])

  const reset = useCallback(() => {
    setPath([journey.nodes[0].id])
  }, [journey])

  return {
    kind: journey.kind ?? 'replay',
    journey,
    journeys: JOURNEYS,
    currentNodeId,
    currentIndex,
    nodes: journey.nodes,
    order,
    validNext,
    advance,
    back,
    reset,
  }
}
