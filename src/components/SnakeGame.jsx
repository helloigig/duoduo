'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { CELL, FORM_COLS, FORM_ROWS } from '@/lib/grid';
import { PROJECTS } from '@/lib/projects';

// ── CONFIG ────────────────────────────────────────────────────────────────────
const TICK_MS   = 160;
const SNAKE_LEN = 4;
const SQ        = 1;    // project square = 1 grid cell
const MIN_DIST  = 2;    // min cell distance between project squares
const EDGE      = 1;    // cells clear from viewport edge

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
 * BFS open-space count from (col, row), blocked by body + form zone.
 * Capped at CAP to stay fast; returns how many free cells are reachable.
 */
function floodCount(col, row, cols, rows, fz, bodySet) {
    const CAP     = 200;
    const visited = new Set([`${col},${row}`]);
    const queue   = [[col, row]];
    while (queue.length > 0 && visited.size < CAP) {
        const [c, r] = queue.shift();
        for (const [dc, dr] of [[1,0],[-1,0],[0,1],[0,-1]]) {
            const nc  = ((c + dc) % cols + cols) % cols;
            const nr  = ((r + dr) % rows + rows) % rows;
            const key = `${nc},${nr}`;
            if (!visited.has(key) && !bodySet.has(key) && !inZone(nc, nr, fz)) {
                visited.add(key);
                queue.push([nc, nr]);
            }
        }
    }
    return visited.size;
}

/**
 * Pick the best next direction toward target, avoiding the form zone.
 * Uses flood fill to avoid directions that lead into a dead end (coiling).
 * Never reverses. Falls back to any valid direction if needed.
 */
function bestDir(head, target, curDir, cols, rows, fz, snake) {
    const dx       = target.col - head.col;
    const dy       = target.row - head.row;
    // Body cells the head must not enter (tail will vacate, so exclude it)
    const body     = new Set((snake ?? []).slice(0, -1).map(s => `${s.col},${s.row}`));
    const snakeLen = (snake ?? []).length;

    function nextCell(d) {
        const [dc, dr] = DELTA[d];
        return {
            col: ((head.col + dc) % cols + cols) % cols,
            row: ((head.row + dr) % rows + rows) % rows,
        };
    }

    function safe(d) {
        if (d === OPP[curDir]) return false;
        const { col: nc, row: nr } = nextCell(d);
        return !inZone(nc, nr, fz) && !body.has(`${nc},${nr}`);
    }

    // Straight-line preference: keep going if already heading toward the target
    // and the path ahead has adequate open space. This produces L-shaped paths
    // instead of diagonal zigzags (which happen when the dominant axis is
    // re-evaluated every tick).
    const isTowardTarget =
        (curDir === 'r' && dx > 0) || (curDir === 'l' && dx < 0) ||
        (curDir === 'd' && dy > 0) || (curDir === 'u' && dy < 0);
    if (isTowardTarget && safe(curDir)) {
        const { col: nc, row: nr } = nextCell(curDir);
        if (floodCount(nc, nr, cols, rows, fz, body) >= snakeLen) return curDir;
    }

    // Build candidate order:
    //   1. Toward target (largest gap first)
    //   2. Perpendicular
    //   3. Everything else (including away)
    const preferred = [];
    if (dx !== 0) preferred.push([dx > 0 ? 'r' : 'l', Math.abs(dx)]);
    if (dy !== 0) preferred.push([dy > 0 ? 'd' : 'u', Math.abs(dy)]);
    preferred.sort((a, b) => b[1] - a[1]);

    const prefDirs = preferred.map(([d]) => d);
    const away     = prefDirs.map(d => OPP[d]);
    const all4     = ['r', 'l', 'u', 'd'];
    const seen     = new Set();
    const ordered  = [
        ...prefDirs,
        ...all4.filter(d => !away.includes(d)),
        ...all4,
    ].filter(d => { if (seen.has(d)) return false; seen.add(d); return true; });

    const safeDirs = ordered.filter(d => safe(d));

    if (safeDirs.length === 0) {
        // Last resort: avoid form zone, allow body collision
        for (const d of ordered) {
            if (d === OPP[curDir]) continue;
            const { col: nc, row: nr } = nextCell(d);
            if (!inZone(nc, nr, fz)) return d;
        }
        return curDir;
    }

    // Score each safe direction by open space after moving there.
    // This prevents the snake from greedily entering a dead end and coiling.
    const scored = safeDirs.map(d => {
        const { col: nc, row: nr } = nextCell(d);
        return { d, space: floodCount(nc, nr, cols, rows, fz, body) };
    });

    // Prefer directions with enough room (>= snake length).
    // Among those, return the first in preferred order (toward target).
    const adequate = scored.filter(s => s.space >= snakeLen);
    if (adequate.length > 0) return adequate[0].d;

    // All paths are tight — pick the roomiest to maximise survival
    scored.sort((a, b) => b.space - a.space);
    return scored[0].d;
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
                    border: '1px solid #d8d8d8',
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
                    borderTop: '1px solid #e8e8e8',
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
                border: '1px solid #d8d8d8',
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
                borderTop: '1px solid #e8e8e8',
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

            // Extend zone upward to also cover the title above the input box
            const fzBase   = formZoneFor(cols, rows);
            const fz       = { ...fzBase, r1: Math.max(0, fzBase.r1 - 1) };
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

        function drawFrame(snake, projects, targetIdx, fz, timestamp) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // ── Dashed indicator around current target ──
            const tgt = projects[targetIdx];
            if (tgt && previewRef.current !== tgt.id) {
                ctx.strokeStyle = 'rgba(0,0,0,0.07)';
                ctx.lineWidth   = 0.5;
                ctx.setLineDash([2, 4]);
                ctx.strokeRect(
                    tgt.col * CELL + 0.5, tgt.row * CELL + 0.5,
                    CELL - 1, CELL - 1
                );
                ctx.setLineDash([]);
            }

            // ── Snake body — 45×45 rounded squares, corners create natural separation ──
            const R = 12;
            snake.forEach(({ col, row }) => {
                ctx.fillStyle = 'rgba(183,234,16,0.3)';
                ctx.beginPath();
                ctx.roundRect(col * CELL, row * CELL, CELL, CELL, R);
                ctx.fill();
            });

            // ── Head — full lime ──
            if (snake.length > 0) {
                const h = snake[0];
                ctx.fillStyle = 'rgba(183,234,16,1)';
                ctx.beginPath();
                ctx.roundRect(h.col * CELL, h.row * CELL, CELL, CELL, R);
                ctx.fill();
            }
        }

        function step(timestamp) {
            rafId = requestAnimationFrame(step);
            if (timestamp - lastTick < TICK_MS) return;
            lastTick = timestamp;

            const g = gRef.current;
            if (!g) return;

            if (pausedRef.current) {
                drawFrame(g.snake, g.projects, g.targetIdx, g.fz, timestamp);
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

            // Hard block: never enter the form zone
            if (inZone(newHead.col, newHead.row, fz)) {
                drawFrame(g.snake, g.projects, g.targetIdx, g.fz, timestamp);
                return;
            }

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

            drawFrame(g.snake, g.projects, g.targetIdx, g.fz, timestamp);
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
            <style>{`
                @keyframes limeBlob1 {
                    0%   { transform: translate(0px,    0px)   scale(1);    }
                    20%  { transform: translate(140px, -100px) scale(1.12); }
                    45%  { transform: translate(60px,   130px) scale(0.92); }
                    70%  { transform: translate(-120px,  50px) scale(1.06); }
                    100% { transform: translate(0px,    0px)   scale(1);    }
                }
                @keyframes limeBlob2 {
                    0%   { transform: translate(0px,   0px)    scale(1);    }
                    30%  { transform: translate(-130px, 80px)  scale(0.88); }
                    55%  { transform: translate(90px,  -110px) scale(1.14); }
                    80%  { transform: translate(50px,   60px)  scale(0.96); }
                    100% { transform: translate(0px,   0px)    scale(1);    }
                }
                @keyframes limeBlob3 {
                    0%   { transform: translate(0px,   0px)    scale(1);    }
                    35%  { transform: translate(80px,  150px)  scale(1.08); }
                    65%  { transform: translate(-100px,-80px)  scale(0.9);  }
                    100% { transform: translate(0px,   0px)    scale(1);    }
                }
                @keyframes limeBlob4 {
                    0%   { transform: translate(0px,   0px)   scale(1);    }
                    40%  { transform: translate(-60px, -120px) scale(1.1);  }
                    75%  { transform: translate(110px,  70px)  scale(0.93); }
                    100% { transform: translate(0px,   0px)   scale(1);    }
                }
            `}</style>

            {/* Solid gray base */}
            <div style={{
                position: 'fixed', inset: 0, zIndex: 0,
                background: '#F0F0F0',
                pointerEvents: 'none',
            }} />

            {/* Lime liquid blobs — float beneath the frosted glass grid */}
            <div style={{ position: 'fixed', inset: 0, zIndex: 0, overflow: 'hidden', pointerEvents: 'none' }}>
                <div style={{
                    position: 'absolute', width: '60vw', height: '60vh',
                    left: '5%', top: '50%',
                    background: 'radial-gradient(ellipse, rgba(183,234,16,0.65) 0%, transparent 70%)',
                    filter: 'blur(55px)',
                    animation: 'limeBlob1 9s ease-in-out infinite',
                }} />
                <div style={{
                    position: 'absolute', width: '50vw', height: '50vh',
                    left: '60%', top: '5%',
                    background: 'radial-gradient(ellipse, rgba(183,234,16,0.5) 0%, transparent 70%)',
                    filter: 'blur(65px)',
                    animation: 'limeBlob2 13s ease-in-out infinite',
                }} />
                <div style={{
                    position: 'absolute', width: '35vw', height: '40vh',
                    left: '35%', top: '35%',
                    background: 'radial-gradient(ellipse, rgba(183,234,16,0.35) 0%, transparent 70%)',
                    filter: 'blur(45px)',
                    animation: 'limeBlob3 17s ease-in-out infinite',
                }} />
                <div style={{
                    position: 'absolute', width: '30vw', height: '35vh',
                    left: '75%', top: '60%',
                    background: 'radial-gradient(ellipse, rgba(183,234,16,0.4) 0%, transparent 70%)',
                    filter: 'blur(50px)',
                    animation: 'limeBlob4 11s ease-in-out infinite',
                }} />
            </div>

            {/* Frosted glass cells — backdrop-filter masked to rounded rects */}
            <div style={{
                position: 'fixed', inset: 0, zIndex: 0,
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                background: 'rgba(255,255,255,0.25)',
                WebkitMaskImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='${CELL}' height='${CELL}'%3E%3Crect x='0' y='0' width='${CELL}' height='${CELL}' rx='12' ry='12' fill='white'/%3E%3C/svg%3E")`,
                maskImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='${CELL}' height='${CELL}'%3E%3Crect x='0' y='0' width='${CELL}' height='${CELL}' rx='12' ry='12' fill='white'/%3E%3C/svg%3E")`,
                WebkitMaskSize: `${CELL}px ${CELL}px`,
                maskSize: `${CELL}px ${CELL}px`,
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
                                position:          'absolute',
                                left:              p.px,
                                top:               p.py,
                                width:             CELL,
                                height:            CELL,
                                background:        'rgba(232, 247, 119, 0.45)',
                                borderRadius:      12,
                                backdropFilter:    'blur(8px)',
                                WebkitBackdropFilter: 'blur(8px)',
                                boxShadow:         'inset 0 0 16px rgba(183,234,16,0.55)',
                                cursor:            'pointer',
                                pointerEvents:     'auto',
                                opacity:           snakeOn ? 0 : isActive ? 0.5 : 1,
                                transition:        'opacity 0.15s',
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
