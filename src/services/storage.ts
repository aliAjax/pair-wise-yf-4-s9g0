import type { WindowScene } from '@/types'

const STORAGE_KEY = 'bus_window_scenes'
const STAGED_LIMIT = 10

export interface StageOutcome {
  status: 'staged' | 'duplicate' | 'not-found'
  evicted: boolean
}

export type RestoreResult = 'restored' | 'conflict' | 'not-found'

interface PersistShape {
  scenes: WindowScene[]
  staged: WindowScene[]
}

function readState(): PersistShape {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { scenes: [], staged: [] }
    const parsed = JSON.parse(raw)
    // 旧版数据直接保存为场景数组，默认没有恢复区
    if (Array.isArray(parsed)) {
      return { scenes: parsed as WindowScene[], staged: [] }
    }
    return {
      scenes: Array.isArray(parsed.scenes) ? parsed.scenes : [],
      staged: Array.isArray(parsed.staged) ? parsed.staged : [],
    }
  } catch {
    return { scenes: [], staged: [] }
  }
}

function writeState(state: PersistShape): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

export function getAllScenes(): WindowScene[] {
  return readState().scenes
}

export function saveScene(scene: WindowScene): void {
  const state = readState()
  state.scenes.push(scene)
  writeState(state)
}

export function deleteScene(id: string): void {
  const state = readState()
  state.scenes = state.scenes.filter((s) => s.id !== id)
  writeState(state)
}

/** 恢复区中的记录，按进入恢复区的先后顺序排列（最早进入的在前） */
export function getStagedScenes(): WindowScene[] {
  return readState().staged
}

/** 将时间线中的记录移入恢复区；重复进入会被拒绝，超出上限时移除最早进入的一条 */
export function stageScene(id: string): StageOutcome {
  const state = readState()
  if (state.staged.some((s) => s.id === id)) {
    return { status: 'duplicate', evicted: false }
  }
  const index = state.scenes.findIndex((s) => s.id === id)
  if (index === -1) {
    return { status: 'not-found', evicted: false }
  }
  const [scene] = state.scenes.splice(index, 1)
  state.staged.push(scene)
  let evicted = false
  if (state.staged.length > STAGED_LIMIT) {
    state.staged.shift()
    evicted = true
  }
  writeState(state)
  return { status: 'staged', evicted }
}

/** 将记录按原数据（含原时间）恢复回时间线；同编号已存在则整次拒绝，恢复区保持不变 */
export function restoreScene(id: string): RestoreResult {
  const state = readState()
  const index = state.staged.findIndex((s) => s.id === id)
  if (index === -1) return 'not-found'
  if (state.scenes.some((s) => s.id === id)) return 'conflict'
  const [scene] = state.staged.splice(index, 1)
  state.scenes.push(scene)
  writeState(state)
  return 'restored'
}

export function getScenesByRoute(routeName: string): WindowScene[] {
  return readState()
    .scenes.filter((s) => s.routeName === routeName)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
}

export function getAllRouteNames(): string[] {
  const scenes = readState().scenes
  const routeSet = new Set(scenes.map((s) => s.routeName))
  return Array.from(routeSet).sort()
}

export function getRandomScene(): WindowScene | null {
  const scenes = readState().scenes
  if (scenes.length === 0) return null
  return scenes[Math.floor(Math.random() * scenes.length)]
}
