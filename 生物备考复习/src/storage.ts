import type { AppSettings, BackupData, ProgressRecord, StudySession } from './types'

const DB_NAME = 'biology-review-db'
const DB_VERSION = 1
const DEFAULT_SETTINGS: AppSettings = { examDate: '2026-07-04T10:30', schemaVersion: 1 }
const FALLBACK_KEY = 'biology-review-fallback-v1'

type FallbackState = { progress: ProgressRecord[]; sessions: StudySession[]; settings: AppSettings }
function fallbackRead(): FallbackState {
  try {
    const value = localStorage.getItem(FALLBACK_KEY)
    return value ? JSON.parse(value) as FallbackState : { progress: [], sessions: [], settings: DEFAULT_SETTINGS }
  } catch { return { progress: [], sessions: [], settings: DEFAULT_SETTINGS } }
}
function fallbackWrite(value: FallbackState) {
  try { localStorage.setItem(FALLBACK_KEY, JSON.stringify(value)) } catch { /* 浏览器禁用存储时保持只读可用 */ }
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains('progress')) db.createObjectStore('progress', { keyPath: 'lessonId' })
      if (!db.objectStoreNames.contains('sessions')) db.createObjectStore('sessions', { keyPath: 'startedAt' })
      if (!db.objectStoreNames.contains('settings')) db.createObjectStore('settings')
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

async function getAll<T>(store: string): Promise<T[]> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const req = db.transaction(store, 'readonly').objectStore(store).getAll()
    req.onsuccess = () => resolve(req.result as T[])
    req.onerror = () => reject(req.error)
  })
}

async function put(store: string, value: unknown, key?: IDBValidKey) {
  const db = await openDB()
  return new Promise<void>((resolve, reject) => {
    const objectStore = db.transaction(store, 'readwrite').objectStore(store)
    const req = key === undefined ? objectStore.put(value) : objectStore.put(value, key)
    req.onsuccess = () => resolve()
    req.onerror = () => reject(req.error)
  })
}

export const storage = {
  async progress() { try { return await getAll<ProgressRecord>('progress') } catch { return fallbackRead().progress } },
  async sessions() { try { return await getAll<StudySession>('sessions') } catch { return fallbackRead().sessions } },
  async saveProgress(value: ProgressRecord) { try { await put('progress', value) } catch { const data=fallbackRead(); data.progress=[...data.progress.filter(x=>x.lessonId!==value.lessonId),value]; fallbackWrite(data) } },
  async saveSession(value: StudySession) { try { await put('sessions', value) } catch { const data=fallbackRead(); data.sessions=[...data.sessions.filter(x=>x.startedAt!==value.startedAt),value]; fallbackWrite(data) } },
  async settings(): Promise<AppSettings> {
    try {
      const db = await openDB()
      return await new Promise((resolve) => {
        const req = db.transaction('settings', 'readonly').objectStore('settings').get('main')
        req.onsuccess = () => resolve((req.result as AppSettings) || DEFAULT_SETTINGS)
        req.onerror = () => resolve(DEFAULT_SETTINGS)
      })
    } catch { return fallbackRead().settings }
  },
  async saveSettings(value: AppSettings) { try { await put('settings', value, 'main') } catch { const data=fallbackRead(); data.settings=value; fallbackWrite(data) } },
  async export(): Promise<BackupData> {
    return { version: 1, exportedAt: new Date().toISOString(), progress: await this.progress(), sessions: await this.sessions(), settings: await this.settings() }
  },
  async import(data: BackupData) {
    if (data.version !== 1 || !Array.isArray(data.progress) || !Array.isArray(data.sessions)) throw new Error('备份格式不正确')
    try {
      const db = await openDB()
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(['progress', 'sessions', 'settings'], 'readwrite')
        tx.objectStore('progress').clear(); tx.objectStore('sessions').clear()
        data.progress.forEach((x) => tx.objectStore('progress').put(x))
        data.sessions.forEach((x) => tx.objectStore('sessions').put(x))
        tx.objectStore('settings').put(data.settings, 'main')
        tx.oncomplete = () => resolve(); tx.onerror = () => reject(tx.error)
      })
    } catch { fallbackWrite({progress:data.progress,sessions:data.sessions,settings:data.settings}) }
  },
  async clear() {
    try {
      const db = await openDB()
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(['progress', 'sessions', 'settings'], 'readwrite')
        tx.objectStore('progress').clear(); tx.objectStore('sessions').clear(); tx.objectStore('settings').clear()
        tx.oncomplete = () => resolve(); tx.onerror = () => reject(tx.error)
      })
    } catch { /* IndexedDB 不可用时清理备用存储 */ }
    try { localStorage.removeItem(FALLBACK_KEY) } catch { /* ignore */ }
  },
}
