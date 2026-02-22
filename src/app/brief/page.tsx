'use client'

import { useState, useRef, useCallback } from 'react'
import styles from './brief.module.css'

// ── TYPES ────────────────────────────────────────────────────────
type Intent = 'new' | 'redesign' | 'website'

interface Milestone {
  phase: string
  title: string
  desc: string
  duoduo_does: string
  client_gets: string
}

interface BriefResult {
  needs_more_info: boolean
  follow_up_question: string
  reframe: string
  core_need: string
  no_visual_note: string
  milestones: Milestone[]
  timeline: string
  investment: string
}

interface UploadedImage {
  base64: string
  mime: string
  url: string
}

// ── INTENT CONFIG ────────────────────────────────────────────────
const INTENTS: Record<Intent, { label: string; ph: string; attach: boolean; extras: boolean; loading: string }> = {
  new: {
    label: 'What are you building?',
    ph: 'Describe the product and the problem it solves. What\'s the biggest unknown or challenge right now?',
    attach: false,
    extras: true,
    loading: 'Defining your product…',
  },
  redesign: {
    label: "What's not working?",
    ph: "Describe the product and the problem. What are users struggling with? Where does the experience break down?",
    attach: true,
    extras: false,
    loading: 'Diagnosing your product…',
  },
  website: {
    label: 'Tell us about the site',
    ph: "Describe what the site is for and what's wrong with it now. Who should it be speaking to, and what's it failing to communicate?",
    attach: true,
    extras: false,
    loading: 'Scoping your website…',
  },
}

// ── SYSTEM PROMPT ────────────────────────────────────────────────
const SYS_BASE = `You are the intake AI for duoduo, a boutique UI/UX and brand design studio (duoduo.global). You think like a senior designer — you hear what a client describes, then name what's really going on underneath it.

OUTPUT STRUCTURE — respond only in valid JSON, no markdown fences:
{
  "needs_more_info": false,
  "follow_up_question": "",
  "reframe": "2 sentences max. Name the real design problem — not a summary of their words. Make them feel you saw something they couldn't quite name themselves. Never start with 'Your core challenge is…'",
  "core_need": "One sentence. The underlying problem, distilled.",
  "no_visual_note": "",
  "milestones": [
    {
      "phase": "Phase label e.g. 'Align'",
      "title": "What happens at this stage — client-facing",
      "desc": "1 sentence describing what this stage achieves",
      "duoduo_does": "What duoduo specifically does here — active, concrete. Not a service name, a real action.",
      "client_gets": "What the client receives or experiences at the end of this stage"
    }
  ],
  "timeline": "X–Y weeks total",
  "investment": "From $X,XXX"
}

MILESTONE RULES:
- 4 milestones only. Label them as client-facing phases: Align / Explore / Build / Deliver (or equivalent)
- No per-phase durations. Total timeline only.
- "duoduo_does" is duoduo's specific contribution — concrete action, not a service category name
- "client_gets" is what they walk away with — tangible and specific

REFRAME QUALITY BAR:
- Don't parrot their words back. Name the structural cause underneath.
- If they say "our app is confusing": don't write "your app is confusing users." Instead: "The interface treats every feature as equal priority, which means users have to do the work of figuring out what matters. That's not a clarity problem — it's a hierarchy problem."
- Be specific. Be direct. Vary your opening.

IF input is too vague (<12 words, no context): set needs_more_info=true, ask one sharp clarifying question.
IF redesign/website with no URL or screenshot: set no_visual_note to a short line requesting one.

INVESTMENT RANGES (honest estimates, not quotes):
Strategy only: $1,500–3,000 | Website: $5,000–12,000 | App redesign: $8,000–20,000 | New product 0→1: $15,000–40,000`

const SYS_CONTEXT: Record<Intent, string> = {
  new: `\n\nThis is a NEW PRODUCT brief. Focus the reframe on: what the product really is, who it's actually for, and what it needs to feel like to earn trust with that audience. Milestones: define → design → prototype → validate.`,
  redesign: `\n\nThis is a REDESIGN brief. Diagnose the root cause — hierarchy, onboarding, trust, comprehension, navigation? Reframe around the structural issue, not "bad UX." Milestones: audit → direction → redesign → handoff.`,
  website: `\n\nThis is a WEBSITE brief. Focus on who the site serves, what it needs to make them feel or do, and whether this is a positioning, credibility, or structural problem. Milestones: strategy → design → build → launch.`,
}

// ── BOOKING SLOTS ────────────────────────────────────────────────
function buildSlots() {
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  const days = ['Mon','Tue','Wed','Thu','Fri']
  const times = ['10:00 AM','2:00 PM','4:30 PM','11:00 AM']
  const slots: { day: string; time: string }[] = []
  const now = new Date()
  let offset = 1
  while (slots.length < 4) {
    const d = new Date(now)
    d.setDate(now.getDate() + offset)
    const wd = d.getDay()
    if (wd > 0 && wd < 6) {
      slots.push({ day: `${days[wd - 1]}, ${months[d.getMonth()]} ${d.getDate()}`, time: `${times[slots.length % times.length]} SGT` })
    }
    offset++
  }
  return slots
}

// ── COMPONENT ────────────────────────────────────────────────────
export default function BriefPage() {
  const [intent, setIntentState] = useState<Intent | null>(null)
  const [mainText, setMainText] = useState('')
  const [url, setUrl] = useState('')
  const [target, setTarget] = useState('')
  const [platforms, setPlatforms] = useState<string[]>([])
  const [imgs, setImgs] = useState<UploadedImage[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingMsg, setLoadingMsg] = useState('')
  const [followupQ, setFollowupQ] = useState('')
  const [followupAns, setFollowupAns] = useState('')
  const [brief, setBrief] = useState<BriefResult | null>(null)
  const [history, setHistory] = useState<{ role: string; content: unknown }[]>([])
  const [error, setError] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null)
  const [confirmed, setConfirmed] = useState(false)
  const [visibleMilestones, setVisibleMilestones] = useState<boolean[]>([])
  const fileRef = useRef<HTMLInputElement>(null)
  const resultRef = useRef<HTMLDivElement>(null)

  const canSubmit = intent && mainText.trim().length >= 8

  // Toggle platform chip
  const togglePlatform = (p: string) => {
    setPlatforms(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p])
  }

  // Image upload
  const handleFiles = (files: FileList) => {
    Array.from(files).forEach(f => {
      const r = new FileReader()
      r.onload = ev => {
        const result = ev.target?.result as string
        setImgs(prev => [...prev, { base64: result.split(',')[1], mime: f.type, url: result }])
      }
      r.readAsDataURL(f)
    })
  }

  // Build message content
  const buildMsg = useCallback(() => {
    const parts: unknown[] = []
    imgs.forEach(img => parts.push({ type: 'image', source: { type: 'base64', media_type: img.mime, data: img.base64 } }))
    let txt = mainText.trim()
    if (url) txt += `\nURL: ${url}`
    if (target) txt += `\nTarget user: ${target}`
    if (platforms.length) txt += `\nPlatform: ${platforms.join(', ')}`
    if (imgs.length) txt += `\n[${imgs.length} screenshot(s) attached]`
    parts.push({ type: 'text', text: txt })
    return parts
  }, [mainText, url, target, platforms, imgs])

  // Call API via our secure proxy route
  const callAPI = async (msgs: { role: string; content: unknown }[]) => {
    const system = SYS_BASE + (intent ? SYS_CONTEXT[intent] : '')
    const res = await fetch('/api/brief', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'gemini-1.5-flash', max_tokens: 1000, system, messages: msgs }),
    })
    const data = await res.json()
    const raw = (data.content || []).map((b: { text?: string }) => b.text || '').join('')
    return JSON.parse(raw.replace(/```json|```/g, '').trim()) as BriefResult
  }

  // Submit
  const handleSubmit = async () => {
    if (!canSubmit || !intent) return
    setError(''); setBrief(null); setFollowupQ(''); setVisibleMilestones([])
    setLoading(true); setLoadingMsg(INTENTS[intent].loading)
    const msgs = [{ role: 'user', content: buildMsg() }]
    setHistory(msgs)
    try {
      const parsed = await callAPI(msgs)
      setLoading(false)
      if (parsed.needs_more_info && parsed.follow_up_question) {
        setFollowupQ(parsed.follow_up_question)
      } else {
        setBrief(parsed)
        animateMilestones(parsed.milestones.length)
        setTimeout(() => resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100)
      }
    } catch {
      setLoading(false); setError('Something went wrong — please try again.')
    }
  }

  // Follow-up
  const handleFollowup = async () => {
    if (!followupAns.trim()) return
    const newHistory = [...history, { role: 'assistant', content: followupQ }, { role: 'user', content: followupAns }]
    setHistory(newHistory); setFollowupQ(''); setFollowupAns('')
    setLoading(true); setLoadingMsg('Almost there…')
    try {
      const parsed = await callAPI(newHistory)
      setLoading(false)
      if (parsed.needs_more_info && parsed.follow_up_question) {
        setFollowupQ(parsed.follow_up_question)
      } else {
        setBrief(parsed)
        animateMilestones(parsed.milestones.length)
        setTimeout(() => resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100)
      }
    } catch {
      setLoading(false); setError('Something went wrong — please try again.')
    }
  }

  const animateMilestones = (count: number) => {
    setVisibleMilestones(Array(count).fill(false))
    for (let i = 0; i < count; i++) {
      setTimeout(() => {
        setVisibleMilestones(prev => { const n = [...prev]; n[i] = true; return n })
      }, 120 + i * 90)
    }
  }

  const restart = () => {
    setIntentState(null); setMainText(''); setUrl(''); setTarget(''); setPlatforms([])
    setImgs([]); setBrief(null); setFollowupQ(''); setFollowupAns(''); setError(''); setHistory([])
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const copyBrief = () => {
    if (!brief) return
    const txt = [
      'duoduo Brief', '─────────────', brief.core_need, '', brief.reframe, '',
      'How we work together:',
      ...brief.milestones.map(m => `${m.phase} — ${m.title}\n  ${m.desc}\n  duoduo: ${m.duoduo_does}\n  ↳ ${m.client_gets}`),
      '', `Timeline: ${brief.timeline}  ·  Investment: ${brief.investment}`, '', 'duoduo.global',
    ].join('\n')
    navigator.clipboard.writeText(txt)
  }

  const slots = buildSlots()

  return (
    <div className={styles.page}>

      {/* ── HEADER */}
      <div className={styles.header}>
        <h1 className={styles.title}>What are you<br />trying to build?</h1>
        <p className={styles.sub}>Tell us what you're working on — and what's making it hard. A few sentences is enough.</p>
      </div>

      {/* ── INTENT */}
      <div className={styles.intentRow}>
        {(['new', 'redesign', 'website'] as Intent[]).map(val => (
          <button
            key={val}
            className={`${styles.intentBtn} ${intent === val ? styles.intentActive : ''}`}
            onClick={() => setIntentState(val)}
          >
            <span className={styles.ibLabel}>
              {val === 'new' ? 'New product' : val === 'redesign' ? 'Redesign' : 'Website'}
            </span>
            <span className={styles.ibSub}>
              {val === 'new' ? 'Starting from scratch' : val === 'redesign' ? 'Something already exists' : 'New or rebuilding'}
            </span>
          </button>
        ))}
      </div>

      {/* ── INPUT CARD */}
      <div className={styles.card}>
        <div className={styles.mainWrap}>
          <label className={styles.fieldLabel}>
            {intent ? INTENTS[intent].label : 'Describe your situation'}
          </label>
          <textarea
            className={styles.textarea}
            rows={4}
            value={mainText}
            onChange={e => setMainText(e.target.value)}
            onKeyDown={e => { if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') handleSubmit() }}
            placeholder={intent ? INTENTS[intent].ph : 'Describe what you\'re working on. Even a few sentences is enough to start.'}
          />
        </div>

        {/* Attachments: redesign + website */}
        {intent && INTENTS[intent].attach && (
          <div className={styles.attachments}>
            <span className={styles.attachLbl}>
              Add context <span className={styles.optional}>— optional, but helpful</span>
            </span>
            <div className={styles.attachRow}>
              <div className={styles.urlField}>
                <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M7 9a3 3 0 004.243.243l2-2A3 3 0 009.172 3L8 4.172"/>
                  <path d="M9 7a3 3 0 00-4.243-.243l-2 2A3 3 0 006.828 13L8 11.828"/>
                </svg>
                <input type="url" placeholder="Paste a URL" value={url} onChange={e => setUrl(e.target.value)} />
              </div>
              <label className={`${styles.imgLbl} ${imgs.length > 0 ? styles.hasFile : ''}`} onClick={() => fileRef.current?.click()}>
                <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <rect x="1" y="3" width="14" height="10" rx="1.5"/>
                  <circle cx="5.5" cy="7.5" r="1"/>
                  <path d="M1 11l4-3.5 2.5 2.5 2-1.5 5 4.5"/>
                </svg>
                {imgs.length > 0 ? `${imgs.length} added` : 'Screenshot'}
              </label>
              <input ref={fileRef} type="file" accept="image/*" multiple style={{ display: 'none' }}
                onChange={e => e.target.files && handleFiles(e.target.files)} />
            </div>
            {imgs.length > 0 && (
              <div className={styles.previewStrip}>
                {imgs.map((img, i) => (
                  <div key={i} className={styles.thumb}>
                    <img src={img.url} alt="" />
                    <div className={styles.rm} onClick={() => setImgs(prev => prev.filter((_, j) => j !== i))}>×</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* New product extras */}
        {intent === 'new' && (
          <div className={styles.newExtras}>
            <div className={styles.extraRow}>
              <label>Who is it for? <span className={styles.optional}>— optional</span></label>
              <input type="text" placeholder="e.g. freelance designers, logistics managers…"
                value={target} onChange={e => setTarget(e.target.value)} />
            </div>
            <div className={styles.extraRow}>
              <label>Platform <span className={styles.optional}>— optional</span></label>
              <div className={styles.pChips}>
                {['Mobile', 'Web app', 'Website', 'Desktop', 'Not sure'].map(p => (
                  <span key={p} className={`${styles.pChip} ${platforms.includes(p) ? styles.pChipOn : ''}`}
                    onClick={() => togglePlatform(p)}>{p}</span>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className={styles.cardFoot}>
          <span className={styles.footHint}>⌘↩ to submit</span>
          <button className={styles.submitBtn} onClick={handleSubmit} disabled={!canSubmit || loading}>
            {loading && <span className={styles.spinner} />}
            {loading ? 'Analyzing…' : 'Generate Brief'}
          </button>
        </div>
      </div>

      {/* Error */}
      {error && <div className={styles.error}>{error}</div>}

      {/* Loading */}
      {loading && (
        <div className={styles.loading}>
          <div className={styles.dots}><span/><span/><span/></div>
          <div className={styles.loadingMsg}>{loadingMsg}</div>
        </div>
      )}

      {/* Follow-up */}
      {followupQ && (
        <div className={styles.followup}>
          <div className={styles.fqHead}>
            <div className={styles.fqEye}>One question</div>
            <div className={styles.fqQ}>{followupQ}</div>
          </div>
          <div className={styles.fqBody}>
            <textarea rows={2} placeholder="Your answer…" value={followupAns}
              onChange={e => setFollowupAns(e.target.value)} />
            <button onClick={handleFollowup}>Continue →</button>
          </div>
        </div>
      )}

      {/* Result */}
      {brief && (
        <div className={styles.result} ref={resultRef}>

          {brief.no_visual_note && (
            <div className={styles.visualNote}>💡 {brief.no_visual_note}</div>
          )}

          {/* Reframe */}
          <div className={styles.reframe}>
            <div className={styles.reframeEye}>duoduo reads</div>
            <div className={styles.reframeBody}>{brief.reframe}</div>
            <div className={styles.coreNeed}>{brief.core_need}</div>
          </div>

          {/* Roadmap */}
          <div className={styles.roadmap}>
            <div className={styles.rmHead}>
              <span className={styles.rmTitle}>How we work together</span>
              <span className={styles.rmTotal}>{brief.timeline}</span>
            </div>
            <div>
              {brief.milestones.map((m, i) => (
                <div key={i} className={`${styles.milestone} ${visibleMilestones[i] ? styles.milestoneShow : ''}`}>
                  <div className={styles.msTrack}>
                    <div className={`${styles.msDot} ${visibleMilestones[i] ? styles.msDotFilled : ''}`} />
                    {i < brief.milestones.length - 1 && <div className={styles.msLine} />}
                  </div>
                  <div className={styles.msContent}>
                    <div className={styles.msPhase}>{m.phase}</div>
                    <div className={styles.msTitle}>{m.title}</div>
                    <div className={styles.msDesc}>{m.desc}</div>
                    <div className={styles.msDuo}>
                      <span className={styles.msDuoTag}>duoduo</span>
                      <span className={styles.msDuoTxt}>{m.duoduo_does}</span>
                    </div>
                    <span className={styles.msGet}>↳ {m.client_gets}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Meta */}
          <div className={styles.meta}>
            <div className={styles.metaItem}>
              <div className={styles.metaLbl}>Timeline</div>
              <div className={styles.metaVal}>{brief.timeline}</div>
            </div>
            <div className={styles.metaItem}>
              <div className={styles.metaLbl}>Investment</div>
              <div className={styles.metaVal}>{brief.investment}</div>
            </div>
          </div>

          {/* CTA */}
          <div className={styles.cta}>
            <p className={styles.ctaNote}>Let's talk through the specifics.</p>
            <button className={styles.ctaPrimary} onClick={() => { setModalOpen(true); setConfirmed(false); setSelectedSlot(null) }}>
              <div>
                <div className={styles.ctaMain}>Book a call with duoduo</div>
                <div className={styles.ctaSub}>30 min · Free · We'll come prepared</div>
              </div>
              <span>→</span>
            </button>
            <button className={styles.ctaSecondary} onClick={copyBrief}>Copy brief</button>
            <div className={styles.restart} onClick={restart}>Start over</div>
          </div>

        </div>
      )}

      {/* ── BOOKING MODAL */}
      {modalOpen && (
        <div className={styles.overlay} onClick={e => { if (e.target === e.currentTarget) setModalOpen(false) }}>
          <div className={styles.modal}>
            {!confirmed ? (
              <>
                <div className={styles.mHead}>
                  <div>
                    <h2>Book a call</h2>
                    <p>30 min · Google Meet · No prep needed</p>
                  </div>
                  <button onClick={() => setModalOpen(false)}>×</button>
                </div>
                <div className={styles.mBody}>
                  {brief?.core_need && (
                    <div className={styles.briefPrev}>
                      <strong>Brief summary</strong>
                      {brief.core_need}
                    </div>
                  )}
                  <div className={styles.slotsLbl}>Available times (SGT)</div>
                  <div className={styles.slots}>
                    {slots.map((slot, i) => (
                      <div key={i}
                        className={`${styles.slot} ${selectedSlot === slot.day ? styles.slotOn : ''}`}
                        onClick={() => setSelectedSlot(slot.day)}>
                        <div>
                          <div className={styles.sDay}>{slot.day}</div>
                          <div className={styles.sTime}>{slot.time}</div>
                        </div>
                        <span className={styles.sDur}>30 min</span>
                      </div>
                    ))}
                  </div>
                  <button className={styles.bookBtn} disabled={!selectedSlot} onClick={() => setConfirmed(true)}>
                    Confirm
                  </button>
                  <p className={styles.mAlt}>Different timezone? <a href="mailto:hello@duoduo.global">Email us</a></p>
                </div>
              </>
            ) : (
              <div className={styles.confirmV}>
                <div className={styles.ck}>✓</div>
                <h3>You're booked.</h3>
                <p>Invite on its way. We've read your brief and will come with questions, not slides.</p>
                <button onClick={() => setModalOpen(false)}>Close</button>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  )
}
