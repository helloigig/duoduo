'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { flushSync } from 'react-dom';
import Link from 'next/link';
import aboutStyles from '@/styles/about.module.css';
import { SYS } from '@/lib/prompt';
import SnakeGame from '@/components/SnakeGame';
import { CELL, FORM_COLS, FORM_ROWS } from '@/lib/grid';

// ── AVATAR ANIMATION COMPONENT ────────────────────────────────────────────────
const HAIR_D = "M34.4919 43.7134C32.6776 47.016 27.7524 57.9013 26.6679 63.3257C26.5839 63.7459 27.8517 62.9688 31.8706 58.4333C35.8894 53.8977 43.0341 45.4914 46.7936 41.4394C50.5531 37.3874 50.7109 37.9445 51.8697 44.2038C53.0285 50.4631 55.1837 62.4077 56.5698 68.2805C57.956 74.1534 58.5079 73.5926 58.9026 73.0088C59.6448 71.9111 61.5177 63.0074 64.5056 50.6634C65.5171 46.485 66.3276 46.7621 68.5281 51.549C74.9371 65.4906 78.9302 74.8187 79.868 73.1751C80.2725 72.022 80.5318 70.221 80.9261 66.6929C81.3204 63.165 81.8419 57.9649 82.3792 52.607L82.3794 52.6057M82.5905 44.4677C82.6446 44.304 82.6987 44.1403 82.9392 44.3089C83.1796 44.4776 83.6049 44.9836 86.4925 50.0756C89.38 55.1677 94.717 64.8305 97.6364 69.2056C100.556 73.5807 100.896 72.3754 101.024 68.4973C101.369 58.1107 101.229 49.7095 101.965 47.1415C102.241 46.179 103.1 46.224 104.433 47.5636C105.766 48.9033 107.746 51.617 111.01 56.6314C118.917 68.7789 124.169 77.3463 125.353 78.4185C129.395 82.0775 122.778 60.7137 122.717 55.5016C122.706 54.588 130.99 63.3757 141.324 74.7754C144.701 78.5006 145.017 77.3487 144.357 72.5161C142.509 58.9878 141.277 49.8663 142.876 50.2149C146.109 50.9194 151.233 58.1509 157.894 65.2331C162.721 70.3654 165.87 71.4928 166.97 71.4786C170.598 71.4316 166.895 60.3063 161.691 49.8817C159.757 46.0062 155.514 41.6757 151.506 37.4454C143.674 29.1798 138.508 25.4296 137.468 24.7984C136.393 24.1464 131.843 21.6179 123.335 17.6549C118.956 15.6149 114.144 14.2097 108.229 12.9153C102.313 11.6208 95.3612 10.657 88.0026 10.2394C80.6441 9.82174 73.0897 9.97954 66.2359 10.4887C59.382 10.9978 53.4575 11.8535 48.1626 12.9903C38.2853 15.1109 32.4059 17.6698 28.7186 19.9494C18.3231 26.3764 14.3622 32.3812 11.8213 36.7429C9.4111 40.8801 11.2376 47.2717 12.5039 51.1684C15.0736 57.2807 16.847 60.784 18.1288 62.4784C18.7143 63.1875 19.1676 63.5905 20.3577 64.5759";
const EYE1_D = "M44.8686 96.6393C44.3108 96.4731 43.6352 96.2894 42.9062 96.1093M42.9062 96.1093C41.6738 95.8047 40.2885 95.5104 39.0605 95.3283M42.9062 96.1093C43.7979 95.8703 44.8548 95.7366 46.0141 95.7578M42.9062 96.1093C42.0458 96.3399 41.3394 96.6686 40.8437 97.0509C40.2495 97.5092 40.2421 98.3672 40.4255 99.0916C40.8103 100.612 42.3307 101.603 43.7997 102.256C45.0834 102.828 46.5511 102.812 47.9064 102.575M39.0605 95.3283C37.9277 95.1602 36.9288 95.0876 36.3071 95.1905C35.4843 95.3267 34.8861 96.0315 34.4921 96.7266C33.7047 98.1158 34.0436 99.8931 34.5949 101.499C35.146 103.105 37.1107 104.721 39.639 106.351C45.7035 110.259 54.4963 107.487 56.0359 106.424C56.2852 106.252 56.4822 106.018 56.6359 105.748M39.0605 95.3283C39.3499 95.1571 39.6698 95.0387 40.0074 94.9947C41.5823 94.7898 43.2604 94.5996 44.8965 95.2666C45.2747 95.4208 45.6495 95.5842 46.0141 95.7578M39.0605 95.3283C38.6718 95.5581 38.3382 95.8831 38.0905 96.2505C37.6584 96.8914 37.5295 97.7509 37.6046 98.5765C37.7523 100.201 39.0842 101.864 40.8371 103.498C44.257 106.686 49.1239 106.721 52.0534 106.443C52.5098 106.4 52.6065 105.749 52.574 105.091M56.6359 105.748C56.9637 105.172 57.0946 104.429 57.1165 103.759C57.1803 101.801 55.8945 100.221 54.4369 98.8676C52.5182 97.0867 50.1773 96.2885 47.9439 95.9309C47.278 95.8243 46.6315 95.7691 46.0141 95.7578M56.6359 105.748C56.07 105.737 55.5417 105.718 55.0727 105.686C54.316 105.595 53.492 105.416 52.574 105.091M56.6359 105.748C57.4323 105.763 58.3034 105.763 59.1897 105.763M46.0141 95.7578C47.6465 96.5347 49.0745 97.5136 49.6908 98.767C50.0398 99.4769 50.1155 100.178 49.8669 100.856C49.8574 100.882 49.8475 100.908 49.8373 100.934M47.9064 102.575C48.0645 102.547 48.2211 102.517 48.3757 102.484C49.0867 102.331 49.5795 101.593 49.8373 100.934M47.9064 102.575C47.843 102.531 47.7792 102.486 47.715 102.44C47.1632 101.709 46.9704 100.862 47.3136 100.503C47.6568 100.144 48.5575 100.174 49.3321 100.622C49.5036 100.721 49.6724 100.825 49.8373 100.934M47.9064 102.575C49.7143 103.839 51.243 104.618 52.574 105.091M49.8373 100.934C51.2007 101.833 52.3034 103.055 52.5168 104.517C52.5432 104.698 52.5643 104.895 52.574 105.091";
const EYE2_D = "M128.118 97.6488C127.664 97.5351 125.81 97.4142 122.98 97.6408C121.741 97.74 121.022 98.5716 120.605 99.2661C120.188 99.9606 120.126 100.688 120.348 101.318C121.175 103.662 125.201 104.472 132.156 104.888M132.156 104.888C133.996 104.998 136.041 105.08 138.285 105.156C139.342 105.191 140.068 105.132 140.59 104.99M132.156 104.888C125.59 104.69 121.059 104.036 119.888 101.36C119.547 100.581 119.548 99.6457 119.832 98.8715C120.116 98.0974 120.621 97.4282 121.303 97.0616C122.639 96.3428 124.416 95.5805 126.436 95.4225C129.685 95.1682 133.096 94.7674 136.487 96.2622C138.37 97.0925 140.357 98.2955 141.425 100.001M132.156 104.888C134.472 104.958 137.042 104.971 139.806 104.996C140.089 104.998 140.349 104.996 140.59 104.99M140.59 104.99C141.164 104.833 141.49 104.575 141.735 104.231C142.202 103.575 142.35 102.478 142.028 101.344C141.892 100.865 141.686 100.418 141.425 100.001M140.59 104.99C142.203 104.946 142.938 104.708 143.495 104.361C144.135 103.962 144.512 103.325 144.4 102.659C144.193 101.437 142.883 100.618 141.425 100.001M141.425 100.001C141.089 99.8582 140.745 99.7265 140.404 99.603C135.88 97.9604 129.985 98.5468 126.34 99.5876M126.34 99.5876C125.158 99.925 124.212 100.31 123.627 100.683C123.096 101.021 123.591 102.069 124.134 102.632C124.678 103.196 125.583 103.507 126.497 103.633C127.411 103.76 128.307 103.693 128.852 103.259C129.398 102.826 129.565 102.028 129.265 101.338C128.965 100.648 128.191 100.091 127.154 99.7733C126.896 99.6944 126.624 99.6312 126.34 99.5876ZM126.34 99.5876C125.479 99.4555 124.51 99.5032 123.519 99.8376";
const MOUTH1_D = "M98.7001 128.108C96.9365 127.264 93.3827 126.214 84.7174 125.998C81.3762 125.914 79.526 127.342 78.5509 128.509C78.0536 129.104 78.1247 130.087 78.2764 130.84C78.5616 132.255 79.8157 133.283 81.2445 134.192C83.0212 134.939 86.1418 135.701 91.0941 136.39C93.9259 136.657 97.4046 136.756 101.529 136.496";
const MOUTH2_D = "M86.4883 167.051C86.4883 167.274 86.8902 167.955 87.8579 168.974C90.0777 171.311 102.78 170.885 111.822 170.5C118.565 170.213 125.534 167.503 128.767 166.477C131.702 165.545 133.7 163.184 134.779 160.451C134.908 158.896 134.646 157.152 134.07 155.456C133.756 154.682 133.4 154.084 132.688 152.95";

function AvatarAni({ paused = false, className, style: styleProp }) {
    const ps   = paused ? 'paused' : 'running';
    const base = { transformOrigin: 'center', transformBox: 'fill-box' };
    const hair  = { ...base, animation: 'ava-hair  2s infinite ease-in-out', animationPlayState: ps };
    const eye   = { ...base, animation: 'ava-eyes  2s infinite ease-in-out', animationPlayState: ps };
    const mouth = { ...base, animation: 'ava-mouth 2s infinite ease-in-out', animationPlayState: ps };
    return (
        <svg viewBox="0 0 180 180" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} style={styleProp}>
            <style>{`
                @keyframes ava-eyes  { 0%,100%{transform:translate(0,0) rotate(0deg)} 25%{transform:translate(12px,-12px) rotate(8deg)} 50%{transform:translate(14px,-8px) rotate(10deg)} 75%{transform:translate(-10px,-10px) rotate(-6deg)} }
                @keyframes ava-mouth { 0%,100%{transform:translate(0,0) scale(1) rotate(0deg)} 25%{transform:translate(6px,-4px) scale(.8) rotate(5deg)} 50%{transform:translate(7px,-2px) scale(.85) rotate(6deg)} 75%{transform:translate(-5px,-3px) scale(.85) rotate(-4deg)} }
                @keyframes ava-hair  { 0%,100%{transform:translate(0,0) rotate(0deg)} 25%{transform:translate(2px,1px) rotate(2deg)} 50%{transform:translate(2.5px,0) rotate(2.5deg)} 75%{transform:translate(-1.5px,1px) rotate(-1.5deg)} }
            `}</style>
            <g stroke="currentColor" strokeOpacity="1" strokeWidth="6" strokeLinecap="round">
                <path style={hair}  d={HAIR_D} />
                <path style={eye}   d={EYE1_D} />
                <path style={eye}   d={EYE2_D} />
                <g    style={mouth}>
                    <path d={MOUTH1_D} />
                    <path d={MOUTH2_D} />
                </g>
            </g>
        </svg>
    );
}

function TitleDuoduo({ onHoverChange }) {
    const [hovered, setHovered] = useState(false);
    return (
        <span
            style={{ color: '#0d0d0d', display: 'inline', cursor: 'default' }}
            onMouseEnter={() => { setHovered(true); onHoverChange?.(true); }}
            onMouseLeave={() => { setHovered(false); onHoverChange?.(false); }}
        >
            <em>duoduo</em>
            {' '}
            <AvatarAni
                paused
                style={{
                    display: 'inline-block',
                    height: '1em', width: '1em',
                    verticalAlign: 'middle',
                    margin: '0 2px',
                    position: 'relative',
                    top: '-0.05em',
                    transition: 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
                    transform: hovered ? 'rotate(10deg)' : 'rotate(0deg)',
                    viewTransitionName: 'duoduo-avatar',
                }}
            />
        </span>
    );
}

// ── LOADING MESSAGES ───────────────────────────────────────────────────────────
const LOADING_MSGS = [
    'Decoding the vibe...',
    'Logic in progress...',
    'Un-complicating it...',
    'Polishing the soul...',
    'Translating your intent...',
    'Mapping the friction...',
    'Filtering the noise...',
    'Extracting the core...',
    'Sculpting the flow...',
    'Weighting the pixels...',
    'Sensing the rhythm...',
    'Aligning the intuition...',
    'Tracing the spark...',
    'Structuring the silence...',
    'Decompressing the brief...',
    'Designing the invisible...',
    'Syncing the logic...',
    'Refining the pulse...',
    'Drafting the essence...',
    'Almost there, stay cool.',
];

// ── ROTATING PLACEHOLDERS ─────────────────────────────────────────────────────
const EXAMPLES = [
    'a mobile app',
    'a website redesign',
    'a brand identity',
    'an AI product',
    'a SaaS dashboard',
    'a D2C launch',
];

// ── COMBINED PAGE ─────────────────────────────────────────────────────────────
export default function Home() {
    const [mainInput,      setMainInput]      = useState('');
    const [loadingMsgIdx,  setLoadingMsgIdx]  = useState(0);
    const [submittedText,  setSubmittedText]  = useState('');
    const [history,        setHistory]        = useState([]);
    const [loading,        setLoading]        = useState(false);
    const [followup,       setFollowup]       = useState(null);
    const [followupInput,  setFollowupInput]  = useState('');
    const [result,         setResult]         = useState(null);
    const [error,          setError]          = useState('');
    const [ctaVisible,     setCtaVisible]     = useState(false);
    const resultRef = useRef(null);
    const [placeholderIdx, setPlaceholderIdx] = useState(0);
    const canSubmit = mainInput.trim().length >= 8 && !loading;

    // Cycle examples
    useEffect(() => {
        const id = setInterval(() => setPlaceholderIdx(i => (i + 1) % EXAMPLES.length), 3000);
        return () => clearInterval(id);
    }, []);

    // Snap form to grid — both horizontally and vertically centered
    const FORM_W = FORM_COLS * CELL; // 560 px
    const [formSnap, setFormSnap] = useState({ left: 0, top: 0, offsetX: 0 });
    useEffect(() => {
        const snap = () => {
            const cols = Math.floor(window.innerWidth / CELL);
            const rows = Math.floor(window.innerHeight / CELL);
            const formCol = Math.floor((cols - FORM_COLS) / 2);
            const formRow = Math.floor((rows - FORM_ROWS) / 2);
            const snappedLeft = formCol * CELL;
            const naturalLeft = (window.innerWidth - FORM_W) / 2;
            setFormSnap({
                left: snappedLeft,
                top: formRow * CELL,
                offsetX: snappedLeft - naturalLeft, // nudge for flexbox-centered elements
            });
        };
        snap();
        window.addEventListener('resize', snap);
        return () => window.removeEventListener('resize', snap);
    }, []);

    // ── API ────────────────────────────────────────────────────────────────────
    const callAPI = useCallback(async (msgs) => {
        try {
            const res  = await fetch('/api/brief', {
                method:  'POST',
                headers: { 'Content-Type': 'application/json' },
                body:    JSON.stringify({ messages: msgs, system: SYS }),
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

    const handleMainKeyDown = (e) => {
        if (e.key === 'Enter' && (e.metaKey || e.ctrlKey || e.shiftKey)) {
            e.preventDefault();
            handleSubmit();
        }
    };

    const handleSubmit = useCallback(async () => {
        if (!canSubmit) return;
        const trimmed = mainInput.trim();
        const msgs    = [{ role: 'user', content: trimmed }];
        setHistory(msgs);

        const applyLoadingState = () => {
            flushSync(() => {
                setResult(null);
                setFollowup(null);
                setError('');
                setCtaVisible(false);
                setLoading(true);
                setSubmittedText(trimmed);
            });
        };

        if (document.startViewTransition) document.startViewTransition(applyLoadingState);
        else applyLoadingState();

        await callAPI(msgs);
    }, [canSubmit, mainInput, callAPI]);

    const handleFollowup = useCallback(async () => {
        if (!followupInput.trim()) return;
        const msgs = [
            ...history,
            { role: 'assistant', content: followup.question },
            { role: 'user',      content: followupInput.trim() },
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

    // Cycle loading messages
    useEffect(() => {
        if (!loading) { setLoadingMsgIdx(0); return; }
        const id = setInterval(() => setLoadingMsgIdx(i => i + 1), 2200);
        return () => clearInterval(id);
    }, [loading]);

    // ── RENDER ────────────────────────────────────────────────────────────────
    return (
        <div style={{ position: 'relative', width: '100vw', height: '100svh', overflow: 'hidden', background: '#F0F0F0' }}>

            {/* ── BACKGROUND: snake game ── */}
            <SnakeGame />

            {/* ── Work link ── */}
            <Link
                href="/work"
                style={{
                    position: 'fixed',
                    top: CELL,
                    right: CELL,
                    zIndex: 50,
                    fontFamily: 'var(--font-geist-sans), sans-serif',
                    fontSize: 12,
                    fontWeight: 600,
                    color: '#0d0d0d',
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                    textDecoration: 'none',
                    background: '#fff',
                    width: CELL * 3,
                    height: CELL * 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '1px solid #e5e5e5',
                    boxSizing: 'border-box',
                }}
            >
                Work →
            </Link>

            {/* ── FOREGROUND: AI reception form ── */}
            <div style={{
                position:       'absolute',
                inset:          0,
                zIndex:         10,
                overflowY:      'auto',
                overflowX:      'hidden',
                display:        'flex',
                flexDirection:  'column',
                alignItems:     'center',
                justifyContent: result || loading ? 'flex-start' : 'flex-start',
                padding:        result || loading ? '80px 24px 120px' : '0 24px',
                scrollbarWidth: 'none',
            }}>

                {/* Form — hidden after submit */}
                {!result && !loading && !followup && (
                    <>
                        {/* Wrapper covers the full 8-cell zone; children are absolutely positioned inside */}
                        <div style={{
                            position: 'absolute',
                            left: formSnap.left,
                            top: formSnap.top,
                            width: FORM_W,
                            height: CELL * 8,
                        }}>
                        <h1
                            className={aboutStyles.pageTitle}
                            style={{
                                position: 'absolute',
                                bottom: CELL * 5,   /* bottom edge sits at row 3; form box top is row 4 → 1 cell gap */
                                left: 0,
                                right: 0,
                                margin: 0,
                                padding: `0 ${CELL}px`,
                                boxSizing: 'border-box',
                                textAlign: 'center',
                                color: '#0d0d0d',
                            }}
                        >
                            How could <TitleDuoduo /> help with{' '}
                            <span className={aboutStyles.exampleInline}>
                                <span key={placeholderIdx} className={aboutStyles.exampleSlide}>
                                    {EXAMPLES[placeholderIdx]}
                                </span>
                            </span>
                        </h1>

                        <div style={{
                            position: 'absolute',
                            top: CELL * 4,
                            left: 0,
                            width: FORM_W,
                            height: CELL * 4,
                            padding: CELL,
                            boxSizing: 'border-box',
                            background: 'rgba(255, 255, 255, 0.3)',
                            borderRadius: 16,
                            backdropFilter: 'blur(5px)',
                            WebkitBackdropFilter: 'blur(5px)',
                        }}>
                        <div className={aboutStyles.formField}>
                            <textarea
                                className={aboutStyles.mainTextarea}
                                style={{ height: 2 * CELL }}
                                value={mainInput}
                                onChange={(e) => setMainInput(e.target.value)}
                                onKeyDown={handleMainKeyDown}
                                placeholder="Tell us the what, why, and for whom. We'll solve the how."
                                aria-label="Describe your project"
                            />
                            <div className={aboutStyles.formFooter}>
                                <button
                                    type="button"
                                    className={aboutStyles.submitBtn}
                                    onClick={handleSubmit}
                                    disabled={!canSubmit}
                                >
                                    Send →
                                </button>
                            </div>
                        </div>
                        {error && <div className={aboutStyles.error}>{error}</div>}
                    </div>
                        </div>
                    </>
                )}

                {/* Loading */}
                {loading && submittedText && (
                    <div className={aboutStyles.loadingCentered} style={{ width: FORM_W, transform: formSnap.offsetX ? `translateX(${formSnap.offsetX}px)` : undefined }}>
                        <blockquote className={aboutStyles.userQuote}>
                            {submittedText}
                        </blockquote>
                        <div className={aboutStyles.loading}>
                            <AvatarAni className={aboutStyles.loadingAvatar} style={{ color: '#0d0d0d' }} />
                            <div key={loadingMsgIdx} className={aboutStyles.loadingMsg}>
                                {LOADING_MSGS[loadingMsgIdx % LOADING_MSGS.length]}
                            </div>
                        </div>
                    </div>
                )}

                {/* Quote top */}
                {(result || followup) && submittedText && (
                    <div className={aboutStyles.submittedTop} style={{ width: FORM_W, transform: formSnap.offsetX ? `translateX(${formSnap.offsetX}px)` : undefined }}>
                        <blockquote className={aboutStyles.userQuote}>
                            {submittedText}
                        </blockquote>
                    </div>
                )}

                {/* Follow-up */}
                {followup && (
                    <div className={aboutStyles.followup} style={{ width: FORM_W, transform: formSnap.offsetX ? `translateX(${formSnap.offsetX}px)` : undefined }}>
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
                            <button type="button" className={aboutStyles.fqBtn} onClick={handleFollowup}>Continue →</button>
                        </div>
                    </div>
                )}

                {/* Result */}
                {result && (
                    <div className={aboutStyles.result} ref={resultRef} style={{ width: FORM_W, transform: formSnap.offsetX ? `translateX(${formSnap.offsetX}px)` : undefined }}>

                        {/* Fax transmission header */}
                        <div className={aboutStyles.faxHead}>
                            <div className={aboutStyles.faxFrom}>
                                DUODUO STUDIO<br />
                                TRANSMISSION
                            </div>
                            <div className={aboutStyles.faxHeadRight}>
                                DATE: {new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase()}<br />
                                PAGES: 01 / 01
                            </div>
                        </div>

                        <div className={aboutStyles.reframe}>
                            <div className={aboutStyles.reframeEye}>What we hear</div>
                            <div className={aboutStyles.reframeBody}>{result.read}</div>
                        </div>
                        <div className={aboutStyles.approachCard}>
                            <div className={aboutStyles.approachEye}>How we&apos;d approach this</div>
                            <div className={aboutStyles.approachBody}>{result.approach}</div>
                        </div>
                        <div className={aboutStyles.meta}>
                            <div className={aboutStyles.metaItem}>
                                <span className={aboutStyles.metaLbl}>Timeline</span>
                                <span className={aboutStyles.metaVal}>{result.timeline}</span>
                            </div>
                            <div className={aboutStyles.metaItemWide}>
                                <div className={aboutStyles.metaLblRow}>
                                    <span className={aboutStyles.metaLbl}>Investment</span>
                                    <span className={aboutStyles.metaVal}>{result.investment?.range}</span>
                                    <span className={aboutStyles.metaTier}>[{result.investment?.tier}]</span>
                                </div>
                                <div className={aboutStyles.metaReason}>{result.investment?.reason}</div>
                            </div>
                        </div>
                        <div className={`${aboutStyles.cta} ${ctaVisible ? aboutStyles.ctaVisible : ''}`}>
                            <p className={aboutStyles.ctaNote}>{result.invite}</p>
                            <button type="button" className={aboutStyles.ctaPrimary} onClick={openCall}>
                                <div className={aboutStyles.ctaLhs}>
                                    <span className={aboutStyles.ctaMain}>Book a call with duoduo</span>
                                    <span className={aboutStyles.ctaSub}>30 min · Free · We&apos;ll come prepared</span>
                                </div>
                                <span className={aboutStyles.ctaArr}>→</span>
                            </button>
                            <button type="button" className={aboutStyles.restart} onClick={restart}>
                                [ start over ]
                            </button>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
}
