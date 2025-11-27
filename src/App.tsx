import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Play, Pause, Activity, ArrowRight, TrendingUp, ZoomIn, ZoomOut, Maximize, Camera, Home, Download, Search, MoreVertical, EyeOff, Pin, ArrowUp, ArrowDown, FileText, X, Minimize2, Info } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, Legend, ComposedChart } from 'recharts';

// --- Constants & Configuration ---

const CITIES = [
  "Islamabad", "Lahore", "Karachi", "Peshawar", "Quetta",
  "Rawalpindi", "Multan", "Faisalabad", "Sialkot", "Gujranwala",
  "Sargodha", "Bahawalpur", "Sukkur", "Larkana", "Hyderabad",
  "Bannu", "Khuzdar"
];

// Generate months from March 2023 to Dec 2024
const MONTHS: string[] = [];
const startYear = 2023;
const startMonth = 3; // March
for (let y = startYear; y <= 2024; y++) {
  const start = y === 2023 ? startMonth : 1;
  const end = 12;
  for (let m = start; m <= end; m++) {
    MONTHS.push(`${y}-${String(m).padStart(2, '0')}`);
  }
}

// --- Data Simulation (Robust Mock) ---

const generateData = () => {
  const data: Record<string, number[][]> = {};

  MONTHS.forEach((month, t) => {
    const n = CITIES.length;
    const matrix: number[][] = Array(n).fill(0).map(() => Array(n).fill(0));

    // Time factor: Integration increases over time
    const integrationLevel = 0.3 + (t / MONTHS.length) * 0.4;

    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        // Base probability of connection based on "Region" (simulated by index proximity)
        const indexDist = Math.abs(i - j);
        let prob = 0.1;
        if (indexDist < 3) prob += 0.5; // Close indices = same region
        if (i < 5 && j < 5) prob += 0.3; // Major cities connect more

        if (Math.random() < prob * integrationLevel) {
          // Weight: 0.3 to 1.0
          const weight = 0.3 + Math.random() * 0.7;
          matrix[i][j] = weight;
          matrix[j][i] = weight;
        }
      }
    }
    data[month] = matrix;
  });
  return data;
};

// Pre-generate mock data to ensure consistency across renders if backend fails
const MOCK_DATA = generateData();

// --- Analytical Engine ---

const calculateCentrality = (matrix: number[][]) => {
  const n = matrix.length;
  const degree = Array(n).fill(0);
  const closeness = Array(n).fill(0);
  const betweenness = Array(n).fill(0);
  const eigenvector = Array(n).fill(1 / Math.sqrt(n));

  // 1. Degree Centrality (Weighted)
  for (let i = 0; i < n; i++) {
    let sum = 0;
    for (let j = 0; j < n; j++) {
      sum += matrix[i][j];
    }
    degree[i] = sum / (n - 1);
  }

  // 2. Closeness Centrality (Harmonic) & 3. Betweenness (Simplified Proxy)
  // Full Brandes is complex for this snippet, using simplified all-pairs shortest path (Floyd-Warshall) for small N=17
  const dist = Array(n).fill(0).map(() => Array(n).fill(Infinity));
  const next = Array(n).fill(0).map(() => Array(n).fill(-1));

  for (let i = 0; i < n; i++) {
    dist[i][i] = 0;
    for (let j = 0; j < n; j++) {
      if (matrix[i][j] > 0) {
        dist[i][j] = 1 / matrix[i][j]; // Distance = 1/Weight
        next[i][j] = j;
      }
    }
  }

  // Floyd-Warshall
  for (let k = 0; k < n; k++) {
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        if (dist[i][k] + dist[k][j] < dist[i][j]) {
          dist[i][j] = dist[i][k] + dist[k][j];
          next[i][j] = next[i][k];
        }
      }
    }
  }

  // Closeness
  for (let i = 0; i < n; i++) {
    let sumInv = 0;
    for (let j = 0; j < n; j++) {
      if (i !== j && dist[i][j] !== Infinity) {
        sumInv += 1 / dist[i][j];
      }
    }
    closeness[i] = sumInv / (n - 1);
  }

  // Betweenness (Proxy based on being on shortest paths)
  // Counting how many times 'k' appears on shortest path between i and j
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      if (i === j) continue;
      let curr = i;
      while (curr !== j && curr !== -1) {
        curr = next[curr][j];
        if (curr !== -1 && curr !== j) {
          betweenness[curr] += 1;
        }
      }
    }
  }
  // Normalize Betweenness
  const maxBet = Math.max(...betweenness) || 1;
  for (let i = 0; i < n; i++) betweenness[i] /= maxBet;


  // 4. Eigenvector Centrality (Power Iteration)
  for (let iter = 0; iter < 50; iter++) {
    const newEv = Array(n).fill(0);
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        newEv[i] += matrix[i][j] * eigenvector[j];
      }
    }
    let norm = 0;
    for (let v of newEv) norm += v * v;
    norm = Math.sqrt(norm);
    if (norm > 0) {
      for (let i = 0; i < n; i++) eigenvector[i] = newEv[i] / norm;
    }
  }

  return { degree, closeness, betweenness, eigenvector };
};

// --- Components ---

const Hero = ({ onStart, loading }: { onStart: () => void, loading: boolean }) => (
  <div className="relative min-h-screen w-full flex flex-col items-center justify-center overflow-hidden bg-[#020617]">
    {/* Background Layers - Strictly Z-0 */}
    <div className="absolute inset-0 z-0 pointer-events-none">
      <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-cyan-500/10 rounded-full blur-[120px] animate-pulse"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-violet-600/10 rounded-full blur-[120px] animate-pulse delay-1000"></div>
      {/* Abstract Grid */}
      <svg width="100%" height="100%" className="opacity-10">
        <defs>
          <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
            <path d="M 50 0 L 0 0 0 50" fill="none" stroke="cyan" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>
    </div>

    {/* Content - Strictly Z-10 */}
    <div className="relative z-10 text-center space-y-10 max-w-5xl px-6 flex flex-col items-center">
      <div className="inline-flex items-center gap-3 px-5 py-2 border border-cyan-500/30 rounded-full bg-cyan-950/30 backdrop-blur-sm text-cyan-400 text-xs font-mono tracking-[0.2em] uppercase animate-fade-in shadow-[0_0_15px_rgba(6,182,212,0.2)]">
        <span className={`w-2 h-2 rounded-full ${loading ? 'bg-yellow-400' : 'bg-cyan-400'} animate-ping`}></span>
        {loading ? 'INITIALIZING PROTOCOLS...' : 'SYSTEM ONLINE // OBSERVATORY ACTIVE'}
      </div>

      <h1 className="text-6xl md:text-8xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white via-cyan-100 to-slate-500 drop-shadow-[0_0_40px_rgba(6,182,212,0.2)]">
        PAKISTAN ECONOMIC<br />OBSERVATORY
      </h1>

      <p className="text-xl md:text-2xl text-slate-400 font-light tracking-wide max-w-3xl mx-auto border-l-4 border-cyan-500/50 pl-8 text-left">
        Discrete Structure Analysis of Market Integration &<br />
        <span className="text-cyan-400 font-medium">Temporal Price Dynamics</span>
      </p>

      <div className="pt-12">
        <button
          onClick={onStart}
          disabled={loading}
          className={`group relative px-12 py-5 bg-cyan-950/40 border border-cyan-500/50 text-cyan-300 font-mono text-lg tracking-wider rounded-sm overflow-hidden transition-all duration-300 ${loading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-cyan-900/40 hover:border-cyan-400 hover:shadow-[0_0_30px_rgba(34,211,238,0.3)]'}`}
        >
          <span className="relative z-10 flex items-center gap-4">
            {loading ? 'LOADING DATA...' : 'INITIALIZE DASHBOARD'} <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </span>
          {!loading && <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 to-transparent translate-x-[-100%] group-hover:translate-x-0 transition-transform duration-500"></div>}
        </button>
      </div>
    </div>
  </div>
);

const ForceGraph = ({ matrix, nodes, threshold = 0, explanation }: { matrix: number[][], nodes: string[], threshold?: number, explanation?: string }) => {


  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Transform State
  const [transform, setTransform] = useState({ x: 0, y: 0, k: 1 });
  const [isDragging, setIsDragging] = useState(false);
  const [lastPos, setLastPos] = useState({ x: 0, y: 0 });

  // Initial positions centered
  const [positions, _setPositions] = useState(() =>
    nodes.map(() => ({
      x: 400 + (Math.random() - 0.5) * 200,
      y: 300 + (Math.random() - 0.5) * 200,
      vx: 0,
      vy: 0
    }))
  );

  // Handlers
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const scaleAmount = -e.deltaY * 0.001;
    const newScale = Math.max(0.1, Math.min(5, transform.k * (1 + scaleAmount)));
    setTransform(prev => ({ ...prev, k: newScale }));
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setLastPos({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const dx = e.clientX - lastPos.x;
    const dy = e.clientY - lastPos.y;
    setTransform(prev => ({ ...prev, x: prev.x + dx, y: prev.y + dy }));
    setLastPos({ x: e.clientX, y: e.clientY });
  };

  const handleMouseUp = () => setIsDragging(false);

  const handleZoomIn = () => setTransform(prev => ({ ...prev, k: Math.min(5, prev.k * 1.2) }));
  const handleZoomOut = () => setTransform(prev => ({ ...prev, k: Math.max(0.1, prev.k / 1.2) }));
  const handleReset = () => setTransform({ x: 0, y: 0, k: 1 });
  const handleFit = () => {
    // Simple fit logic: reset for now, could calculate bounding box
    setTransform({ x: 0, y: 0, k: 0.8 });
  };
  const handleScreenshot = () => {
    if (canvasRef.current) {
      const link = document.createElement('a');
      link.download = 'network_topology.png';
      link.href = canvasRef.current.toDataURL();
      link.click();
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container || !matrix) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeObserver = new ResizeObserver(() => {
      const dpr = window.devicePixelRatio || 1;
      const rect = container.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
    });
    resizeObserver.observe(container);

    let animationFrameId: number;

    const render = () => {
      const width = container.clientWidth;
      const height = container.clientHeight;
      const dpr = window.devicePixelRatio || 1;

      // Physics Update (Independent of View)
      // ... (Physics logic same as before) ...
      const k = 0.05;
      const repulsion = 8000;
      const damping = 0.6;
      const centerForce = 0.02;
      const padding = 40;

      for (let i = 0; i < nodes.length; i++) {
        let fx = 0, fy = 0;
        for (let j = 0; j < nodes.length; j++) {
          if (i === j) continue;
          const dx = positions[i].x - positions[j].x;
          const dy = positions[i].y - positions[j].y;
          const distSq = dx * dx + dy * dy + 1;
          const force = repulsion / distSq;
          const angle = Math.atan2(dy, dx);
          fx += Math.cos(angle) * force;
          fy += Math.sin(angle) * force;
        }
        for (let j = 0; j < nodes.length; j++) {
          if (matrix[i][j] > threshold) { // Apply Threshold
            const dx = positions[j].x - positions[i].x;
            const dy = positions[j].y - positions[i].y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const force = (dist - 150) * k * matrix[i][j];
            const angle = Math.atan2(dy, dx);
            fx += Math.cos(angle) * force;
            fy += Math.sin(angle) * force;
          }
        }
        const dx = width / 2 - positions[i].x;
        const dy = height / 2 - positions[i].y;
        fx += dx * centerForce;
        fy += dy * centerForce;

        positions[i].vx = (positions[i].vx + fx) * damping;
        positions[i].vy = (positions[i].vy + fy) * damping;
        positions[i].x += positions[i].vx;
        positions[i].y += positions[i].vy;
        positions[i].x = Math.max(padding, Math.min(width - padding, positions[i].x));
        positions[i].y = Math.max(padding, Math.min(height - padding, positions[i].y));
      }

      // Draw
      ctx.save();
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.scale(dpr, dpr); // Handle high DPI

      // Apply View Transform
      ctx.translate(width / 2, height / 2); // Center origin
      ctx.translate(transform.x, transform.y); // Pan
      ctx.scale(transform.k, transform.k); // Zoom
      ctx.translate(-width / 2, -height / 2); // Reset origin

      // Edges
      ctx.lineWidth = 1 / transform.k; // Keep lines thin
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          if (matrix[i][j] > threshold) { // Apply Threshold
            ctx.beginPath();
            ctx.moveTo(positions[i].x, positions[i].y);
            ctx.lineTo(positions[j].x, positions[j].y);
            ctx.strokeStyle = `rgba(34, 211, 238, ${matrix[i][j] * 0.8})`;
            ctx.stroke();
          }
        }
      }

      // Nodes
      for (let i = 0; i < nodes.length; i++) {
        ctx.beginPath();
        ctx.arc(positions[i].x, positions[i].y, 6 / transform.k, 0, Math.PI * 2); // Keep nodes consistent size
        ctx.fillStyle = '#020617';
        ctx.fill();
        ctx.strokeStyle = '#22d3ee';
        ctx.lineWidth = 2 / transform.k;
        ctx.stroke();

        // Label
        if (transform.k > 0.5) { // Hide labels if zoomed out too far
          const label = nodes[i];
          ctx.font = `${10 / transform.k}px monospace`;
          const textWidth = ctx.measureText(label).width;
          ctx.fillStyle = 'rgba(2, 6, 23, 0.7)';
          ctx.fillRect(positions[i].x + 10 / transform.k, positions[i].y - 8 / transform.k, textWidth + 4 / transform.k, 14 / transform.k);
          ctx.fillStyle = '#94a3b8';
          ctx.fillText(label, positions[i].x + 12 / transform.k, positions[i].y + 2 / transform.k);
        }
      }

      ctx.restore();
      animationFrameId = requestAnimationFrame(render);
    };

    render();
    return () => {
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
    };
  }, [matrix, nodes, positions, transform]);

  return (
    <DashboardSection title="Network Topology" className="h-full" explanation={explanation}>
      <div ref={containerRef} className="w-full h-full relative group overflow-hidden">
        <canvas
          ref={canvasRef}
          className="block w-full h-full cursor-move"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onWheel={handleWheel}
        />

        {/* Toolbar */}
        <div className="absolute bottom-6 right-6 flex flex-col gap-2 bg-slate-900/80 backdrop-blur border border-white/10 p-2 rounded-lg shadow-xl translate-y-20 group-hover:translate-y-0 transition-transform duration-300">
          <button onClick={handleZoomIn} className="p-2 hover:bg-white/10 rounded text-cyan-400" title="Zoom In"><ZoomIn size={20} /></button>
          <button onClick={handleZoomOut} className="p-2 hover:bg-white/10 rounded text-cyan-400" title="Zoom Out"><ZoomOut size={20} /></button>
          <button onClick={handleFit} className="p-2 hover:bg-white/10 rounded text-cyan-400" title="Fit View"><Maximize size={20} /></button>
          <button onClick={handleReset} className="p-2 hover:bg-white/10 rounded text-cyan-400" title="Reset"><Home size={20} /></button>
          <div className="h-px bg-white/10 my-1"></div>
          <button onClick={handleScreenshot} className="p-2 hover:bg-white/10 rounded text-cyan-400" title="Screenshot"><Camera size={20} /></button>
        </div>
      </div>
    </DashboardSection>
  );
};

// --- Advanced UI Components ---

const SectionToolbar = ({
  onDownload,
  onFullscreen,
  searchQuery,
  setSearchQuery
}: {
  onDownload?: () => void,
  onFullscreen?: () => void,
  searchQuery?: string,
  setSearchQuery?: (q: string) => void
}) => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  return (
    <div className="flex items-center gap-2 bg-slate-900/50 p-1 rounded-lg border border-white/10 backdrop-blur-sm">
      {setSearchQuery && (
        <div className={`flex items-center transition-all duration-300 ${isSearchOpen ? 'w-48 px-2' : 'w-8 justify-center'}`}>
          {isSearchOpen ? (
            <>
              <Search size={14} className="text-slate-400 mr-2 shrink-0" />
              <input
                autoFocus
                type="text"
                placeholder="Search..."
                className="bg-transparent border-none outline-none text-xs text-white w-full placeholder:text-slate-600"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onBlur={() => !searchQuery && setIsSearchOpen(false)}
              />
              <button onClick={() => { setSearchQuery(''); setIsSearchOpen(false); }} className="ml-1 text-slate-500 hover:text-white"><X size={12} /></button>
            </>
          ) : (
            <button onClick={() => setIsSearchOpen(true)} className="p-1.5 text-slate-400 hover:text-cyan-400 transition-colors">
              <Search size={16} />
            </button>
          )}
        </div>
      )}

      {onDownload && (
        <>
          <div className="w-px h-4 bg-white/10 mx-1"></div>
          <button onClick={onDownload} className="p-1.5 text-slate-400 hover:text-cyan-400 hover:bg-white/5 rounded transition-colors" title="Download">
            <Download size={16} />
          </button>
        </>
      )}

      {onFullscreen && (
        <button onClick={onFullscreen} className="p-1.5 text-slate-400 hover:text-cyan-400 hover:bg-white/5 rounded transition-colors" title="Fullscreen">
          <Maximize size={16} />
        </button>
      )}
    </div>
  );
};

const LiveHeatMap = ({ matrix, nodes, explanation }: { matrix: number[][], nodes: string[], explanation?: string }) => {
  const [hoveredCell, setHoveredCell] = useState<{ i: number, j: number } | null>(null);

  // Spectral Gradient (Blue -> Cyan -> Green -> Yellow -> Red)
  const getHeatMapColor = (value: number) => {
    if (value === 0) return '#0f172a'; // Background
    const hue = 240 - (value * 240); // 240 (Blue) -> 0 (Red)
    return `hsl(${hue}, 90%, 50%)`;
  };

  return (
    <DashboardSection title="Live Heat Map Visualization" className="h-full" explanation={explanation}>
      <div className="flex flex-col items-center justify-center h-full p-4">
        <div className="relative overflow-auto custom-scrollbar max-w-full max-h-full bg-[#020617] p-4 rounded-xl border border-white/5">
          <div
            className="grid gap-px bg-slate-800/50" // Gap for grid lines
            style={{
              gridTemplateColumns: `auto repeat(${nodes.length}, minmax(32px, 1fr))`, // Slightly larger cells
            }}
          >
            {/* Top Left Empty (Placeholder for alignment if needed, but we are moving labels to bottom) */}
            {/* Actually, if we move labels to bottom, we just need the rows first */}

            {/* Rows */}
            {nodes.map((rowNode, i) => (
              <React.Fragment key={`row-${i}`}>
                {/* Y Axis Label */}
                <div className="sticky left-0 z-10 bg-[#020617] py-1 px-3 flex items-center justify-end">
                  <span className="text-[10px] font-medium text-slate-400 whitespace-nowrap">
                    {rowNode}
                  </span>
                </div>

                {/* Cells */}
                {nodes.map((colNode, j) => {
                  const val = matrix[i][j];
                  const isHovered = hoveredCell?.i === i && hoveredCell?.j === j;

                  return (
                    <div
                      key={`${i}-${j}`}
                      className="w-8 h-8 relative group transition-colors duration-200"
                      onMouseEnter={() => setHoveredCell({ i, j })}
                      onMouseLeave={() => setHoveredCell(null)}
                      style={{ backgroundColor: getHeatMapColor(val) }}
                    >
                      {isHovered && (
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-slate-900 text-white text-xs p-2 rounded shadow-xl z-50 whitespace-nowrap border border-white/10 pointer-events-none">
                          <div className="font-bold">{rowNode} ↔ {colNode}</div>
                          <div className="text-cyan-400">Correlation: {val.toFixed(3)}</div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </React.Fragment>
            ))}

            {/* Bottom Left Empty */}
            <div className="sticky bottom-0 left-0 z-20 bg-[#020617]"></div>

            {/* X Axis Labels (Bottom) */}
            {nodes.map((node, i) => (
              <div key={`x-${i}`} className="sticky bottom-0 z-10 bg-[#020617] pt-2 pb-6 flex items-start justify-center h-32">
                <span className="text-[10px] font-medium text-slate-400 -rotate-90 whitespace-nowrap origin-top translate-y-2">
                  {node}
                </span>
              </div>
            ))}

          </div>
        </div>

        {/* Legend */}
        <div className="mt-6 flex items-center gap-4 bg-slate-900/50 p-2 rounded-full border border-white/10">
          <span className="text-xs text-slate-400">Low (0.0)</span>
          <div className="w-48 h-2 rounded-full bg-gradient-to-r from-blue-600 via-green-500 to-red-600"></div>
          <span className="text-xs text-slate-400">High (1.0)</span>
        </div>
      </div>
    </DashboardSection>
  );
};

const ExplanationModal = ({ title, content, onClose }: { title: string, content: string, onClose: () => void }) => {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#0f172a] border border-cyan-500/30 rounded-xl shadow-2xl max-w-2xl w-full overflow-hidden animate-scale-in">
        <div className="p-6 border-b border-white/10 flex justify-between items-center bg-[#020617]">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <Info className="text-cyan-400" /> {title}
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>
        <div className="p-6 text-slate-300 space-y-4 leading-relaxed">
          <ReactMarkdown>{content}</ReactMarkdown>
        </div>
      </div>
    </div>
  );
};

const DashboardSection = ({
  title,
  children,
  className = "",
  onDownload,
  searchQuery,
  setSearchQuery,
  explanation
}: {
  title: string,
  children: React.ReactNode,
  className?: string,
  onDownload?: () => void,
  searchQuery?: string,
  setSearchQuery?: (q: string) => void,
  explanation?: string
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);

  return (
    <div className={`bg-[#020617] border border-white/10 rounded-xl overflow-hidden flex flex-col transition-all duration-500 ${isFullscreen ? 'fixed inset-0 z-50' : 'relative'} ${className}`}>
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-white/5 backdrop-blur-sm">
        <h2 className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-violet-400 tracking-wider uppercase font-mono">
          {title}
        </h2>
        <div className="flex items-center gap-2">
          {explanation && (
            <button
              onClick={() => setShowExplanation(true)}
              className="p-1.5 text-slate-400 hover:text-cyan-400 transition-colors mr-2"
              title="Show Explanation"
            >
              <Info size={18} />
            </button>
          )}
          <SectionToolbar
            onDownload={onDownload}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            onFullscreen={() => setIsFullscreen(!isFullscreen)}
          />
          {isFullscreen && (
            <button onClick={() => setIsFullscreen(false)} className="p-1.5 text-slate-400 hover:text-red-400 transition-colors ml-2">
              <Minimize2 size={16} />
            </button>
          )}
        </div>
      </div>
      <div className="flex-1 overflow-hidden relative p-4">
        {children}
      </div>

      {showExplanation && explanation && (
        <ExplanationModal
          title={`About: ${title}`}
          content={explanation}
          onClose={() => setShowExplanation(false)}
        />
      )}
    </div>
  );
};

const ColumnHeader = ({
  label,
  field,
  sortConfig,
  onSort,
  onPin,
  onHide,
  onAutosize,
  isPinned
}: {
  label: string,
  field: string,
  sortConfig: { key: string, direction: 'asc' | 'desc' } | null,
  onSort: (key: string, dir: 'asc' | 'desc') => void,
  onPin: (key: string) => void,
  onHide: (key: string) => void,
  onAutosize: (key: string) => void,
  isPinned: boolean
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <th className={`p-0 relative group ${isPinned ? 'sticky left-0 z-20 bg-[#020617] shadow-[2px_0_5px_rgba(0,0,0,0.5)]' : ''}`}>
      <div className="flex items-center justify-between p-4 border-b border-white/10 bg-white/5 hover:bg-white/10 transition-colors">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-white uppercase tracking-wider">{label}</span>
          {sortConfig?.key === field && (
            sortConfig.direction === 'asc' ? <ArrowUp size={12} className="text-cyan-400" /> : <ArrowDown size={12} className="text-cyan-400" />
          )}
          {isPinned && <Pin size={12} className="text-cyan-400 rotate-45" />}
        </div>

        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`opacity-0 group-hover:opacity-100 p-1 hover:bg-white/10 rounded ${isOpen ? 'opacity-100 bg-white/10' : ''}`}
        >
          <MoreVertical size={14} className="text-slate-400" />
        </button>
      </div>

      {isOpen && (
        <div ref={menuRef} className="absolute top-full right-0 mt-1 w-48 bg-[#0f172a] border border-white/10 rounded shadow-xl z-50 flex flex-col py-1 text-xs font-mono text-slate-300">
          <div className="px-3 py-2 border-b border-white/10 font-bold text-slate-500 flex items-center gap-2">
            <FileText size={12} /> {label}
          </div>

          <button onClick={() => { onSort(field, 'asc'); setIsOpen(false); }} className="px-3 py-2 hover:bg-cyan-900/30 hover:text-cyan-400 text-left flex items-center gap-2">
            <ArrowUp size={14} /> Sort Ascending
          </button>
          <button onClick={() => { onSort(field, 'desc'); setIsOpen(false); }} className="px-3 py-2 hover:bg-cyan-900/30 hover:text-cyan-400 text-left flex items-center gap-2">
            <ArrowDown size={14} /> Sort Descending
          </button>

          <div className="h-px bg-white/10 my-1"></div>

          <button onClick={() => { onAutosize(field); setIsOpen(false); }} className="px-3 py-2 hover:bg-cyan-900/30 hover:text-cyan-400 text-left flex items-center gap-2">
            <span>↔</span> Autosize
          </button>
          <button onClick={() => { onPin(field); setIsOpen(false); }} className="px-3 py-2 hover:bg-cyan-900/30 hover:text-cyan-400 text-left flex items-center gap-2">
            <Pin size={14} /> {isPinned ? 'Unpin Column' : 'Pin Column'}
          </button>
          <button onClick={() => { onHide(field); setIsOpen(false); }} className="px-3 py-2 hover:bg-cyan-900/30 hover:text-cyan-400 text-left flex items-center gap-2">
            <EyeOff size={14} /> Hide Column
          </button>
        </div>
      )}
    </th>
  );
};

const CityCentralityMatrix = ({ data, explanation }: { data: any[], explanation?: string }) => {
  const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' } | null>({ key: 'Composite', direction: 'desc' });
  const [pinnedColumns, setPinnedColumns] = useState<string[]>(['name']);
  const [hiddenColumns, setHiddenColumns] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Columns Config
  const columns = [
    { key: 'name', label: 'City' },
    { key: 'Degree', label: 'Degree' },
    { key: 'Closeness', label: 'Closeness' },
    { key: 'Betweenness', label: 'Betweenness' },
    { key: 'Eigenvector', label: 'Eigenvector' },
    { key: 'Composite', label: 'Composite' },
  ];

  // Filter & Sort
  const processedData = useMemo(() => {
    let filtered = data.filter(row =>
      row.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (sortConfig) {
      filtered.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === 'asc' ? -1 : 1;
        if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return filtered;
  }, [data, sortConfig, searchQuery]);

  // Handlers
  const handleSort = (key: string, direction: 'asc' | 'desc') => setSortConfig({ key, direction });
  const handlePin = (key: string) => {
    setPinnedColumns(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]);
  };
  const handleHide = (key: string) => setHiddenColumns(prev => [...prev, key]);
  const handleAutosize = (key: string) => { console.log('Autosize', key); };

  const handleDownload = () => {
    const csvContent = "data:text/csv;charset=utf-8,"
      + columns.map(c => c.label).join(",") + "\n"
      + processedData.map(row => columns.map(c => row[c.key]).join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "centrality_data.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <DashboardSection
      title="City Centrality Matrix"
      onDownload={handleDownload}
      searchQuery={searchQuery}
      setSearchQuery={setSearchQuery}
      className="h-full"
      explanation={explanation}
    >
      <div className="overflow-auto h-full custom-scrollbar relative">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr>
              {columns.map(col => {
                if (hiddenColumns.includes(col.key)) return null;
                return (
                  <ColumnHeader
                    key={col.key}
                    label={col.label}
                    field={col.key}
                    sortConfig={sortConfig}
                    onSort={handleSort}
                    onPin={handlePin}
                    onHide={handleHide}
                    onAutosize={handleAutosize}
                    isPinned={pinnedColumns.includes(col.key)}
                  />
                );
              })}
            </tr>
          </thead>
          <tbody className="text-sm font-mono">
            {processedData.map((row) => (
              <tr key={row.name} className="border-b border-white/5 hover:bg-white/5 transition-colors group">
                {columns.map(col => {
                  if (hiddenColumns.includes(col.key)) return null;
                  const isPinned = pinnedColumns.includes(col.key);
                  const val = row[col.key];
                  const isNumber = typeof val === 'number';
                  const color = isNumber ? `hsl(${200 - (val * 150)}, 80%, 50%)` : '#ffffff'; // Changed to pure white

                  return (
                    <td
                      key={col.key}
                      className={`p-4 ${isNumber ? 'text-right' : ''} ${isPinned ? 'sticky left-0 bg-[#020617] group-hover:bg-[#0f172a] shadow-[2px_0_5px_rgba(0,0,0,0.5)]' : ''}`}
                    >
                      <span style={{ color: col.key === 'name' ? '#ffffff' : color, fontWeight: col.key === 'name' ? 600 : 400 }}>
                        {isNumber ? val.toFixed(3) : val}
                      </span>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </DashboardSection>
  );
};

const CompositeScoreRanking = ({ data, explanation }: { data: any[], explanation?: string }) => {
  const handleDownload = () => {
    // Simple CSV export for chart data
    const csvContent = "data:text/csv;charset=utf-8,"
      + "City,Composite Score\n"
      + data.map(row => `${row.name},${row.Composite}`).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "composite_ranking.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <DashboardSection title="Composite Score Ranking" onDownload={handleDownload} className="h-full" explanation={explanation}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ left: 40, right: 30, top: 20, bottom: 20 }}>
          <XAxis type="number" hide />
          <YAxis dataKey="name" type="category" width={100} tick={{ fill: '#94a3b8', fontSize: 12, fontFamily: 'monospace' }} />
          <Tooltip
            cursor={{ fill: 'rgba(255,255,255,0.05)' }}
            contentStyle={{ backgroundColor: '#020617', borderColor: '#1e293b', color: '#f1f5f9' }}
          />
          <Bar dataKey="Composite" barSize={16}>
            {data.map((_, index) => (
              <Cell key={`cell-${index}`} fill={`url(#neonGreenGradient)`} />
            ))}
          </Bar>
          <defs>
            <linearGradient id="neonGreenGradient" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#84cc16" />
              <stop offset="100%" stopColor="#bef264" />
            </linearGradient>
          </defs>
        </BarChart>
      </ResponsiveContainer>
    </DashboardSection>
  );
};

const TemporalHasseDiagram = ({ months, activeIndex, matrix, explanation }: { months: string[], activeIndex: number, matrix: number[][], explanation?: string }) => {

  const properties = useMemo(() => {
    if (!matrix || matrix.length === 0) return { reflexive: 'N/A', antisymmetric: 'N/A', transitive: 'N/A' };

    const n = matrix.length;
    let isReflexive = true;
    let isAntisymmetric = true;
    let isTransitive = true;

    // Check Reflexive: M[i][i] should be non-zero (or 1, depending on definition, assuming non-zero for now)
    for (let i = 0; i < n; i++) {
      if (matrix[i][i] === 0) {
        isReflexive = false;
        break;
      }
    }

    // Check Antisymmetric: If M[i][j] > 0 and M[j][i] > 0, then i == j
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        if (i !== j && matrix[i][j] > 0 && matrix[j][i] > 0) {
          isAntisymmetric = false;
          break;
        }
      }
      if (!isAntisymmetric) break;
    }

    // Check Transitive: If M[i][j] > 0 and M[j][k] > 0, then M[i][k] > 0
    // This can be expensive O(n^3), but n is small (cities ~20)
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        if (matrix[i][j] > 0) {
          for (let k = 0; k < n; k++) {
            if (matrix[j][k] > 0 && matrix[i][k] === 0) {
              isTransitive = false;
              break;
            }
          }
        }
        if (!isTransitive) break;
      }
      if (!isTransitive) break;
    }

    return {
      reflexive: isReflexive ? 'YES' : 'NO',
      antisymmetric: isAntisymmetric ? 'YES' : 'NO',
      transitive: isTransitive ? 'YES' : 'NO'
    };
  }, [matrix]);

  return (
    <DashboardSection title="Temporal Relation (Hasse)" className="h-full" explanation={explanation}>
      <div className="absolute top-4 right-4 p-3 bg-black/40 backdrop-blur rounded border border-white/10 text-xs font-mono text-slate-400 space-y-1 z-20">
        <div className="flex justify-between gap-4"><span>Reflexive:</span> <span className={properties.reflexive === 'YES' ? "text-cyan-400" : "text-red-400"}>{properties.reflexive}</span></div>
        <div className="flex justify-between gap-4"><span>Antisymmetric:</span> <span className={properties.antisymmetric === 'YES' ? "text-cyan-400" : "text-red-400"}>{properties.antisymmetric}</span></div>
        <div className="flex justify-between gap-4"><span>Transitive:</span> <span className={properties.transitive === 'YES' ? "text-cyan-400" : "text-red-400"}>{properties.transitive}</span></div>
      </div>

      <div className="flex-1 overflow-x-auto custom-scrollbar flex items-center gap-8 px-8">
        {months.map((m, i) => {
          const isActive = i === activeIndex;
          const isPast = i < activeIndex;
          return (
            <div key={m} className="flex flex-col items-center relative z-10 min-w-[80px]">
              {i > 0 && <div className={`absolute top-1/2 right-[50%] w-8 h-0.5 -translate-y-1/2 translate-x-[-50%] ${isPast ? 'bg-cyan-500/50' : 'bg-slate-800'}`}></div>}
              <div
                className={`
                  px-4 py-3 rounded border font-mono text-sm transition-all duration-500 whitespace-nowrap
                  ${isActive ? 'bg-cyan-950/80 border-cyan-400 text-cyan-300 shadow-[0_0_15px_rgba(34,211,238,0.3)] scale-110' :
                    isPast ? 'bg-cyan-950/20 border-cyan-500/30 text-cyan-600' : 'bg-slate-900 border-slate-800 text-slate-600'}
                `}
              >
                {m}
              </div>
            </div>
          );
        })}
      </div>
    </DashboardSection>
  );
};

const ComparativeAnalysis = ({ data, explanation }: { data: any[], explanation?: string }) => {
  // Top 5 Contrast
  const top5 = data.slice(0, 5);

  return (
    <DashboardSection title="Comparative Analysis" className="h-full" explanation={explanation}>
      <div className="h-full flex flex-col">
        <h3 className="text-sm font-mono text-slate-400 mb-4 flex items-center gap-2 uppercase">
          <TrendingUp size={16} /> Top 5 Contrast (Degree vs Eigenvector)
        </h3>
        <div className="flex-1 min-h-0">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={top5} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
              <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 12 }} />
              <YAxis tick={{ fill: '#64748b', fontSize: 12 }} />
              <Tooltip contentStyle={{ backgroundColor: '#020617', borderColor: '#1e293b' }} />
              <Legend />
              <Bar dataKey="Degree" fill="#22d3ee" barSize={30} />
              <Bar dataKey="Eigenvector" fill="#f472b6" barSize={30} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>
    </DashboardSection>
  );
};


// --- Configuration Sidebar ---

const ConfigurationSidebar = ({
  selectedCategory,
  setSelectedCategory,
  timeIndex,
  setTimeIndex,
  maxTime,
  months,
  similarityThreshold,
  setSimilarityThreshold,
  weightingMethod,
  setWeightingMethod,
  currentSimilarityStats,
  customWeights,
  setCustomWeights,
  isOpen,
  onToggle
}: {
  selectedCategory: string,
  setSelectedCategory: (c: string) => void,
  timeIndex: number,
  setTimeIndex: (t: number) => void,
  maxTime: number,
  months: string[],
  similarityThreshold: number,
  setSimilarityThreshold: (t: number) => void,
  weightingMethod: string,
  setWeightingMethod: (m: string) => void,
  currentSimilarityStats: { min: number, max: number, avg: number },
  customWeights?: { degree: number, closeness: number, betweenness: number, eigenvector: number },
  setCustomWeights?: (w: any) => void,
  isOpen: boolean,
  onToggle: () => void
}) => {
  const categories = [
    "1. Food Staples & Grains",
    "2. Meat, Poultry & Dairy",
    "3. Oils, Condiments & Sweeteners",
    "4. Fruits & Vegetables",
    "5. Non-Food Essentials",
    "6. Utilities & Transport",
    "7. Clothing & Miscellaneous"
  ];

  const weightingMethods = [
    "Equal Weighting",
    "Correlation-Based",
    "Entropy-Based",
    "Category Importance",
    "Interactive"
  ];

  const handleWeightChange = (key: string, value: number) => {
    if (setCustomWeights && customWeights) {
      setCustomWeights({ ...customWeights, [key]: value });
    }
  };

  return (
    <>
      {/* Collapsed Toggle Button */}
      <button
        onClick={onToggle}
        className={`fixed left-4 top-4 z-50 p-2 bg-cyan-950/80 text-cyan-400 rounded-lg border border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.2)] hover:bg-cyan-900 transition-all duration-300 ${isOpen ? 'opacity-0 pointer-events-none -translate-x-10' : 'opacity-100 translate-x-0'}`}
      >
        <MoreVertical size={20} />
      </button>

      {/* Sidebar */}
      <div className={`fixed left-0 top-0 h-screen w-80 bg-[#0f172a] border-r border-white/10 flex flex-col z-40 shadow-2xl transition-transform duration-300 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6 border-b border-white/10 bg-[#020617] flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Activity className="text-cyan-400" /> Configuration
            </h2>
            <p className="text-xs text-slate-500 mt-1">Adjust visualization parameters</p>
          </div>
          <button onClick={onToggle} className="text-slate-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 flex flex-col gap-8 overflow-y-auto custom-scrollbar flex-1">

          {/* Category Selection */}
          <div className="flex flex-col gap-3">
            <label className="text-sm font-semibold text-slate-300">Select Product Category</label>
            <div className="relative">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg px-4 py-3 appearance-none focus:outline-none focus:border-cyan-500 transition-colors cursor-pointer"
              >
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                <ArrowDown size={14} />
              </div>
            </div>
          </div>

          {/* Time Step Slider */}
          <div className="flex flex-col gap-3">
            <div className="flex justify-between items-end">
              <label className="text-sm font-semibold text-slate-300">Select Time Step</label>
              <span className="text-xs font-mono text-cyan-400">{months[timeIndex] || 'Loading...'}</span>
            </div>
            <input
              type="range"
              min="0"
              max={maxTime}
              value={timeIndex}
              onChange={(e) => setTimeIndex(parseInt(e.target.value))}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-mono">
              <span>{months[0]}</span>
              <span>{months[months.length - 1]}</span>
            </div>
          </div>

          {/* Similarity Threshold */}
          <div className="flex flex-col gap-3">
            <div className="flex justify-between items-end">
              <label className="text-sm font-semibold text-slate-300">Similarity Threshold</label>
              <span className="text-xs font-mono text-cyan-400">{similarityThreshold.toFixed(3)}</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.001"
              value={similarityThreshold}
              onChange={(e) => setSimilarityThreshold(parseFloat(e.target.value))}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-red-500"
            />
            <p className="text-xs text-slate-500">Filter edges below this correlation value.</p>
          </div>

          {/* Weighting Technique */}
          <div className="flex flex-col gap-3">
            <label className="text-sm font-semibold text-slate-300">Composite Score Weighting</label>
            <div className="relative">
              <select
                value={weightingMethod}
                onChange={(e) => setWeightingMethod(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg px-4 py-3 appearance-none focus:outline-none focus:border-cyan-500 transition-colors cursor-pointer"
              >
                {weightingMethods.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                <ArrowDown size={14} />
              </div>
            </div>

            {/* Interactive Sliders */}
            {weightingMethod === "Interactive" && customWeights && (
              <div className="mt-2 space-y-3 bg-slate-900/50 p-3 rounded-lg border border-white/5 animate-fade-in">
                {Object.entries(customWeights).map(([key, val]) => (
                  <div key={key} className="space-y-1">
                    <div className="flex justify-between text-[10px] uppercase text-slate-400 font-mono">
                      <span>{key}</span>
                      <span>{val.toFixed(2)}</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={val}
                      onChange={(e) => handleWeightChange(key, parseFloat(e.target.value))}
                      className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Stats Display */}
          <div className="bg-slate-900/50 rounded-xl p-4 border border-white/5">
            <h3 className="text-xs font-bold text-slate-400 uppercase mb-3">Current Similarity Stats</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-[10px] text-slate-500">Min</div>
                <div className="text-sm font-mono text-white">{currentSimilarityStats.min.toFixed(4)}</div>
              </div>
              <div>
                <div className="text-[10px] text-slate-500">Max</div>
                <div className="text-sm font-mono text-white">{currentSimilarityStats.max.toFixed(4)}</div>
              </div>
              <div className="col-span-2">
                <div className="text-[10px] text-slate-500">Average</div>
                <div className="text-sm font-mono text-white">{currentSimilarityStats.avg.toFixed(4)}</div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </>
  );
};

function App() {
  const [view, setView] = useState<'landing' | 'dashboard'>('landing');
  const [timeIndex, setTimeIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [loading, setLoading] = useState(true);

  // Configuration State
  const [selectedCategory, setSelectedCategory] = useState("1. Food Staples & Grains");
  const [similarityThreshold, setSimilarityThreshold] = useState(0.0);
  const [weightingMethod, setWeightingMethod] = useState("Equal Weighting");

  const [data, setData] = useState<Record<string, number[][]>>({});
  const [months, setMonths] = useState<string[]>([]);

  // Load Data
  useEffect(() => {
    const loadData = async () => {
      setLoading(true); // Ensure loading state is set
      // Try Backend First
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2000); // 2s timeout

        // Encode category for URL
        const categoryParam = encodeURIComponent(selectedCategory);
        const response = await fetch(`http://localhost:5000/api/data/graphs?category=${categoryParam}`, { signal: controller.signal });
        clearTimeout(timeoutId);

        if (response.ok) {
          const jsonData = await response.json();
          if (Object.keys(jsonData).length > 0) {
            setData(jsonData);
            setMonths(Object.keys(jsonData).sort());
            setLoading(false);
            return;
          }
        }
      } catch (e) {
        console.warn("Backend not reachable, using Mock Data", e);
      }

      // Fallback to Mock Data
      setData(MOCK_DATA);
      setMonths(MONTHS);
      setLoading(false);
    };

    loadData();
  }, [selectedCategory]); // Re-fetch when category changes

  // Timeline Loop
  useEffect(() => {
    let interval: any;
    if (isPlaying && months.length > 0) {
      interval = setInterval(() => {
        setTimeIndex(prev => (prev + 1) % months.length);
      }, 2000); // Slowed down as requested
    }
    return () => clearInterval(interval);
  }, [isPlaying, months]);

  // Derived Metrics
  const currentMonth = months[timeIndex] || "";
  const currentMatrix = data[currentMonth] || [];

  // Filter Matrix based on Threshold (Client-Side)
  const filteredMatrix = useMemo(() => {
    if (!currentMatrix || currentMatrix.length === 0) return [];

    return currentMatrix.map(row =>
      row.map(val => val >= similarityThreshold ? val : 0)
    );
  }, [currentMatrix, similarityThreshold]);

  const metrics = useMemo(() => calculateCentrality(filteredMatrix), [filteredMatrix]);

  // Calculate Similarity Stats
  const similarityStats = useMemo(() => {
    let min = 1, max = 0, sum = 0, count = 0;
    // Use original matrix for stats to show full distribution, or filtered?
    // Usually stats should reflect what's visible, so let's use filteredMatrix but ignore 0s
    filteredMatrix.forEach(row => row.forEach(val => {
      if (val > 0 && val < 1) { // Ignore self-loops (1.0) and zeros
        if (val < min) min = val;
        if (val > max) max = val;
        sum += val;
        count++;
      }
    }));
    return { min: count > 0 ? min : 0, max, avg: count > 0 ? sum / count : 0 };
  }, [filteredMatrix]);

  // Interactive Weights State
  const [customWeights, setCustomWeights] = useState({ degree: 0.25, closeness: 0.25, betweenness: 0.25, eigenvector: 0.25 });
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Weighting Logic Helpers
  const calculateEntropyWeights = (metrics: any) => {
    const n = metrics.degree.length;
    if (n === 0) return { degree: 0.25, closeness: 0.25, betweenness: 0.25, eigenvector: 0.25 };

    const keys = ['degree', 'closeness', 'betweenness', 'eigenvector'];
    const entropies: Record<string, number> = {};
    const disperions: Record<string, number> = {};
    let totalDispersion = 0;

    keys.forEach(key => {
      const values = metrics[key] as number[];
      const sum = values.reduce((a, b) => a + b, 0);
      if (sum === 0) {
        entropies[key] = 1; // No information
      } else {
        // Normalized values
        const p = values.map(v => v / sum);
        // Entropy
        const k = 1 / Math.log(n);
        let e = 0;
        p.forEach(val => {
          if (val > 0) e += val * Math.log(val);
        });
        entropies[key] = -k * e;
      }
      disperions[key] = 1 - entropies[key];
      totalDispersion += disperions[key];
    });

    if (totalDispersion === 0) return { degree: 0.25, closeness: 0.25, betweenness: 0.25, eigenvector: 0.25 };

    return {
      degree: disperions['degree'] / totalDispersion,
      closeness: disperions['closeness'] / totalDispersion,
      betweenness: disperions['betweenness'] / totalDispersion,
      eigenvector: disperions['eigenvector'] / totalDispersion
    };
  };

  const CATEGORY_WEIGHTS: Record<string, any> = {
    "1. Food Staples & Grains": { degree: 0.4, closeness: 0.3, betweenness: 0.1, eigenvector: 0.2 },
    "2. Meat, Poultry & Dairy": { degree: 0.3, closeness: 0.4, betweenness: 0.1, eigenvector: 0.2 },
    "3. Oils, Condiments & Sweeteners": { degree: 0.2, closeness: 0.2, betweenness: 0.4, eigenvector: 0.2 },
    "4. Fruits & Vegetables": { degree: 0.5, closeness: 0.2, betweenness: 0.1, eigenvector: 0.2 },
    "5. Non-Food Essentials": { degree: 0.2, closeness: 0.3, betweenness: 0.2, eigenvector: 0.3 },
    "6. Utilities & Transport": { degree: 0.1, closeness: 0.2, betweenness: 0.5, eigenvector: 0.2 },
    "7. Clothing & Miscellaneous": { degree: 0.2, closeness: 0.2, betweenness: 0.2, eigenvector: 0.4 }
  };

  const chartData = useMemo(() => {
    let weights = { degree: 0.25, closeness: 0.25, betweenness: 0.25, eigenvector: 0.25 };

    if (weightingMethod === "Equal Weighting") {
      weights = { degree: 0.25, closeness: 0.25, betweenness: 0.25, eigenvector: 0.25 };
    } else if (weightingMethod === "Correlation-Based") {
      // Simulating correlation weights (Degree usually high correlation with others)
      weights = { degree: 0.4, closeness: 0.2, betweenness: 0.2, eigenvector: 0.2 };
    } else if (weightingMethod === "Entropy-Based") {
      weights = calculateEntropyWeights(metrics);
    } else if (weightingMethod === "Category Importance") {
      weights = CATEGORY_WEIGHTS[selectedCategory] || { degree: 0.25, closeness: 0.25, betweenness: 0.25, eigenvector: 0.25 };
    } else if (weightingMethod === "Interactive") {
      weights = customWeights;
    }

    return CITIES.map((city, i) => {
      const composite = (
        (metrics.degree[i] || 0) * weights.degree +
        (metrics.closeness[i] || 0) * weights.closeness +
        (metrics.betweenness[i] || 0) * weights.betweenness +
        (metrics.eigenvector[i] || 0) * weights.eigenvector
      );

      return {
        name: city,
        Degree: metrics.degree[i] || 0,
        Closeness: metrics.closeness[i] || 0,
        Betweenness: metrics.betweenness[i] || 0,
        Eigenvector: metrics.eigenvector[i] || 0,
        Composite: composite
      };
    }).sort((a, b) => b.Composite - a.Composite);
  }, [metrics, weightingMethod, selectedCategory, customWeights]);

  return (
    <div className="bg-[#020617] text-slate-200 font-sans selection:bg-cyan-500/30 overflow-x-hidden min-h-screen flex">

      {/* View Transition */}
      <div className={`transition-opacity duration-1000 ${view === 'landing' ? 'opacity-100 fixed inset-0 z-50' : 'opacity-0 pointer-events-none absolute inset-0'}`}>
        {view === 'landing' && <Hero onStart={() => setView('dashboard')} loading={loading} />}
      </div>

      <div className={`transition-opacity duration-1000 flex w-full ${view === 'dashboard' ? 'opacity-100' : 'opacity-0 pointer-events-none absolute inset-0'}`}>
        {view === 'dashboard' && (
          <>
            {/* Sidebar */}
            <ConfigurationSidebar
              selectedCategory={selectedCategory}
              setSelectedCategory={setSelectedCategory}
              timeIndex={timeIndex}
              setTimeIndex={setTimeIndex}
              maxTime={Math.max(0, months.length - 1)}
              months={months}
              similarityThreshold={similarityThreshold}
              setSimilarityThreshold={setSimilarityThreshold}
              weightingMethod={weightingMethod}
              setWeightingMethod={setWeightingMethod}
              currentSimilarityStats={similarityStats}
              customWeights={customWeights}
              setCustomWeights={setCustomWeights}
              isOpen={isSidebarOpen}
              onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
            />

            <main className={`flex-1 min-h-screen flex flex-col min-w-0 transition-all duration-300 ${isSidebarOpen ? 'ml-80' : 'ml-0'}`}>

              {/* Header */}
              <header className="sticky top-0 z-30 bg-[#020617]/90 backdrop-blur-md border-b border-white/10 px-8 py-4 shadow-lg">
                <div className="max-w-[1800px] mx-auto flex flex-col md:flex-row items-center gap-8">
                  <div className="flex items-center gap-4 min-w-[240px]">
                    <div className="p-2 bg-cyan-950/30 rounded border border-cyan-500/30">
                      <Activity className="w-6 h-6 text-cyan-400" />
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-slate-100 tracking-wide">MARKET INTEGRATION</h2>
                      <p className="text-xs text-slate-500 font-mono">LIVE OBSERVATORY // {currentMonth}</p>
                    </div>
                  </div>

                  <div className="flex-1 w-full flex items-center gap-6 bg-white/5 rounded-full px-6 py-3 border border-white/5">
                    <button
                      onClick={() => setIsPlaying(!isPlaying)}
                      className="p-3 rounded-full bg-cyan-500 hover:bg-cyan-400 text-[#020617] transition-colors shadow-[0_0_10px_cyan]"
                    >
                      {isPlaying ? <Pause size={18} /> : <Play size={18} />}
                    </button>
                    <div className="flex-1 flex flex-col justify-center px-4">
                      {/* Timeline Slider moved to Sidebar, keeping simple progress here or removing? Keeping for now as quick access */}
                      <div className="w-full h-2 bg-slate-800 rounded-lg overflow-hidden">
                        <div
                          className="h-full bg-cyan-500 transition-all duration-500"
                          style={{ width: `${(timeIndex / Math.max(1, months.length - 1)) * 100}%` }}
                        ></div>
                      </div>
                      <div className="flex justify-between text-[10px] text-slate-500 mt-1 font-mono">
                        <span>Progress</span>
                        <span>{Math.round((timeIndex / Math.max(1, months.length - 1)) * 100)}%</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-10 text-right hidden md:flex min-w-[240px] justify-end">
                    <div>
                      <div className="text-xs text-slate-500 font-mono uppercase">Nodes</div>
                      <div className="text-xl font-bold text-cyan-400 leading-none">{CITIES.length}</div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-500 font-mono uppercase">Density</div>
                      <div className="text-xl font-bold text-purple-400 leading-none">
                        {(currentMatrix.flat().filter(w => w > 0).length / (CITIES.length * CITIES.length)).toFixed(2)}
                      </div>
                    </div>
                  </div>
                </div>
              </header>

              {/* Dashboard Content - Vertical Stacked Layout */}
              <div className="flex-1 max-w-[1800px] mx-auto w-full p-8 flex flex-col gap-12">

                {/* Section 1: Force Directed Topology (Large) */}
                <div className="h-[80vh] min-h-[700px]">
                  <ForceGraph
                    matrix={filteredMatrix}
                    nodes={CITIES}
                    threshold={similarityThreshold}
                    explanation={`
**Force Directed Topology Graph**

This visualization represents the **similarity network** of cities based on their price indices for the selected product category.

- **Nodes (Circles):** Represent cities.
- **Edges (Lines):** Represent a strong similarity in price trends between two cities.
- **Physics Simulation:** Nodes repel each other, while edges pull connected nodes together, naturally clustering similar cities.

**How it works:**
1. **Data Source:** Fetches the adjacency matrix for the selected **Product Category** and **Time Step**.
2. **Filtering:** Edges are only drawn if the similarity score is greater than the **Similarity Threshold** (controlled by the slider).
3. **Interaction:** Drag nodes to rearrange the layout. Hover to see connections.
                    `}
                  />
                </div>

                {/* Section 2: City Centrality Matrix (Large Table) */}
                <div className="min-h-[600px]">
                  <CityCentralityMatrix
                    data={chartData}
                    explanation={`
**City Centrality Matrix**

This table displays key **Network Centrality Metrics** for each city, providing a quantitative measure of its importance within the price similarity network.

- **Degree:** The number of direct connections (similar cities). High degree = Highly similar to many others.
- **Closeness:** How close a city is to all other cities in the network. High closeness = Can "reach" other cities quickly (central position).
- **Betweenness:** How often a city acts as a bridge along the shortest path between two other cities. High betweenness = Connects different clusters.
- **Eigenvector:** A measure of influence; a city is important if it is connected to other important cities.

**Updates:**
These metrics are recalculated in real-time based on the **Filtered Matrix** (affected by Category and Threshold).
                    `}
                  />
                </div>

                {/* Section 3: Analytics Grid (Ranking + Comparative) */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 min-h-[600px]">
                  <div className="h-full">
                    <CompositeScoreRanking
                      data={chartData}
                      explanation={`
**Composite Score Ranking**

This chart ranks cities based on a **Composite Score**, which is a weighted sum of the four centrality metrics (Degree, Closeness, Betweenness, Eigenvector).

**Formula:**
\`Composite = w_d * Degree + w_c * Closeness + w_b * Betweenness + w_e * Eigenvector\`

**Configuration:**
You can adjust the weights using the **Composite Score Weighting** dropdown in the sidebar:
- **Equal Weighting:** All metrics contribute equally (25%).
- **Entropy-Based:** Weights are calculated dynamically based on the information entropy of each metric.
- **Category Importance:** Pre-defined weights optimized for the selected product category.
- **Interactive:** Manually adjust weights using sliders.
                      `}
                    />
                  </div>
                  <div className="h-full">
                    <ComparativeAnalysis
                      data={chartData}
                      explanation={`
**Comparative Analysis**

This chart allows you to compare two different metrics side-by-side for the top 5 ranked cities.

- **Purpose:** To visualize the relationship or trade-off between different types of centrality (e.g., Degree vs. Betweenness).
- **Usage:** Use the dropdowns to select which metrics to compare.
- **Insight:** Identify cities that might have high connectivity (Degree) but low influence (Eigenvector), or vice versa.
                      `}
                    />
                  </div>
                </div>

                {/* Section 4: Temporal Relation (Hasse) */}
                <div className="min-h-[500px]">
                  <TemporalHasseDiagram
                    months={months}
                    activeIndex={timeIndex}
                    matrix={filteredMatrix}
                    explanation={`
**Temporal Relation (Hasse Diagram)**

This visualization tracks the mathematical properties of the similarity network over time.

**Properties Monitored:**
- **Reflexive:** Does every city have a similarity of 1.0 with itself? (Always YES by definition).
- **Antisymmetric:** If City A is similar to City B, is City B similar to City A? (Symmetric matrices imply this is trivial, but strictly antisymmetric means if A->B then B!->A. For undirected similarity, this is usually NO unless edges are directed). *Note: In this context, we check for strict antisymmetry which is rare in similarity graphs.*
- **Transitive:** If A is similar to B, and B is similar to C, is A similar to C? (Triangular closure).

**Timeline:**
The horizontal axis represents the timeline. The current time step is highlighted.
                    `}
                  />
                </div>

                {/* Section 5: Live Correlation Matrix (New) */}
                <div className="min-h-[800px] mb-12">
                  <LiveHeatMap
                    matrix={filteredMatrix}
                    nodes={CITIES}
                    explanation={`
**Live Correlation Heat Map**

This grid visualizes the exact **Cosine Similarity** score between every pair of cities.

- **Color Scale:**
  - **Red:** High Similarity (Close to 1.0)
  - **Blue:** Low Similarity (Close to 0.0)
- **Axes:** Both X and Y axes list the cities.
- **Interaction:** Hover over any cell to see the precise correlation value between the two intersecting cities.
- **Filtering:** Cells with values below the **Similarity Threshold** are filtered out (shown as dark/black).
                    `}
                  />
                </div>

              </div>
            </main>
          </>
        )}
      </div>
    </div>
  );
}

export default App;
