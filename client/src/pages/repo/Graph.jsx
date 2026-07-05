import { useEffect, useState, useMemo, useCallback, useRef } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import ReactFlow, {
  Controls, MiniMap, Background,
  useNodesState, useEdgesState, useReactFlow,
  ReactFlowProvider,
} from 'reactflow'
import 'reactflow/dist/style.css'
import dagre from 'dagre'
import { Flame } from 'lucide-react'
import { Switch } from '../../components/ui/switch'
import { Skeleton } from '../../components/ui/skeleton'
import FileNode from '../../components/shared/FileNode'
import api from '../../api/api'

// ── dagre layout ─────────────────────────────────────────────────────────────

function applyLayout(nodes, edges) {
  const g = new dagre.graphlib.Graph()
  g.setGraph({ rankdir: 'LR', nodesep: 60, ranksep: 100 })
  g.setDefaultEdgeLabel(() => ({}))
  nodes.forEach(n => g.setNode(n.id, { width: 160, height: 60 }))
  edges.forEach(e => g.setEdge(e.source, e.target))
  dagre.layout(g)
  return nodes.map(n => {
    const pos = g.node(n.id)
    return { ...n, position: { x: pos.x - 80, y: pos.y - 30 } }
  })
}

const NODE_TYPES = { fileNode: FileNode }

// ── inner component (needs ReactFlowProvider context) ─────────────────────────

function GraphInner() {
  const { owner, name } = useParams()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { fitView, fitBounds } = useReactFlow()

  const [rawFiles, setRawFiles]     = useState([])
  const [rawEdges, setRawEdges]     = useState([])
  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])

  const [selectedNode, setSelectedNode] = useState(null)
  const [deadOnly,    setDeadOnly]    = useState(false)
  const [entryOnly,   setEntryOnly]   = useState(false)
  const [traceTarget, setTraceTarget] = useState('')
  const [tracePath,   setTracePath]   = useState([])
  const [traceResult, setTraceResult] = useState(null)
  const [tracing,     setTracing]     = useState(false)
  const [traceDropdownOpen, setTraceDropdownOpen] = useState(false)
  const traceInputRef = useRef(null)
  const [loading,     setLoading]     = useState(true)
  const [error,       setError]       = useState(null)
  const [panelOpen,   setPanelOpen]   = useState(true)
  const [blastRadiusData, setBlastRadiusData] = useState(null)

  // ── fetch ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    api.get(`/api/graph/${owner}/${name}`)
      .then(res => {
        const files    = res.data.nodes || []
        const apiEdges = res.data.edges || []
        setRawFiles(files)
        setRawEdges(apiEdges)

        const rfNodes = files.map(f => ({
          id: f.path,
          type: 'fileNode',
          position: { x: 0, y: 0 },
          data: {
            label: f.name, path: f.path,
            language: f.language, isDead: f.isDead,
            isEntry: f.isEntry, complexity: f.complexityScore ?? 0,
          },
        }))
        const rfEdges = apiEdges.map(e => ({
          id: `${e.source}->${e.target}`,
          source: e.source, target: e.target,
          type: 'smoothstep',
          style: { stroke: '#555', strokeWidth: 1.5 },
          animated: true,
        }))
        const laid = applyLayout(rfNodes, rfEdges)
        setNodes(laid)
        setEdges(rfEdges)
        
        const highlightPath = searchParams.get('highlight')
        if (highlightPath) {
          const highlightNode = rfNodes.find(n => n.id === highlightPath)
          if (highlightNode) {
            setSelectedNode(highlightNode.data)
            setPanelOpen(true) // Force panel open when highlighting
          }
        }
      })
      .catch(e => setError(e.response?.data?.message || 'Failed to load graph'))
      .finally(() => setLoading(false))
  }, [owner, name]) // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-center on highlighted node after nodes are rendered
  useEffect(() => {
    const highlightPath = searchParams.get('highlight')
    if (highlightPath && nodes.length > 0) {
      // Fetch blast radius data for context
      api.get(`/api/repos/${owner}/${name}/blast-radius`)
        .then(res => {
          const results = res.data.results || []
          const fileData = results.find(f => f.path === highlightPath)
          setBlastRadiusData(fileData || null)
        })
        .catch(() => setBlastRadiusData(null))
      
      const timer = setTimeout(() => {
        fitView({
          nodes: [{ id: highlightPath }],
          duration: 800,
          padding: 0.3,
          maxZoom: 0.8,
        })
      }, 300)
      return () => clearTimeout(timer)
    } else if (!highlightPath && nodes.length > 0) {
      // Find the most important node (entry point, or highest complexity fallback)
      let targetNode = nodes.find(n => n.data.isEntry)
      if (!targetNode) {
        targetNode = [...nodes].sort((a, b) => (b.data.complexity || 0) - (a.data.complexity || 0))[0]
      }
      
      if (targetNode) {
        const timer = setTimeout(() => {
          fitView({
            nodes: [{ id: targetNode.id }],
            duration: 1000,
            padding: 1, 
            maxZoom: 1.2,
          })
        }, 200)
        return () => clearTimeout(timer)
      }
    }
  }, [nodes, searchParams, fitView, owner, name])

  // ── filtered nodes + edges ─────────────────────────────────────────────────
  const filteredNodes = useMemo(() => {
    let n = nodes
    if (deadOnly && entryOnly) {
      // both active: show files that are dead AND entry (edge case, but handle it)
      n = n.filter(node => node.data.isDead && node.data.isEntry)
    } else if (deadOnly) {
      n = n.filter(node => node.data.isDead)
    } else if (entryOnly) {
      n = n.filter(node => node.data.isEntry)
    }

    const traceSet = new Set(tracePath)
    const highlightPath = searchParams.get('highlight')
    
    return n.map(node => {
      // Trace highlighting (blue)
      if (traceSet.has(node.id)) {
        return {
          ...node,
          style: { border: '2px solid #3b82f6', boxShadow: '0 0 8px #3b82f6' }
        }
      }
      // Blast radius highlighting (orange, more prominent)
      if (highlightPath === node.id) {
        return {
          ...node,
          selected: true,
          style: { 
            border: '3px solid #f97316', 
            boxShadow: '0 0 20px rgba(249,115,22,0.6)'
          }
        }
      }
      return node
    })
  }, [nodes, deadOnly, entryOnly, tracePath, searchParams])

  const filteredEdges = useMemo(() => {
    const nodeIds = new Set(filteredNodes.map(n => n.id))
    // Build a set of "source->target" pairs that are part of the trace path
    const traceEdgeSet = new Set()
    for (let i = 0; i < tracePath.length - 1; i++) {
      traceEdgeSet.add(`${tracePath[i]}->${tracePath[i + 1]}`)
    }
    return edges
      .filter(e => nodeIds.has(e.source) && nodeIds.has(e.target))
      .map(e => {
        const isTraced = traceEdgeSet.has(`${e.source}->${e.target}`)
        const isConnectedToSelected = selectedNode && (e.source === selectedNode.path || e.target === selectedNode.path)
        
        return isTraced
          ? { ...e, type: 'smoothstep', style: { stroke: '#3b82f6', strokeWidth: 2.5 }, animated: true }
          : isConnectedToSelected
          ? { ...e, type: 'smoothstep', style: { stroke: '#f97316', strokeWidth: 2.5 }, animated: true }
          : { ...e, type: 'smoothstep', style: { stroke: '#555', strokeWidth: 1.5, opacity: 0.6 }, animated: true }
      })
  }, [edges, filteredNodes, tracePath, selectedNode])

  // ── trace autocomplete suggestions ────────────────────────────────────────
  const traceSuggestions = useMemo(() => {
    const q = traceTarget.trim().toLowerCase()
    if (!q || q.length < 1) return []
    return rawFiles
      .filter(f => f.path !== selectedNode?.path)
      .filter(f => {
        const basename = f.path.split('/').pop().toLowerCase()
        return basename.includes(q) || f.path.toLowerCase().includes(q)
      })
      .slice(0, 8)
  }, [traceTarget, rawFiles, selectedNode])

  // ── trace ──────────────────────────────────────────────────────────────────
  async function handleTrace() {
    if (!selectedNode || !traceTarget.trim()) return
    setTracing(true)
    setTraceResult(null)
    setTracePath([])
    try {
      const res = await api.get(`/api/graph/${owner}/${name}/trace`, {
        params: { from: selectedNode.path, to: traceTarget.trim() },
      })
      if (res.data.found) {
        setTracePath(res.data.path)
        setTraceResult({ found: true, path: res.data.path })
      } else {
        setTraceResult({ found: false })
      }
    } catch { setTraceResult({ found: false }) }
    finally { setTracing(false) }
  }

  const onNodeClick = useCallback((_, node) => {
    setSelectedNode(node.data)
    setTracePath([])
    setTraceResult(null)
    setTraceTarget('')
    setTraceDropdownOpen(false)
  }, [])

  const onPaneClick = useCallback(() => {
    setSelectedNode(null)
    setTracePath([])
    setTraceResult(null)
  }, [])

  if (loading) return (
    <div className="w-full h-[calc(100vh-120px)] flex items-center justify-center">
      <div className="space-y-3 w-3/4">
        <Skeleton className="h-8 w-64 bg-[#1e1e1e]" />
        <Skeleton className="h-full w-full bg-[#1e1e1e] rounded-xl" style={{ height: 400 }} />
      </div>
    </div>
  )

  if (error) return (
    <div className="p-4 text-red-400 text-sm border border-red-500/30 bg-red-500/10 rounded-xl">
      {error}
    </div>
  )

  // Empty state — analysis ran but no edges were produced
  if (!loading && nodes.length === 0) return (
    <div className="w-full h-[calc(100vh-180px)] flex flex-col items-center justify-center gap-4 text-center">
      <div className="w-16 h-16 rounded-2xl bg-[#111] border border-[#222] flex items-center justify-center">
        <span className="text-3xl">🕸️</span>
      </div>
      <div>
        <p className="text-white font-semibold">No dependency data found</p>
        <p className="text-sm text-gray-500 mt-1">
          This repo may have no JS/TS files, or the analysis is still running.
        </p>
      </div>
    </div>
  )

  return (
    <div className="w-full h-[calc(100vh-120px)] relative">
      {/* ── Blast Radius context banner ─────────────────────────────────── */}
      {searchParams.get('highlight') && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 px-4 py-2 rounded-lg bg-orange-500/20 border border-orange-500/40 text-orange-300 text-xs font-medium flex items-center gap-3 shadow-lg">
          <Flame size={14} />
          <span>Viewing high-risk file from Blast Radius analysis</span>
          <button
            onClick={() => {
              const highlightPath = searchParams.get('highlight')
              if (highlightPath) {
                fitView({
                  nodes: [{ id: highlightPath }],
                  duration: 600,
                  padding: 0.3,
                  maxZoom: 0.8,
                })
              }
            }}
            className="ml-2 px-2 py-1 rounded bg-orange-500/30 hover:bg-orange-500/40 border border-orange-500/50 transition-colors text-orange-200 hover:text-orange-100"
          >
            Center View
          </button>
        </div>
      )}
      
      {/* ── Toolbar ────────────────────────────────────────────────────── */}
      <div className="absolute top-4 left-4 z-10 rounded-xl border border-[#222] bg-[#111]/90 backdrop-blur p-3 flex items-center gap-4 text-sm shadow-lg">
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <Switch
            checked={deadOnly}
            onCheckedChange={setDeadOnly}
            className="scale-75"
          />
          <span className="text-gray-300">Dead Files</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <Switch
            checked={entryOnly}
            onCheckedChange={setEntryOnly}
            className="scale-75"
          />
          <span className="text-gray-300">Entry Only</span>
        </label>
        <span className="text-gray-600 text-xs border-l border-[#333] pl-4">
          {filteredNodes.length} nodes · {filteredEdges.length} edges
        </span>
        <button
          onClick={() => fitView({ padding: 0.1, duration: 400 })}
          className="text-xs text-gray-400 hover:text-white border border-[#333] rounded px-2 py-1 transition-colors cursor-pointer"
        >
          Fit View
        </button>
        {/* Mobile panel toggle */}
        <button
          onClick={() => setPanelOpen(p => !p)}
          className="text-xs text-gray-400 hover:text-white border border-[#333] rounded px-2 py-1 transition-colors cursor-pointer md:hidden"
        >
          {panelOpen ? 'Hide Panel' : 'Panel'}
        </button>
      </div>

      {/* ── Right panel — hidden on mobile unless panelOpen ──────────── */}
      {selectedNode && panelOpen && (
        <div className="absolute right-0 top-0 h-full w-80 z-20 bg-[#0a0a0a]/80 backdrop-blur-xl border-l border-[#ffffff10] p-6 overflow-y-auto flex flex-col gap-6 shadow-2xl transition-all duration-300">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <p className="font-bold text-white text-base tracking-tight truncate pr-4">{selectedNode.label}</p>
              <button onClick={() => setSelectedNode(null)} className="text-gray-500 hover:text-white transition-colors cursor-pointer shrink-0">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
              </button>
            </div>
            <p className="text-[11px] text-gray-500 break-all font-mono leading-relaxed">{selectedNode.path}</p>
          </div>

          <div className="flex flex-wrap gap-2">
            {selectedNode.language && (
              <span className="text-[10px] px-2.5 py-1 rounded-md bg-[#ffffff08] border border-[#ffffff15] text-gray-300 font-medium uppercase tracking-wider">
                {selectedNode.language}
              </span>
            )}
            <span className="text-[10px] px-2.5 py-1 rounded-md bg-[#ffffff08] border border-[#ffffff15] text-gray-300 font-medium uppercase tracking-wider">
              complexity {selectedNode.complexity}
            </span>
            {selectedNode.isDead && (
              <span className="text-[10px] px-2.5 py-1 rounded-md bg-red-500/10 text-red-400 border border-red-500/20 font-medium uppercase tracking-wider">Dead</span>
            )}
            {selectedNode.isEntry && (
              <span className="text-[10px] px-2.5 py-1 rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/20 font-medium uppercase tracking-wider">Entry</span>
            )}
          </div>

          {/* ── Blast Radius Context ────────────────────────────────────── */}
          {blastRadiusData && (
            <>
              <div className="border-t border-[#222]" />
              <div className="space-y-3 rounded-lg bg-orange-500/5 border border-orange-500/20 p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Flame size={16} className="text-orange-400" />
                    <span className="text-xs font-semibold text-orange-300">Blast Radius Risk</span>
                  </div>
                  <span className={`text-2xl font-bold tabular-nums ${
                    blastRadiusData.score >= 60 ? 'text-red-400' : 
                    blastRadiusData.score >= 30 ? 'text-yellow-400' : 
                    'text-green-400'
                  }`}>
                    {blastRadiusData.score}
                  </span>
                </div>
                
                <p className="text-xs text-gray-400 leading-relaxed">
                  {blastRadiusData.reason}
                </p>
                
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-[#0a0a0a] rounded p-2 border border-[#222]">
                    <p className="text-[10px] text-gray-600 uppercase tracking-wide mb-0.5">Dependents</p>
                    <p className="text-sm font-semibold text-white">{blastRadiusData.dependentCount}</p>
                  </div>
                  <div className="bg-[#0a0a0a] rounded p-2 border border-[#222]">
                    <p className="text-[10px] text-gray-600 uppercase tracking-wide mb-0.5">Entry Points</p>
                    <p className="text-sm font-semibold text-white">{blastRadiusData.entryPointsAffected}</p>
                  </div>
                  <div className="bg-[#0a0a0a] rounded p-2 border border-[#222]">
                    <p className="text-[10px] text-gray-600 uppercase tracking-wide mb-0.5">Recent Commits</p>
                    <p className="text-sm font-semibold text-white">{blastRadiusData.commitFrequency}</p>
                  </div>
                  <div className="bg-[#0a0a0a] rounded p-2 border border-[#222]">
                    <p className="text-[10px] text-gray-600 uppercase tracking-wide mb-0.5">Risk Level</p>
                    <p className="text-sm font-semibold text-white capitalize">{blastRadiusData.riskLevel}</p>
                  </div>
                </div>
              </div>
            </>
          )}

          <div className="border-t border-[#ffffff10]" />

          {/* Trace */}
          <div className="space-y-3">
            <p className="text-xs font-semibold text-gray-300 tracking-wide">Trace Import Chain</p>
            <div className="relative" ref={traceInputRef}>
              <input
                type="text"
                placeholder="Type a filename to search..."
                value={traceTarget}
                onChange={e => {
                  setTraceTarget(e.target.value)
                  setTraceDropdownOpen(true)
                  setTraceResult(null)
                }}
                onFocus={() => setTraceDropdownOpen(true)}
                onBlur={() => setTimeout(() => setTraceDropdownOpen(false), 150)}
                className="w-full text-xs px-3 py-2 rounded-lg bg-[#ffffff05] border border-[#ffffff15] text-white placeholder:text-gray-600 focus:outline-none focus:border-[#444] focus:ring-1 focus:ring-[#444] transition-all"
              />
              {traceDropdownOpen && traceSuggestions.length > 0 && (
                <ul className="absolute z-50 left-0 right-0 mt-1 bg-[#1a1a1a] border border-[#333] rounded-lg overflow-hidden shadow-2xl max-h-48 overflow-y-auto">
                  {traceSuggestions.map(f => (
                    <li
                      key={f.path}
                      onMouseDown={() => {
                        setTraceTarget(f.path)
                        setTraceDropdownOpen(false)
                      }}
                      className="px-3 py-2 cursor-pointer hover:bg-[#252525] transition-colors"
                    >
                      <p className="text-xs text-white truncate font-medium">{f.path.split('/').pop()}</p>
                      <p className="text-[10px] text-gray-500 truncate mt-0.5 font-mono">{f.path}</p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <button
              onClick={handleTrace}
              disabled={tracing || !traceTarget.trim()}
              className="w-full py-2 rounded-lg bg-[#ffffff08] border border-[#ffffff15] text-xs font-medium text-gray-300
                         hover:text-white hover:bg-[#ffffff10] transition-colors cursor-pointer
                         disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
            >
              {tracing ? 'Tracing…' : 'Trace'}
            </button>

            {traceResult && (
              traceResult.found ? (
                <div className="space-y-1">
                  <p className="text-xs text-green-400">Path found ({traceResult.path.length} hops)</p>
                  <div className="font-mono text-[10px] space-y-0.5">
                    {traceResult.path.map((p, i) => {
                      const basename = p.split('/').pop()
                      return (
                        <div key={p} className="flex items-start gap-1">
                          {i > 0 && <span className="text-gray-600 mt-0.5 shrink-0">→</span>}
                          <button
                            title={p}
                            onClick={() => {
                              // select the node in the panel
                              const nodeData = rawFiles.find(f => f.path === p)
                              if (nodeData) setSelectedNode({
                                label: nodeData.name,
                                path: nodeData.path,
                                language: nodeData.language,
                                isDead: nodeData.isDead,
                                isEntry: nodeData.isEntry,
                                complexity: nodeData.complexityScore ?? 0,
                              })
                              // center the canvas on it
                              fitView({
                                nodes: [{ id: p }],
                                duration: 500,
                                padding: 0.5,
                              })
                            }}
                            className="text-left text-blue-400 hover:text-blue-300 hover:underline break-all cursor-pointer transition-colors"
                          >
                            {basename}
                          </button>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ) : (
                <p className="text-xs text-red-400">No connection found</p>
              )
            )}
          </div>

          <div className="border-t border-[#ffffff10]" />

          <button
            onClick={() => navigate(`/repo/${owner}/${name}/ai`)}
            className="py-2.5 rounded-lg bg-gradient-to-r from-[#1e1e1e] to-[#252525] border border-[#333] text-xs font-semibold text-gray-200
                       hover:text-white hover:border-[#555] hover:shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            ✨ Explain with AI
          </button>
        </div>
      )}

      {/* ── ReactFlow canvas ──────────────────────────────────────────── */}
      <ReactFlow
        nodes={filteredNodes}
        edges={filteredEdges.map(e => ({ ...e, type: 'smoothstep' }))}
        nodeTypes={NODE_TYPES}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        fitView
        fitViewOptions={{ padding: 0.2, maxZoom: 1.2, duration: 800 }}
        minZoom={0.1}
        maxZoom={3}
        defaultEdgeOptions={{ animated: true, type: 'smoothstep', style: { stroke: '#555', strokeWidth: 1.5 } }}
        style={{ background: '#0a0a0a' }}
        proOptions={{ hideAttribution: true }}
      >
        <Controls 
          className="bg-[#1e1e1e] border border-[#333] rounded-md shadow-xl overflow-hidden [&>button]:bg-[#1e1e1e] [&>button]:border-b [&>button]:border-[#333] [&>button:last-child]:border-0 [&>button:hover]:bg-[#2a2a2a] [&>button>svg]:fill-gray-300 [&>button:hover>svg]:fill-white" 
          showInteractive={false}
        />
        <MiniMap
          nodeColor={n => n.data?.isDead ? '#ef4444' : '#3b82f6'}
          maskColor="rgba(0,0,0,0.7)"
          style={{ background: '#111', border: '1px solid #333', borderRadius: '8px' }}
        />
        <Background color="#2a2a2a" gap={24} variant="dots" size={2} />
      </ReactFlow>
    </div>
  )
}

// ── exported wrapper with provider ───────────────────────────────────────────
export default function Graph() {
  return (
    <ReactFlowProvider>
      <GraphInner />
    </ReactFlowProvider>
  )
}
