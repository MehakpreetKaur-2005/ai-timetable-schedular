import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import '../landing.css'

import heroBg from '../assets/hero-bg.png'

export default function LandingPage() {
  const navigate = useNavigate()
  const problemRef = useRef(null)
  const [problemVisible, setProblemVisible] = useState(false)

  useEffect(() => {
    const el = problemRef.current
    if (!el) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        setProblemVisible(entry.isIntersecting)
      },
      { threshold: 0.15 }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <>
      {/* ── NAVBAR ── */}
      <nav className="navbar" id="navbar">
        {/* Brand */}
        <div className="navbar-brand">
          <svg
            className="navbar-brand-logo"
            viewBox="0 0 40 40"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <rect width="40" height="40" rx="10" fill="#B8654A" />
            <path
              d="M12 12H20V16H12V12Z M22 12H28V20H22V12Z M12 18H20V22H16V28H12V18Z M18 24H28V28H18V24Z"
              fill="white"
              opacity="0.95"
            />
          </svg>

          <div className="navbar-brand-text-group">
            <span className="navbar-brand-title">SchedulAI</span>
            <span className="navbar-brand-tagline">Smart Academic Scheduling</span>
          </div>
        </div>

        {/* Center Links */}
        <ul className="navbar-links">
          <li><a className="navbar-link" href="#problem" onClick={(e) => { e.preventDefault(); document.getElementById('problem').scrollIntoView({behavior: 'smooth'}) }}>About</a></li>
          <li><a className="navbar-link" href="#solution" onClick={(e) => { e.preventDefault(); document.getElementById('solution').scrollIntoView({behavior: 'smooth'}) }}>Features</a></li>
          <li><a className="navbar-link" href="#ai" onClick={(e) => { e.preventDefault(); document.getElementById('ai').scrollIntoView({behavior: 'smooth'}) }}>How it Works</a></li>
        </ul>

        {/* CTA */}
        <Link className="navbar-cta" to="/login">
          Login <span className="navbar-cta-arrow">→</span>
        </Link>
      </nav>

      {/* ── HERO SECTION ── */}
      <section className="hero" id="hero">
        <div
          className="hero-bg"
          style={{ backgroundImage: `url(${heroBg})` }}
        />
        <div className="hero-overlay" />

        <div className="hero-content">
          <h1 className="hero-headline">
            From Weeks of Planning<br />to Seconds of Intelligence
          </h1>
          <p className="hero-subtitle">
            Smarter Timetable. Zero Conflicts. Powered by AI.
          </p>
          <div className="hero-cta-row">
            <button className="btn btn-primary" id="cta-get-started" onClick={() => navigate('/register')}>
              Get Started
            </button>
            <button className="btn btn-secondary" id="cta-learn-more" onClick={() => document.getElementById('problem').scrollIntoView({behavior: 'smooth'})}>
              Learn More
            </button>
          </div>
        </div>
      </section>

      {/* ── PROBLEM SECTION ── */}
      <section
        ref={problemRef}
        className={`problem${problemVisible ? ' problem--visible' : ''} `}
        id="problem"
      >
        {/* Quote */}
        <h2 className="problem-quote">
          &ldquo;Planning takes days. Changes take more.&rdquo;
        </h2>
        {/* Support text */}
        <p className="problem-support">When Scheduling becomes a Struggle</p>

        {/* Timeline */}
        <div className="problem-timeline">
          <div className="timeline-line" />

          {/* Card 1 — top */}
          <div className="timeline-item timeline-item--top">
            <div className="timeline-card">
              <div className="timeline-card-icon">
                <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="24" cy="24" r="22" stroke="currentColor" strokeWidth="2" fill="none" opacity="0.15" />
                  <path d="M16 18h16v2H16v-2zm0 5h12v2H16v-2zm0 5h8v2H16v-2z" fill="currentColor" />
                  <rect x="13" y="12" width="22" height="24" rx="3" stroke="currentColor" strokeWidth="2" fill="none" />
                </svg>
              </div>
              <h3 className="timeline-card-title">Manual Planning</h3>
              <p className="timeline-card-desc">
                Hours of spreadsheets and back-and-forth emails just to draft a single timetable.
              </p>
            </div>
            <div className="timeline-dot" />
          </div>

          {/* Card 2 — bottom */}
          <div className="timeline-item timeline-item--bottom">
            <div className="timeline-dot" />
            <div className="timeline-card">
              <div className="timeline-card-icon">
                <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="24" cy="24" r="22" stroke="currentColor" strokeWidth="2" fill="none" opacity="0.15" />
                  <path d="M18 16l12 16M30 16L18 32" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                </svg>
              </div>
              <h3 className="timeline-card-title">Conflicts</h3>
              <p className="timeline-card-desc">
                Overlapping classes, double-booked rooms, and clashing faculty schedules.
              </p>
            </div>
          </div>

          {/* Card 3 — top */}
          <div className="timeline-item timeline-item--top">
            <div className="timeline-card">
              <div className="timeline-card-icon">
                <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="24" cy="24" r="22" stroke="currentColor" strokeWidth="2" fill="none" opacity="0.15" />
                  <circle cx="24" cy="20" r="5" stroke="currentColor" strokeWidth="2" fill="none" />
                  <path d="M20 30c0-1 1.5-2 4-2s4 1 4 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  <path d="M24 35v-3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  <path d="M20 33l4 2 4-2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none" />
                </svg>
              </div>
              <h3 className="timeline-card-title">Stress</h3>
              <p className="timeline-card-desc">
                Coordinators overwhelmed by endless constraints and last-minute requests.
              </p>
            </div>
            <div className="timeline-dot" />
          </div>

          {/* Card 4 — bottom */}
          <div className="timeline-item timeline-item--bottom">
            <div className="timeline-dot" />
            <div className="timeline-card">
              <div className="timeline-card-icon">
                <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="24" cy="24" r="22" stroke="currentColor" strokeWidth="2" fill="none" opacity="0.15" />
                  <circle cx="24" cy="24" r="9" stroke="currentColor" strokeWidth="2" fill="none" />
                  <path d="M24 18v6l4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </div>
              <h3 className="timeline-card-title">Delays</h3>
              <p className="timeline-card-desc">
                Weeks lost waiting for approvals and revisions before the term even starts.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── SOLUTION SECTION ── */}
      <section className="solution" id="solution">
        {/* Animated Background Dots */}
        <div className="solution-bg-dots">
          {[...Array(20)].map((_, i) => (
            <div key={i} className="dot-particle" style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${Math.random() * 3 + 4}s`
            }} />
          ))}
        </div>

        <div className="solution-content">
          <h2 className="solution-title">From Chaos to Clarity</h2>
          <p className="solution-subtitle">Smart AI that transforms scheduling</p>

          <div className="solution-grid">
            {/* Card A */}
            <div className="solution-card">
              <div className="solution-card-icon">
                {/* AI Brain / Magic Sparkle Icon */}
                <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M24 8a16 16 0 0 0-16 16c0 5 2.3 9.4 5.9 12.3.9.7 1.4 1.8 1.4 2.9v1.8h17.4v-1.8c0-1.1.5-2.2 1.4-2.9C37.7 33.4 40 29 40 24A16 16 0 0 0 24 8z" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                  <path d="M18 45h12M20 40h8M24 20l-4 4 4 4 4-4-4-4z" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <h3 className="solution-card-title">Auto-Generates Optimized Timetables</h3>
              <p className="solution-card-desc">
                Instantly creates structured timetables based on constraints, availability, and institutional rules.
              </p>
            </div>

            {/* Card B */}
            <div className="solution-card">
              <div className="solution-card-icon">
                {/* Shield / Warning Resolver Icon */}
                <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M24 6L8 14v10c0 11 7 21 16 24 9-3 16-13 16-24V14L24 6z" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round" />
                  <path d="M16 26l6 6 12-12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <h3 className="solution-card-title">Detects & Resolves Conflicts</h3>
              <p className="solution-card-desc">
                Identifies scheduling clashes in real-time and automatically adjusts for seamless coordination.
              </p>
            </div>

            {/* Card C */}
            <div className="solution-card">
              <div className="solution-card-icon">
                {/* Scale Balance Icon */}
                <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M24 8v34M14 16H8s-4 12 6 12 6-12 6-12h-6zm20 0h-6s-4 12 6 12 6-12 6-12h-6z" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M14 16h20" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                  <path d="M20 42h8" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                </svg>
              </div>
              <h3 className="solution-card-title">Balances Faculty Workload</h3>
              <p className="solution-card-desc">
                Ensures fair distribution of teaching hours while maximizing efficiency.
              </p>
            </div>

            {/* Card D */}
            <div className="solution-card">
              <div className="solution-card-icon">
                {/* Dashboard Grid / Control Panel Icon */}
                <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="8" y="8" width="13" height="13" rx="2" stroke="currentColor" strokeWidth="2.5" />
                  <rect x="27" y="8" width="13" height="13" rx="2" stroke="currentColor" strokeWidth="2.5" />
                  <rect x="8" y="27" width="13" height="13" rx="2" stroke="currentColor" strokeWidth="2.5" />
                  <rect x="27" y="27" width="13" height="13" rx="2" stroke="currentColor" strokeWidth="2.5" />
                  <path d="M12 27v4M17 32v4M33 13v4M29 18v3" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                </svg>
              </div>
              <h3 className="solution-card-title">Easy Admin Dashboard</h3>
              <p className="solution-card-desc">
                A clean and intuitive interface for admins to manage schedules, faculty, and classes effortlessly.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── AI SECTION (Powered by Intelligent Algorithms) ── */}
      <section className="ai-section" id="ai">
        <div className="ai-container">

          {/* Left Text Content */}
          <div className="ai-text-content">
            <h2 className="ai-title">
              <span className="punchline-dark">Good scheduling follows rules.</span>
              <span className="punchline-light">Intelligent scheduling understands priorities.</span>
            </h2>
            <div className="ai-tag">Powered by Intelligent Algorithms</div>
          </div>

          {/* Right Pipeline Flow Diagram */}
          <div className="ai-flow-card">
            <div className="ai-flow">
              {/* SVG Connecting Line */}
              <svg className="flow-lines-svg" xmlns="http://www.w3.org/2000/svg">
                <path className="flow-path" d="M30 40 L30 110 L30 180 L30 250 L30 320" stroke="currentColor" strokeWidth="2" strokeDasharray="6 6" fill="none" />
                <circle className="flow-dot flow-dot-1" cx="30" cy="40" r="4" />
                <circle className="flow-dot flow-dot-2" cx="30" cy="110" r="4" />
                <circle className="flow-dot flow-dot-3" cx="30" cy="180" r="4" />
                <circle className="flow-dot flow-dot-4" cx="30" cy="250" r="4" />
                <circle className="flow-dot flow-dot-5" cx="30" cy="320" r="4" />
              </svg>

              {/* Step 1 */}
              <div className="flow-step flow-step-1">
                <div className="flow-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
                  </svg>
                </div>
                <div className="flow-label">Admin Input</div>
              </div>

              {/* Step 2 */}
              <div className="flow-step flow-step-2">
                <div className="flow-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                </div>
                <div className="flow-label">Constraint Processor</div>
              </div>

              {/* Step 3 */}
              <div className="flow-step flow-step-3">
                <div className="flow-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                  </svg>
                </div>
                <div className="flow-label">Optimization Engine</div>
              </div>

              {/* Step 4 (Conflict Resolution - flashes red then green via CSS) */}
              <div className="flow-step flow-step-4 flow-step-conflict">
                <div className="flow-icon icon-conflict">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0zM12 9v4M12 17h.01" />
                  </svg>
                </div>
                <div className="flow-icon icon-resolved">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
                  </svg>
                </div>
                <div className="flow-label">Conflict Resolution</div>
              </div>

              {/* Step 5 */}
              <div className="flow-step flow-step-5">
                <div className="flow-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                </div>
                <div className="flow-label">Optimized Timetable</div>
              </div>

            </div>
          </div>

        </div>
      </section>
    </>
  )
}

