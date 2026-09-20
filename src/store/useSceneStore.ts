import { create } from 'zustand'
import type { WindowScene, SceneFormData } from '@/types'
import {
  getAllScenes,
  saveScene as storageSaveScene,
  deleteScene as storageDeleteScene,
  stageScene as storageStageScene,
  restoreScene as storageRestoreScene,
  getStagedScenes,
  getScenesByRoute,
  getAllRouteNames,
  getRandomScene,
} from '@/services/storage'
import type { StageOutcome, RestoreResult } from '@/services/storage'

interface SceneState {
  scenes: WindowScene[]
  stagedScenes: WindowScene[]
  routeNames: string[]
  currentRouteScenes: WindowScene[]
  selectedRoute: string
  randomScene: WindowScene | null

  loadAll: () => void
  saveScene: (data: SceneFormData) => void
  deleteScene: (id: string) => void
  stageScene: (id: string) => StageOutcome
  restoreScene: (id: string) => RestoreResult
  selectRoute: (routeName: string) => void
  refreshRandom: () => void
}

export const useSceneStore = create<SceneState>((set) => ({
  scenes: [],
  stagedScenes: [],
  routeNames: [],
  currentRouteScenes: [],
  selectedRoute: '',
  randomScene: null,

  loadAll: () => {
    const scenes = getAllScenes()
    const stagedScenes = getStagedScenes()
    const routeNames = getAllRouteNames()
    set((state) => ({
      scenes,
      stagedScenes,
      routeNames,
      currentRouteScenes: state.selectedRoute
        ? getScenesByRoute(state.selectedRoute)
        : [],
    }))
  },

  saveScene: (data: SceneFormData) => {
    const scene: WindowScene = {
      ...data,
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
    }
    storageSaveScene(scene)
    const scenes = getAllScenes()
    const routeNames = getAllRouteNames()
    set((state) => {
      const currentRouteScenes =
        state.selectedRoute ? getScenesByRoute(state.selectedRoute) : []
      return { scenes, routeNames, currentRouteScenes }
    })
  },

  deleteScene: (id: string) => {
    storageDeleteScene(id)
    const scenes = getAllScenes()
    const routeNames = getAllRouteNames()
    set((state) => {
      const currentRouteScenes =
        state.selectedRoute ? getScenesByRoute(state.selectedRoute) : []
      return { scenes, routeNames, currentRouteScenes }
    })
  },

  stageScene: (id: string) => {
    const outcome = storageStageScene(id)
    if (outcome.status === 'staged') {
      const scenes = getAllScenes()
      const stagedScenes = getStagedScenes()
      const routeNames = getAllRouteNames()
      set((state) => ({
        scenes,
        stagedScenes,
        routeNames,
        currentRouteScenes: state.selectedRoute
          ? getScenesByRoute(state.selectedRoute)
          : [],
      }))
    }
    return outcome
  },

  restoreScene: (id: string) => {
    const result = storageRestoreScene(id)
    if (result === 'restored') {
      const scenes = getAllScenes()
      const stagedScenes = getStagedScenes()
      const routeNames = getAllRouteNames()
      set((state) => ({
        scenes,
        stagedScenes,
        routeNames,
        currentRouteScenes: state.selectedRoute
          ? getScenesByRoute(state.selectedRoute)
          : [],
      }))
    }
    return result
  },

  selectRoute: (routeName: string) => {
    const currentRouteScenes = routeName ? getScenesByRoute(routeName) : []
    set({ selectedRoute: routeName, currentRouteScenes })
  },

  refreshRandom: () => {
    const randomScene = getRandomScene()
    set({ randomScene })
  },
}))
