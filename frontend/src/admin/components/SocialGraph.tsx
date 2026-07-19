import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Globe, Users, ShieldAlert, Activity, Cpu, Zap, Eye, EyeOff, Radio } from 'lucide-react';

interface SocialGraphProps {
    users: any[];
    onlineUserIds: Set<string>;
    onSelectUser: (user: any) => void;
}

interface Node {
    id: string;
    x: number;
    y: number;
    vx: number; // Velocity X for smooth premium momentum physics
    vy: number; // Velocity Y
    avatar: string;
    username: string;
    fullname: string;
    role: string;
    isBanned: boolean;
    isOnline: boolean;
    userRef: any;
}

interface Link {
    source: string;
    target: string;
}

const SocialGraph: React.FC<SocialGraphProps> = ({ users, onlineUserIds, onSelectUser }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    
    // States
    const [nodes, setNodes] = useState<Node[]>([]);
    const [links, setLinks] = useState<Link[]>([]);
    const [hoveredNode, setHoveredNode] = useState<Node | null>(null);
    const [draggedNode, setDraggedNode] = useState<string | null>(null);
    const [isFrozen, setIsFrozen] = useState(false);
    const [showLabels, setShowLabels] = useState(true);

    const width = 900;
    const height = 500;

    // Build or update network nodes and links
    useEffect(() => {
        if (!users || users.length === 0) return;

        // Build Follower Relationship Links
        const builtLinks: Link[] = [];
        users.forEach(user => {
            if (user.following && Array.isArray(user.following)) {
                user.following.forEach((followedUid: string) => {
                    const targetExists = users.some(u => u.firebaseUid === followedUid);
                    if (targetExists) {
                        builtLinks.push({
                            source: user.firebaseUid,
                            target: followedUid
                        });
                    }
                });
            }
        });

        // Initialize or update nodes using velocity-aware physics structures
        setNodes(prevNodes => {
            const existingNodesMap = new Map(prevNodes.map(n => [n.id, n]));
            
            return users.map(user => {
                const existing = existingNodesMap.get(user.firebaseUid);
                
                // Explode nodes wider initially across the large grid
                const x = existing ? existing.x : width / 2 + (Math.random() - 0.5) * 500;
                const y = existing ? existing.y : height / 2 + (Math.random() - 0.5) * 300;
                const vx = existing ? existing.vx : (Math.random() - 0.5) * 4;
                const vy = existing ? existing.vy : (Math.random() - 0.5) * 4;

                return {
                    id: user.firebaseUid,
                    x,
                    y,
                    vx,
                    vy,
                    avatar: user.profilepicture,
                    username: user.username,
                    fullname: user.fullname || user.username,
                    role: user.role,
                    isBanned: user.isBanned,
                    isOnline: onlineUserIds.has(user.firebaseUid),
                    userRef: user
                };
            });
        });

        setLinks(builtLinks);
    }, [users, onlineUserIds]);

    // Premium Velocity-Based Physics Engine Loop
    useEffect(() => {
        if (nodes.length === 0 || isFrozen) return;

        let animationFrameId: number;

        const updatePhysics = () => {
            setNodes(currentNodes => {
                // Clone nodes to update physics state
                const updatedNodes = currentNodes.map(n => ({ ...n }));
                
                // 1. Hyper-Charged Coulomb Repulsion (Pushes nodes far apart, completely preventing clutter)
                for (let i = 0; i < updatedNodes.length; i++) {
                    const nodeA = updatedNodes[i];
                    for (let j = i + 1; j < updatedNodes.length; j++) {
                        const nodeB = updatedNodes[j];
                        const dx = nodeB.x - nodeA.x;
                        const dy = nodeB.y - nodeA.y;
                        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
                        
                        // Force active range is wider to keep nodes spread out gracefully
                        if (dist < 350) {
                            // Heavy exponential charge repulsion formula to guarantee clear spatial layout
                            const charge = 160000; 
                            const force = charge / (dist * dist * dist); // Cubic damping force
                            const fx = force * (dx / dist);
                            const fy = force * (dy / dist);
                            
                            if (nodeA.id !== draggedNode) {
                                nodeA.vx -= fx;
                                nodeA.vy -= fy;
                            }
                            if (nodeB.id !== draggedNode) {
                                nodeB.vx += fx;
                                nodeB.vy += fy;
                            }
                        }
                    }
                }

                // 2. Linear Spring Tension along Relationship Connections
                links.forEach(link => {
                    const sourceNode = updatedNodes.find(n => n.id === link.source);
                    const targetNode = updatedNodes.find(n => n.id === link.target);
                    
                    if (sourceNode && targetNode) {
                        const dx = targetNode.x - sourceNode.x;
                        const dy = targetNode.y - sourceNode.y;
                        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
                        
                        // Natural relaxed spring distance
                        const desiredDist = 200;
                        const springFactor = 0.008; // Delicate tension to allow repulsion to dominate
                        const force = (dist - desiredDist) * springFactor;
                        const fx = force * (dx / dist);
                        const fy = force * (dy / dist);
                        
                        if (sourceNode.id !== draggedNode) {
                            sourceNode.vx += fx;
                            sourceNode.vy += fy;
                        }
                        if (targetNode.id !== draggedNode) {
                            targetNode.vx -= fx;
                            targetNode.vy -= fy;
                        }
                    }
                });

                // 3. Ultra-Gentle Central Gravity
                const centerX = width / 2;
                const centerY = height / 2;
                updatedNodes.forEach(node => {
                    if (node.id === draggedNode) return;
                    
                    // Very light central attraction to prevent clustering in a central blob
                    node.vx += (centerX - node.x) * 0.0008;
                    node.vy += (centerY - node.y) * 0.0008;
                });

                // 4. Friction/Damping and Position Integration
                updatedNodes.forEach(node => {
                    if (node.id === draggedNode) return;
                    
                    // Smooth friction deceleration (84% damping factor)
                    node.vx *= 0.84;
                    node.vy *= 0.84;
                    
                    node.x += node.vx;
                    node.y += node.vy;

                    // Firm bounding box collision bouncing
                    const radius = 30;
                    if (node.x < radius) { node.x = radius; node.vx *= -0.5; }
                    if (node.x > width - radius) { node.x = width - radius; node.vx *= -0.5; }
                    if (node.y < radius) { node.y = radius; node.vy *= -0.5; }
                    if (node.y > height - radius) { node.y = height - radius; node.vy *= -0.5; }
                });

                return updatedNodes;
            });

            animationFrameId = requestAnimationFrame(updatePhysics);
        };

        animationFrameId = requestAnimationFrame(updatePhysics);
        return () => cancelAnimationFrame(animationFrameId);
    }, [links, draggedNode, nodes.length, isFrozen]);

    // Trigger explosive Big Bang dispersion
    const triggerBigBang = () => {
        setNodes(currentNodes => 
            currentNodes.map(node => {
                if (node.id === draggedNode) return node;
                return {
                    ...node,
                    vx: (Math.random() - 0.5) * 35, // Inject huge velocity spike
                    vy: (Math.random() - 0.5) * 35
                };
            })
        );
    };

    // Drag controllers
    const handleMouseDown = (nodeId: string) => {
        setDraggedNode(nodeId);
    };

    const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
        if (!draggedNode) return;
        
        const svg = e.currentTarget;
        const rect = svg.getBoundingClientRect();
        
        const x = ((e.clientX - rect.left) / rect.width) * width;
        const y = ((e.clientY - rect.top) / rect.height) * height;

        setNodes(currentNodes => 
            currentNodes.map(n => n.id === draggedNode ? { ...n, x: Math.max(30, Math.min(width - 30, x)), y: Math.max(30, Math.min(height - 30, y)), vx: 0, vy: 0 } : n)
        );
    };

    const handleMouseUp = () => {
        setDraggedNode(null);
    };

    // Calculate interactive path highlighting states
    const getConnectedNodeIds = () => {
        if (!hoveredNode) return new Set<string>();
        const connected = new Set<string>([hoveredNode.id]);
        links.forEach(link => {
            if (link.source === hoveredNode.id) connected.add(link.target);
            if (link.target === hoveredNode.id) connected.add(link.source);
        });
        return connected;
    };

    const connectedNodeIds = getConnectedNodeIds();

    return (
        <div className="bg-gradient-to-b from-[#06060c] to-[#020204] border border-indigo-500/10 rounded-[32px] p-6 relative overflow-hidden flex flex-col shadow-[0_25px_60px_rgba(0,0,0,0.65)] select-none">
            {/* Cyber Glow Top Line Indicator */}
            <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-[#00f2fe] via-[#7d2ae8] to-[#f35588]"></div>
            
            {/* Header controls pane */}
            <div className="flex items-center justify-between mb-6 flex-wrap gap-4 border-b border-white/[0.03] pb-5">
                <div className="flex items-center gap-3">
                    <div className="p-3 rounded-2xl bg-[#7d2ae8]/5 border border-[#7d2ae8]/20 text-[#00f2fe] shadow-[0_0_15px_rgba(0,242,254,0.15)]">
                        <Radio className="w-5 h-5 animate-pulse text-[#00f2fe]" />
                    </div>
                    <div>
                        <h4 className="text-sm font-black text-white tracking-widest uppercase flex items-center gap-2">
                            Ecosystem Traveler Relations Topology
                            <span className="px-2 py-0.5 text-[8px] bg-[#00f2fe]/10 border border-[#00f2fe]/30 rounded text-[#00f2fe] font-black uppercase tracking-widest animate-pulse">Velocity Engine</span>
                        </h4>
                        <span className="text-[9px] text-gray-500 font-bold uppercase tracking-widest block mt-0.5">Premium Momentum Vectors // Path Highlight Filters // Symmetrical Spacing</span>
                    </div>
                </div>

                {/* Physics Console HUD Controls */}
                <div className="flex items-center gap-2 bg-white/[0.02] border border-white/5 rounded-2xl p-1.5 z-20">
                    {/* Big Bang trigger dispersion */}
                    <button
                        onClick={triggerBigBang}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#00f2fe]/10 hover:bg-[#00f2fe]/20 border border-[#00f2fe]/20 hover:border-[#00f2fe]/40 text-[#00f2fe] text-[9px] font-black uppercase tracking-widest transition-all"
                        title="Inject massive kinetic energy to disperse cluttered nodes"
                    >
                        <Zap className="w-3.5 h-3.5" /> Disperse Nodes
                    </button>

                    {/* Toggle Lock physics */}
                    <button
                        onClick={() => setIsFrozen(!isFrozen)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[9px] font-black uppercase tracking-widest transition-all ${
                            isFrozen 
                            ? 'bg-rose-500/10 border-rose-500/20 text-rose-400' 
                            : 'bg-white/5 border-white/5 text-gray-400 hover:bg-white/10'
                        }`}
                        title="Freeze all movements in space"
                    >
                        <Activity className="w-3.5 h-3.5" /> {isFrozen ? "Locked" : "Freeze Layout"}
                    </button>

                    {/* Toggle Username labels */}
                    <button
                        onClick={() => setShowLabels(!showLabels)}
                        className="p-1.5 rounded-xl bg-white/5 border border-white/5 text-gray-400 hover:bg-white/10 hover:text-white transition-all"
                        title="Toggle Username Capsule Labels"
                    >
                        {showLabels ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </button>
                </div>
            </div>

            {/* Futuristic Tech Sonar radar Canvas */}
            <div className="bg-[#020204]/60 border border-white/5 rounded-3xl relative overflow-hidden shadow-inner h-[500px]" ref={containerRef}>
                
                {/* Tech Cyber Matrix Background Grid */}
                <div 
                    className="absolute inset-0 opacity-15 pointer-events-none"
                    style={{
                        backgroundImage: `radial-gradient(rgba(0, 242, 254, 0.25) 1px, transparent 1px)`,
                        backgroundSize: '28px 28px'
                    }}
                ></div>

                {/* Cyber Sonar Targeting concentric Rings */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.02]">
                    <div className="w-[120px] h-[120px] border border-[#00f2fe] rounded-full"></div>
                    <div className="w-[280px] h-[280px] border border-[#00f2fe] rounded-full absolute"></div>
                    <div className="w-[480px] h-[480px] border border-[#00f2fe] rounded-full absolute"></div>
                    <div className="w-[700px] h-[700px] border border-[#00f2fe] rounded-full absolute"></div>
                </div>

                <svg
                    width="100%"
                    height="100%"
                    viewBox={`0 0 ${width} ${height}`}
                    className="select-none cursor-grab active:cursor-grabbing relative z-10"
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                >
                    {/* SVG Definitions for arrows and avatars patterns */}
                    <defs>
                        {/* Custom Laser Gradient Edges */}
                        <linearGradient id="laserGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#4facfe" stopOpacity="0.45" />
                            <stop offset="50%" stopColor="#7d2ae8" stopOpacity="0.8" />
                            <stop offset="100%" stopColor="#f35588" stopOpacity="0.45" />
                        </linearGradient>

                        {/* Arrowheads for target lines */}
                        <marker
                            id="arrow"
                            viewBox="0 0 10 10"
                            refX="38" // Precise offset intersection matching nested boundaries
                            refY="5"
                            markerWidth="5"
                            markerHeight="5"
                            orient="auto-start-reverse"
                        >
                            <path d="M 0 1.5 L 9 5 L 0 8.5 z" fill="#00f2fe" />
                        </marker>

                        {/* Circular Image Clip Patterns */}
                        {nodes.map(node => (
                            <pattern
                                key={`pattern-${node.id}`}
                                id={`avatar-${node.id}`}
                                patternUnits="objectBoundingBox"
                                patternContentUnits="objectBoundingBox"
                                width="1"
                                height="1"
                            >
                                <image
                                    x="0"
                                    y="0"
                                    width="1"
                                    height="1"
                                    href={node.avatar || `https://ui-avatars.com/api/?name=${node.username}&background=2e1065&color=fff`}
                                    preserveAspectRatio="xMidYMid slice"
                                />
                            </pattern>
                        ))}
                    </defs>

                    {/* Laser Link Paths (With Interactive Connected Path Highlighting!) */}
                    <g>
                        {links.map((link, idx) => {
                            const source = nodes.find(n => n.id === link.source);
                            const target = nodes.find(n => n.id === link.target);
                            if (!source || !target) return null;

                            // Dim links that aren't related to the hovered node to prevent visual clutter
                            const isLinkActive = !hoveredNode || (hoveredNode.id === source.id || hoveredNode.id === target.id);
                            const linkOpacity = isLinkActive ? 0.75 : 0.08;
                            const strokeColor = isLinkActive ? "url(#laserGrad)" : "rgba(255, 255, 255, 0.15)";

                            return (
                                <g key={`link-${idx}`}>
                                    {/* Ambient Link Line */}
                                    <line
                                        x1={source.x}
                                        y1={source.y}
                                        x2={target.x}
                                        y2={target.y}
                                        stroke={strokeColor}
                                        strokeWidth={isLinkActive ? 1.8 : 1}
                                        markerEnd="url(#arrow)"
                                        style={{ opacity: linkOpacity }}
                                        className="transition-all duration-300"
                                    />
                                    {/* Marching Laser Transmission Particle */}
                                    {isLinkActive && (
                                        <line
                                            x1={source.x}
                                            y1={source.y}
                                            x2={target.x}
                                            y2={target.y}
                                            stroke="#00f2fe"
                                            strokeWidth={2}
                                            strokeDasharray="6 32"
                                            style={{
                                                opacity: linkOpacity,
                                                animation: 'laserFlow 1.8s linear infinite'
                                            }}
                                        />
                                    )}
                                </g>
                            );
                        })}
                    </g>

                    {/* Cyber Tech Nodes (With Interactive Neighbor Highlighting!) */}
                    <g>
                        {nodes.map(node => {
                            const isNodeHovered = hoveredNode?.id === node.id;
                            
                            // Dim node if another node is hovered and this is not a connected neighbor
                            const isNodeDimmed = hoveredNode && !connectedNodeIds.has(node.id);
                            const nodeOpacity = isNodeDimmed ? 0.25 : 1;

                            // Color configuration mapping
                            const glowBorder = node.isBanned 
                                ? '#f35588' 
                                : node.role === 'admin' 
                                ? '#00f2fe' 
                                : node.isOnline 
                                ? '#10b981' 
                                : '#4b5563';

                            const glowShadow = node.isBanned 
                                ? 'rgba(243, 85, 136, 0.65)' 
                                : node.role === 'admin' 
                                ? 'rgba(0, 242, 254, 0.65)' 
                                : node.isOnline 
                                ? 'rgba(16, 185, 129, 0.65)' 
                                : 'rgba(75, 85, 99, 0.2)';

                            return (
                                <g
                                    key={`node-${node.id}`}
                                    transform={`translate(${node.x}, ${node.y})`}
                                    onMouseDown={() => handleMouseDown(node.id)}
                                    onMouseEnter={() => setHoveredNode(node)}
                                    onMouseLeave={() => setHoveredNode(null)}
                                    onClick={() => onSelectUser(node.userRef)}
                                    className="cursor-pointer transition-all duration-300"
                                    style={{ opacity: nodeOpacity }}
                                >
                                    {/* 1. Concentric Pulse Halo ring (for online active nodes) */}
                                    {node.isOnline && !node.isBanned && (
                                        <circle
                                            r={isNodeHovered ? 30 : 24}
                                            fill="none"
                                            stroke={glowBorder}
                                            strokeWidth={1.5}
                                            strokeOpacity={0.3}
                                            style={{
                                                animation: 'radarPulse 2.5s infinite linear'
                                            }}
                                        />
                                    )}

                                    {/* 2. Glass Cyber Frame outer container */}
                                    <circle
                                        r={isNodeHovered ? 26 : 21}
                                        fill="#040408"
                                        stroke={glowBorder}
                                        strokeWidth={isNodeHovered ? 2.5 : 1.5}
                                        className="transition-all duration-300"
                                        style={{
                                            filter: isNodeHovered ? `drop-shadow(0 0 12px ${glowShadow})` : 'none'
                                        }}
                                    />

                                    {/* 3. Clipped User Avatar */}
                                    <circle
                                        r={isNodeHovered ? 22 : 18}
                                        fill={`url(#avatar-${node.id})`}
                                        stroke="#040408"
                                        strokeWidth={1}
                                        className="transition-all duration-300"
                                    />

                                    {/* 4. Username Label Tech Capsule */}
                                    {showLabels && (
                                        <g transform={`translate(0, ${isNodeHovered ? 42 : 36})`} className="pointer-events-none transition-all duration-300">
                                            <rect
                                                x="-35"
                                                y="-7"
                                                width="70"
                                                height="14"
                                                rx="4"
                                                fill="#020204"
                                                stroke={glowBorder}
                                                strokeOpacity={isNodeHovered ? 0.9 : 0.25}
                                                strokeWidth={1}
                                            />
                                            <text
                                                textAnchor="middle"
                                                fill={isNodeHovered ? "#ffffff" : "#a1a1aa"}
                                                fontSize="8"
                                                fontWeight="black"
                                                y="2.5"
                                                className="tracking-wider uppercase"
                                            >
                                                {node.username.substring(0, 8)}
                                            </text>
                                        </g>
                                    )}

                                    {/* 5. Online Ping overlay indicator dot */}
                                    {node.isOnline && !node.isBanned && (
                                        <circle
                                            cx={isNodeHovered ? 18 : 15}
                                            cy={isNodeHovered ? -18 : -15}
                                            r={4}
                                            fill="#10b981"
                                            stroke="#020204"
                                            strokeWidth={1.5}
                                        />
                                    )}

                                    {/* 6. Admin star marker badge */}
                                    {node.role === 'admin' && (
                                        <g transform={`translate(${isNodeHovered ? -18 : -15}, ${isNodeHovered ? -18 : -15}) scale(0.6)`}>
                                            <circle cx="5" cy="5" r="7" fill="#00f2fe" />
                                            <path d="M5 1.5 L6.2 3.8 L8.8 4 L6.8 5.6 L7.4 8.1 L5 6.8 L2.6 8.1 L3.2 5.6 L1.2 4 L3.8 3.8 Z" fill="#020204" />
                                        </g>
                                    )}
                                </g>
                            );
                        })}
                    </g>
                </svg>

                {/* Graph HUD Hover telemetry card */}
                <AnimatePresence>
                    {hoveredNode && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 15 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 15 }}
                            className="absolute bottom-6 left-6 bg-[#040408]/90 border border-indigo-500/20 rounded-3xl p-5 w-72 shadow-[0_20px_45px_rgba(0,0,0,0.65)] pointer-events-none space-y-4 z-20 backdrop-blur-xl"
                        >
                            <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-[#00f2fe] to-[#7d2ae8]"></div>

                            <div className="flex items-center gap-3">
                                <div className="relative">
                                    <img
                                        src={hoveredNode.avatar || `https://ui-avatars.com/api/?name=${hoveredNode.username}&background=6366f1&color=fff`}
                                        alt={hoveredNode.username}
                                        className="w-12 h-12 rounded-2xl object-cover border border-white/10"
                                    />
                                    {hoveredNode.isOnline && !hoveredNode.isBanned && (
                                        <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-500 border-4 border-[#040408] rounded-full"></span>
                                    )}
                                </div>
                                <div>
                                    <h5 className="text-sm font-extrabold text-white leading-tight flex items-center gap-1.5">
                                        {hoveredNode.fullname}
                                    </h5>
                                    <span className="text-[9px] text-gray-500 font-bold block uppercase tracking-widest mt-0.5">@{hoveredNode.username}</span>
                                </div>
                            </div>
                            
                            <div className="flex items-center gap-2 text-[8px] font-black uppercase tracking-wider text-gray-400">
                                <span className={`px-2 py-0.5 rounded border ${
                                    hoveredNode.role === 'admin' 
                                    ? 'bg-[#00f2fe]/10 text-[#00f2fe] border-[#00f2fe]/20' 
                                    : 'bg-white/5 border border-white/5 text-gray-400'
                                }`}>
                                    {hoveredNode.role}
                                </span>

                                {hoveredNode.isBanned ? (
                                    <span className="flex items-center gap-1 text-rose-400 px-2 py-0.5 bg-rose-500/10 border border-rose-500/20 rounded">
                                        <ShieldAlert className="w-3 h-3" /> Suspended
                                    </span>
                                ) : hoveredNode.isOnline ? (
                                    <span className="flex items-center gap-1 text-emerald-400 px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 rounded">
                                        <Zap className="w-3 h-3 animate-bounce" /> Online
                                    </span>
                                ) : (
                                    <span className="px-2 py-0.5 bg-white/5 border border-white/5 rounded text-gray-500">
                                        Offline
                                    </span>
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-2 text-center text-[10px] font-black uppercase tracking-wider bg-white/[0.01] border border-white/5 rounded-2xl p-2.5">
                                <div className="space-y-0.5">
                                    <span className="text-gray-500 text-[8px] block">Following</span>
                                    <span className="text-white text-sm font-black">{hoveredNode.userRef.following?.length || 0}</span>
                                </div>
                                <div className="space-y-0.5 border-l border-white/5">
                                    <span className="text-gray-500 text-[8px] block">Followers</span>
                                    <span className="text-white text-sm font-black">{hoveredNode.userRef.followers?.length || 0}</span>
                                </div>
                            </div>

                            <div className="text-[7.5px] font-black uppercase tracking-wider text-gray-500 text-center animate-pulse">
                                Click Node to inspect profile dossier
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {nodes.length === 0 && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 py-20 text-center">
                        <Users className="w-10 h-10 text-gray-700 animate-pulse" />
                        <p className="text-xs text-gray-500 font-black uppercase tracking-widest">Constructing social relations network...</p>
                    </div>
                )}
            </div>

            {/* Premium Animations Style Injection */}
            <style>{`
                @keyframes laserFlow {
                    0% {
                        stroke-dashoffset: 0;
                    }
                    100% {
                        stroke-dashoffset: -38;
                    }
                }
                @keyframes radarPulse {
                    0% {
                        transform: scale(0.9);
                        opacity: 0.8;
                    }
                    100% {
                        transform: scale(1.4);
                        opacity: 0;
                    }
                }
            `}</style>
        </div>
    );
};

export default SocialGraph;
