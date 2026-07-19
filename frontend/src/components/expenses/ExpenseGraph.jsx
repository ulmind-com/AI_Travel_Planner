import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Info, RefreshCw, ZoomIn, ZoomOut, ArrowRight, Sparkles
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { expenseService } from '../../services/expenseService';

export default function ExpenseGraph({ groupId, token, refreshTrigger, currentUser, onAddExpense }) {
    const [graphData, setGraphData] = useState({ nodes: [], edges: [] });
    const [isLoading, setIsLoading] = useState(true);
    const [hoveredNode, setHoveredNode] = useState(null);
    const [hoveredEdge, setHoveredEdge] = useState(null);
    const [selectedNode, setSelectedNode] = useState(null); // Node clicked for filter
    const [paymentTarget, setPaymentTarget] = useState(null); // Payer/receiver confirmation modal
    const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);

    // Zoom & Pan state
    const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 });
    const [isPanning, setIsPanning] = useState(false);
    const panStart = useRef({ x: 0, y: 0 });

    // Force simulation refs and state
    const containerRef = useRef(null);
    const nodesRef = useRef([]);
    const edgesRef = useRef([]);
    const simulationRef = useRef(null);
    const [simulationNodes, setSimulationNodes] = useState([]);
    
    // Dragging state
    const draggedNodeId = useRef(null);

    // dimensions
    const width = 800;
    const height = 500;

    // Fetch graph data
    const fetchGraphData = async () => {
        try {
            setIsLoading(true);
            const res = await expenseService.getExpenseGraph(groupId, token);
            if (res.status === 'Success') {
                const { nodes, edges } = res.data;

                // Match with previous coordinates if they exist, to avoid resetting position
                const existingNodesMap = new Map(nodesRef.current.map(n => [n.id, n]));

                const initializedNodes = nodes.map((n, i) => {
                    const existing = existingNodesMap.get(n.id);
                    if (existing) {
                        return {
                            ...n,
                            x: existing.x,
                            y: existing.y,
                            vx: existing.vx,
                            vy: existing.vy
                        };
                    }

                    // Arrange in a circle around center
                    const angle = (i / nodes.length) * 2 * Math.PI;
                    const radius = 150;
                    return {
                        ...n,
                        x: width / 2 + Math.cos(angle) * radius,
                        y: height / 2 + Math.sin(angle) * radius,
                        vx: 0,
                        vy: 0
                    };
                });

                nodesRef.current = initializedNodes;
                edgesRef.current = edges;
                setGraphData({ nodes: initializedNodes, edges });
                setSimulationNodes([...initializedNodes]);
            }
        } catch (error) {
            console.error('Error fetching graph data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (groupId && token) {
            fetchGraphData();
        }
    }, [groupId, token, refreshTrigger]);

    // Force Directed Simulation loop
    useEffect(() => {
        if (graphData.nodes.length === 0) return;

        const kRepulsion = 1500; // Force pushing nodes apart
        const kAttraction = 0.04; // Spring force pulling links together
        const restLength = 160;  // Preferred link distance
        const gravity = 0.03;    // Pull toward center
        const damping = 0.85;    // Slow down velocity

        const runSimulation = () => {
            const nodes = nodesRef.current;
            const edges = edgesRef.current;
            const centerX = width / 2;
            const centerY = height / 2;

            // 1. Repulsion between all nodes
            for (let i = 0; i < nodes.length; i++) {
                const nodeA = nodes[i];
                if (nodeA.id === draggedNodeId.current) continue;

                for (let j = i + 1; j < nodes.length; j++) {
                    const nodeB = nodes[j];
                    const dx = nodeA.x - nodeB.x;
                    const dy = nodeA.y - nodeB.y;
                    const distSq = dx * dx + dy * dy || 1;
                    const dist = Math.sqrt(distSq);

                    // Coulomb-like force
                    const force = kRepulsion / distSq;
                    const fx = (dx / dist) * force;
                    const fy = (dy / dist) * force;

                    if (nodeA.id !== draggedNodeId.current) {
                        nodeA.vx += fx;
                        nodeA.vy += fy;
                    }
                    if (nodeB.id !== draggedNodeId.current) {
                        nodeB.vx -= fx;
                        nodeB.vy -= fy;
                    }
                }
            }

            // 2. Attraction along edges
            edges.forEach(edge => {
                const nodeA = nodes.find(n => n.id === edge.from);
                const nodeB = nodes.find(n => n.id === edge.to);
                if (!nodeA || !nodeB) return;

                const dx = nodeA.x - nodeB.x;
                const dy = nodeA.y - nodeB.y;
                const dist = Math.sqrt(dx * dx + dy * dy) || 1;

                // Hooke's Law spring force
                const force = kAttraction * (dist - restLength);
                const fx = (dx / dist) * force;
                const fy = (dy / dist) * force;

                if (nodeA.id !== draggedNodeId.current) {
                    nodeA.vx -= fx;
                    nodeA.vy -= fy;
                }
                if (nodeB.id !== draggedNodeId.current) {
                    nodeB.vx += fx;
                    nodeB.vy += fy;
                }
            });

            // 3. Center gravity & boundary constraints
            nodes.forEach(node => {
                if (node.id === draggedNodeId.current) return;

                // Center pull
                node.vx -= (node.x - centerX) * gravity;
                node.vy -= (node.y - centerY) * gravity;

                // Apply velocity and damping
                node.x += node.vx;
                node.y += node.vy;
                node.vx *= damping;
                node.vy *= damping;

                // Keep inside canvas bounds
                node.x = Math.max(50, Math.min(width - 50, node.x));
                node.y = Math.max(50, Math.min(height - 50, node.y));
            });

            // Trigger react state update
            setSimulationNodes([...nodes]);

            simulationRef.current = requestAnimationFrame(runSimulation);
        };

        simulationRef.current = requestAnimationFrame(runSimulation);

        return () => {
            if (simulationRef.current) {
                cancelAnimationFrame(simulationRef.current);
            }
        };
    }, [graphData]);

    // Zoom & Pan Handlers
    const handleZoom = (factor) => {
        setTransform(prev => ({
            ...prev,
            scale: Math.max(0.5, Math.min(3, prev.scale * factor))
        }));
    };

    const handlePanStart = (e) => {
        if (e.target.tagName === 'circle' || e.target.tagName === 'image' || draggedNodeId.current) return;
        setIsPanning(true);
        const clientX = e.clientX || (e.touches && e.touches[0].clientX);
        const clientY = e.clientY || (e.touches && e.touches[0].clientY);
        panStart.current = {
            x: clientX - transform.x,
            y: clientY - transform.y
        };
    };

    const handlePanMove = (e) => {
        if (isPanning) {
            const clientX = e.clientX || (e.touches && e.touches[0].clientX);
            const clientY = e.clientY || (e.touches && e.touches[0].clientY);
            setTransform(prev => ({
                ...prev,
                x: clientX - panStart.current.x,
                y: clientY - panStart.current.y
            }));
        } else if (draggedNodeId.current) {
            // Drag node logic
            const rect = containerRef.current.getBoundingClientRect();
            const clientX = e.clientX || (e.touches && e.touches[0].clientX);
            const clientY = e.clientY || (e.touches && e.touches[0].clientY);

            // Convert screen mouse coordinates back to SVG coordinate space
            const svgX = (clientX - rect.left - transform.x) / transform.scale;
            const svgY = (clientY - rect.top - transform.y) / transform.scale;

            const draggedNode = nodesRef.current.find(n => n.id === draggedNodeId.current);
            if (draggedNode) {
                draggedNode.x = svgX;
                draggedNode.y = svgY;
                draggedNode.vx = 0;
                draggedNode.vy = 0;
            }
        }
    };

    const handlePanEnd = () => {
        setIsPanning(false);
        draggedNodeId.current = null;
    };

    const handleNodeDragStart = (e, nodeId) => {
        e.stopPropagation();
        draggedNodeId.current = nodeId;
    };

    // Settlement confirmation
    const handleSettleDebt = async () => {
        if (!paymentTarget) return;
        setIsSubmittingPayment(true);
        try {
            // Add a settlement expense (split equal to 0, directly paid by debtor to creditor)
            const amount = paymentTarget.amount;
            const description = `Debt settlement: ${paymentTarget.fromName} paid ${paymentTarget.toName}`;
            
            // Invoke onAddExpense callback in dashboard to save it to database
            await onAddExpense({
                paidBy: paymentTarget.fromId,
                amount: amount,
                description: description,
                splitType: 'custom',
                participants: [paymentTarget.fromId, paymentTarget.toId],
                splitDetails: [
                    { userId: paymentTarget.toId, amount: amount } // Payer gets split amount of total, meaning direct transfer
                ]
            });

            toast.success(`Settled $${amount.toFixed(2)} between ${paymentTarget.fromName} and ${paymentTarget.toName}!`);
            setPaymentTarget(null);
            fetchGraphData();
        } catch (error) {
            console.error('Error settling debt:', error);
            toast.error('Failed to log settlement payment.');
        } finally {
            setIsSubmittingPayment(false);
        }
    };

    // Calculate highlighted/shorted path or filters
    const filteredEdges = useMemo(() => {
        if (!selectedNode) return graphData.edges;
        return graphData.edges.filter(edge => 
            edge.from === selectedNode || edge.to === selectedNode
        );
    }, [graphData.edges, selectedNode]);

    const filteredNodes = useMemo(() => {
        if (!selectedNode) return simulationNodes;
        // Keep selected node and all its direct connections
        const connectedIds = new Set([selectedNode]);
        graphData.edges.forEach(edge => {
            if (edge.from === selectedNode) connectedIds.add(edge.to);
            if (edge.to === selectedNode) connectedIds.add(edge.from);
        });
        return simulationNodes.map(n => ({
            ...n,
            isDimmed: !connectedIds.has(n.id)
        }));
    }, [simulationNodes, graphData.edges, selectedNode]);

    return (
        <div className="bg-card/30 backdrop-blur-xl border border-white/10 rounded-[2.5rem] p-6 sm:p-8 shadow-2xl relative overflow-hidden">
            {/* Background elements */}
            <div className="absolute top-0 right-0 w-80 h-80 bg-primary/10 rounded-full blur-[80px] pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-80 h-80 bg-purple-500/10 rounded-full blur-[80px] pointer-events-none" />

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 relative z-10">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                        <Sparkles size={20} />
                    </div>
                    <div>
                        <h3 className="text-lg font-black uppercase tracking-wider text-foreground">Interactive Debt Nexus</h3>
                        <p className="text-xs text-muted-foreground">Real-time force-directed visualization of group liabilities.</p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setTransform({ x: 0, y: 0, scale: 1 })}
                        className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 text-muted-foreground hover:text-foreground transition-all"
                        title="Reset Graph Position"
                    >
                        <RefreshCw size={16} />
                    </button>
                    <button
                        onClick={() => handleZoom(1.2)}
                        className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 text-muted-foreground hover:text-foreground transition-all"
                        title="Zoom In"
                    >
                        <ZoomIn size={16} />
                    </button>
                    <button
                        onClick={() => handleZoom(0.8)}
                        className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 text-muted-foreground hover:text-foreground transition-all"
                        title="Zoom Out"
                    >
                        <ZoomOut size={16} />
                    </button>
                </div>
            </div>

            {/* Canvas/SVG viewport */}
            <div 
                ref={containerRef}
                className="w-full relative h-[500px] border border-white/5 bg-black/25 rounded-3xl overflow-hidden cursor-grab active:cursor-grabbing select-none"
                onMouseDown={handlePanStart}
                onMouseMove={handlePanMove}
                onMouseUp={handlePanEnd}
                onMouseLeave={handlePanEnd}
                onTouchStart={handlePanStart}
                onTouchMove={handlePanMove}
                onTouchEnd={handlePanEnd}
            >
                {isLoading ? (
                    <div className="absolute inset-0 flex items-center justify-center bg-card/10 backdrop-blur-sm z-20">
                        <div className="flex flex-col items-center gap-3">
                            <div className="w-8 h-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
                            <span className="text-xs font-black uppercase tracking-widest text-muted-foreground animate-pulse">Mapping Liabilities...</span>
                        </div>
                    </div>
                ) : graphData.nodes.length === 0 ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6">
                        <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-muted-foreground mb-3">
                            <Info size={24} />
                        </div>
                        <h4 className="text-sm font-black uppercase tracking-widest text-foreground">No liabilities to graph</h4>
                        <p className="text-xs text-muted-foreground max-w-xs mt-1">Everyone is settled up or no group expenses have been recorded yet.</p>
                    </div>
                ) : (
                    <svg className="w-full h-full pointer-events-none">
                        <defs>
                            {/* Arrow head marker definitions */}
                            <marker
                                id="arrow-standard"
                                viewBox="0 0 10 10"
                                refX="24" /* Pull back so arrow tip aligns correctly with node radius */
                                refY="5"
                                markerWidth="6"
                                markerHeight="6"
                                orient="auto-start-reverse"
                            >
                                <path d="M 0 1 L 10 5 L 0 9 z" fill="rgba(255, 255, 255, 0.2)" />
                            </marker>
                            <marker
                                id="arrow-highlight"
                                viewBox="0 0 10 10"
                                refX="24"
                                refY="5"
                                markerWidth="7"
                                markerHeight="7"
                                orient="auto-start-reverse"
                            >
                                <path d="M 0 1 L 10 5 L 0 9 z" fill="#818cf8" />
                            </marker>
                        </defs>

                        {/* Outer group carrying zoom & pan transform */}
                        <g transform={`translate(${transform.x}, ${transform.y}) scale(${transform.scale})`}>
                            {/* 1. Render Edges (lines) */}
                            {filteredEdges.map((edge, index) => {
                                const sourceNode = filteredNodes.find(n => n.id === edge.from);
                                const targetNode = filteredNodes.find(n => n.id === edge.to);

                                if (!sourceNode || !targetNode) return null;

                                const isHighlighted = hoveredEdge === edge || 
                                    (hoveredNode && (hoveredNode.id === edge.from || hoveredNode.id === edge.to)) ||
                                    (selectedNode && (selectedNode === edge.from || selectedNode === edge.to));
                                
                                const isDimmed = (hoveredNode && hoveredNode.id !== edge.from && hoveredNode.id !== edge.to) ||
                                    (selectedNode && selectedNode !== edge.from && selectedNode !== edge.to);

                                // Dynamic thickness proportional to debt size
                                const strokeWidth = Math.max(1.5, Math.min(8, 1 + edge.amount / 100));

                                return (
                                    <g key={`edge-${index}`} className="pointer-events-auto cursor-pointer">
                                        <line
                                            x1={sourceNode.x}
                                            y1={sourceNode.y}
                                            x2={targetNode.x}
                                            y2={targetNode.y}
                                            stroke={isHighlighted ? "#818cf8" : "rgba(255, 255, 255, 0.15)"}
                                            strokeWidth={strokeWidth}
                                            strokeDasharray={isHighlighted ? "none" : "4, 4"}
                                            opacity={isDimmed && !isHighlighted ? 0.2 : 1}
                                            markerEnd={isHighlighted ? "url(#arrow-highlight)" : "url(#arrow-standard)"}
                                            onMouseEnter={() => setHoveredEdge(edge)}
                                            onMouseLeave={() => setHoveredEdge(null)}
                                            onClick={() => {
                                                const currentIsDebtor = currentUser && currentUser._id === edge.from;
                                                const currentIsCreditor = currentUser && currentUser._id === edge.to;
                                                
                                                setPaymentTarget({
                                                    fromId: edge.from,
                                                    toId: edge.to,
                                                    fromName: sourceNode.name,
                                                    toName: targetNode.name,
                                                    amount: edge.amount,
                                                    canResolveDirectly: currentIsDebtor || currentIsCreditor
                                                });
                                            }}
                                        />
                                        {/* Edge weight text in middle of edge line */}
                                        {isHighlighted && (
                                            <g transform={`translate(${(sourceNode.x + targetNode.x) / 2}, ${(sourceNode.y + targetNode.y) / 2})`}>
                                                <rect
                                                    x="-28"
                                                    y="-12"
                                                    width="56"
                                                    height="18"
                                                    rx="6"
                                                    fill="#1e1b4b"
                                                    stroke="#818cf8"
                                                    strokeWidth="1"
                                                />
                                                <text
                                                    textAnchor="middle"
                                                    y="1"
                                                    fill="#e0e7ff"
                                                    fontSize="9"
                                                    fontWeight="bold"
                                                >
                                                    ${edge.amount.toFixed(2)}
                                                </text>
                                            </g>
                                        )}
                                    </g>
                                );
                            })}

                            {/* 2. Render Nodes (circle avatars) */}
                            {filteredNodes.map((node) => {
                                const isReceiving = node.balance > 0;
                                const isOwing = node.balance < 0;
                                const isHighlighted = hoveredNode?.id === node.id || selectedNode === node.id;
                                const isDimmed = node.isDimmed || (hoveredNode && hoveredNode.id !== node.id);

                                return (
                                    <g
                                        key={node.id}
                                        transform={`translate(${node.x}, ${node.y})`}
                                        className="pointer-events-auto cursor-pointer"
                                        onMouseDown={(e) => handleNodeDragStart(e, node.id)}
                                        onTouchStart={(e) => handleNodeDragStart(e, node.id)}
                                        onMouseEnter={() => setHoveredNode(node)}
                                        onMouseLeave={() => setHoveredNode(null)}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            // Toggle selected filter node
                                            setSelectedNode(prev => prev === node.id ? null : node.id);
                                        }}
                                    >
                                        {/* Pulse ring for highlighted node */}
                                        {isHighlighted && (
                                            <circle
                                                r="28"
                                                fill="none"
                                                stroke={isReceiving ? "#10b981" : isOwing ? "#f43f5e" : "#64748b"}
                                                strokeWidth="2"
                                                className="animate-ping"
                                                opacity="0.4"
                                            />
                                        )}

                                        {/* Outer circle border based on balance */}
                                        <circle
                                            r="22"
                                            fill="#0f172a"
                                            stroke={isReceiving ? "#10b981" : isOwing ? "#f43f5e" : "#64748b"}
                                            strokeWidth={isHighlighted ? 4 : 2}
                                            opacity={isDimmed ? 0.35 : 1}
                                            className="transition-all duration-200"
                                        />

                                        {/* User avatar image clipping */}
                                        <g opacity={isDimmed ? 0.35 : 1}>
                                            <clipPath id={`avatar-clip-${node.id}`}>
                                                <circle r="18" />
                                            </clipPath>
                                            <image
                                                href={node.profilepicture}
                                                x="-18"
                                                y="-18"
                                                width="36"
                                                height="36"
                                                clipPath={`url(#avatar-clip-${node.id})`}
                                                preserveAspectRatio="xMidYMid slice"
                                            />
                                        </g>

                                        {/* Name Label */}
                                        <g transform="translate(0, 34)" opacity={isDimmed ? 0.4 : 1}>
                                            <rect
                                                x="-45"
                                                y="-10"
                                                width="90"
                                                height="15"
                                                rx="4"
                                                fill="rgba(15, 23, 42, 0.85)"
                                                stroke="rgba(255, 255, 255, 0.05)"
                                                strokeWidth="0.5"
                                            />
                                            <text
                                                textAnchor="middle"
                                                fontSize="8"
                                                fontWeight="bold"
                                                fill="#ffffff"
                                            >
                                                {node.name.length > 12 ? `${node.name.substring(0, 10)}...` : node.name}
                                            </text>
                                        </g>

                                        {/* Mini balance tag */}
                                        <g transform="translate(0, -30)" opacity={isDimmed ? 0.4 : 1}>
                                            <rect
                                                x="-35"
                                                y="-8"
                                                width="70"
                                                height="13"
                                                rx="4"
                                                fill={isReceiving ? "rgba(16, 185, 129, 0.15)" : isOwing ? "rgba(244, 63, 94, 0.15)" : "rgba(100, 116, 139, 0.15)"}
                                                stroke={isReceiving ? "rgba(16, 185, 129, 0.3)" : isOwing ? "rgba(244, 63, 94, 0.3)" : "rgba(100, 116, 139, 0.3)"}
                                                strokeWidth="0.5"
                                            />
                                            <text
                                                textAnchor="middle"
                                                fontSize="8"
                                                fontWeight="black"
                                                fill={isReceiving ? "#34d399" : isOwing ? "#fb7185" : "#94a3b8"}
                                            >
                                                {isReceiving ? `+$${node.balance.toFixed(0)}` : isOwing ? `-$${Math.abs(node.balance).toFixed(0)}` : '$0'}
                                            </text>
                                        </g>
                                    </g>
                                );
                            })}
                        </g>
                    </svg>
                )}

                {/* Info Overlay / Tooltip */}
                <AnimatePresence>
                    {(hoveredNode || hoveredEdge) && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            className="absolute bottom-4 left-4 right-4 sm:left-6 sm:right-auto bg-slate-950/90 border border-white/10 rounded-2xl p-4 shadow-xl pointer-events-none z-10 max-w-sm backdrop-blur-md"
                        >
                            {hoveredNode ? (
                                <div className="flex items-center gap-3">
                                    <img 
                                        src={hoveredNode.profilepicture} 
                                        alt={hoveredNode.name} 
                                        className="w-10 h-10 rounded-full object-cover border border-white/15" 
                                    />
                                    <div>
                                        <div className="text-xs font-black text-foreground">{hoveredNode.name}</div>
                                        <div className="text-[10px] text-muted-foreground">@{hoveredNode.username}</div>
                                        <div className={`text-xs font-black uppercase mt-1 ${
                                            hoveredNode.balance > 0 ? 'text-emerald-400' : hoveredNode.balance < 0 ? 'text-pink-400' : 'text-slate-400'
                                        }`}>
                                            {hoveredNode.balance > 0 
                                                ? `Owed $${hoveredNode.balance.toFixed(2)}` 
                                                : hoveredNode.balance < 0 
                                                    ? `Owes $${Math.abs(hoveredNode.balance).toFixed(2)}` 
                                                    : 'Settled Up'
                                            }
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
                                    <span className="text-xs font-black uppercase text-indigo-300">Liability:</span>
                                    <span className="text-xs font-medium text-foreground">
                                        {nodesRef.current.find(n => n.id === hoveredEdge.from)?.name || 'Member'} owes {nodesRef.current.find(n => n.id === hoveredEdge.to)?.name || 'Member'} <span className="font-bold text-emerald-400">${hoveredEdge.amount.toFixed(2)}</span>
                                    </span>
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Filter instructions help */}
                {selectedNode && (
                    <div className="absolute top-4 left-4 bg-slate-900/80 border border-white/5 px-3 py-1.5 rounded-xl text-[10px] text-muted-foreground flex items-center gap-1.5 backdrop-blur-sm">
                        <Info size={12} className="text-indigo-400" />
                        <span>Filtering connected debts. Click empty space to clear filter.</span>
                    </div>
                )}
            </div>

            {/* Bottom Legend */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mt-6 pt-6 border-t border-white/5 relative z-10">
                <div className="space-y-1">
                    <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Color Legend</span>
                    <div className="flex items-center gap-4 text-xs font-semibold text-muted-foreground">
                        <div className="flex items-center gap-1.5">
                            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                            <span>Receives Money</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <div className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                            <span>Owes Money</span>
                        </div>
                    </div>
                </div>

                <div className="space-y-1">
                    <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Graph Interactions</span>
                    <p className="text-[11px] text-muted-foreground">
                        • Drag nodes to float naturally.<br />
                        • Click a node to isolate their relationships.<br />
                        • Click a debt line (arrow) to trigger a settlement payment.
                    </p>
                </div>

                <div className="flex flex-col justify-center sm:items-end">
                    <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Group Net Liability</span>
                    <span className="text-lg font-black text-foreground">
                        ${graphData.edges.reduce((acc, curr) => acc + curr.amount, 0).toFixed(2)}
                    </span>
                </div>
            </div>

            {/* Confirm Payment Modal */}
            <AnimatePresence>
                {paymentTarget && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setPaymentTarget(null)}
                            className="absolute inset-0 bg-background/80 backdrop-blur-md"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-card border border-white/10 w-full max-w-md rounded-3xl p-6 shadow-2xl relative z-10"
                        >
                            <h3 className="text-base font-black uppercase tracking-wider mb-4">Settle Up Debt</h3>

                            <div className="bg-white/5 rounded-2xl p-4 border border-white/5 flex items-center justify-between gap-3 mb-6">
                                <div className="text-center flex-1">
                                    <div className="text-[10px] font-black uppercase text-rose-400 mb-1">Debtor</div>
                                    <div className="text-sm font-bold text-foreground">{paymentTarget.fromName}</div>
                                </div>
                                <div className="flex flex-col items-center justify-center text-muted-foreground">
                                    <ArrowRight size={16} />
                                    <span className="text-xs font-black text-emerald-400 mt-1">${paymentTarget.amount.toFixed(2)}</span>
                                </div>
                                <div className="text-center flex-1">
                                    <div className="text-[10px] font-black uppercase text-emerald-400 mb-1">Creditor</div>
                                    <div className="text-sm font-bold text-foreground">{paymentTarget.toName}</div>
                                </div>
                            </div>

                            <p className="text-xs text-muted-foreground leading-relaxed mb-6">
                                Clicking "Confirm Settlement" will record a manual transaction of <strong>${paymentTarget.amount.toFixed(2)}</strong> paid by <strong>{paymentTarget.fromName}</strong> to <strong>{paymentTarget.toName}</strong>. This will adjust their mutual liabilities to $0.
                            </p>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setPaymentTarget(null)}
                                    className="flex-1 h-11 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-black uppercase tracking-widest text-muted-foreground transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSettleDebt}
                                    disabled={isSubmittingPayment}
                                    className="flex-1 h-11 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-xs font-black uppercase tracking-widest text-white shadow-lg shadow-emerald-500/25 transition-all flex items-center justify-center gap-1.5"
                                >
                                    {isSubmittingPayment ? 'Settling...' : 'Confirm Settle'}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
