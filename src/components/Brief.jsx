'use client';

// AI brief form — same flow as the previous homepage (POST /api/brief →
// follow-up question or a written read of the project), restyled for the list layout.

import { useCallback, useEffect, useRef, useState } from 'react';

const EXAMPLES = ['a mobile app', 'a website redesign', 'a brand identity', 'an AI product', 'a SaaS dashboard', 'a D2C launch'];

const LOADING_MSGS = [
    'Decoding the vibe...', 'Logic in progress...', 'Un-complicating it...', 'Polishing the soul...',
    'Translating your intent...', 'Mapping the friction...', 'Filtering the noise...', 'Extracting the core...',
    'Sculpting the flow...', 'Weighting the pixels...', 'Sensing the rhythm...', 'Aligning the intuition...',
    'Tracing the spark...', 'Structuring the silence...', 'Decompressing the brief...', 'Designing the invisible...',
    'Syncing the logic...', 'Refining the pulse...', 'Drafting the essence...', 'Almost there, stay cool.',
];

export default function Brief({ onBookCall }) {
    const [input, setInput] = useState('');
    const [submitted, setSubmitted] = useState('');
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(false);
    const [followup, setFollowup] = useState(null);
    const [followupInput, setFollowupInput] = useState('');
    const [result, setResult] = useState(null);
    const [error, setError] = useState('');
    const [exampleIdx, setExampleIdx] = useState(0);
    const [msgIdx, setMsgIdx] = useState(0);
    const topRef = useRef(null);
    const canSubmit = input.trim().length >= 8 && !loading;

    useEffect(() => {
        const id = setInterval(() => setExampleIdx((i) => (i + 1) % EXAMPLES.length), 3000);
        return () => clearInterval(id);
    }, []);

    useEffect(() => {
        if (!loading) { setMsgIdx(0); return; }
        const id = setInterval(() => setMsgIdx((i) => i + 1), 2200);
        return () => clearInterval(id);
    }, [loading]);

    const callAPI = useCallback(async (messages) => {
        setLoading(true);
        setError('');
        try {
            const res = await fetch('/api/brief', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ messages }),
            });
            const data = await res.json();
            if (data.error) { setError(data.error); return; }
            let parsed;
            try { parsed = JSON.parse((data.text || '').replace(/```json|```/g, '').trim()); }
            catch { setError('Something went wrong — please try again.'); return; }
            if (parsed.needs_more_info && parsed.follow_up_question) setFollowup({ question: parsed.follow_up_question });
            else setResult(parsed);
            requestAnimationFrame(() => topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
        } catch {
            setError('Could not connect. Please try again.');
        } finally {
            setLoading(false);
        }
    }, []);

    const submit = () => {
        if (!canSubmit) return;
        const text = input.trim();
        const msgs = [{ role: 'user', content: text }];
        setSubmitted(text);
        setHistory(msgs);
        setResult(null);
        setFollowup(null);
        callAPI(msgs);
    };

    const answer = () => {
        if (!followupInput.trim() || loading) return;
        const msgs = [
            ...history,
            { role: 'assistant', content: followup.question },
            { role: 'user', content: followupInput.trim() },
        ];
        setHistory(msgs);
        setFollowup(null);
        setFollowupInput('');
        callAPI(msgs);
    };

    const restart = () => {
        setInput(''); setSubmitted(''); setHistory([]);
        setFollowup(null); setFollowupInput(''); setResult(null); setError('');
    };

    const sendOnShiftEnter = (fn) => (e) => {
        if (e.key === 'Enter' && (e.shiftKey || e.metaKey || e.ctrlKey)) { e.preventDefault(); fn(); }
    };

    const idle = !submitted;

    return (
        <section className="brief" aria-labelledby="brief-title" ref={topRef}>
            <div className="list__head list__head--archive">
                <h2 className="h3" id="brief-title">Start a project</h2>
            </div>

            <div className="brief__body">
                {idle ? (
                    <>
                        <p className="h1 brief__q">
                            How could duoduo help with{' '}
                            <span className="brief__example" aria-live="polite">
                                <span key={exampleIdx} className="hl">{EXAMPLES[exampleIdx]}</span>
                            </span>
                            ?
                        </p>
                        <textarea
                            className="h2 brief__input"
                            rows={4}
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={sendOnShiftEnter(submit)}
                            placeholder="Tell us the what, why, and for whom. We’ll solve the how."
                            aria-label="Describe your project"
                            maxLength={4000}
                        />
                        <div className="brief__bar">
                            <span className="h3 muted brief__hint">⇧↩ to send</span>
                            <button className="h3 brief__send" type="button" onClick={submit} disabled={!canSubmit}>Send →</button>
                        </div>
                    </>
                ) : (
                    <blockquote className="h2 muted brief__quote">“{submitted}”</blockquote>
                )}

                {loading && (
                    <p className="h3 brief__loading" aria-live="polite" key={msgIdx}>{LOADING_MSGS[msgIdx % LOADING_MSGS.length]}</p>
                )}

                {followup && !loading && (
                    <div className="brief__followup">
                        <span className="h3">One question</span>
                        <p className="h2">{followup.question}</p>
                        <textarea
                            className="h2 brief__input"
                            rows={2}
                            value={followupInput}
                            onChange={(e) => setFollowupInput(e.target.value)}
                            onKeyDown={sendOnShiftEnter(answer)}
                            placeholder="Your answer…"
                            aria-label="Your answer"
                            maxLength={2000}
                            autoFocus
                        />
                        <div className="brief__bar">
                            <span className="h3 muted brief__hint">⇧↩ to send</span>
                            <button className="h3 brief__send" type="button" onClick={answer} disabled={!followupInput.trim()}>Continue →</button>
                        </div>
                    </div>
                )}

                {result && !loading && (
                    <dl className="brief__result">
                        <div><dt className="h3">What we hear</dt><dd className="h2">{result.read}</dd></div>
                        <div><dt className="h3">How we’d approach this</dt><dd className="h2">{result.approach}</dd></div>
                        <div><dt className="h3">Timeline</dt><dd className="h2">{result.timeline}</dd></div>
                        <div>
                            <dt className="h3">Investment</dt>
                            <dd className="h2">
                                {result.investment?.range} <span className="muted">[{result.investment?.tier}]</span>
                                <span className="brief__reason muted">{result.investment?.reason}</span>
                            </dd>
                        </div>
                        {result.invite ? <div><dt className="h3">Next</dt><dd className="h2">{result.invite}</dd></div> : null}
                    </dl>
                )}

                {error && <p className="h3 brief__error" role="alert">{error}</p>}

                {(result || error) && !loading && (
                    <div className="brief__bar brief__bar--end">
                        {result ? <button className="h2 brief__cta" type="button" onClick={onBookCall}>Book a 15-minute call →</button> : <span />}
                        <button className="h3 muted" type="button" onClick={restart}>Start over</button>
                    </div>
                )}
            </div>
        </section>
    );
}
