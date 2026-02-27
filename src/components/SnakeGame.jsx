'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { CELL, FORM_COLS, FORM_ROWS } from '@/lib/grid';

// ── CONFIG ────────────────────────────────────────────────────────────────────
const TICK_MS   = 160;
const SNAKE_LEN = 8;
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

/**
 * Pick the best next direction toward target, avoiding the form zone.
 * Never reverses. Falls back to any valid direction if needed.
 */
function bestDir(head, target, curDir, cols, rows, fz) {
    const dx = target.col - head.col;
    const dy = target.row - head.row;

    // Build candidate list ordered by alignment with target
    const preferred = [];
    if (dx !== 0) preferred.push([dx > 0 ? 'r' : 'l', Math.abs(dx)]);
    if (dy !== 0) preferred.push([dy > 0 ? 'd' : 'u', Math.abs(dy)]);
    preferred.sort((a, b) => b[1] - a[1]);

    const all4 = ['r', 'l', 'u', 'd'];
    const seen  = new Set();
    const ordered = [
        ...preferred.map(([d]) => d),
        ...all4,
    ].filter(d => { if (seen.has(d)) return false; seen.add(d); return true; });

    // First pass: prefer directions that avoid form zone
    for (const d of ordered) {
        if (d === OPP[curDir]) continue;
        const [dc, dr] = DELTA[d];
        const nc = ((head.col + dc) % cols + cols) % cols;
        const nr = ((head.row + dr) % rows + rows) % rows;
        if (!inZone(nc, nr, fz)) return d;
    }

    // Second pass: allow form zone if truly surrounded (edge case)
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
    const autoCloseTimerRef = useRef(null);  // timeout id for auto-closing preview
    const closePreviewRef   = useRef(null);  // stable ref to closePreview for use inside RAF

    const [preview,  setPreview]  = useState(null);
    const [lightbox, setLightbox] = useState(null);
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
        if (gRef.current) {
            gRef.current.targetIdx =
                (gRef.current.targetIdx + 1) % gRef.current.projects.length;
        }
    }, []);

    // Keep ref in sync so the RAF loop can call closePreview without closure issues
    closePreviewRef.current = closePreview;

    // Toggle: first click opens, second click closes
    const handleSquareClick = useCallback((id) => {
        if (previewRef.current === id) {
            closePreview();
        } else {
            previewRef.current = id;
            setPreview(id);
            pausedRef.current = true;
            if (gRef.current) {
                const idx = gRef.current.projects.findIndex(p => p.id === id);
                if (idx !== -1) gRef.current.targetIdx = idx;
            }
        }
    }, [closePreview]);

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
                targetIdx: 0,
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

            // ── Snake — uniform light gray, fills full cell interior ──
            ctx.fillStyle = '#BBBBBB';
            snake.forEach(({ col, row }) => {
                ctx.fillRect(col * CELL + 1, row * CELL + 1, CELL - 1, CELL - 1);
            });

            // ── Tiny dot on head indicating next target project ──
            if (snake.length > 0 && tgt) {
                const head = snake[0];
                const cx = head.col * CELL + CELL / 2 + 0.5;
                const cy = head.row * CELL + CELL / 2 + 0.5;
                ctx.fillStyle = tgt.color;
                ctx.beginPath();
                ctx.arc(cx, cy, 2, 0, Math.PI * 2);
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
                drawFrame(g.snake, g.projects, g.targetIdx, g.fz);
                return;
            }

            const { snake, dir, cols, rows, projects, fz } = g;
            const head   = snake[0];
            const target = projects[g.targetIdx];

            g.dir = bestDir(head, target, dir, cols, rows, fz);

            const [dc, dr] = DELTA[g.dir];
            const newHead  = {
                col: ((head.col + dc) % cols + cols) % cols,
                row: ((head.row + dr) % rows + rows) % rows,
            };
            g.snake = [newHead, ...snake.slice(0, -1)];

            setHeadCell({ col: newHead.col, row: newHead.row });

            // When snake reaches target, open its preview then auto-close after 2 s
            if (newHead.col === target.col && newHead.row === target.row) {
                if (previewRef.current === null) {
                    previewRef.current = target.id;
                    setPreview(target.id);
                    pausedRef.current = true;
                    autoCloseTimerRef.current = setTimeout(
                        () => closePreviewRef.current?.(),
                        2000
                    );
                }
            }

            drawFrame(g.snake, g.projects, g.targetIdx, g.fz);
        }

        init();
        window.addEventListener('resize', init);
        rafId = requestAnimationFrame(step);

        return () => {
            cancelAnimationFrame(rafId);
            window.removeEventListener('resize', init);
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
                            onClick={() => handleSquareClick(p.id)}
                            onMouseEnter={() => {
                                // Redirect snake toward this square on hover
                                if (gRef.current && !pausedRef.current) {
                                    const idx = gRef.current.projects.findIndex(q => q.id === p.id);
                                    if (idx !== -1) gRef.current.targetIdx = idx;
                                }
                            }}
                            style={{
                                position:        'absolute',
                                // Fill the full cell interior — grid line acts as border
                                left:            p.px + 1,
                                top:             p.py + 1,
                                width:           CELL - 1,
                                height:          CELL - 1,
                                backgroundColor: p.color,
                                cursor:          'pointer',
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

            {/* Preview card */}
            {preview != null && byId[preview] && (
                <PreviewCard
                    project={byId[preview]}
                    onClose={closePreview}
                    onExpand={() => setLightbox(preview)}
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
