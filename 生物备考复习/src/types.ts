export type Mastery = 'unstarted' | 'reviewing' | 'mastered'
export type BookId = '必修1' | '必修2'

export interface KnowledgeBlock {
  goals: string[]
  concepts: string[]
  process: string[]
  experiments: string[]
  pitfalls: string[]
  examTips: string[]
  network: string[]
}

export interface Lesson {
  id: string
  book: BookId
  chapter: string
  chapterNo: number
  sectionNo: number
  title: string
  pages: string
  topics: string[]
  priority: '高频' | '重点' | '基础'
  minutes: number
  modelId?: string
  content: KnowledgeBlock
}

export interface Topic {
  id: string
  name: string
  icon: string
  description: string
  color: string
}

export interface ModelScene {
  id: string
  name: string
  lessonId: string
  kind: 'molecule' | 'cell' | 'membrane' | 'energy' | 'organelle' | 'division' | 'helix' | 'expression' | 'variation'
  summary: string
  parts: string[]
  stages: string[]
  compare?: [string, string]
}

export interface ProgressRecord {
  lessonId: string
  mastery: Mastery
  updatedAt: string
  modelExplored: boolean
  visits: number
  seconds: number
}

export interface StudySession {
  lessonId: string
  startedAt: string
  seconds: number
}

export interface AppSettings {
  examDate: string
  schemaVersion: number
}

export interface BackupData {
  version: 1
  exportedAt: string
  progress: ProgressRecord[]
  sessions: StudySession[]
  settings: AppSettings
}
