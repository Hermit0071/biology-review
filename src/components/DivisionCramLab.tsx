import divisionModelHtml from '../../有丝分裂与减数分裂动画模型/有丝分裂与减数分裂动画模型.html?raw'
import { lessons } from '../data'
import type { Lesson } from '../types'

const embedStyles = `
<style>
  body { min-height: 0; overflow: hidden; background: transparent; }
  .ambient, .hero, .compare-card, .chart-card, .references, footer { display: none !important; }
  .app { width: 100%; margin: 0; padding: 0; }
  .topbar { position: static; min-height: 62px; grid-template-columns: 1fr; padding: 9px 14px; border: 0; border-radius: 0; box-shadow: none; }
  .brand, .top-meta { display: none; }
  .segmented { justify-self: center; }
  .workspace { grid-template-columns: minmax(0, 1.7fr) minmax(290px, .72fr); gap: 12px; }
  .model-card, .info-card, .quantity-card, .exam-card { border-radius: 0; box-shadow: none; }
  .model-card { padding: 14px; }
  .scene-wrap { min-height: 430px; border-radius: 20px; }
  #scene { height: 430px; }
  .side { gap: 10px; }
  .info-card { padding: 18px; }
  .info-card h2 { font-size: 23px; }
  @media (max-width: 800px) {
    .workspace { grid-template-columns: 1fr; }
    .side { display: none; }
    .model-card { padding: 10px; }
    .model-head { align-items: flex-start; }
    .count-badges { max-width: 180px; }
    .scene-wrap { min-height: 380px; }
    #scene { height: 380px; }
  }
</style>`

const embeddedModelHtml = divisionModelHtml.replace('</head>', `${embedStyles}</head>`)
const mitosisLesson = lessons.find(lesson => lesson.id === 'b1-4-1')!
const meiosisLesson = lessons.find(lesson => lesson.id === 'b2-2-1')!

export default function DivisionCramLab({ onOpen }: { onOpen: (lesson: Lesson) => void }) {
  return <section className="cram-animation" aria-labelledby="cram-animation-title">
    <header className="cram-animation-head">
      <div>
        <span className="eyebrow">CORE ANIMATION · 先看动态</span>
        <h2 id="cram-animation-title">一次看清，两种分裂</h2>
        <p>有丝分裂追踪“复制后一次分裂”；减数分裂追踪“复制一次、连续分裂两次”。可播放、拖动进度或逐阶段对照。</p>
      </div>
      <span className="cram-animation-badge">2n = 4 为演示模型</span>
    </header>

    <div className="cram-animation-frame">
      <iframe
        srcDoc={embeddedModelHtml}
        title="有丝分裂与减数分裂连续动画"
        sandbox="allow-scripts"
        loading="eager"
      />
    </div>

    <div className="cram-animation-memory">
      <p><strong>减数分裂的连续性：</strong>同源染色体先联会形成四分体，相邻的非姐妹染色单体随后可交换相应片段；交换后的重组片段会延续到减数第二次分裂形成的子细胞中。</p>
      <p><strong>遗传规律的细胞学基础：</strong>减Ⅰ同源染色体分离，对应等位基因分离；各对同源染色体的独立排列与组合，是非同源染色体上非等位基因自由组合的基础。</p>
    </div>

    <div className="cram-animation-courses">
      <span>动画建立图景后，进入完整课程</span>
      <div>
        <button className="ghost small" onClick={() => onOpen(mitosisLesson)}>有丝分裂完整课程 →</button>
        <button className="primary small" onClick={() => onOpen(meiosisLesson)}>减数分裂完整课程 →</button>
      </div>
    </div>
  </section>
}
