import { useMemo, useState } from 'react'

export function PunnettSquare(){
  const [a,setA]=useState('Aa'); const [b,setB]=useState('Aa')
  const gametes=(g:string)=>Array.from(new Set(g.split('')))
  const cells=useMemo(()=>gametes(a).flatMap(x=>gametes(b).map(y=>[x,y].sort((m,n)=>m.toLowerCase()===n.toLowerCase()?m.localeCompare(n):m.toLowerCase().localeCompare(n.toLowerCase())).join(''))),[a,b])
  return <div className="interaction-card"><span className="eyebrow">遗传棋盘格</span><h3>让配子相遇</h3><div className="cross-input"><label>亲本 A<select value={a} onChange={e=>setA(e.target.value)}><option>AA</option><option>Aa</option><option>aa</option></select></label><b>×</b><label>亲本 B<select value={b} onChange={e=>setB(e.target.value)}><option>AA</option><option>Aa</option><option>aa</option></select></label></div><div className="punnett">{cells.map((c,i)=><span key={i}>{c}</span>)}</div><p>子代基因型：{Array.from(new Set(cells)).map(c=>`${c} ${cells.filter(x=>x===c).length}/${cells.length}`).join(' · ')}</p></div>
}

export function AssortmentSimulator(){
  const [runs,setRuns]=useState<string[]>([]); const types=['YR','Yr','yR','yr']
  const run=()=>setRuns(Array.from({length:40},()=>types[Math.floor(Math.random()*4)]))
  return <div className="interaction-card"><span className="eyebrow">随机模拟</span><h3>自由组合实验</h3><div className="seed-row">{types.map(t=><div key={t}><strong>{runs.filter(x=>x===t).length}</strong><span>{t} 配子</span></div>)}</div><button className="primary small" onClick={run}>随机形成 40 个配子</button><p>{runs.length?'样本越大，各类配子的频率通常越接近 1∶1∶1∶1。':'点击开始，观察随机性如何逐渐显出规律。'}</p></div>
}

export function ExperimentLab(){
  const [choice,setChoice]=useState(''); const right=choice==='温度'
  return <div className="interaction-card"><span className="eyebrow">变量辨析</span><h3>找出自变量</h3><p>探究温度对淀粉酶活性的影响，各组改变的是哪项？</p><div className="choice-row">{['温度','酶量','底物浓度'].map(x=><button className={choice===x?(right?'correct':'wrong'):''} onClick={()=>setChoice(x)} key={x}>{x}</button>)}</div>{choice&&<p className={right?'feedback good':'feedback'}>{right?'正确：主动改变的温度是自变量，其他条件应保持相同。':'再想想：这项应当作为无关变量保持一致。'}</p>}</div>
}

export function EvolutionTimeline(){return <div className="interaction-card timeline-card"><span className="eyebrow">证据时间轴</span><h3>生命演化长卷</h3><div className="timeline"><span style={{left:'3%'}}>早期生命<small>约 35 亿年前</small></span><span style={{left:'34%'}}>真核生物<small>细胞结构复杂化</small></span><span style={{left:'62%'}}>多细胞生物<small>功能分化</small></span><span style={{left:'90%'}}>人类出现<small>演化长河的近端</small></span></div><p>时间轴只表达先后与尺度；现存物种不是彼此“进化来的高低阶梯”。</p></div>}
