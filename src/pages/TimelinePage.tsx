import { useEffect, useState } from 'react'
import {
  Search,
  Route,
  X,
  Trash2,
  Clock,
  MapPin,
  Archive,
  ArchiveRestore,
  Inbox,
} from 'lucide-react'
import { useSceneStore } from '@/store/useSceneStore'
import {
  formatTimestamp,
  getTimeOfDay,
  getWeatherIcon,
  getTreeIcon,
  getPedestrianIcon,
} from '@/utils/sceneHelpers'
import type { WindowScene } from '@/types'

export default function TimelinePage() {
  const {
    routeNames,
    selectedRoute,
    currentRouteScenes,
    stagedScenes,
    selectRoute,
    loadAll,
    deleteScene,
    stageScene,
    restoreScene,
  } = useSceneStore()
  const [search, setSearch] = useState('')
  const [detailScene, setDetailScene] = useState<WindowScene | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  useEffect(() => {
    loadAll()
  }, [loadAll])

  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(() => setToast(null), 2500)
    return () => clearTimeout(timer)
  }, [toast])

  const filteredRoutes = routeNames.filter((r) =>
    r.toLowerCase().includes(search.toLowerCase())
  )

  const sorted = [...currentRouteScenes].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  )

  const handleDelete = (id: string) => {
    deleteScene(id)
    setDetailScene(null)
  }

  const handleStage = (id: string) => {
    const outcome = stageScene(id)
    if (outcome.status === 'staged') {
      setToast(
        outcome.evicted ? '已移入恢复区，最早暂存的一条已移出' : '已移入恢复区'
      )
      setDetailScene(null)
    } else if (outcome.status === 'duplicate') {
      setToast('该记录已在恢复区中')
    } else {
      setToast('记录不存在，暂存失败')
    }
  }

  const handleRestore = (id: string) => {
    const result = restoreScene(id)
    if (result === 'restored') {
      setToast('已恢复回时间线')
    } else if (result === 'conflict') {
      setToast('时间线中已存在同编号记录，恢复被拒绝')
    } else {
      setToast('恢复区中找不到该记录')
    }
  }

  return (
    <div className="min-h-screen bg-teal-950 font-serif text-mist-100">
      {toast && (
        <div className="fixed left-1/2 top-6 z-[60] -translate-x-1/2 animate-slide-down rounded-full border border-dusk-400/40 bg-teal-900/95 px-5 py-2.5 text-sm text-mist-100 shadow-lg shadow-black/30 backdrop-blur-sm">
          {toast}
        </div>
      )}

      <div className="mx-auto max-w-3xl px-4 py-8">
        <h1 className="mb-6 text-3xl font-bold tracking-wide text-dusk-400">
          窗景时间线
        </h1>

        <div className="mb-6 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 w-4 h-4 -translate-y-1/2 text-mist-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="搜索路线..."
              className="w-full rounded-lg border border-teal-800 bg-teal-900/60 py-2.5 pl-10 pr-4 text-sm text-mist-100 placeholder:text-mist-500 focus:border-dusk-400 focus:outline-none"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => selectRoute('')}
              className={`rounded-full px-3.5 py-1.5 text-xs transition-colors ${
                !selectedRoute
                  ? 'bg-dusk-400 text-teal-950'
                  : 'bg-teal-900 text-mist-300 hover:bg-teal-800'
              }`}
            >
              全部
            </button>
            {filteredRoutes.map((name) => (
              <button
                key={name}
                onClick={() => selectRoute(name)}
                className={`rounded-full px-3.5 py-1.5 text-xs transition-colors ${
                  selectedRoute === name
                    ? 'bg-dusk-400 text-teal-950'
                    : 'bg-teal-900 text-mist-300 hover:bg-teal-800'
                }`}
              >
                <Route className="mr-1 inline w-3 h-3" />
                {name}
              </button>
            ))}
          </div>
        </div>

        {stagedScenes.length > 0 && (
          <section className="mb-8 rounded-xl border border-dusk-400/25 bg-dusk-400/5 p-4">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-sm font-semibold text-dusk-300">
                <Inbox className="w-4 h-4" />
                恢复区
              </h2>
              <span className="text-xs text-mist-500">
                {stagedScenes.length}/10
              </span>
            </div>
            <ul className="space-y-2">
              {stagedScenes.map((scene) => (
                <li
                  key={scene.id}
                  className="flex items-center gap-3 rounded-lg border border-teal-800/70 bg-teal-900/40 px-3 py-2"
                >
                  <div className="w-28 shrink-0">
                    <p className="text-xs text-dusk-400">
                      {formatTimestamp(scene.timestamp)}
                    </p>
                    <p className="mt-0.5 text-[10px] text-mist-500">
                      {getTimeOfDay(scene.timestamp)}
                    </p>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-1 text-xs text-mist-300">
                      <MapPin className="h-3 w-3 shrink-0" />
                      <span className="truncate">{scene.routeName}</span>
                    </p>
                    {scene.note ? (
                      <p className="mt-0.5 truncate text-xs text-mist-400">
                        {scene.note}
                      </p>
                    ) : (
                      <p className="mt-0.5 truncate text-xs text-mist-500">
                        {scene.segment}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => handleRestore(scene.id)}
                    className="flex shrink-0 items-center gap-1 rounded-lg border border-dusk-400/40 px-2.5 py-1.5 text-xs text-dusk-300 transition-colors hover:bg-dusk-400/15"
                  >
                    <ArchiveRestore className="h-3.5 w-3.5" />
                    恢复
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )}

        {sorted.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-mist-400">
            <div className="mb-4 text-6xl opacity-30">🪟</div>
            <p className="text-lg">
              {selectedRoute ? '该路线暂无窗景记录' : '选择一条路线，开始浏览窗景'}
            </p>
          </div>
        ) : (
          <div className="relative pl-8">
            <div className="absolute left-3 top-0 bottom-0 w-px bg-teal-800" />
            <div className="space-y-6">
              {sorted.map((scene) => (
                <div key={scene.id} className="relative flex gap-4">
                  <div className="absolute -left-5 top-1 h-2.5 w-2.5 rounded-full bg-dusk-400 ring-4 ring-teal-950" />
                  <div className="w-20 shrink-0 pt-0.5 text-right">
                    <p className="text-xs text-dusk-400">
                      {formatTimestamp(scene.timestamp)}
                    </p>
                    <p className="mt-0.5 text-[10px] text-mist-500">
                      {getTimeOfDay(scene.timestamp)}
                    </p>
                  </div>
                  <button
                    onClick={() => setDetailScene(scene)}
                    className="group flex-1 rounded-xl border border-teal-800 bg-teal-900/50 p-4 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-dusk-400/40 hover:shadow-lg hover:shadow-dusk-400/10"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      {getWeatherIcon(scene.weather)}
                      <span className="text-sm font-semibold text-mist-100">
                        {scene.segment}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 mb-1.5 text-mist-400">
                      <MapPin className="w-3 h-3" />
                      <span className="text-xs">{scene.routeName}</span>
                      <span className="mx-1 text-teal-700">·</span>
                      <span className="text-xs">{scene.seatDirection}侧</span>
                    </div>
                    {scene.note && (
                      <p className="text-xs text-mist-400 line-clamp-2">
                        {scene.note}
                      </p>
                    )}
                    <div className="mt-2 flex items-center gap-2">
                      {getTreeIcon(scene.treeDensity)}
                      {getPedestrianIcon(scene.pedestrianStatus)}
                      {scene.signText && (
                        <span className="rounded bg-teal-800/60 px-1.5 py-0.5 text-[10px] text-mist-300">
                          {scene.signText}
                        </span>
                      )}
                    </div>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {detailScene && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={() => setDetailScene(null)}
        >
          <div
            className="relative mx-4 w-full max-w-md animate-scale-in rounded-2xl border border-teal-700 bg-teal-900 p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setDetailScene(null)}
              className="absolute right-4 top-4 text-mist-400 hover:text-mist-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="mb-4 flex items-center gap-3">
              {getWeatherIcon(detailScene.weather)}
              <h2 className="text-xl font-bold text-dusk-400">{detailScene.segment}</h2>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-2 text-mist-300">
                <MapPin className="w-4 h-4 text-dusk-400" />
                <span>{detailScene.routeName}</span>
                <span className="text-teal-600">·</span>
                <span>{detailScene.seatDirection}侧</span>
              </div>
              <div className="flex items-center gap-2 text-mist-300">
                <Clock className="w-4 h-4 text-dusk-400" />
                <span>{formatTimestamp(detailScene.timestamp)}</span>
                <span className="text-teal-600">·</span>
                <span>{getTimeOfDay(detailScene.timestamp)}</span>
              </div>
              <div className="flex items-center gap-3 text-mist-300">
                {getTreeIcon(detailScene.treeDensity)}
                <span>{detailScene.treeDensity}</span>
                {getPedestrianIcon(detailScene.pedestrianStatus)}
                <span>{detailScene.pedestrianStatus}</span>
              </div>
              {detailScene.signText && (
                <div className="rounded-lg bg-teal-800/50 px-3 py-2 text-mist-200">
                  招牌: {detailScene.signText}
                </div>
              )}
              {detailScene.note && (
                <div className="rounded-lg border border-teal-800 px-3 py-2 text-mist-300">
                  {detailScene.note}
                </div>
              )}
            </div>

            <div className="mt-5 flex gap-3">
              <button
                onClick={() => handleStage(detailScene.id)}
                className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-dusk-400/40 py-2.5 text-sm text-dusk-300 transition-colors hover:bg-dusk-400/15"
              >
                <Archive className="w-4 h-4" />
                暂存
              </button>
              <button
                onClick={() => handleDelete(detailScene.id)}
                className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-red-900/40 py-2.5 text-sm text-red-300 transition-colors hover:bg-red-900/60"
              >
                <Trash2 className="w-4 h-4" />
                删除此窗景
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
