'use client'

import { useEffect, useState } from 'react'
import { Navbar } from '@/components/launch-page/navbar'
import ObrixRobot from '@/components/launch-page/obrix-robot'
import { SiteFooter } from '@/components/launch-page/site-footer'
import { LiveSection } from '@/components/launch-page/live-section'

const prompts = [
  'Create a smart contract for a token named OXRIZ on Robinhood Chain.',
  'Explain what a smart contract does in simple terms.',
  'Audit this contract for reentrancy vulnerabilities.',
  'Analyze the crypto market and discover new opportunities.',
]

export default function Home() {
  const [announcement, setAnnouncement] = useState(true)
  const [promptIndex, setPromptIndex] = useState(0)
  const [typedPrompt, setTypedPrompt] = useState('')
  const [activeSection, setActiveSection] = useState('INTRO')

  useEffect(() => {
    let index = 0
    let deleting = false
    let timeout: ReturnType<typeof setTimeout>

    const type = () => {
      const target = prompts[promptIndex]
      if (!deleting) {
        index++
        setTypedPrompt(target.slice(0, index))
        if (index >= target.length) {
          deleting = true
          timeout = setTimeout(type, 2600)
          return
        }
        timeout = setTimeout(type, 38)
      } else {
        index = Math.max(0, index - 2)
        setTypedPrompt(target.slice(0, index))
        if (index <= 0) {
          deleting = false
          setPromptIndex((old) => (old + 1) % prompts.length)
          timeout = setTimeout(() => {
            index = 0
            setTypedPrompt('')
          }, 250)
          return
        }
        timeout = setTimeout(type, 14)
      }
    }

    timeout = setTimeout(type, 500)
    return () => clearTimeout(timeout)
  }, [promptIndex])

  useEffect(() => {
    const nodes = document.querySelectorAll<HTMLElement>('.obrix-reveal')
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const element = entry.target as HTMLElement
          const delay = Number(element.dataset.delay || 0)
          setTimeout(() => element.classList.add('is-visible'), delay)
          observer.unobserve(element)
        }
      })
    }, { threshold: 0.15 })

    nodes.forEach((node) => observer.observe(node))
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const update = () => {
      const sections = ['intro', 'product', 'live']
      let active = 'INTRO'
      sections.forEach((id) => {
        const el = document.getElementById(id)
        if (el && el.getBoundingClientRect().top < window.innerHeight * 0.5) {
          active = id.toUpperCase()
        }
      })
      setActiveSection(active)
    }
    window.addEventListener('scroll', update, { passive: true })
    update()
    return () => window.removeEventListener('scroll', update)
  }, [])



  return (
    <div className="obrix-site obrix-paper-grid">
      <ObrixRobot />

      {announcement && (
        <div className="obrix-announcement">
          <span><strong>New:</strong> OXRIZ — a new on-chain launch experience ↗</span>
          <button aria-label="Dismiss announcement" onClick={() => setAnnouncement(false)}>×</button>
        </div>
      )}

      <div className="obrix-nav-wrap">
        <Navbar />
      </div>

      <aside className="obrix-rail" aria-label="Page sections">
        <div className="obrix-rail-dots">
          {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13].map((n) => (
            <span key={n} />
          ))}
        </div>
        <div className="obrix-rail-label">{activeSection}</div>
        <a href="#product">≡ MENU</a>
      </aside>

      <main className="obrix-content">
        <section id="intro" className="obrix-section obrix-intro">
          <div className="obrix-prompt obrix-reveal" data-delay="100">
            <div className="obrix-quote-tab">“</div>
            <div className="obrix-prompt-box">
              <span>{typedPrompt}</span><i className="obrix-caret" />
            </div>
            <p className="obrix-prompt-next">{prompts[(promptIndex + 1) % prompts.length]}</p>
          </div>

          <div className="obrix-rule obrix-reveal" data-delay="200" />
          <div className="obrix-features obrix-reveal" data-delay="300">
            {['ON-CHAIN LAUNCHES', 'SMART CONTRACTS', 'AI & MARKET TOOLS', 'AND MUCH MORE'].map((item, i) => (
              <div className={i === 3 ? 'is-dim' : ''} key={item}>
                <span className="obrix-feature-dot" />{item}
              </div>
            ))}
          </div>

          <div className="obrix-intro-title obrix-reveal" data-delay="200">
            <p className="obrix-eyebrow">BUILD THE NEXT ON-CHAIN IDEA</p>
            <h1><span className="obrix-headline-frame">Thinking</span><br /><span className="obrix-headline-frame obrix-headline-second">Machines</span></h1>
          </div>

          <p className="obrix-intro-sub obrix-reveal" data-delay="400">
            Your gateway to a more thoughtful on-chain launch experience.
          </p>
          <a className="obrix-cta" href="/launch">Launch a token →</a>
          <a className="obrix-scroll" href="#product">SCROLL <span>↓</span></a>
          <div className="obrix-bottom-rule" />
        </section>

        <section id="product" className="obrix-section obrix-product">
          <div className="obrix-product-heading obrix-reveal" data-delay="100">
            <span className="obrix-eyebrow">··</span>
            <h2><span className="obrix-heading-frame">Start</span><br />Building</h2>
            <p>Everything you need to take a token from idea to on-chain, in one place.</p>
          </div>

          <div className="obrix-go-grid obrix-reveal" data-delay="200">
            {[
              { n: '01', title: 'Launch a token', body: 'Fill in your token details, preview it live and deploy through Pons V2.', href: '/launch' },
              { n: '02', title: 'Explore launches', body: 'See every token launched through the factory, read straight from the chain.', href: '/explore' },
              { n: '03', title: 'Talk to the agent', body: 'Describe your token in plain words and let the agent draft it for you.', href: '/agent' },
              { n: '04', title: 'AI Copilot', body: 'Ask about Pons V2, token launches and project strategy before you act.', href: '/copilot' },
            ].map((c) => (
              <a className="obrix-go-card" href={c.href} key={c.n}>
                <span>{c.n}</span>
                <strong>{c.title}</strong>
                <p>{c.body}</p>
                <em>Open →</em>
              </a>
            ))}
          </div>

          <div className="obrix-go-steps obrix-reveal" data-delay="300">
            <div><b>01</b>DESCRIBE</div>
            <div><b>02</b>CONNECT</div>
            <div><b>03</b>DEPLOY</div>
            <div><b>04</b>TRACK</div>
          </div>
        </section>

        <LiveSection />
      </main>
      <SiteFooter />
    </div>
  )
}
