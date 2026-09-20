import type { WindowScene } from '@/types'

const STORAGE_KEY = 'bus_window_scenes'
const STAGING_KEY = 'bus_window_scenes_staging'
const STAGING_LIMIT = 10

function readList(key: string): WindowScene[] {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return []
    return JSON.parse(raw) as WindowScene[]
  } catch {
    return []
  }
}

function writeList(key: string, scenes: WindowScene[]): void {
  localStorage.setItem(key, JSON.stringify(scenes))
}

export function getAllScenes(): WindowScene[] {
  return readList(STORAGE_KEY)
}

export function saveScene(scene: WindowScene): void {
  const scenes = getAllScenes()
  scenes.push(scene)
  writeList(STORAGE_KEY, scenes)
}

export function deleteScene(id: string): void {
  writeList(STORAGE_KEY, getAllScenes().filter((s) => s.id !== id))
}

export function getScenesByRoute(routeName: string): WindowScene[] {
  return getAllScenes()
    .filter((s) => s.routeName === routeName)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
}

export function getAllRouteNames(): string[] {
  const scenes = getAllScenes()
  const routeSet = new Set(scenes.map((s) => s.routeName))
  return Array.from(routeSet).sort()
}

export function getRandomScene(): WindowScene | null {
  const scenes = getAllScenes()
  if (scenes.length === 0) return null
  return scenes[Math.floor(Math.random() * scenes.length)]
}

export function getStagedScenes(): WindowScene[] {
  return readList(STAGING_KEY)
}

export function stageScene(id: string): void {
  const scenes = getAllScenes()
  const scene = scenes.find((s) => s.id === id)
  if (!scene) return
  const staged = getStagedScenes()
  if (!staged.some((s) => s.id === id)) {
    staged.push(scene)
    while (staged.length > STAGING_LIMIT) staged.shift()
  }
  writeList(STAGING_KEY, staged)
  writeList(STORAGE_KEY, scenes.filter((s) => s.id !== id))
}

export function restoreScene(id: string): boolean {
  const staged = getStagedScenes()
  const scene = staged.find((s) => s.id === id)
  if (!scene) return false
  const scenes = getAllScenes()
  if (scenes.some((s) => s.id === id)) return false
  scenes.push(scene)
  writeList(STORAGE_KEY, scenes)
  writeList(STAGING_KEY, staged.filter((s) => s.id !== id))
  return true
}
