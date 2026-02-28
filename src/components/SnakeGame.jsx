'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { CELL, FORM_COLS, FORM_ROWS } from '@/lib/grid';

// ── CONFIG ────────────────────────────────────────────────────────────────────
const TICK_MS   = 160;
const SNAKE_LEN = 4;
const SQ        = 1;    // project square = 1 grid cell
const MIN_DIST  = 6;    // min cell distance between project squares
const EDGE      = 2;    // cells clear from viewport edge

// ── PROJECTS ──────────────────────────────────────────────────────────────────
const PROJECTS = [
    { id: 0, name: 'Dify',              tag: 'Website Design', subtitle: 'AI Platform',       preview: '/Dify.mp4',           isVideo: true,  color: '#818CF8' },
    { id: 1, name: 'Galeta',            tag: 'Website Design', subtitle: 'Bakery',             preview: '/galeta.mp4',         isVideo: true,  color: '#F472B6' },
    { id: 2, name: 'AnyApp',            tag: 'UI/UX Design',   subtitle: 'AI Widgets App',     preview: '/AnyApp.png',         isVideo: false, color: '#F59E0B' },
    { id: 3, name: 'AI Platform',       tag: 'UI/UX Design',   subtitle: 'AI Dashboard',       preview: '/aiplatform.png',     isVideo: false, color: '#38BDF8' },
    { id: 4, name: 'Bloc1',             tag: 'UI/UX Design',   subtitle: 'Climbing Gym App',   preview: '/Bloc1.png',          isVideo: false, color: '#F87171' },
    { id: 5, name: 'Basecamp Research', tag: 'Website Design', subtitle: 'Research Institute', preview: '/BCR.mp4',            isVideo: true,  color: '#A78BFA' },
    { id: 6, name: 'Kendall Common',    tag: 'Website Design', subtitle: 'Real Estate',        preview: '/kendall common.mp4', isVideo: true,  color: '#FBBF24' },
    { id: 7, name: 'Cuto',              tag: 'Redesign',       subtitle: 'Wallpaper App',      preview: '/cuto.png',           isVideo: false, color: '#34D399' },
];

// ── HELPERS ───────────────────────────────────────────────────────────────────
const OPP   = { r: 'l', l: 'r', u: 'd', d: 'u' };
const DELTA = { r: [1, 0], l: [-1, 0], u: [0, -1], d: [0, 1] };

function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

function formZoneFor(cols, rows) {
    const c1 = Math.round((cols - FORM_COLS) / 2);
    const r1 = Math.round((rows - FORM_ROWS) / 2);
    return { c1, c2: c1 + FORM_COLS, r1, r2: r1 + FORM_ROWS };
}

function inZone(col, row, z) {
    return col >= z.c1 && col < z.c2 && row >= z.r1 && row < z.r2;
}

/** Randomly place projects outside the form exclusion zone */
function randomisePositions(cols, rows) {
    const fz = formZoneFor(cols, rows);
    // Add 1-cell buffer around exclusion zone for project placement
    const buf = { c1: fz.c1 - 2, c2: fz.c2 + 2, r1: fz.r1 - 2, r2: fz.r2 + 2 };

    const candidates = [];
    for (let c = EDGE; c < cols - EDGE; c++) {
        for (let r = EDGE; r < rows - EDGE; r++) {
            if (c >= buf.c1 && c < buf.c2 && r >= buf.r1 && r < buf.r2) continue;
            candidates.push([c, r]);
        }
    }

    // Fisher-Yates shuffle
    for (let i = candidates.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
    }

    // Greedy pick with minimum distance
    const picked = [];
    for (const [c, r] of candidates) {
        if (picked.length >= PROJECTS.length) break;
        const tooClose = picked.some(
            ([pc, pr]) => Math.abs(pc - c) + Math.abs(pr - r) < MIN_DIST
        );
        if (!tooClose) picked.push([c, r]);
    }

    return PROJECTS.map((p, i) => ({
        ...p,
        col: picked[i]?.[0] ?? EDGE + i * 4,
        row: picked[i]?.[1] ?? EDGE,
    }));
}

/** Return the index of the project closest to head (Manhattan distance) */
function nearestIdx(head, projects) {
    let best = 0, bestDist = Infinity;
    projects.forEach((p, i) => {
        const dist = Math.abs(p.col - head.col) + Math.abs(p.row - head.row);
        if (dist < bestDist) { bestDist = dist; best = i; }
    });
    return best;
}

/** Pick a new random grid position for a project, avoiding snake body, other projects, form zone, and edges */
function randomNewPos(cols, rows, fz, snake, projects, excludeIdx) {
    const buf = { c1: fz.c1 - 2, c2: fz.c2 + 2, r1: fz.r1 - 2, r2: fz.r2 + 2 };
    const occupied = new Set();
    snake.forEach(({ col, row }) => occupied.add(`${col},${row}`));
    projects.forEach((p, i) => { if (i !== excludeIdx) occupied.add(`${p.col},${p.row}`); });

    const candidates = [];
    for (let c = EDGE; c < cols - EDGE; c++) {
        for (let r = EDGE; r < rows - EDGE; r++) {
            if (c >= buf.c1 && c < buf.c2 && r >= buf.r1 && r < buf.r2) continue;
            if (occupied.has(`${c},${r}`)) continue;
            candidates.push([c, r]);
        }
    }
    if (candidates.length === 0) return null;
    const [c, r] = candidates[Math.floor(Math.random() * candidates.length)];
    return { col: c, row: r };
}

/**
 * Pick the best next direction toward target, avoiding the form zone.
 * Never reverses. Falls back to any valid direction if needed.
 */
function bestDir(head, target, curDir, cols, rows, fz, snake) {
    const dx = target.col - head.col;
    const dy = target.row - head.row;
    // Body cells the head must not enter (tail will vacate, so exclude it)
    const body = new Set((snake ?? []).slice(0, -1).map(s => `${s.col},${s.row}`));

    function safe(d) {
        if (d === OPP[curDir]) return false;
        const [dc, dr] = DELTA[d];
        const nc = ((head.col + dc) % cols + cols) % cols;
        const nr = ((head.row + dr) % rows + rows) % rows;
        return !inZone(nc, nr, fz) && !body.has(`${nc},${nr}`);
    }

    // Keep going straight when current direction is toward the target and the path is clear
    const isTowardTarget =
        (curDir === 'r' && dx > 0) || (curDir === 'l' && dx < 0) ||
        (curDir === 'd' && dy > 0) || (curDir === 'u' && dy < 0);
    if (isTowardTarget && safe(curDir)) return curDir;

    // Build candidate order:
    //   1. Toward target (largest gap first)
    //   2. Perpendicular  (better than going backwards when blocked by form zone)
    //   3. Everything else
    const preferred = [];
    if (dx !== 0) preferred.push([dx > 0 ? 'r' : 'l', Math.abs(dx)]);
    if (dy !== 0) preferred.push([dy > 0 ? 'd' : 'u', Math.abs(dy)]);
    preferred.sort((a, b) => b[1] - a[1]);

    const prefDirs = preferred.map(([d]) => d);
    const away     = prefDirs.map(d => OPP[d]);   // opposite of "toward" = "away"
    const all4     = ['r', 'l', 'u', 'd'];
    const seen     = new Set();
    const ordered  = [
        ...prefDirs,
        ...all4.filter(d => !away.includes(d)),    // perp + preferred (deduped below)
        ...all4,                                    // last resort includes away dirs
    ].filter(d => { if (seen.has(d)) return false; seen.add(d); return true; });

    for (const d of ordered) {
        if (safe(d)) return d;
    }

    // Absolute last resort: allow form zone
    for (const d of ordered) {
        if (d !== OPP[curDir]) return d;
    }

    return curDir;
}

// ── LIGHTBOX ──────────────────────────────────────────────────────────────────
function Lightbox({ project, onClose }) {
    return (
        <div
            onClick={onClose}
            style={{
                position: 'fixed', inset: 0, zIndex: 200,
                background: 'rgba(0,0,0,0.4)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
        >
            <div
                onClick={e => e.stopPropagation()}
                style={{
                    width: 'min(680px, 92vw)',
                    background: '#fff',
                    border: `1.5px solid ${project.color}`,
                    overflow: 'hidden',
                }}
            >
                {project.isVideo ? (
                    <video
                        src={project.preview}
                        autoPlay muted loop playsInline
                        style={{ width: '100%', maxHeight: 420, objectFit: 'cover', display: 'block' }}
                    />
                ) : (
                    <img
                        src={project.preview}
                        alt={project.name}
                        style={{ width: '100%', maxHeight: 420, objectFit: 'cover', display: 'block' }}
                    />
                )}
                <div style={{
                    padding: '14px 20px',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    borderTop: `1px solid ${project.color}`,
                }}>
                    <div>
                        <div style={{
                            fontFamily: 'var(--font-geist-sans),sans-serif',
                            fontSize: 15, fontWeight: 600, color: '#0d0d0d',
                            letterSpacing: '-0.02em', marginBottom: 2,
                        }}>
                            {project.name}
                        </div>
                        <div style={{
                            fontFamily: 'var(--font-geist-sans),sans-serif',
                            fontSize: 11, color: '#999',
                        }}>
                            {project.tag} · {project.subtitle}
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        style={{
                            background: 'none', border: '1px solid #e5e5e5',
                            width: 30, height: 30, cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 16, color: '#888', fontFamily: 'inherit',
                        }}
                    >×</button>
                </div>
            </div>
        </div>
    );
}

// ── PREVIEW CARD ──────────────────────────────────────────────────────────────
function PreviewCard({ project, onClose, onExpand, vw, vh }) {
    const CARD_W = 220;
    const CARD_H = 162;
    const GAP    = 10;

    const isBottom = project.py > vh * 0.55;
    const top  = isBottom ? project.py - CARD_H - GAP : project.py + CELL + GAP;
    const left = clamp(project.px + CELL / 2 - CARD_W / 2, 10, vw - CARD_W - 10);

    return (
        <div
            onClick={onExpand}
            style={{
                position: 'fixed', top, left,
                width: CARD_W,
                background: '#fff',
                border: `1px solid ${project.color}`,
                cursor: 'pointer',
                zIndex: 50,
                animation: 'pcIn 0.16s ease',
            }}
        >
            <style>{`@keyframes pcIn{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:translateY(0)}}`}</style>

            {project.isVideo ? (
                <video
                    src={project.preview}
                    autoPlay muted loop playsInline
                    style={{ width: '100%', height: 110, objectFit: 'cover', display: 'block' }}
                />
            ) : (
                <img
                    src={project.preview}
                    alt={project.name}
                    style={{ width: '100%', height: 110, objectFit: 'cover', display: 'block' }}
                />
            )}

            <div style={{
                padding: '8px 10px',
                borderTop: `1px solid ${project.color}`,
            }}>
                <div style={{
                    fontFamily: 'var(--font-geist-sans),sans-serif',
                    fontSize: 12, fontWeight: 600, color: '#0d0d0d',
                    letterSpacing: '-0.01em',
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                }}>
                    {project.name}
                </div>
                <div style={{
                    fontFamily: 'var(--font-geist-sans),sans-serif',
                    fontSize: 10, color: '#aaa', marginTop: 1,
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                }}>
                    {project.tag}
                </div>
            </div>
        </div>
    );
}

// ── MAIN ──────────────────────────────────────────────────────────────────────
export default function SnakeGame() {
    const canvasRef         = useRef(null);
    const gRef              = useRef(null);
    const pausedRef         = useRef(false);
    const previewRef        = useRef(null);  // mirror of preview state for use in callbacks
    const autoCloseTimerRef = useRef(null);
    const closePreviewRef   = useRef(null);  // stable ref so RAF loop can call closePreview
    const manualRef         = useRef(false); // true while user is controlling the snake
    const manualTimerRef    = useRef(null);  // timeout to revert to auto after 5 s
    const nextDirRef        = useRef(null);  // queued direction from latest keypress
    const postEatRef        = useRef(null);  // pending repositioning fn, run when preview closes

    const [preview,      setPreview]      = useState(null); // eating-triggered, pauses snake
    const [hoverPreview, setHoverPreview] = useState(null); // hover-triggered, snake keeps moving
    const [lightbox,     setLightbox]     = useState(null);
    const [computed, setComputed] = useState([]);
    const [viewport, setViewport] = useState({ w: 0, h: 0 });
    const [headCell, setHeadCell] = useState({ col: -1, row: -1 });

    const closePreview = useCallback(() => {
        if (autoCloseTimerRef.current) {
            clearTimeout(autoCloseTimerRef.current);
            autoCloseTimerRef.current = null;
        }
        previewRef.current = null;
        setPreview(null);
        pausedRef.current = false;
    }, []);

    closePreviewRef.current = closePreview;

    // Hover preview is fully independent — snake keeps moving, no timers
    const handleSquareHover = useCallback((id) => setHoverPreview(id),  []);
    const handleSquareLeave = useCallback(()    => setHoverPreview(null), []);

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx    = canvas.getContext('2d');
        let rafId;
        let lastTick = 0;

        function init() {
            canvas.width  = window.innerWidth;
            canvas.height = window.innerHeight;
            const cols = Math.floor(canvas.width  / CELL);
            const rows = Math.floor(canvas.height / CELL);

            const fz       = formZoneFor(cols, rows);
            const projects = randomisePositions(cols, rows);

            const startCol = Math.floor(cols * 0.12);
            const startRow = Math.floor(rows * 0.50);

            gRef.current = {
                cols, rows, projects, fz,
                snake: Array.from({ length: SNAKE_LEN }, (_, i) => ({
                    col: startCol - i, row: startRow,
                })),
                dir: 'r',
                targetIdx: nearestIdx({ col: startCol, row: startRow }, projects),
            };

            setViewport({ w: canvas.width, h: canvas.height });
            setComputed(projects.map(p => ({
                ...p,
                px: p.col * CELL,
                py: p.row * CELL,
            })));
        }

        function drawFrame(snake, projects, targetIdx, fz) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // ── Dashed indicator around current target ──
            const tgt = projects[targetIdx];
            if (tgt && previewRef.current !== tgt.id) {
                ctx.strokeStyle = 'rgba(0,0,0,0.13)';
                ctx.lineWidth   = 0.5;
                ctx.setLineDash([2, 4]);
                ctx.strokeRect(
                    tgt.col * CELL + 1.5, tgt.row * CELL + 1.5,
                    CELL - 2, CELL - 2
                );
                ctx.setLineDash([]);
            }

            // ── Snake body — uniform light gray ──
            ctx.fillStyle = '#BBBBBB';
            snake.forEach(({ col, row }) => {
                ctx.fillRect(col * CELL + 1, row * CELL + 1, CELL - 1, CELL - 1);
            });

            // ── Head overlay ──
            if (snake.length > 0) {
                const h = snake[0];
                if (manualRef.current) {
                    // Manual mode: darker head as indicator
                    ctx.fillStyle = '#444444';
                    ctx.fillRect(h.col * CELL + 1, h.row * CELL + 1, CELL - 1, CELL - 1);
                } else if (tgt) {
                    // Auto mode: tiny colored dot pointing at current target
                    const cx = h.col * CELL + CELL / 2 + 0.5;
                    const cy = h.row * CELL + CELL / 2 + 0.5;
                    ctx.fillStyle = tgt.color;
                    ctx.beginPath();
                    ctx.arc(cx, cy, 2, 0, Math.PI * 2);
                    ctx.fill();
                }
            }
        }

        function step(timestamp) {
            rafId = requestAnimationFrame(step);
            if (timestamp - lastTick < TICK_MS) return;
            lastTick = timestamp;

            const g = gRef.current;
            if (!g) return;

            if (pausedRef.current) {
                drawFrame(g.snake, g.projects, g.targetIdx, g.fz);
                return;
            }

            const { snake, dir, cols, rows, projects, fz } = g;
            const head   = snake[0];
            const target = projects[g.targetIdx];

            if (manualRef.current) {
                // Apply queued keypress if valid
                const qd = nextDirRef.current;
                if (qd && qd !== OPP[g.dir]) {
                    nextDirRef.current = null;
                    const [qdc, qdr] = DELTA[qd];
                    const qnc = ((head.col + qdc) % cols + cols) % cols;
                    const qnr = ((head.row + qdr) % rows + rows) % rows;
                    const bodyHit = snake.slice(0, -1).some(s => s.col === qnc && s.row === qnr);
                    if (!inZone(qnc, qnr, fz) && !bodyHit) g.dir = qd;
                    // else: blocked — keep current direction
                }
                // Safety: if current direction would hit something, let auto steer us clear
                const [cdc, cdr] = DELTA[g.dir];
                const cnc = ((head.col + cdc) % cols + cols) % cols;
                const cnr = ((head.row + cdr) % rows + rows) % rows;
                const bodyAhead = snake.slice(0, -1).some(s => s.col === cnc && s.row === cnr);
                if (inZone(cnc, cnr, fz) || bodyAhead) {
                    g.dir = bestDir(head, target, g.dir, cols, rows, fz, snake);
                }
            } else {
                g.dir = bestDir(head, target, dir, cols, rows, fz, snake);
            }

            const [dc, dr] = DELTA[g.dir];
            const newHead  = {
                col: ((head.col + dc) % cols + cols) % cols,
                row: ((head.row + dr) % rows + rows) % rows,
            };

            // Check all projects for a hit — in manual mode the user can land on any square
            const eatenIdx = projects.findIndex(p => p.col === newHead.col && p.row === newHead.row);
            const eating   = eatenIdx !== -1;
            const eaten    = eating ? projects[eatenIdx] : null;

            // Grow on eat, otherwise slide (drop tail)
            g.snake = eating ? [newHead, ...snake] : [newHead, ...snake.slice(0, -1)];

            setHeadCell({ col: newHead.col, row: newHead.row });

            if (eating && previewRef.current === null) {
                // Store repositioning so it can be triggered early by a keypress
                postEatRef.current = () => {
                    postEatRef.current = null;
                    const g2 = gRef.current;
                    if (!g2) return;
                    const newPos = randomNewPos(g2.cols, g2.rows, g2.fz, g2.snake, g2.projects, eatenIdx);
                    if (newPos) {
                        g2.projects[eatenIdx] = { ...eaten, col: newPos.col, row: newPos.row };
                        setComputed(prev => prev.map(p =>
                            p.id === eaten.id
                                ? { ...p, col: newPos.col, row: newPos.row, px: newPos.col * CELL, py: newPos.row * CELL }
                                : p
                        ));
                    }
                    g2.targetIdx = nearestIdx(g2.snake[0], g2.projects);
                };

                previewRef.current = eaten.id;
                setPreview(eaten.id);
                pausedRef.current = true;
                autoCloseTimerRef.current = setTimeout(() => {
                    closePreviewRef.current?.();
                    postEatRef.current?.();
                }, 3000);
            }

            drawFrame(g.snake, g.projects, g.targetIdx, g.fz);
        }

        const KEY_MAP = {
            ArrowUp: 'u', ArrowDown: 'd', ArrowLeft: 'l', ArrowRight: 'r',
            w: 'u', s: 'd', a: 'l', d: 'r',
            W: 'u', S: 'd', A: 'l', D: 'r',
        };
        function handleKey(e) {
            const d = KEY_MAP[e.key];
            if (!d) return;
            e.preventDefault();

            if (pausedRef.current) {
                // Any direction key dismisses the preview early
                if (autoCloseTimerRef.current) {
                    clearTimeout(autoCloseTimerRef.current);
                    autoCloseTimerRef.current = null;
                }
                closePreviewRef.current?.();   // close preview, resume movement
                postEatRef.current?.();         // run repositioning immediately if from eating
            }

            // Queue direction and enter / refresh manual mode
            nextDirRef.current = d;
            manualRef.current  = true;
            if (manualTimerRef.current) clearTimeout(manualTimerRef.current);
            manualTimerRef.current = setTimeout(() => {
                manualRef.current      = false;
                manualTimerRef.current = null;
            }, 5000);
        }

        init();
        window.addEventListener('resize', init);
        window.addEventListener('keydown', handleKey);
        rafId = requestAnimationFrame(step);

        return () => {
            cancelAnimationFrame(rafId);
            window.removeEventListener('resize', init);
            window.removeEventListener('keydown', handleKey);
            if (manualTimerRef.current) clearTimeout(manualTimerRef.current);
        };
    }, []);

    const byId = Object.fromEntries(computed.map(p => [p.id, p]));

    return (
        <>
            {/* CSS grid background — avoids Hermann grid illusion from canvas stroke intersections */}
            <div style={{
                position: 'fixed', inset: 0, zIndex: 0,
                background: '#F2F2F2',
                backgroundImage: [
                    `linear-gradient(#E0E0E0 1px, transparent 1px)`,
                    `linear-gradient(90deg, #E0E0E0 1px, transparent 1px)`,
                ].join(', '),
                backgroundSize: `${CELL}px ${CELL}px`,
                pointerEvents: 'none',
            }} />

            {/* Canvas layer — trail, target indicator, snake only (no grid) */}
            <div style={{ position: 'fixed', inset: 0, zIndex: 1, pointerEvents: 'none' }}>
                <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0 }} />
            </div>

            {/* Project squares — z-index 20, above form overlay */}
            <div style={{ position: 'fixed', inset: 0, zIndex: 20, pointerEvents: 'none' }}>
                {computed.map(p => {
                    const isActive = preview === p.id;
                    const snakeOn  = headCell.col === p.col && headCell.row === p.row;
                    return (
                        <div
                            key={p.id}
                            onMouseEnter={() => handleSquareHover(p.id)}
                            onMouseLeave={handleSquareLeave}
                            style={{
                                position:        'absolute',
                                // Fill the full cell interior — grid line acts as border
                                left:            p.px + 1,
                                top:             p.py + 1,
                                width:           CELL - 1,
                                height:          CELL - 1,
                                backgroundColor: p.color,
                                cursor:          'default',
                                pointerEvents:   'auto',
                                outline:         snakeOn || isActive
                                    ? `2px solid ${p.color}`
                                    : 'none',
                                outlineOffset:   '2px',
                                transition:      'outline 0.1s',
                            }}
                        />
                    );
                })}
            </div>

            {/* Eating preview — pauses snake, auto-closes after 3 s */}
            {preview != null && byId[preview] && (
                <PreviewCard
                    project={byId[preview]}
                    onClose={closePreview}
                    onExpand={() => setLightbox(preview)}
                    vw={viewport.w}
                    vh={viewport.h}
                />
            )}

            {/* Hover preview — snake keeps moving, closes on mouse-leave */}
            {hoverPreview != null && byId[hoverPreview] && (
                <PreviewCard
                    project={byId[hoverPreview]}
                    onClose={handleSquareLeave}
                    onExpand={() => setLightbox(hoverPreview)}
                    vw={viewport.w}
                    vh={viewport.h}
                />
            )}

            {/* Lightbox */}
            {lightbox != null && byId[lightbox] && (
                <Lightbox
                    project={byId[lightbox]}
                    onClose={() => setLightbox(null)}
                />
            )}
        </>
    );
}
