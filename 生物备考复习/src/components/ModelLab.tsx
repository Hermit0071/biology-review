import { Canvas, useFrame } from '@react-three/fiber'
import { Html, Line, OrbitControls } from '@react-three/drei'
import { Component, useEffect, useRef, useState, type ReactNode } from 'react'
import * as THREE from 'three'
import type { ModelScene } from '../types'

class WebGLErrorBoundary extends Component<{ children: ReactNode; fallback: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  render() { return this.state.failed ? this.props.fallback : this.props.children }
}

type Vec3 = [number, number, number]
type PickFn = (name: string) => void
type SceneProps = { model: ModelScene; explode: number; playing: boolean; speed: number; stage: number; labels: boolean; onPick: PickFn }

const C = {
  red: '#ff5f6d', coral: '#ff8a65', orange: '#ffb347', yellow: '#ffd93d',
  green: '#47d7a5', leaf: '#72df72', cyan: '#35c8e0', blue: '#4d96ff',
  violet: '#9b7bff', pink: '#ff78c7', ink: '#173b52', pale: '#eaf8ff', white: '#ffffff'
}

function Label({ position, children, onClick }: { position: Vec3; children: ReactNode; onClick?: () => void }) {
  return <Html center position={position}><button className="model-label" onClick={onClick}>{children}</button></Html>
}

function Part({ position, color, name, scale = [1, 1, 1], labels, onPick, shape = 'sphere', opacity = .96, rotation = [0, 0, 0] }: {
  position: Vec3; color: string; name: string; scale?: Vec3; labels: boolean; onPick: PickFn;
  shape?: 'sphere' | 'box' | 'torus' | 'capsule' | 'cylinder'; opacity?: number; rotation?: Vec3
}) {
  return <group position={position} rotation={rotation}>
    <mesh scale={scale} onClick={(e) => { e.stopPropagation(); onPick(name) }} castShadow>
      {shape === 'box' ? <boxGeometry args={[1, 1, 1]} /> : shape === 'torus' ? <torusGeometry args={[.72, .18, 20, 48]} /> : shape === 'capsule' ? <capsuleGeometry args={[.35, .9, 10, 22]} /> : shape === 'cylinder' ? <cylinderGeometry args={[.55, .55, .16, 32]} /> : <sphereGeometry args={[.5, 32, 24]} />}
      <meshStandardMaterial color={color} roughness={.3} metalness={.03} transparent opacity={opacity} />
    </mesh>
    {labels && <Label position={[0, .78, 0]} onClick={() => onPick(name)}>{name}</Label>}
  </group>
}

function Atom({ position, color, radius, name, onPick }: { position: Vec3; color: string; radius: number; name: string; onPick: PickFn }) {
  return <mesh position={position} castShadow onClick={(e) => { e.stopPropagation(); onPick(name) }}>
    <sphereGeometry args={[radius, 32, 24]} /><meshStandardMaterial color={color} roughness={.24} />
  </mesh>
}

function CellShell({ position = [0, 0, 0], scale = [2.3, 1.75, 1.45], color = C.cyan, box = false, opacity = .14 }: { position?: Vec3; scale?: Vec3; color?: string; box?: boolean; opacity?: number }) {
  return <mesh position={position} scale={scale} renderOrder={-1}>{box ? <boxGeometry args={[1, 1, 1]} /> : <sphereGeometry args={[1, 42, 30]} />}<meshPhysicalMaterial color={color} transparent opacity={opacity} roughness={.16} side={THREE.DoubleSide} depthWrite={false} /></mesh>
}

function Chromosome({ position, color, scale = 1, labels = false, onPick, name = '染色体', separated = false }: { position: Vec3; color: string; scale?: number; labels?: boolean; onPick: PickFn; name?: string; separated?: boolean }) {
  const gap = separated ? .3 : 0
  return <group position={position} scale={scale}>
    <Part position={[-gap, 0, 0]} rotation={[0, 0, .5]} color={color} name={name} shape="capsule" scale={[.28, .85, .28]} labels={labels} onPick={onPick} />
    <Part position={[gap, 0, 0]} rotation={[0, 0, -.5]} color={color} name="姐妹染色单体" shape="capsule" scale={[.28, .85, .28]} labels={false} onPick={onPick} />
    <Atom position={[0, 0, .02]} color={C.yellow} radius={.15} name="着丝粒" onPick={onPick} />
  </group>
}

const waterH1: Vec3 = [-.79, -.61, 0]
const waterH2: Vec3 = [.79, -.61, 0]
function WaterUnit({ position = [0, 0, 0], rotation = [0, 0, 0], labels, onPick, charges = false, scale = 1 }: { position?: Vec3; rotation?: Vec3; labels: boolean; onPick: PickFn; charges?: boolean; scale?: number }) {
  return <group position={position} rotation={rotation} scale={scale}>
    <Line points={[[0, 0, 0], waterH1]} color="#c7d5df" lineWidth={9} /><Line points={[[0, 0, 0], waterH2]} color="#c7d5df" lineWidth={9} />
    <Atom position={[0, 0, 0]} color={C.red} radius={.48} name="氧原子 O" onPick={onPick} />
    <Atom position={waterH1} color={C.white} radius={.28} name="氢原子 H" onPick={onPick} /><Atom position={waterH2} color={C.white} radius={.28} name="氢原子 H" onPick={onPick} />
    {labels && <><Label position={[0, .65, 0]} onClick={() => onPick('氧原子 O')}>O</Label><Label position={[-1.05, -.72, 0]} onClick={() => onPick('氢原子 H')}>H</Label><Label position={[1.05, -.72, 0]} onClick={() => onPick('氢原子 H')}>H</Label></>}
    {charges && <><Html center position={[0, .92, 0]}><span className="charge-label negative">δ−</span></Html><Html center position={[-1.12, -.42, 0]}><span className="charge-label positive">δ+</span></Html><Html center position={[1.12, -.42, 0]}><span className="charge-label positive">δ+</span></Html></>}
  </group>
}

function WaterScene({ stage, explode, labels, onPick }: Pick<SceneProps, 'stage' | 'explode' | 'labels' | 'onPick'>) {
  const e = explode * .7
  if (stage === 0) return <group><WaterUnit labels={labels} charges onPick={onPick} scale={1.4} />{labels && <Html center position={[0, -1.55, 0]}><span className="angle-label">H—O—H ≈ 104.5° · 弯曲形</span></Html>}</group>
  if (stage === 1) return <group>
    <WaterUnit position={[-1.75 - e, .45, 0]} rotation={[0, 0, -.2]} labels={labels} charges onPick={onPick} scale={.8} />
    <WaterUnit position={[0, -.35, 0]} rotation={[0, 0, .35]} labels={false} charges onPick={onPick} scale={.8} />
    <WaterUnit position={[1.75 + e, .48, 0]} rotation={[0, 0, -.65]} labels={false} charges onPick={onPick} scale={.8} />
    <Line points={[[-.96, .05, 0], [-.38, -.08, 0]]} color={C.blue} lineWidth={2} dashed dashSize={.1} gapSize={.08} />
    <Line points={[[.72, -.05, 0], [1.06, .12, 0]]} color={C.blue} lineWidth={2} dashed dashSize={.1} gapSize={.08} />
    {labels && <Label position={[0, 1.5, 0]} onClick={() => onPick('分子间 O···H 氢键')}>蓝色虚线：O···H 氢键</Label>}
  </group>
  return <group><Part position={[0, 0, 0]} color={C.violet} name="Na⁺" scale={[.7, .7, .7]} labels={labels} onPick={onPick} />
    {[0, 1, 2, 3, 4, 5].map(i => { const a = i * Math.PI / 3; const p: Vec3 = [Math.cos(a) * (1.72 + e), Math.sin(a) * (1.72 + e), 0]; return <WaterUnit key={i} position={p} rotation={[0, 0, a + Math.PI / 2]} labels={false} onPick={onPick} scale={.5} /> })}
    {labels && <Html center position={[0, -2.4, 0]}><span className="angle-label">氧端 δ− 朝向 Na⁺，形成水合层</span></Html>}
  </group>
}

function BiomoleculeScene({ stage, explode, labels, onPick }: Pick<SceneProps, 'stage' | 'explode' | 'labels' | 'onPick'>) {
  const e = explode * .5
  const bead = (p: Vec3, color: string, name: string, key: string) => <Part key={key} position={p} color={color} name={name} scale={[.34, .34, .34]} labels={labels} onPick={onPick} />
  if (stage === 0) return <group>
    <group position={[-1.8, .75, 0]}>{[0, 1, 2, 3, 4, 5].map(i => { const a = i * Math.PI / 3; return bead([Math.cos(a) * .6, Math.sin(a) * .6, 0], i === 0 ? C.red : C.cyan, '葡萄糖单体', `g${i}`) })}</group>
    <group position={[.2, .75, 0]}>{bead([0, 0, 0], C.coral, '氨基酸中心碳', 'aa0')}{bead([-.55, 0, 0], C.blue, '氨基', 'aa1')}{bead([.55, 0, 0], C.red, '羧基', 'aa2')}</group>
    <group position={[-1, -1, 0]}>{bead([-.45, 0, 0], C.orange, '磷酸基团', 'n0')}{bead([.1, 0, 0], C.green, '五碳糖', 'n1')}{bead([.65, 0, 0], C.violet, '含氮碱基', 'n2')}</group>
    <group position={[1.45, -.8, 0]}>{bead([-.45, 0, 0], C.cyan, '甘油', 'l0')}{bead([.1, .24, 0], C.yellow, '脂肪酸', 'l1')}{bead([.1, -.24, 0], C.yellow, '脂肪酸', 'l2')}</group>
  </group>
  if (stage === 1) return <group>{Array.from({ length: 7 }, (_, i) => <group key={i}>{bead([(i - 3) * (.65 + e), 0, 0], i % 2 ? C.cyan : C.coral, '单体', `p${i}`)}{i < 6 && <Line points={[[(i - 3) * (.65 + e) + .25, 0, 0], [(i - 2) * (.65 + e) - .25, 0, 0]]} color={C.orange} lineWidth={4} />}</group>)}{labels && <Label position={[0, 1, 0]} onClick={() => onPick('脱水缩合形成的共价键')}>脱水缩合 → 多聚体</Label>}</group>
  const fold = Array.from({ length: 28 }, (_, i) => new THREE.Vector3((i - 14) * .16, Math.sin(i * .7) * .75, Math.cos(i * .45) * .55))
  return <group><Line points={fold} color={C.violet} lineWidth={8} />{fold.filter((_, i) => i % 4 === 0).map((p, i) => <Part key={i} position={[p.x, p.y, p.z]} color={[C.red, C.yellow, C.green, C.blue][i % 4]} name="侧链基团" scale={[.22, .22, .22]} labels={false} onPick={onPick} />)}{labels && <Label position={[0, 1.45, 0]} onClick={() => onPick('特定空间结构决定功能')}>折叠形成特定空间结构</Label>}</group>
}

function MiniNucleus({ position, scale = 1, labels, onPick }: { position: Vec3; scale?: number; labels: boolean; onPick: PickFn }) {
  const chromatin = [[-.45, .2, .35], [-.15, -.35, .4], [.2, .28, .35], [.45, -.12, .35]] as Vec3[]
  return <group position={position} scale={scale}><CellShell scale={[.82, .78, .68]} color={C.violet} opacity={.23} /><CellShell scale={[.72, .68, .58]} color={C.pink} opacity={.09} /><Line points={chromatin} color={C.violet} lineWidth={3} /><Part position={[-.15, .08, .48]} color={C.pink} name="核仁" scale={[.24, .24, .2]} labels={false} onPick={onPick} />{labels && <Label position={[0, 1, 0]} onClick={() => onPick('细胞核：双层核膜、核孔、染色质与核仁')}>细胞核</Label>}</group>
}

function MiniMitochondrion({ position, scale = 1, labels, onPick }: { position: Vec3; scale?: number; labels: boolean; onPick: PickFn }) {
  return <group position={position} scale={scale} rotation={[0, 0, -.18]}><Part position={[0, 0, 0]} color={C.coral} name="线粒体双层膜" scale={[1, .45, .48]} labels={labels} onPick={onPick} opacity={.72} />{[-.45, 0, .45].map((x, i) => <Line key={i} points={[[x, .28, .38], [x - .15, .02, .42], [x + .15, -.28, .38]]} color={C.yellow} lineWidth={3} />)}</group>
}

function MiniGolgi({ position, scale = 1, labels, onPick }: { position: Vec3; scale?: number; labels: boolean; onPick: PickFn }) {
  return <group position={position} scale={scale}>{Array.from({ length: 5 }, (_, i) => { const y = (i - 2) * .17; return <Line key={i} points={[[-.65 + i * .04, y, 0], [-.25, y - .08, .05], [.25, y - .08, .05], [.65 - i * .04, y, 0]]} color={C.pink} lineWidth={6} /> })}{[-.8, .82].map((x, i) => <Part key={i} position={[x, i ? .25 : -.22, 0]} color={C.pink} name="高尔基体运输囊泡" scale={[.12, .12, .12]} labels={false} onPick={onPick} />)}{labels && <Label position={[0, .75, 0]} onClick={() => onPick('高尔基体：扁平囊堆叠并形成囊泡')}>高尔基体</Label>}</group>
}

function MiniER({ position, scale = 1, labels, onPick }: { position: Vec3; scale?: number; labels: boolean; onPick: PickFn }) {
  const sheets = [-.38, 0, .38]
  return <group position={position} scale={scale}>{sheets.map((y, i) => <Line key={i} points={[[-.9, y, 0], [-.45, y + .12, .05], [0, y - .08, 0], [.48, y + .1, .05], [.9, y, 0]]} color={C.blue} lineWidth={5} />)}{Array.from({ length: 9 }, (_, i) => <Part key={i} position={[(i % 3 - 1) * .6, (Math.floor(i / 3) - 1) * .38 + .12, .18]} color={C.yellow} name="附着核糖体" scale={[.06, .06, .06]} labels={false} onPick={onPick} />)}{labels && <Label position={[0, .9, 0]} onClick={() => onPick('粗面内质网：膜囊表面附着核糖体')}>粗面内质网</Label>}</group>
}

function MiniCentrosome({ position, scale = 1, labels, onPick }: { position: Vec3; scale?: number; labels: boolean; onPick: PickFn }) {
  return <group position={position} scale={scale}><Part position={[-.14, 0, 0]} rotation={[0, 0, Math.PI / 2]} color={C.orange} name="中心粒（一对互相垂直）" shape="capsule" scale={[.15, .48, .15]} labels={labels} onPick={onPick} /><Part position={[.18, .12, .08]} rotation={[Math.PI / 2, 0, 0]} color={C.yellow} name="中心粒" shape="capsule" scale={[.15, .48, .15]} labels={false} onPick={onPick} /></group>
}

function MiniChloroplast({ position, scale = 1, labels, onPick }: { position: Vec3; scale?: number; labels: boolean; onPick: PickFn }) {
  return <group position={position} scale={scale}><Part position={[0, 0, 0]} color={C.leaf} name="叶绿体双层包膜" scale={[1, .5, .46]} labels={labels} onPick={onPick} opacity={.7} />{[-.45, 0, .45].map((x, gi) => <group key={x} position={[x, 0, .42]}>{[-.12, 0, .12].map((y, i) => <Part key={i} position={[0, y, 0]} color={C.green} name="基粒" shape="cylinder" scale={[.26, .5, .26]} labels={false} onPick={onPick} />)}{gi < 2 && <Line points={[[.18, 0, 0], [.72, 0, 0]]} color={C.yellow} lineWidth={2} />}</group>)}</group>
}

function AnimalCell({ position = [0, 0, 0], scale = 1, exploded = 0, labels, onPick }: { position?: Vec3; scale?: number; exploded?: number; labels: boolean; onPick: PickFn }) {
  const e = exploded
  return <group position={position} scale={scale}><CellShell color={C.cyan} scale={[2.45, 1.75, 1.35]} opacity={.16} /><MiniNucleus position={[-.45 - e * .35, .18 + e * .15, 0]} labels={labels} onPick={onPick} /><MiniER position={[-.32 - e * .18, -.18 - e * .22, -.18]} scale={.9} labels={labels && e > .2} onPick={onPick} /><MiniGolgi position={[.72 + e * .38, -.58 - e * .18, .18]} scale={.75} labels={labels && e > .2} onPick={onPick} /><MiniMitochondrion position={[1 + e * .42, .55 + e * .18, .12]} scale={.72} labels={labels} onPick={onPick} /><MiniCentrosome position={[.35 + e * .25, .42 + e * .28, .55]} scale={.8} labels={labels && e > .2} onPick={onPick} />{[[-1.25,-.62],[1.3,-.35],[1.42,.18]].map(([x,y],i)=><Part key={i} position={[x,y,.48]} color={i?C.green:C.orange} name={i?'溶酶体/过氧化物酶体':'囊泡'} scale={[.13,.13,.13]} labels={false} onPick={onPick}/>)}{Array.from({length:12},(_,i)=><Part key={i} position={[(i%4-1.5)*.75,(Math.floor(i/4)-1)*.55,.62]} color={C.yellow} name="游离核糖体" scale={[.045,.045,.045]} labels={false} onPick={onPick}/>)}</group>
}

function PlantCell({ position, scale = 1, labels, onPick }: { position: Vec3; scale?: number; labels: boolean; onPick: PickFn }) {
  return <group position={position} scale={scale}><CellShell color={C.leaf} box scale={[2.35, 1.9, 1.25]} opacity={.28} /><CellShell color={C.cyan} box scale={[2.18, 1.72, 1.12]} opacity={.1} /><CellShell position={[-.2, .05, 0]} scale={[1.2, 1.24, .72]} color={C.cyan} opacity={.16} /><MiniNucleus position={[.72, .42, .2]} scale={.65} labels={labels} onPick={onPick} />{[[-.72,.68],[-.82,-.7],[.78,-.7]].map(([x,y],i)=><MiniChloroplast key={i} position={[x,y,.28]} scale={.5} labels={labels&&i===0} onPick={onPick}/>)}<MiniMitochondrion position={[.78,.02,.35]} scale={.38} labels={false} onPick={onPick}/>{labels&&<Label position={[0,-1.35,0]} onClick={()=>onPick('细胞壁、细胞膜和中央大液泡')}>细胞壁 · 大液泡</Label>}</group>
}

function ProkaryoteCell({ position, scale = 1, labels, onPick }: { position: Vec3; scale?: number; labels: boolean; onPick: PickFn }) {
  const dna = [[-1.1,.1,.38],[-.65,.4,.42],[-.15,-.32,.42],[.4,.35,.42],[1,-.05,.4]] as Vec3[]
  return <group position={position} scale={scale}><CellShell color={C.orange} scale={[2.25, 1.05, .95]} opacity={.2} /><CellShell color={C.yellow} scale={[2.05, .88, .8]} opacity={.09} /><Line points={dna} color={C.violet} lineWidth={5} />{Array.from({length:14},(_,i)=><Part key={i} position={[(i%7-3)*.42,(Math.floor(i/7)-.5)*.5,.52]} color={C.coral} name="70S 核糖体" scale={[.055,.055,.055]} labels={false} onPick={onPick}/>)}<Line points={[[2.05,0,0],[2.7,.45,0],[3.35,-.2,0],[4,.18,0]]} color={C.blue} lineWidth={3}/>{labels&&<Label position={[0,1.25,0]} onClick={()=>onPick('拟核：环状 DNA，无核膜')}>拟核 · 无膜细胞器</Label>}</group>
}

function CellScene({ stage, explode, labels, onPick }: Pick<SceneProps, 'stage' | 'explode' | 'labels' | 'onPick'>) {
  if (stage === 0) return <AnimalCell labels={labels} onPick={onPick} />
  if (stage === 1) return <AnimalCell exploded={.45 + explode} labels={labels} onPick={onPick} />
  return <group><AnimalCell position={[-2.25, 0, 0]} scale={.62} labels={labels} onPick={onPick} /><PlantCell position={[0, 0, 0]} scale={.62} labels={labels} onPick={onPick} /><ProkaryoteCell position={[2.35, 0, 0]} scale={.58} labels={labels} onPick={onPick} /></group>
}

function Phospholipid({ x, z, side, onPick }: { x: number; z: number; side: number; onPick: PickFn }) {
  const y = side * .58
  return <group><Part position={[x, y, z]} color={C.cyan} name="亲水头部" scale={[.19, .19, .19]} labels={false} onPick={onPick} /><Line points={[[x - .08, y - side * .15, z], [x - .13, side * .05, z]]} color={C.orange} lineWidth={2} /><Line points={[[x + .08, y - side * .15, z], [x + .13, side * .05, z]]} color={C.orange} lineWidth={2} /></group>
}

function MembraneScene({ stage, explode, labels, onPick }: Pick<SceneProps, 'stage' | 'explode' | 'labels' | 'onPick'>) {
  const move = stage === 0 ? -2 + explode * 2 : stage === 1 ? -.9 + explode * 1.2 : stage === 2 ? 1.1 - explode : 0
  return <group rotation={[.18, 0, 0]}>{Array.from({ length: 48 }, (_, i) => { const x = (i % 12 - 5.5) * .52; const z = (Math.floor(i / 12) - 1.5) * .55; return <group key={i}><Phospholipid x={x} z={z} side={1} onPick={onPick} /><Phospholipid x={x} z={z} side={-1} onPick={onPick} />{i%6===0&&<Part position={[x,.02,z]} color={C.yellow} name="胆固醇：调节膜流动性" scale={[.1,.22,.1]} labels={false} onPick={onPick}/>}</group> })}
    <Part position={[-1.1, 0, 0]} color={C.violet} name="通道蛋白" shape="torus" rotation={[Math.PI / 2, 0, 0]} scale={[.55, .85, .55]} labels={labels && stage === 1} onPick={onPick} /><Part position={[1.2, 0, 0]} color={C.pink} name="载体蛋白" shape="capsule" scale={[.7, 1.05, .7]} labels={labels && stage === 2} onPick={onPick} />
    <Part position={[-2.25,.48,.2]} color={C.coral} name="糖蛋白" scale={[.48,.35,.4]} labels={labels&&stage===0} onPick={onPick}/><Line points={[[ -2.25,.72,.2],[-2.42,1.02,.2],[-2.2,1.3,.2],[-2.42,1.55,.2]]} color={C.green} lineWidth={4}/>{[[-2.42,1.02],[-2.2,1.3],[-2.42,1.55]].map(([x,y],i)=><Part key={i} position={[x,y,.2]} color={C.green} name="膜外侧糖链" scale={[.09,.09,.09]} labels={false} onPick={onPick}/>)}<Part position={[2.35,-.72,-.25]} color={C.blue} name="外周蛋白" scale={[.55,.2,.38]} labels={false} onPick={onPick}/>
    {stage < 3 && <Part position={[move, stage === 0 ? 1.1 - explode * 1.8 : .1, 0]} color={C.yellow} name={stage === 2 ? '逆浓度梯度运输的溶质' : '运输中的溶质'} scale={[.22, .22, .22]} labels={labels} onPick={onPick} />}{stage === 2 && <Part position={[2, -.95, 0]} color={C.green} name="ATP 供能" scale={[.3, .3, .3]} labels={labels} onPick={onPick} />}{stage === 3 && <><CellShell position={[2, 0, 0]} scale={[.65 + explode, .65 + explode, .65 + explode]} color={C.cyan} /><Label position={[2, 1.1, 0]} onClick={() => onPick('囊泡运输')}>胞吞 / 胞吐囊泡</Label></>}
  </group>
}

function EnergyScene({ stage, explode, labels, onPick }: Pick<SceneProps, 'stage' | 'explode' | 'labels' | 'onPick'>) {
  const substrateX = stage === 0 ? 1.8 + explode : stage === 1 ? .35 : 2
  return <group><Part position={[-.45, .25, 0]} color={C.blue} name="酶（反应前后不变）" scale={[1.35, .9, .85]} labels={labels} onPick={onPick} /><Part position={[.35, .25, .1]} color="#ffffff" name="活性部位" scale={[.55, .42, .42]} labels={labels && stage < 2} onPick={onPick} opacity={.9} />
    {stage < 2 && <Part position={[substrateX, .25, .1]} color={C.yellow} name="与活性部位互补的底物" shape="box" scale={[.48, .42, .4]} labels={labels} onPick={onPick} />}{stage === 2 && <><Part position={[1.45 + explode, .65, 0]} color={C.green} name="产物 A" scale={[.32, .32, .32]} labels={labels} onPick={onPick} /><Part position={[1.6 + explode, -.35, 0]} color={C.coral} name="产物 B" scale={[.3, .3, .3]} labels={labels} onPick={onPick} /></>}{stage === 3 && <group position={[1.55, 0, 0]}><Part position={[-.45, 0, 0]} color={C.green} name="ADP" scale={[.6, .42, .42]} labels={labels} onPick={onPick} /><Part position={[.45 + explode, 0, 0]} color={C.orange} name="Pi" scale={[.28, .28, .28]} labels={labels} onPick={onPick} /><Line points={[[.15, 0, 0], [.7, 0, 0]]} color={C.red} lineWidth={4} />{labels && <Label position={[0, 1, 0]} onClick={() => onPick('ATP ⇄ ADP + Pi')}>ATP ⇄ ADP + Pi</Label>}</group>}</group>
}

function MitochondrionScene({ stage, explode, labels, onPick }: Pick<SceneProps, 'stage' | 'explode' | 'labels' | 'onPick'>) {
  const cristae = [-1.45, -.75, 0, .75, 1.45]
  const mtDNA = [[-.72,-.2,.72],[-.42,.05,.76],[-.05,-.15,.74],[.28,.08,.76],[.58,-.18,.72]] as Vec3[]
  return <group><CellShell scale={[2.72 + explode * .3, 1.48 + explode * .2, 1.22]} color={C.coral} opacity={.23} /><CellShell scale={[2.5, 1.28, 1.04]} color={C.orange} opacity={.11} />{cristae.map((x, i) => <Line key={i} points={[[x-.18, 1.02, .12], [x-.2, .48, .28], [x+.22, .18, .42], [x+.2, -.38, .3], [x-.16, -.92, .12]]} color={C.red} lineWidth={6} />)}
    <Line points={mtDNA} color={C.violet} lineWidth={3}/>{Array.from({length:8},(_,i)=><Part key={i} position={[(i%4-.5)*.35-1.1,(Math.floor(i/4)-.5)*.38,.68]} color={C.blue} name="线粒体核糖体" scale={[.055,.055,.055]} labels={false} onPick={onPick}/>)}
    {stage === 0 && <><Line points={[[-3.25, .8, 0], [-2.75, .35, 0], [-2.25, .1, 0]]} color={C.blue} lineWidth={5} /><Label position={[-2.55, 1.45, 0]} onClick={() => onPick('线粒体外膜、内膜与膜间隙')}>双层膜 · 内膜向内折叠成嵴</Label></>}{stage === 1 && <group>{Array.from({ length: 7 }, (_, i) => <Part key={i} position={[Math.cos(i) * (.68 + explode), Math.sin(i) * (.68 + explode), .7]} color={C.yellow} name="柠檬酸循环中间产物" scale={[.14, .14, .14]} labels={false} onPick={onPick} />)}{labels && <Label position={[0, 1.72, 0]} onClick={() => onPick('线粒体基质含酶、DNA 与核糖体')}>基质：柠檬酸循环</Label>}</group>}{stage === 2 && <>{cristae.map((x, i) => <Part key={i} position={[x, -.12, .72]} color={i % 2 ? C.green : C.blue} name={i % 2 ? 'ATP 合酶' : '电子传递链'} shape="capsule" scale={[.15, .3, .15]} labels={labels && i === 2} onPick={onPick} />)}<Line points={[[-1.8, .82, .7], [-.9, .66, .72], [0, .82, .7], [.9, .66, .72], [1.8, .82, .7]]} color={C.yellow} lineWidth={3} /></>}
  </group>
}

function ChloroplastScene({ stage, explode, labels, onPick }: Pick<SceneProps, 'stage' | 'explode' | 'labels' | 'onPick'>) {
  const grana = [-1.45, -.72, 0, .72, 1.45]
  const cpDNA = [[-.75,-.78,.7],[-.35,-.58,.74],[.05,-.8,.72],[.42,-.6,.74],[.75,-.78,.7]] as Vec3[]
  return <group><CellShell scale={[2.78 + explode * .25, 1.48 + explode * .15, 1.12]} color={C.green} opacity={.23} /><CellShell scale={[2.56, 1.28, .96]} color={C.leaf} opacity={.1} />{grana.map((x, gi) => <group key={x} position={[x, gi % 2 ? -.18 : .22, .25]}>{Array.from({ length: 6 }, (_, i) => <Part key={i} position={[0, (i - 2.5) * (.14 + explode * .025), 0]} color={gi%2?C.green:'#20b873'} name="类囊体（堆叠成基粒）" shape="cylinder" scale={[.62, .65, .62]} labels={labels && gi === 1 && i === 5} onPick={onPick} />)}</group>)}{grana.slice(0, 4).map((x, i) => <Line key={x} points={[[x + .26, .08, .28], [grana[i + 1] - .26, .08, .28]]} color={C.yellow} lineWidth={4} />)}<Line points={cpDNA} color={C.violet} lineWidth={3}/>{Array.from({length:7},(_,i)=><Part key={i} position={[1.05+(i%3)*.22,-.62+(Math.floor(i/3))* .2,.68]} color={C.blue} name="叶绿体核糖体" scale={[.05,.05,.05]} labels={false} onPick={onPick}/>)}
    {stage === 0 && Array.from({ length: 6 }, (_, i) => <Line key={i} points={[[i - 2.5, 2, 0], [i - 2.5, 1.28, .2]]} color={C.yellow} lineWidth={3} />)}{stage === 1 && <><Part position={[-.52, .92, .7]} color={C.yellow} name="ATP" scale={[.25, .25, .25]} labels={labels} onPick={onPick} /><Part position={[.52, .92, .7]} color={C.blue} name="NADPH" scale={[.25, .25, .25]} labels={labels} onPick={onPick} /><Part position={[1.9,.72,.65]} color={C.cyan} name="释放 O₂" scale={[.2,.2,.2]} labels={labels} onPick={onPick}/></>}{stage === 2 && <><Part position={[0, 0, .72]} color={C.cyan} name="基质中的 CO₂ 固定" scale={[.32, .32, .32]} labels={labels} onPick={onPick} />{Array.from({ length: 6 }, (_, i) => <Part key={i} position={[Math.cos(i) * .8, Math.sin(i) * .65, .72]} color={C.orange} name="碳反应循环" scale={[.12, .12, .12]} labels={false} onPick={onPick} />)}</>}{stage === 3 && <Part position={[2.15 + explode, 0, .55]} color={C.orange} name="三碳糖输出并合成糖类" scale={[.42, .42, .42]} labels={labels} onPick={onPick} />}
  </group>
}

function Spindle({ left = -2, right = 2, targets }: { left?: number; right?: number; targets: Vec3[] }) {
  return <>{targets.map((p, i) => <group key={i}><Line points={[[left, 0, 0], p]} color={C.cyan} lineWidth={1} /><Line points={[[right, 0, 0], p]} color={C.cyan} lineWidth={1} /></group>)}<Part position={[left, 0, 0]} color={C.orange} name="纺锤体一极" scale={[.16, .16, .16]} labels={false} onPick={() => {}} /><Part position={[right, 0, 0]} color={C.orange} name="纺锤体一极" scale={[.16, .16, .16]} labels={false} onPick={() => {}} /></>
}

function MeiosisSpindle({ center = [0, 0, 0], scale = 1, axis = 'y', targets, onPick }: { center?: Vec3; scale?: number; axis?: 'x' | 'y'; targets: Vec3[]; onPick: PickFn }) {
  const poleA: Vec3 = axis === 'y' ? [center[0], center[1] + 1.45 * scale, .15] : [center[0] - 1.45 * scale, center[1], .15]
  const poleB: Vec3 = axis === 'y' ? [center[0], center[1] - 1.45 * scale, .15] : [center[0] + 1.45 * scale, center[1], .15]
  return <>{targets.map((p, i) => <group key={i}><Line points={[poleA, p]} color={C.orange} lineWidth={1.4} /><Line points={[poleB, p]} color={C.orange} lineWidth={1.4} /></group>)}<Part position={poleA} color={C.yellow} name="纺锤体一极（中心体）" shape="torus" scale={[.22, .22, .22]} labels={false} onPick={onPick} /><Part position={poleB} color={C.yellow} name="纺锤体另一极（中心体）" shape="torus" scale={[.22, .22, .22]} labels={false} onPick={onPick} /></>
}

function RecombinedChromosome({ position, color, segmentColor, scale = 1, labels = false, onPick, name = '复制后的染色体' }: { position: Vec3; color: string; segmentColor: string; scale?: number; labels?: boolean; onPick: PickFn; name?: string }) {
  return <group position={position} scale={scale}><Chromosome position={[0, 0, 0]} color={color} labels={labels} onPick={onPick} name={name} /><Part position={[-.28, .58, .05]} rotation={[0, 0, .5]} color={segmentColor} name="交换后的染色单体片段" shape="capsule" scale={[.18, .22, .18]} labels={false} onPick={onPick} /></group>
}

function MitosisScene({ stage, explode, labels, onPick }: Pick<SceneProps, 'stage' | 'explode' | 'labels' | 'onPick'>) {
  const ys = [-.8, 0, .8]
  if (stage === 0) return <group><CellShell scale={[2.35, 1.75, 1]} color={C.cyan} /><CellShell scale={[1.15, 1.15, .8]} color={C.violet} opacity={.12} /><Line points={[[-.8, .4, .3], [-.3, -.5, .3], [.2, .6, .3], [.7, -.4, .3]]} color={C.violet} lineWidth={4} />{labels && <Label position={[0, 1.45, 0]} onClick={() => onPick('间期：DNA 复制，染色质未凝缩')}>间期：DNA 复制</Label>}</group>
  if (stage === 1) return <group><CellShell scale={[2.35, 1.75, 1]} color={C.cyan} />{ys.map((y, i) => <Chromosome key={i} position={[(i - 1) * .7, y, 0]} color={i % 2 ? C.red : C.violet} scale={.65} labels={labels && i === 1} onPick={onPick} />)}<Spindle targets={ys.map(y => [0, y, 0])} /></group>
  if (stage === 2) return <group><CellShell scale={[2.35, 1.75, 1]} color={C.cyan} />{ys.map((y, i) => <Chromosome key={i} position={[0, y, 0]} color={i % 2 ? C.red : C.violet} scale={.65} labels={labels && i === 1} onPick={onPick} />)}<Spindle targets={ys.map(y => [0, y, 0])} />{labels && <Label position={[0, 1.55, 0]} onClick={() => onPick('赤道面')}>中期：着丝粒排列在赤道面</Label>}</group>
  if (stage === 3) return <group><CellShell scale={[2.35, 1.75, 1]} color={C.cyan} />{ys.map((y, i) => <group key={i}><Part position={[-.7 - explode, y, 0]} rotation={[0, 0, -.5]} color={C.red} name="向一极移动的子染色体" shape="capsule" scale={[.18, .5, .18]} labels={labels && i === 1} onPick={onPick} /><Part position={[.7 + explode, y, 0]} rotation={[0, 0, .5]} color={C.violet} name="向另一极移动的子染色体" shape="capsule" scale={[.18, .5, .18]} labels={false} onPick={onPick} /></group>)}<Spindle targets={ys.flatMap(y => [[-.7, y, 0], [.7, y, 0]] as Vec3[])} /></group>
  return <group><CellShell position={[-1.15 - explode * .4, 0, 0]} scale={[1.25, 1.5, .9]} color={C.cyan} /><CellShell position={[1.15 + explode * .4, 0, 0]} scale={[1.25, 1.5, .9]} color={C.cyan} />{[-1.15, 1.15].map((x, i) => <group key={x}>{ys.map((y, j) => <Part key={j} position={[x + (j - 1) * .18, y * .55, 0]} color={i ? C.violet : C.red} name="相同遗传物质的子细胞" shape="capsule" scale={[.12, .34, .12]} labels={false} onPick={onPick} />)}</group>)}{labels && <Label position={[0, 1.8, 0]} onClick={() => onPick('两个遗传物质相同的子细胞')}>末期 / 胞质分裂</Label>}</group>
}

function MeiosisScene({ stage, explode, labels, onPick }: Pick<SceneProps, 'stage' | 'explode' | 'labels' | 'onPick'>) {
  const e = explode * .35
  if (stage === 0) return <group><CellShell scale={[2.35, 1.75, 1]} color={C.leaf} opacity={.18} /><CellShell scale={[1.45, 1.15, .8]} color={C.violet} opacity={.08} />
    <group position={[-.68, .1, 0]}><RecombinedChromosome position={[-.18-e, 0, 0]} color={C.red} segmentColor={C.blue} scale={.68} labels={labels} onPick={onPick} name="同源染色体联会成四分体" /><RecombinedChromosome position={[.18+e, 0, 0]} color={C.blue} segmentColor={C.red} scale={.68} labels={false} onPick={onPick} /></group>
    <group position={[.78, -.25, 0]} scale={.72}><Chromosome position={[-.18-e, 0, 0]} color={C.red} labels={false} onPick={onPick} /><Chromosome position={[.18+e, 0, 0]} color={C.blue} labels={false} onPick={onPick} /></group><Part position={[-.68,.12,.48]} color={C.yellow} name="交叉点：非姐妹染色单体交换" scale={[.16,.16,.16]} labels={labels} onPick={onPick}/><MeiosisSpindle targets={[[-.68,.1,0],[.78,-.25,0]]} onPick={onPick}/>{labels&&<Label position={[0,1.72,0]} onClick={()=>onPick('前期Ⅰ：联会、四分体和交叉互换')}>前期Ⅰ · 联会与交换</Label>}</group>
  if (stage === 1) return <group><CellShell scale={[2.35, 1.75, 1]} color={C.leaf} opacity={.18} />{[-.72,.72].map((x,pair)=><group key={x} position={[x,0,0]} scale={.62}><RecombinedChromosome position={[-.2,0,0]} color={pair?C.blue:C.red} segmentColor={pair?C.red:C.blue} labels={labels&&pair===0} onPick={onPick} name="四分体排列在赤道面"/><RecombinedChromosome position={[.2,0,0]} color={pair?C.red:C.blue} segmentColor={pair?C.blue:C.red} labels={false} onPick={onPick}/></group>)}<MeiosisSpindle targets={[[-.72,0,0],[.72,0,0]]} onPick={onPick}/>{labels&&<Label position={[0,1.72,0]} onClick={()=>onPick('中期Ⅰ：同源染色体成对排列')}>中期Ⅰ · 四分体位于赤道面</Label>}</group>
  if (stage === 2) return <group><CellShell scale={[2.35, 1.75, 1]} color={C.leaf} opacity={.18} /><RecombinedChromosome position={[-.65,.72+e,0]} color={C.red} segmentColor={C.blue} scale={.58} labels={labels} onPick={onPick} name="同源染色体分离，姐妹染色单体仍相连"/><Chromosome position={[.65,.78+e,0]} color={C.blue} scale={.58} labels={false} onPick={onPick}/><Chromosome position={[-.65,-.72-e,0]} color={C.blue} scale={.58} labels={false} onPick={onPick}/><RecombinedChromosome position={[.65,-.78-e,0]} color={C.red} segmentColor={C.blue} scale={.58} labels={false} onPick={onPick}/><MeiosisSpindle targets={[[-.65,.72,0],[.65,.78,0],[-.65,-.72,0],[.65,-.78,0]]} onPick={onPick}/>{labels&&<Label position={[0,1.72,0]} onClick={()=>onPick('后期Ⅰ不分裂着丝粒')}>后期Ⅰ · 分同源，不分姐妹</Label>}</group>
  if (stage === 3) return <group>{[-.9-e,.9+e].map((y,cell)=><group key={y}><CellShell position={[0,y,0]} scale={[1.65,.72,.78]} color={C.leaf} opacity={.18}/><RecombinedChromosome position={[-.45,y,0]} color={cell?C.red:C.blue} segmentColor={cell?C.blue:C.red} scale={.48} labels={labels&&cell===0} onPick={onPick} name="单倍体核：染色体仍由两条姐妹染色单体组成"/><Chromosome position={[.45,y,0]} color={cell?C.blue:C.red} scale={.48} labels={false} onPick={onPick}/></group>)}{labels&&<Label position={[0,0,0]} onClick={()=>onPick('末期Ⅰ与胞质分裂形成两个单倍体细胞')}>末期Ⅰ / 胞质分裂 · 2 个 n 细胞</Label>}</group>
  if (stage === 4) return <group>{[-.9,.9].map((y,cell)=><group key={y}><CellShell position={[0,y,0]} scale={[1.65,.72,.78]} color={C.leaf} opacity={.18}/><RecombinedChromosome position={[-.42,y,0]} color={cell?C.red:C.blue} segmentColor={cell?C.blue:C.red} scale={.45} labels={labels&&cell===0} onPick={onPick} name="前期Ⅱ：没有再次复制 DNA"/><Chromosome position={[.42,y,0]} color={cell?C.blue:C.red} scale={.45} labels={false} onPick={onPick}/><MeiosisSpindle center={[0,y,0]} scale={.72} axis="x" targets={[[-.42,y,0],[.42,y,0]]} onPick={onPick}/></group>)}{labels&&<Label position={[0,0,0]} onClick={()=>onPick('前期Ⅱ：两个细胞分别形成纺锤体')}>前期Ⅱ · 无 DNA 再复制</Label>}</group>
  if (stage === 5) return <group>{[-.9,.9].map((y,cell)=><group key={y}><CellShell position={[0,y,0]} scale={[1.65,.72,.78]} color={C.leaf} opacity={.18}/><RecombinedChromosome position={[0,y-.22,0]} color={cell?C.red:C.blue} segmentColor={cell?C.blue:C.red} scale={.42} labels={labels&&cell===0} onPick={onPick} name="中期Ⅱ：染色体单独排列在赤道面"/><Chromosome position={[0,y+.22,0]} color={cell?C.blue:C.red} scale={.42} labels={false} onPick={onPick}/><MeiosisSpindle center={[0,y,0]} scale={.72} axis="x" targets={[[0,y-.22,0],[0,y+.22,0]]} onPick={onPick}/></group>)}{labels&&<Label position={[0,0,0]} onClick={()=>onPick('中期Ⅱ：着丝粒位于赤道面')}>中期Ⅱ · 染色体单列</Label>}</group>
  if (stage === 6) return <group>{[-.9,.9].map((y,cell)=><group key={y}><CellShell position={[0,y,0]} scale={[1.65,.72,.78]} color={C.leaf} opacity={.18}/>{[-.72-e,.72+e].map((x,side)=><group key={x}><Part position={[x,y-.2,0]} rotation={[0,0,side?.45:-.45]} color={cell?C.red:C.blue} name="后期Ⅱ：着丝粒分裂，姐妹染色单体分开" shape="capsule" scale={[.13,.38,.13]} labels={labels&&cell===0&&side===0} onPick={onPick}/><Part position={[x,y+.2,0]} rotation={[0,0,side?-.45:.45]} color={cell?C.blue:C.red} name="子染色体移向细胞两极" shape="capsule" scale={[.13,.38,.13]} labels={false} onPick={onPick}/></group>)}<MeiosisSpindle center={[0,y,0]} scale={.72} axis="x" targets={[[-.72,y-.2,0],[.72,y-.2,0],[-.72,y+.2,0],[.72,y+.2,0]]} onPick={onPick}/></group>)}{labels&&<Label position={[0,0,0]} onClick={()=>onPick('后期Ⅱ分离姐妹染色单体')}>后期Ⅱ · 分姐妹染色单体</Label>}</group>
  const cells:[number,number][]=[[-1.25,.78],[1.25,.78],[-1.25,-.78],[1.25,-.78]]
  return <group>{cells.map(([x,y],i)=><group key={i}><CellShell position={[x,y,0]} scale={[.72,.58,.56]} color={C.leaf} opacity={.2}/><Part position={[x-.15,y,0]} rotation={[0,0,i%2?.4:-.4]} color={i<2?C.red:C.blue} name="单倍体配子中的单染色单体染色体" shape="capsule" scale={[.1,.3,.1]} labels={labels&&i===0} onPick={onPick}/><Part position={[x+.15,y,0]} rotation={[0,0,i%2?-.35:.35]} color={i%2?C.blue:C.red} name="重组染色体" shape="capsule" scale={[.1,.25,.1]} labels={false} onPick={onPick}/><Part position={[x+.08,y+.18,.03]} color={i%2?C.red:C.blue} name="交换片段" scale={[.055,.055,.055]} labels={false} onPick={onPick}/></group>)}{labels&&<Label position={[0,0,0]} onClick={()=>onPick('末期Ⅱ与胞质分裂形成四个遗传组成不同的单倍体细胞')}>末期Ⅱ / 胞质分裂 · 4 个 n 配子</Label>}</group>
}

function DNAHelix({ position = [0, 0, 0], scale = 1, spread = 0, labels = false, onPick, gene = false, strandColors = [C.red, C.blue] }: { position?: Vec3; scale?: number; spread?: number; labels?: boolean; onPick: PickFn; gene?: boolean; strandColors?: [string, string] }) {
  const a: THREE.Vector3[] = [], b: THREE.Vector3[] = []
  for (let i = 0; i < 41; i++) { const y = (i - 20) * .12; const t = i * Math.PI / 5; a.push(new THREE.Vector3(Math.cos(t) * (.72 + spread), y, Math.sin(t) * (.72 + spread))); b.push(new THREE.Vector3(-Math.cos(t) * (.72 + spread), y, -Math.sin(t) * (.72 + spread))) }
  return <group position={position} scale={scale} rotation={[0, 0, Math.PI / 2]}><Line points={a} color={strandColors[0]} lineWidth={4} /><Line points={b} color={strandColors[1]} lineWidth={4} />{a.filter((_, i) => i % 2 === 0).map((p, i) => <Line key={i} points={[p, b[i * 2]]} color={gene && i >= 5 && i <= 12 ? C.yellow : C.cyan} lineWidth={gene && i >= 5 && i <= 12 ? 5 : 2} />)}{labels && <Label position={[0, 1.25, 0]} onClick={() => onPick(gene ? '基因是有遗传效应的 DNA 片段' : 'DNA 双螺旋：约 10 bp/圈')}>{gene ? '黄色：基因片段' : 'DNA 双螺旋'}</Label>}</group>
}

function HierarchyScene({ stage, explode, labels, onPick }: Pick<SceneProps, 'stage' | 'explode' | 'labels' | 'onPick'>) {
  if (stage === 0) return <Chromosome position={[0, 0, 0]} color={C.violet} scale={1.45} labels={labels} onPick={onPick} name="一条复制后的染色体" />
  if (stage === 1) { const pts = Array.from({ length: 13 }, (_, i) => new THREE.Vector3((i - 6) * (.4 + explode * .1), Math.sin(i) * .35, 0)); return <group><Line points={pts} color={C.blue} lineWidth={3} />{pts.map((p, i) => <Part key={i} position={[p.x, p.y, p.z]} color={C.violet} name="组蛋白八聚体上的核小体" scale={[.22, .22, .22]} labels={labels && i === 6} onPick={onPick} />)}</group> }
  return <DNAHelix scale={1.25} spread={explode * .12} labels={labels} onPick={onPick} gene={stage === 3} />
}

function DNAReplicationScene({ stage, explode, labels, onPick }: Pick<SceneProps, 'stage' | 'explode' | 'labels' | 'onPick'>) {
  if (stage === 0) return <DNAHelix scale={1.25} labels={labels} onPick={onPick} />
  if (stage === 1) return <group><Line points={[[-2.4, .8, 0], [-.8, .3, 0], [0, 0, 0], [.9, .9 + explode, 0], [2.4, 1.2 + explode, 0]]} color={C.red} lineWidth={5} /><Line points={[[-2.4, -.8, 0], [-.8, -.3, 0], [0, 0, 0], [.9, -.9 - explode, 0], [2.4, -1.2 - explode, 0]]} color={C.blue} lineWidth={5} /><Part position={[0, 0, 0]} color={C.orange} name="解旋酶" shape="torus" scale={[.55, .55, .55]} labels={labels} onPick={onPick} /></group>
  if (stage === 2) return <group><Line points={[[-2.4, .8, 0], [2.4, .8, 0]]} color={C.red} lineWidth={5} /><Line points={[[-2.4, -.8, 0], [2.4, -.8, 0]]} color={C.blue} lineWidth={5} /><Line points={[[-2.1, .45, 0], [2.1, .45, 0]]} color={C.green} lineWidth={5} /><Line points={[[-2.1, -.45, 0], [-.8, -.45, 0], [-.5, -.45, 0], [.35, -.45, 0], [.65, -.45, 0], [1.25, -.45, 0], [1.55, -.45, 0], [2.1, -.45, 0]]} color={C.yellow} lineWidth={5} dashed /><Label position={[0, 1.5, 0]} onClick={() => onPick('连续合成与不连续合成')}>绿色/黄色：新链（互补、反向平行）</Label></group>
  const separation = 1 + explode * .35
  return <group>
    <DNAHelix position={[0, separation, 0]} scale={.62} labels={false} onPick={onPick} strandColors={[C.red, C.green]} />
    <DNAHelix position={[0, -separation, 0]} scale={.62} labels={false} onPick={onPick} strandColors={[C.blue, C.yellow]} />
    {labels && <><Label position={[0, 1.78 + explode * .35, 0]} onClick={() => onPick('子代 DNA ①：一条红色母链和一条绿色新链')}>独立的子代 DNA ① · 母链＋新链</Label><Label position={[0, -1.78 - explode * .35, 0]} onClick={() => onPick('子代 DNA ②：一条蓝色母链和一条黄色新链')}>独立的子代 DNA ② · 母链＋新链</Label></>}
  </group>
}

function ExpressionScene({ stage, explode, labels, onPick }: Pick<SceneProps, 'stage' | 'explode' | 'labels' | 'onPick'>) {
  const mrna = [[-2.1, -.55, 0], [-1.2, -.72, 0], [-.3, -.55, 0], [.6, -.72, 0], [1.5, -.55, 0], [2.1 + explode, -.72, 0]] as Vec3[]
  return <group>{stage < 2 && <DNAHelix position={[0, .7, 0]} scale={.78} spread={stage ? .18 : 0} labels={labels && stage === 0} onPick={onPick} />}{stage <= 1 && <Part position={[-.8 + stage * 1.2, .65, .65]} color={C.orange} name="RNA 聚合酶" scale={[.62, .5, .45]} labels={labels} onPick={onPick} />}{stage >= 1 && <Line points={mrna} color={C.green} lineWidth={5} />}{stage >= 2 && <Part position={[-.3 + (stage - 2) * .45, -.62, 0]} color={C.violet} name="核糖体（大、小亚基）" scale={[1.05, .55, .75]} labels={labels} onPick={onPick} />}{stage >= 3 && [-1.3, -.35, .6].map((x, i) => <group key={i}><Line points={[[x, -1.8, 0], [x, -1, 0], [x - .2, -.78, 0], [x + .2, -.78, 0]]} color={C.blue} lineWidth={4} /><Part position={[x, -1.85, 0]} color={[C.red, C.yellow, C.cyan][i]} name="tRNA 携带氨基酸" scale={[.18, .18, .18]} labels={labels && i === 1} onPick={onPick} /></group>)}{stage >= 3 && Array.from({ length: stage === 4 ? 7 : 4 }, (_, i) => <Part key={i} position={[.2 + i * .3, .15 + Math.sin(i) * .2 + (stage === 4 ? explode : 0), 0]} color={[C.red, C.yellow, C.cyan, C.pink][i % 4]} name="延伸中的多肽链" scale={[.15, .15, .15]} labels={false} onPick={onPick} />)}{stage === 4 && <Label position={[1.1, 1.2 + explode, 0]} onClick={() => onPick('肽链释放并折叠')}>终止密码 → 肽链释放</Label>}</group>
}

function VariationScene({ stage, explode, labels, onPick }: Pick<SceneProps, 'stage' | 'explode' | 'labels' | 'onPick'>) {
  if (stage === 0) return <group><Chromosome position={[0, .2, 0]} color={C.blue} scale={1.35} labels={labels} onPick={onPick} name="正常复制染色体" /><DNAHelix position={[0, -1.55, 0]} scale={.38} labels={false} onPick={onPick} /></group>
  if (stage === 1) return <group><DNAHelix position={[-.9 - explode, 0, 0]} scale={.8} labels={labels} onPick={onPick} gene /><DNAHelix position={[.9 + explode, 0, 0]} scale={.8} labels={false} onPick={onPick} gene /><Part position={[.9 + explode, .15, .7]} color={C.pink} name="碱基替换/增添/缺失" scale={[.2, .2, .2]} labels={labels} onPick={onPick} /></group>
  if (stage === 2) return <group><Chromosome position={[-1.1 - explode, 0, 0]} color={C.blue} labels={labels} onPick={onPick} name="正常染色体" /><group position={[1.1 + explode, 0, 0]}><Part position={[0, .38, 0]} rotation={[0, 0, .45]} color={C.red} name="缺失/重复/倒位/易位" shape="capsule" scale={[.24, .42, .24]} labels={labels} onPick={onPick} /><Part position={[.2, -.45, 0]} rotation={[0, 0, -.65]} color={C.red} name="结构畸变" shape="capsule" scale={[.24, .78, .24]} labels={false} onPick={onPick} /></group></group>
  return <group>{[-1.6, -.8, 0, .8, 1.6].map((x, i) => <Part key={i} position={[x + (i === 4 ? explode : 0), 0, 0]} rotation={[0, 0, i % 2 ? .4 : -.4]} color={i === 4 ? C.red : C.blue} name={i === 4 ? '非整倍体：多/少一条染色体' : '染色体组成员'} shape="capsule" scale={[.18, .62, .18]} labels={labels && i === 4} onPick={onPick} />)}</group>
}

function SceneContent(props: SceneProps) {
  const { model } = props
  if (model.id === 'water') return <WaterScene {...props} />
  if (model.id === 'biomolecule') return <BiomoleculeScene {...props} />
  if (model.id === 'cell') return <CellScene {...props} />
  if (model.id === 'membrane') return <MembraneScene {...props} />
  if (model.id === 'energy') return <EnergyScene {...props} />
  if (model.id === 'respiration') return <MitochondrionScene {...props} />
  if (model.id === 'photosynthesis') return <ChloroplastScene {...props} />
  if (model.id === 'mitosis') return <MitosisScene {...props} />
  if (model.id === 'meiosis') return <MeiosisScene {...props} />
  if (model.id === 'chromosome') return <HierarchyScene {...props} />
  if (model.id === 'dna') return <DNAReplicationScene {...props} />
  if (model.id === 'expression') return <ExpressionScene {...props} />
  return <VariationScene {...props} />
}

function BiologyScene(props: SceneProps) {
  const root = useRef<THREE.Group>(null)
  useFrame((state) => {
    if (!root.current) return
    // 过程图只作小幅度摆动，避免染色体、细胞器在侧视时互相遮挡；
    // 用户仍可通过 OrbitControls 自由旋转到任意角度。
    if (props.playing) root.current.rotation.y = Math.sin(state.clock.elapsedTime * .34 * props.speed) * .2
    root.current.position.y = Math.sin(state.clock.elapsedTime * .75) * .035
  })
  return <group ref={root}><SceneContent {...props} /></group>
}

const accuracyGuide: Record<string, string> = {
  water: '按教材与水分子结构图校准：H—O—H 约 104.5°；红色 O、白色 H；氢键仅连接相邻分子的 O···H。',
  biomolecule: '区分糖、氨基酸、核苷酸与脂质基本构件；多聚体连接和折叠均为教学性简化。',
  cell: '按所给动物、植物细胞显微结构图校准：动物细胞呈柔性轮廓并含中心体；植物细胞有细胞壁、中央大液泡和叶绿体；原核细胞无核膜与膜性细胞器。',
  membrane: '按流动镶嵌模型校准：磷脂双层中疏水尾相向；膜蛋白分为贯穿与外周类型；糖链只位于膜外侧，并加入调节流动性的胆固醇。',
  energy: '酶的活性部位与底物特异匹配，酶在反应前后不被消耗；ATP 末端磷酸基团参与能量耦联。',
  respiration: '依据电镜与剖面图：双层膜；内膜向基质折叠成嵴；柠檬酸循环在基质，电子传递链位于内膜。',
  photosynthesis: '依据叶绿体电镜：双层包膜；类囊体堆叠成基粒并由基质片层相连；碳反应发生于基质。',
  mitosis: '阶段顺序按染色体凝缩、赤道面排列、姐妹染色单体分离、形成两个遗传物质相同的子细胞。',
  meiosis: '按所给八阶段图校准：前期Ⅰ联会并在非姐妹染色单体间交换；中期Ⅰ四分体成对排列；后期Ⅰ分同源而不分着丝粒；减Ⅱ再分姐妹，最终形成四个单倍体细胞。',
  chromosome: '层级为染色体—染色质—核小体—DNA—基因；核小体以 DNA 缠绕组蛋白为核心。',
  dna: '双螺旋约 10 个碱基对一圈；复制完成后得到两个彼此独立的双链 DNA 分子，每个子代 DNA 都由一条母链和一条新合成链组成。',
  expression: '转录以 DNA 一条链为模板合成 RNA；翻译由核糖体读取 mRNA，tRNA 携带氨基酸。',
  variation: '基因突变发生在碱基序列层面；染色体畸变分结构变化与数目变化，层级不可混淆。'
}

function Fallback({ model, stage }: { model: ModelScene; stage: number }) { return <div className="model-fallback"><div className="fallback-orbit">{model.parts.slice(0, 6).map((p, i) => <span key={p} style={{ transform: `rotate(${i * 60 + stage * 12}deg) translateX(${75 + stage * 8}px) rotate(-${i * 60 + stage * 12}deg)` }}>{p}</span>)}</div><p>当前设备未启用 WebGL，已切换为二维结构关系图。</p></div> }

export default function ModelLab({ model, onExplored }: { model: ModelScene; onExplored: () => void }) {
  const [explode, setExplode] = useState(0), [playing, setPlaying] = useState(true), [speed, setSpeed] = useState(1), [labels, setLabels] = useState(true), [stage, setStage] = useState(0), [picked, setPicked] = useState(model.parts[0])
  useEffect(() => { setStage(0); setPicked(model.parts[0]); setExplode(0); setPlaying(true) }, [model.id])
  const mark = (fn: () => void) => { fn(); onExplored() }
  return <section className="model-lab" aria-label={`${model.name}三维模型`}>
    <div className="model-title"><div><span className="eyebrow">动态教学模型 · 比例经简化</span><h2>{model.name}</h2><p>{model.summary}</p></div><div className="picked"><span>当前结构</span><strong>{picked}</strong></div></div>
    <div className="model-stage"><div className="scene-indicator" aria-live="polite"><span>场景 {stage + 1}/{model.stages.length}</span><strong>{model.stages[stage]}</strong></div><div className="orbit-hint">拖动旋转 · 滚轮缩放 · 可从任意角度观察</div>
      <WebGLErrorBoundary fallback={<Fallback model={model} stage={stage} />}><Canvas camera={{ position: [0, 1, 6.6], fov: 45 }} shadows dpr={[1, 1.6]}><color attach="background" args={['#ffffff']} /><ambientLight intensity={2.15} /><hemisphereLight args={['#ffffff', '#d8f4ff', 1.1]} /><directionalLight position={[5, 7, 6]} intensity={2.5} castShadow /><directionalLight position={[-5, -2, 3]} intensity={1.1} /><BiologyScene model={model} explode={explode} playing={playing} speed={speed} stage={stage} labels={labels} onPick={setPicked} /><OrbitControls enablePan={false} minDistance={3.2} maxDistance={11} /></Canvas></WebGLErrorBoundary>
    </div>
    <div className="stage-switcher" aria-label="模型场景选择">{model.stages.map((s, i) => <button aria-pressed={i === stage} className={i === stage ? 'active' : ''} key={s} onClick={() => { setStage(i); onExplored() }}><span>{i + 1}</span><strong>{s}</strong></button>)}</div>
    <div className="model-controls"><button className="primary small" onClick={() => mark(() => setPlaying(!playing))}>{playing ? '暂停' : '播放'}</button><label>拆解 <input aria-label="拆解程度" type="range" min="0" max="1" step=".05" value={explode} onChange={e => mark(() => setExplode(+e.target.value))} /></label><label>速度 <select value={speed} onChange={e => setSpeed(+e.target.value)}><option value=".5">0.5×</option><option value="1">1×</option><option value="2">2×</option></select></label><button className="ghost small" onClick={() => setLabels(!labels)}>{labels ? '隐藏标注' : '显示标注'}</button>{model.compare && <span className="compare-chip">对比：{model.compare.join(' ↔ ')}</span>}</div>
    <div className="model-accuracy"><span>教材 × 照片 × 结构图校准</span><p>{accuracyGuide[model.id]}</p></div>
  </section>
}
