import { useMemo, useState } from 'react'
import { lessons, topics } from '../data'
import type { Lesson } from '../types'
import DivisionCramLab from './DivisionCramLab'

type PriorityFilter = '全部' | Lesson['priority']

const REVIEWED_KEY = 'biology-review-cram-reviewed-v1'
const priorityOrder: Record<Lesson['priority'], number> = { '高频': 0, '重点': 1, '基础': 2 }

function loadReviewed() {
  try {
    const value = JSON.parse(localStorage.getItem(REVIEWED_KEY) || '[]')
    return new Set<string>(Array.isArray(value) ? value.filter((x): x is string => typeof x === 'string') : [])
  } catch {
    return new Set<string>()
  }
}

function saveReviewed(value: Set<string>) {
  try { localStorage.setItem(REVIEWED_KEY, JSON.stringify([...value])) } catch { /* 禁用本地存储时仍可在本次打开中使用 */ }
}

export default function QuickReview({ onOpen }: { onOpen: (lesson: Lesson) => void }) {
  const [topicId, setTopicId] = useState('all')
  const [priority, setPriority] = useState<PriorityFilter>('全部')
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [reviewed, setReviewed] = useState<Set<string>>(loadReviewed)

  const groups = useMemo(() => topics.map(topic => ({
    topic,
    items: lessons
      .filter(lesson => lesson.topics.includes(topic.id) && (priority === '全部' || lesson.priority === priority))
      .sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority] || a.id.localeCompare(b.id)),
  })).filter(group => (topicId === 'all' || group.topic.id === topicId) && group.items.length), [topicId, priority])

  const visibleIds = useMemo(() => [...new Set(groups.flatMap(group => group.items.map(lesson => lesson.id)))], [groups])
  const reviewedCount = visibleIds.filter(id => reviewed.has(id)).length
  const allExpanded = visibleIds.length > 0 && visibleIds.every(id => expanded.has(id))
  const showDivisionAnimation = topicId === 'all' || topicId === 'division' || topicId === 'genetics'

  const toggleExpanded = (id: string) => setExpanded(current => {
    const next = new Set(current)
    next.has(id) ? next.delete(id) : next.add(id)
    return next
  })

  const toggleReviewed = (id: string) => setReviewed(current => {
    const next = new Set(current)
    next.has(id) ? next.delete(id) : next.add(id)
    saveReviewed(next)
    return next
  })

  const toggleAll = () => setExpanded(current => {
    const next = new Set(current)
    if (allExpanded) visibleIds.forEach(id => next.delete(id))
    else visibleIds.forEach(id => next.add(id))
    return next
  })

  const printPage = () => {
    setExpanded(current => new Set([...current, ...visibleIds]))
    window.setTimeout(() => window.print(), 80)
  }

  return <main className="content-page cram-page">
    <header className="cram-head">
      <div>
        <span className="eyebrow">LAST-MINUTE REVIEW</span>
        <h1>考前速记</h1>
        <p>把易错点、学考提示和知识链压到一起。先抓高频，再扫遗漏。</p>
      </div>
      <div className="cram-progress" aria-label={`当前筛选已过 ${reviewedCount} 课，共 ${visibleIds.length} 课`}>
        <strong>{reviewedCount}<small> / {visibleIds.length}</small></strong>
        <span>当前已过一遍</span>
        <i><b style={{ width: `${visibleIds.length ? reviewedCount / visibleIds.length * 100 : 0}%` }} /></i>
      </div>
    </header>

    <section className="cram-toolbar" aria-label="速记筛选与操作">
      <div className="cram-priority-filter">
        {(['全部', '高频', '重点', '基础'] as PriorityFilter[]).map(value => <button key={value} className={priority === value ? 'active' : ''} onClick={() => setPriority(value)}>{value === '全部' ? '全部频级' : value}</button>)}
      </div>
      <label>专题
        <select value={topicId} onChange={event => setTopicId(event.target.value)}>
          <option value="all">全部专题</option>
          {topics.map(topic => <option value={topic.id} key={topic.id}>{topic.name}</option>)}
        </select>
      </label>
      <div className="cram-actions">
        <button className="ghost small" onClick={toggleAll}>{allExpanded ? '全部折叠' : '全部展开'}</button>
        <button className="primary small" onClick={printPage}>打印 / 存为 PDF</button>
      </div>
    </section>

    <p className="cram-print-note">考前速记 · {priority === '全部' ? '全部频级' : priority} · {topicId === 'all' ? '全部专题' : topics.find(topic => topic.id === topicId)?.name}</p>

    {showDivisionAnimation && <DivisionCramLab onOpen={onOpen} />}

    <div className="cram-groups">
      {groups.map(({ topic, items }) => <section className="cram-group" key={topic.id} style={{ '--topic': topic.color } as React.CSSProperties}>
        <header>
          <span>{topic.icon}</span>
          <div><small>专题 {String(topics.findIndex(x => x.id === topic.id) + 1).padStart(2, '0')}</small><h2>{topic.name}</h2></div>
          <b>{items.length} 课</b>
        </header>
        <div className="cram-list">
          {items.map(lesson => {
            const isOpen = expanded.has(lesson.id)
            const isReviewed = reviewed.has(lesson.id)
            return <article className={`cram-card ${isOpen ? 'open' : ''} ${isReviewed ? 'reviewed' : ''}`} key={`${topic.id}-${lesson.id}`}>
              <div className="cram-card-head">
                <button className="cram-card-toggle" onClick={() => toggleExpanded(lesson.id)} aria-expanded={isOpen}>
                  <span className={`priority ${lesson.priority}`}>{lesson.priority}</span>
                  <div><small>{lesson.book} · {lesson.chapter}</small><h3>{lesson.title}</h3></div>
                  <b aria-hidden="true">{isOpen ? '−' : '+'}</b>
                </button>
                <button className={`cram-check ${isReviewed ? 'done' : ''}`} onClick={() => toggleReviewed(lesson.id)} aria-pressed={isReviewed}>
                  <i>{isReviewed ? '✓' : ''}</i><span>{isReviewed ? '已过一遍' : '标记已过'}</span>
                </button>
              </div>
              {isOpen && <div className="cram-card-body">
                <section className="cram-pitfalls"><h4><span>!</span> 易错辨析</h4><ul>{lesson.content.pitfalls.map(item => <li key={item}>{item}</li>)}</ul></section>
                <section className="cram-tips"><h4>学考提示</h4><ul>{lesson.content.examTips.map(item => <li key={item}>{item}</li>)}</ul></section>
                <div className="cram-network"><strong>知识链</strong>{lesson.content.network.map((item, index) => <span key={item}>{item}{index < lesson.content.network.length - 1 && <b>→</b>}</span>)}</div>
                <button className="cram-link" onClick={() => onOpen(lesson)}>查看完整课程 →</button>
              </div>}
            </article>
          })}
        </div>
      </section>)}
    </div>
  </main>
}
