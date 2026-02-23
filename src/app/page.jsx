'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import aboutStyles from './about/about.module.css';
import homeStyles from '@/styles/Home.module.css';

function TitleDuoduo({ styles }) {
    const [hovered, setHovered] = useState(false);
    return (
        <span
            className={styles.titleDuoduo}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
        >
            <em style={{ color: hovered ? '#FF2EDC' : 'inherit' }}>duoduo</em>
            {' '}
            <img
                src={hovered ? '/avatar-pink.svg' : '/avatar-black.svg'}
                className={styles.titleAvatar}
                style={{ transform: hovered ? 'rotate(10deg)' : 'rotate(0deg)' }}
                alt=""
            />
        </span>
    );
}

// ── AI SYSTEM PROMPT ──────────────────────────────────────────────────────────
const SYS = `You are the first person someone speaks to when they reach out to duoduo — a boutique product design studio founded by Kiwi and Gigi, operating between London and Shenzhen.

Your role is reception and account executive. You are warm, perceptive, and specific. You make people feel genuinely understood — not processed. You speak like a thoughtful designer who's worked closely with founders, not like a chatbot or a form.

Your goal: make them feel seen, share a genuine insight about what you hear in their situation, and invite them into a real conversation with the team.

ABOUT THE FOUNDERS — use this to personalise the "invite" field when relevant:
— Kiwi: strong background in hardware and lighting product design, HCI graduate. Brings systems thinking and physical-digital interaction — specifically the interaction and interface layer of hardware products.
— Gigi: background in fashion and brand, HCI graduate. Brings taste, identity thinking, and sensitivity to how a product feels and presents itself to the world.
Together: they bridge the gap between how something looks, how it works, and how it gets made. When the client's situation touches any of these areas, weave in the relevant perspective naturally — don't list credentials, just let the thinking show.
IMPORTANT SCOPE LIMIT: duoduo does not do industrial design. For hardware or physical products, the work is strictly limited to interaction design and digital/screen interfaces — never form, materials, or manufacturing.

Silently detect whether this is a new product (building from scratch) or a redesign (something exists that isn't working). Shape your response accordingly — don't name the detection.

OUTPUT — respond only in valid JSON, no markdown fences:
{
  "needs_more_info": false,
  "follow_up_question": "",
  "read": "1 sentence max. The core demand — distilled to its essence. What they actually need, not what they described. Sharp and specific. Never start with 'Your challenge is' or 'It sounds like'.",
  "approach": "3–4 sentences focused purely on how duoduo would tackle this — the method, the angle, the first move. No mention of founders or credentials. The approach itself is the only thing.",
  "invite": "1–2 sentences. A specific, genuine reason why a 30-min conversation would move things forward — tied directly to something they said. If one founder's background is directly relevant, name them and explain concretely why their experience matters for this specific situation (e.g. 'Kiwi has spent years on hardware interaction interfaces and will immediately see where the physical-to-screen handoff is breaking down' or 'Gigi's brand background means she'll spot within minutes whether the identity problem is upstream of the UX'). One name only, never forced — omit entirely if it doesn't genuinely fit.",
  "timeline": "X–Y weeks",
  "investment": {
    "tier": "One of: Strategy / MVP / Full Product / Enterprise",
    "range": "$X,XXX–$X,XXX",
    "reason": "1 short sentence explaining why this tier fits their situation."
  }
}

QUALITY BAR:
— "read" is the trust-builder. It should feel like insight from someone who's been in the room with dozens of founders. Not a reflection of their words. A new angle.
— "approach" is specific to their situation. Not "we'll audit your UX". More like "we'd start by mapping where users lose confidence in the checkout flow, because that's usually where the real drop-off is — and fixing it rarely requires a redesign, just a clearer hierarchy at two or three key moments." Give them a real point of view, not a process.
— "invite" makes the call feel worth having, not like a sales step. If a founder is mentioned, explain precisely why their background is relevant to this client's specific problem — not just that they have experience, but what that experience means for the client's situation right now.

IF input is too vague (under 15 words with no real context): set needs_more_info=true and ask one warm, specific question that helps you understand what they're actually dealing with.

INVESTMENT TIERS:
Map the client's situation to the most fitting tier based on scope, complexity, and what they described.

— Strategy        $1,500–3,000    Direction, research, or a focused audit. No full design execution.
— MVP             $8,000–15,000   One core flow or product surface, designed and ready to build or test.
— Full Product    $18,000–35,000  End-to-end product design — multiple flows, systems, handoff-ready.
— Enterprise      $40,000+        Complex systems, multiple platforms, or org-wide design work.

Slide within the range based on signals: number of surfaces, platforms, whether a design system is needed, research depth, existing assets. Be honest — if it's genuinely unclear, pick the lower end and say so in "reason".`;

// ── PROJECT DATA ──────────────────────────────────────────────────────────────

const LEFT_PROJECTS = [
    { name: 'Dify', tag: 'Website Design', subtitle: 'AI Platform', preview: '/Dify.mp4', isVideo: true, url: 'https://dify.ai' },
    { name: 'AnyApp', tag: 'UI/UX Design', subtitle: 'AI Widgets App', preview: '/AnyApp.png' },
    { name: 'AI Platform', tag: 'UI/UX Design', subtitle: 'AI Dashboard', preview: '/aiplatform.png' },
    { name: 'Cuto', tag: 'Redesign', subtitle: 'Wallpaper App', preview: '/cuto.png', url: 'https://apps.apple.com/us/app/cuto-wallpaper/id1068086465' },
];

const RIGHT_PROJECTS = [
    { name: 'Bloc1', tag: 'UI/UX Design', subtitle: 'Climbing Gym App', preview: '/Bloc1.png' },
    { name: 'Kendall Common', tag: 'Website Design', subtitle: 'Real Estate', preview: '/kendall common.mp4', isVideo: true, url: 'https://kendallcommon.com' },
    { name: 'Galeta', tag: 'Website Design', subtitle: 'Bakery', preview: '/galeta.mp4', isVideo: true, url: 'https://galeta.co.uk' },
    { name: 'Basecamp Research', tag: 'Website Design', subtitle: 'Research Institute', preview: '/BCR.mp4', isVideo: true, url: 'https://basecamp-research.com' },
];

const ALL_PROJECTS = [...LEFT_PROJECTS, ...RIGHT_PROJECTS];
const MOBILE_ITEM_HEIGHT = 52;
const LOOP_COUNT = 20;
const LOOPED_PROJECTS = Array.from({ length: LOOP_COUNT }, () => ALL_PROJECTS).flat();

// ── COMBINED PAGE ─────────────────────────────────────────────────────────────
export default function Home() {
    // About state
    const [mainInput, setMainInput] = useState('');
    const [submittedText, setSubmittedText] = useState('');
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(false);
    const [followup, setFollowup] = useState(null);
    const [followupInput, setFollowupInput] = useState('');
    const [result, setResult] = useState(null);
    const [error, setError] = useState('');
    const [ctaVisible, setCtaVisible] = useState(false);
    const resultRef = useRef(null);
    const pageRef = useRef(null);
    const canSubmit = mainInput.trim().length >= 8 && !loading;

    // Portfolio state
    const total = ALL_PROJECTS.length;
    const [activeStep, setActiveStep] = useState(0);
    const pausedRef = useRef(false);
    const scrollContainerRef = useRef(null);
    const isRecentering = useRef(false);
    const scrollTimeout = useRef(null);
    const carouselRef = useRef(null);
    const desktopItemRefs = useRef([]);
    const desktopLoopIdxRef = useRef(0);
    const mobilePreviewRef = useRef(null);
    const activeStepRef = useRef(activeStep);
    activeStepRef.current = activeStep;
    const midStart = Math.floor(LOOP_COUNT / 2) * total;

    const scrollToLoopItem = useCallback((idx, smooth = true) => {
        const el = carouselRef.current;
        const item = desktopItemRefs.current[idx];
        if (!el || !item) return;
        el.scrollTo({
            top: item.offsetTop - (el.clientHeight - item.offsetHeight) / 2,
            behavior: smooth ? 'smooth' : 'auto',
        });
    }, []);

    const pause = useCallback(() => { pausedRef.current = true; }, []);
    const resume = useCallback(() => { pausedRef.current = false; }, []);

    // ── About handlers ────────────────────────────────────────────────────────
    const handleMainKeyDown = (e) => {
        if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') handleSubmit();
    };

    const callAPI = useCallback(async (msgs) => {
        try {
            const res = await fetch('/api/brief', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ messages: msgs, system: SYS }),
            });
            const data = await res.json();
            if (data.error) { setLoading(false); setError(data.error); return; }
            const raw = data.text || '';
            setLoading(false);
            let parsed;
            try { parsed = JSON.parse(raw.replace(/```json|```/g, '').trim()); }
            catch { setError('Something went wrong — please try again.'); return; }

            if (parsed.needs_more_info && parsed.follow_up_question) {
                setFollowup({ question: parsed.follow_up_question });
            } else {
                setResult(parsed);
                setTimeout(() => {
                    setCtaVisible(true);
                    resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }, 200);
            }
        } catch {
            setLoading(false);
            setError('Could not connect. Please try again.');
        }
    }, []);

    const handleSubmit = useCallback(async () => {
        if (!canSubmit) return;
        setResult(null);
        setFollowup(null);
        setError('');
        setCtaVisible(false);
        setLoading(true);
        const trimmed = mainInput.trim();
        setSubmittedText(trimmed);
        const msgs = [{ role: 'user', content: trimmed }];
        setHistory(msgs);
        await callAPI(msgs);
    }, [canSubmit, mainInput, callAPI]);

    const handleFollowup = useCallback(async () => {
        if (!followupInput.trim()) return;
        const msgs = [
            ...history,
            { role: 'assistant', content: followup.question },
            { role: 'user', content: followupInput.trim() },
        ];
        setHistory(msgs);
        setFollowup(null);
        setFollowupInput('');
        setLoading(true);
        await callAPI(msgs);
    }, [followupInput, history, followup, callAPI]);

    const restart = () => {
        setResult(null);
        setFollowup(null);
        setError('');
        setCtaVisible(false);
        setLoading(false);
        setMainInput('');
        setSubmittedText('');
        setHistory([]);
    };

    const openCall = () => window.dispatchEvent(new CustomEvent('open-cal'));

    // ── Scroll-to-top event (triggered by avatar click in PageShell) ──────────
    useEffect(() => {
        const handler = () => pageRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
        window.addEventListener('scroll-to-top', handler);
        return () => window.removeEventListener('scroll-to-top', handler);
    }, []);

    // ── Portfolio effects ─────────────────────────────────────────────────────

    // Mobile: init scroll position
    useEffect(() => {
        const el = scrollContainerRef.current;
        if (el) el.scrollTop = midStart * MOBILE_ITEM_HEIGHT;
    }, [midStart]);

    // Mobile: detect active item on scroll + infinite loop recenter
    useEffect(() => {
        const el = scrollContainerRef.current;
        if (!el) return;
        const lowerBound = total * 3 * MOBILE_ITEM_HEIGHT;
        const upperBound = total * (LOOP_COUNT - 3) * MOBILE_ITEM_HEIGHT;

        const handleScroll = () => {
            if (isRecentering.current) return;
            const containerCenter = el.scrollTop + el.clientHeight / 2;
            const idx = Math.floor(containerCenter / MOBILE_ITEM_HEIGHT);
            const realIdx = ((idx % total) + total) % total;
            setActiveStep(realIdx);
            if (el.scrollTop < lowerBound || el.scrollTop > upperBound) {
                isRecentering.current = true;
                const currentIdx = Math.round(el.scrollTop / MOBILE_ITEM_HEIGHT);
                const equivalent = (currentIdx % total) + midStart;
                el.style.scrollBehavior = 'auto';
                el.scrollTop = equivalent * MOBILE_ITEM_HEIGHT;
                el.style.scrollBehavior = '';
                requestAnimationFrame(() => { isRecentering.current = false; });
            }
            pausedRef.current = true;
            clearTimeout(scrollTimeout.current);
            scrollTimeout.current = setTimeout(() => { pausedRef.current = false; }, 2000);
        };

        el.addEventListener('scroll', handleScroll, { passive: true });
        return () => el.removeEventListener('scroll', handleScroll);
    }, [total, midStart]);

    // Desktop carousel: init scroll to middle of looped list
    useEffect(() => {
        const id = requestAnimationFrame(() => {
            desktopLoopIdxRef.current = midStart;
            scrollToLoopItem(midStart, false);
        });
        return () => cancelAnimationFrame(id);
    }, [midStart, scrollToLoopItem]);

    // Desktop carousel: detect active item + infinite loop recentering
    useEffect(() => {
        const el = carouselRef.current;
        if (!el) return;

        const handleScroll = () => {
            const center = el.scrollTop + el.clientHeight / 2;
            let closestIdx = midStart;
            let minDist = Infinity;
            desktopItemRefs.current.forEach((item, i) => {
                if (!item) return;
                const dist = Math.abs((item.offsetTop + item.offsetHeight / 2) - center);
                if (dist < minDist) { minDist = dist; closestIdx = i; }
            });

            setActiveStep(((closestIdx % total) + total) % total);
            desktopLoopIdxRef.current = closestIdx;

            // Silently recenter when near edges
            if (closestIdx < total * 3 || closestIdx > LOOPED_PROJECTS.length - total * 3) {
                const equivalent = midStart + (((closestIdx % total) + total) % total);
                const target = desktopItemRefs.current[equivalent];
                if (target) {
                    el.style.scrollBehavior = 'auto';
                    el.scrollTop = target.offsetTop - (el.clientHeight - target.offsetHeight) / 2;
                    el.style.scrollBehavior = '';
                    desktopLoopIdxRef.current = equivalent;
                }
            }

            pausedRef.current = true;
            clearTimeout(scrollTimeout.current);
            scrollTimeout.current = setTimeout(() => { pausedRef.current = false; }, 2000);
        };

        el.addEventListener('scroll', handleScroll, { passive: true });
        return () => el.removeEventListener('scroll', handleScroll);
    }, [total, midStart]);

    // Auto-advance
    useEffect(() => {
        let interval;

        const advance = () => {
            if (pausedRef.current) return;
            const isMobile = window.innerWidth <= 768;
            if (isMobile && scrollContainerRef.current) {
                scrollContainerRef.current.scrollBy({ top: MOBILE_ITEM_HEIGHT, behavior: 'smooth' });
            } else if (!isMobile) {
                let nextIdx = desktopLoopIdxRef.current + 1;
                if (nextIdx > LOOPED_PROJECTS.length - total * 3) {
                    nextIdx = midStart + (nextIdx % total);
                }
                desktopLoopIdxRef.current = nextIdx;
                setActiveStep(nextIdx % total);
                scrollToLoopItem(nextIdx);
            }
        };

        const start = () => { interval = setInterval(advance, 8000); };
        const stop = () => clearInterval(interval);

        // Restart interval fresh when tab regains focus to prevent accumulated callbacks
        const handleVisibility = () => {
            if (document.hidden) { stop(); } else { stop(); start(); }
        };

        document.addEventListener('visibilitychange', handleVisibility);
        start();

        return () => {
            stop();
            document.removeEventListener('visibilitychange', handleVisibility);
        };
    }, [total, midStart, scrollToLoopItem]);

    // ── Render ────────────────────────────────────────────────────────────────
    return (
        <div className={aboutStyles.combinedPage} ref={pageRef}>

            {/* ── ABOUT SECTION ── */}
            <div className={aboutStyles.aboutSection}>
                <div className={aboutStyles.inner}>

                    {/* Form — hidden after submit */}
                    {!result && !loading && !followup && (
                        <div className={aboutStyles.formSectionCentered}>
                            <h1 className={aboutStyles.pageTitle}>
                                How could <TitleDuoduo styles={aboutStyles} /> help you?
                            </h1>
                            <div className={aboutStyles.inputCard}>
                                <div className={aboutStyles.mainWrap}>
                                    <label className={aboutStyles.fieldLabel}>Tell us what you're working on</label>
                                    <textarea
                                        className={aboutStyles.mainTextarea}
                                        rows={5}
                                        value={mainInput}
                                        onChange={(e) => setMainInput(e.target.value)}
                                        onKeyDown={handleMainKeyDown}
                                        placeholder="What are you building or fixing, and what's making it hard right now? A few sentences is enough."
                                    />
                                </div>
                                <div className={aboutStyles.cardFoot}>
                                    <span className={aboutStyles.footHint}>⌘↩ to send</span>
                                    <button className={aboutStyles.submitBtn} onClick={handleSubmit} disabled={!canSubmit}>
                                        {loading && <span className={aboutStyles.spinner} />}
                                        <span>{loading ? 'Reading…' : 'Send'}</span>
                                    </button>
                                </div>
                            </div>
                            {error && <div className={aboutStyles.error}>{error}</div>}
                        </div>
                    )}

                    {/* Quote — shown after submit */}
                    {(result || loading || followup) && submittedText && (
                        <div className={aboutStyles.submittedTop}>
                            <blockquote className={aboutStyles.userQuote}>{submittedText}</blockquote>
                        </div>
                    )}

                    {/* Loading */}
                    {loading && (
                        <div className={aboutStyles.loading}>
                            <div className={aboutStyles.dots}>
                                <span className={aboutStyles.dot} />
                                <span className={aboutStyles.dot} />
                                <span className={aboutStyles.dot} />
                            </div>
                            <div className={aboutStyles.loadingMsg}>Thinking about your situation…</div>
                        </div>
                    )}

                    {/* Follow-up */}
                    {followup && (
                        <div className={aboutStyles.followup}>
                            <div className={aboutStyles.fqHead}>
                                <div className={aboutStyles.fqEye}>One question</div>
                                <div className={aboutStyles.fqQ}>{followup.question}</div>
                            </div>
                            <div className={aboutStyles.fqBody}>
                                <textarea
                                    className={aboutStyles.fqTextarea}
                                    value={followupInput}
                                    onChange={(e) => setFollowupInput(e.target.value)}
                                    placeholder="Your answer…"
                                    rows={2}
                                    autoFocus
                                />
                                <button className={aboutStyles.fqBtn} onClick={handleFollowup}>Continue →</button>
                            </div>
                        </div>
                    )}

                    {/* Result */}
                    {result && (
                        <div className={aboutStyles.result} ref={resultRef}>
                            <div className={aboutStyles.reframe}>
                                <div className={aboutStyles.reframeEye}>What we hear</div>
                                <div className={aboutStyles.reframeBody}>{result.read}</div>
                            </div>
                            <div className={aboutStyles.approachCard}>
                                <div className={aboutStyles.approachEye}>How we'd approach this</div>
                                <div className={aboutStyles.approachBody}>{result.approach}</div>
                            </div>
                            <div className={aboutStyles.meta}>
                                <div className={aboutStyles.metaItem}>
                                    <div className={aboutStyles.metaLbl}>Typical timeline</div>
                                    <div className={aboutStyles.metaVal}>{result.timeline}</div>
                                </div>
                                <div className={aboutStyles.metaItemWide}>
                                    <div className={aboutStyles.metaLblRow}>
                                        <span className={aboutStyles.metaLbl}>Ballpark investment</span>
                                        <span className={aboutStyles.metaTier}>{result.investment?.tier}</span>
                                    </div>
                                    <div className={aboutStyles.metaVal}>{result.investment?.range}</div>
                                    <div className={aboutStyles.metaReason}>{result.investment?.reason}</div>
                                </div>
                            </div>
                            <div className={`${aboutStyles.cta} ${ctaVisible ? aboutStyles.ctaVisible : ''}`}>
                                <p className={aboutStyles.ctaNote}>{result.invite}</p>
                                <button className={aboutStyles.ctaPrimary} onClick={openCall}>
                                    <div className={aboutStyles.ctaLhs}>
                                        <span className={aboutStyles.ctaMain}>Book a call with duoduo</span>
                                        <span className={aboutStyles.ctaSub}>30 min · Free · We'll come prepared</span>
                                    </div>
                                    <span className={aboutStyles.ctaArr}>→</span>
                                </button>
                                <button className={aboutStyles.restart} onClick={restart}>Start over</button>
                            </div>
                        </div>
                    )}

                </div>
            </div>

            {/* ── PORTFOLIO SECTION ── */}
            <section className={homeStyles.portfolioSection}>

                {/* Desktop carousel */}
                <div
                    ref={carouselRef}
                    className={homeStyles.carouselTrack}
                    onMouseEnter={pause}
                    onMouseLeave={resume}
                >
                    {LOOPED_PROJECTS.map((project, i) => {
                        const realIdx = ((i % total) + total) % total;
                        return (
                        <div
                            key={`dc-${i}`}
                            ref={(el) => (desktopItemRefs.current[i] = el)}
                            className={`${homeStyles.carouselItem} ${realIdx === activeStep ? homeStyles.carouselItemActive : ''}`}
                            onClick={() => { if (project.url) window.open(project.url, '_blank'); }}
                            style={{ cursor: project.url ? 'pointer' : 'default' }}
                        >
                            {project.preview && (
                                project.isVideo ? (
                                    <video
                                        className={homeStyles.carouselMedia}
                                        src={project.preview}
                                        loop muted playsInline autoPlay draggable={false}
                                    />
                                ) : (
                                    <img
                                        className={homeStyles.carouselMedia}
                                        src={project.preview}
                                        alt={project.name}
                                        draggable={false}
                                    />
                                )
                            )}
                            <div className={homeStyles.carouselOverlay}>
                                <span className={homeStyles.carouselOverlayName}>{project.name}</span>
                                <span className={homeStyles.carouselOverlayMeta}>
                                    {project.tag}
                                    {project.tag && project.subtitle && ' · '}
                                    {project.subtitle}
                                </span>
                            </div>
                        </div>
                        );
                    })}
                </div>

                {/* Mobile layout */}
                <section className={homeStyles.mobileLayout}>
                    <div ref={scrollContainerRef} className={homeStyles.mobileScrollContainer}>
                        {LOOPED_PROJECTS.map((project, i) => {
                            const realIndex = i % total;
                            const isActive = realIndex === activeStep;
                            return (
                                <div
                                    key={`mobile-${i}`}
                                    className={`${homeStyles.mobileProjectItem} ${isActive ? homeStyles.projectItemActive : homeStyles.projectItem}`}
                                    style={{ height: MOBILE_ITEM_HEIGHT, minHeight: MOBILE_ITEM_HEIGHT }}
                                    onClick={() => {
                                        const el = scrollContainerRef.current;
                                        if (!el) return;
                                        const targetTop = i * MOBILE_ITEM_HEIGHT + MOBILE_ITEM_HEIGHT / 2 - el.clientHeight / 2;
                                        el.scrollTo({ top: targetTop, behavior: 'smooth' });
                                    }}
                                >
                                    <span className={homeStyles.projectName}>{project.name}</span>
                                    {(project.tag || project.subtitle) && (
                                        <span className={homeStyles.projectSubtitle}>
                                            {project.tag && <span className={homeStyles.projectTag}>{project.tag}</span>}
                                            {project.tag && project.subtitle && ' for '}
                                            {project.subtitle}
                                        </span>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                    <div ref={mobilePreviewRef} className={homeStyles.mobilePreview}>
                        {ALL_PROJECTS.map((project, i) => (
                            project.preview ? (
                                project.isVideo ? (
                                    <video
                                        key={project.name}
                                        data-project-index={i}
                                        className={`${homeStyles.previewImage} ${i === activeStep ? homeStyles.previewVisible : homeStyles.previewHidden}`}
                                        src={i === activeStep ? project.preview : undefined}
                                        preload={i === activeStep ? 'auto' : 'none'}
                                        loop muted playsInline draggable={false}
                                        onCanPlay={(e) => { if (activeStepRef.current === i) e.target.play().catch(() => {}); }}
                                    />
                                ) : (
                                    <img
                                        key={project.name}
                                        className={`${homeStyles.previewImage} ${i === activeStep ? homeStyles.previewVisible : homeStyles.previewHidden}`}
                                        src={project.preview}
                                        alt={project.name}
                                        draggable={false}
                                    />
                                )
                            ) : (
                                <div
                                    key={project.name}
                                    className={`${homeStyles.previewInner} ${i === activeStep ? homeStyles.previewVisible : homeStyles.previewHidden}`}
                                >
                                    <span className={homeStyles.previewLabel}>{project.name}</span>
                                </div>
                            )
                        ))}
                    </div>
                </section>

            </section>

        </div>
    );
}
