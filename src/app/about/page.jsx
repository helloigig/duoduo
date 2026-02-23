'use client';

import { useState, useRef, useCallback } from 'react';
import styles from './about.module.css';

const SYS = `You are the first person someone speaks to when they reach out to duoduo — a boutique product design studio founded by Kiwi and Gigi, operating between London and Shenzhen.

Your role is reception and account executive. You are warm, perceptive, and specific. You make people feel genuinely understood — not processed. You speak like a thoughtful designer who's worked closely with founders, not like a chatbot or a form.

Your goal: make them feel seen, share a genuine insight about what you hear in their situation, and invite them into a real conversation with the team.

ABOUT THE FOUNDERS — use this to personalise the "approach" field when relevant:
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
  "approach": "3–4 sentences. Specific, concrete thinking about how duoduo would actually tackle this situation — the angle, the first move, what to focus on first and why, what traps to avoid. Ground it in the details they shared. No founder names, no credentials. Think like a senior designer who has seen this problem before and knows exactly where the real work is.",
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

export default function AboutPage() {
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

    const canSubmit = mainInput.trim().length >= 8 && !loading;

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
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const openCall = () => window.dispatchEvent(new CustomEvent('open-cal'));

    return (
        <main className={styles.page}>
            <div className={styles.inner}>

                {/* FORM — hidden after submit */}
                {!result && !loading && !followup && (
                    <div className={styles.formSectionCentered}>
                        <h1 className={styles.pageTitle}>How duoduo can help you?</h1>

                        <div className={styles.inputCard}>
                            <div className={styles.mainWrap}>
                                <label className={styles.fieldLabel}>Tell us what you're working on</label>
                                <textarea
                                    className={styles.mainTextarea}
                                    rows={5}
                                    value={mainInput}
                                    onChange={(e) => setMainInput(e.target.value)}
                                    onKeyDown={handleMainKeyDown}
                                    placeholder="What are you building or fixing, and what's making it hard right now? A few sentences is enough."
                                />
                            </div>
                            <div className={styles.cardFoot}>
                                <span className={styles.footHint}>⌘↩ to send</span>
                                <button className={styles.submitBtn} onClick={handleSubmit} disabled={!canSubmit}>
                                    {loading && <span className={styles.spinner} />}
                                    <span>{loading ? 'Reading…' : 'Send'}</span>
                                </button>
                            </div>
                        </div>

                        {error && <div className={styles.error}>{error}</div>}
                    </div>
                )}

                {/* QUOTE — shown after submit */}
                {(result || loading || followup) && submittedText && (
                    <div className={styles.submittedTop}>
                        <blockquote className={styles.userQuote}>{submittedText}</blockquote>
                    </div>
                )}

                {/* LOADING */}
                {loading && (
                    <div className={styles.loading}>
                        <div className={styles.dots}>
                            <span className={styles.dot} />
                            <span className={styles.dot} />
                            <span className={styles.dot} />
                        </div>
                        <div className={styles.loadingMsg}>Thinking about your situation…</div>
                    </div>
                )}

                {/* FOLLOW-UP */}
                {followup && (
                    <div className={styles.followup}>
                        <div className={styles.fqHead}>
                            <div className={styles.fqEye}>One question</div>
                            <div className={styles.fqQ}>{followup.question}</div>
                        </div>
                        <div className={styles.fqBody}>
                            <textarea
                                className={styles.fqTextarea}
                                value={followupInput}
                                onChange={(e) => setFollowupInput(e.target.value)}
                                placeholder="Your answer…"
                                rows={2}
                                autoFocus
                            />
                            <button className={styles.fqBtn} onClick={handleFollowup}>Continue →</button>
                        </div>
                    </div>
                )}

                {/* RESULT */}
                {result && (
                    <div className={styles.result} ref={resultRef}>

                        {/* What duoduo reads */}
                        <div className={styles.reframe}>
                            <div className={styles.reframeEye}>What we hear</div>
                            <div className={styles.reframeBody}>{result.read}</div>
                        </div>

                        {/* How we'd approach it */}
                        <div className={styles.approachCard}>
                            <div className={styles.approachEye}>How we'd approach this</div>
                            <div className={styles.approachBody}>{result.approach}</div>
                        </div>

                        {/* Meta */}
                        <div className={styles.meta}>
                            <div className={styles.metaItem}>
                                <div className={styles.metaLbl}>Typical timeline</div>
                                <div className={styles.metaVal}>{result.timeline}</div>
                            </div>
                            <div className={styles.metaItemWide}>
                                <div className={styles.metaLblRow}>
                                    <span className={styles.metaLbl}>Ballpark investment</span>
                                    <span className={styles.metaTier}>{result.investment?.tier}</span>
                                </div>
                                <div className={styles.metaVal}>{result.investment?.range}</div>
                                <div className={styles.metaReason}>{result.investment?.reason}</div>
                            </div>
                        </div>

                        {/* CTA */}
                        <div className={`${styles.cta} ${ctaVisible ? styles.ctaVisible : ''}`}>
                            <p className={styles.ctaNote}>{result.invite}</p>
                            <button className={styles.ctaPrimary} onClick={openCall}>
                                <div className={styles.ctaLhs}>
                                    <span className={styles.ctaMain}>Book a call with duoduo</span>
                                    <span className={styles.ctaSub}>30 min · Free · We'll come prepared</span>
                                </div>
                                <span className={styles.ctaArr}>→</span>
                            </button>
                            <button className={styles.restart} onClick={restart}>Start over</button>
                        </div>

                    </div>
                )}


            </div>
        </main>
    );
}
