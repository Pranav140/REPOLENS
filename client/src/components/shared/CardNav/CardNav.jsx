import { useLayoutEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ArrowUpRight } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import './CardNav.css';

const CardNav = ({
  items,
  className = '',
  ease = 'power3.out',
  baseColor = 'var(--bg-surface)',
  menuColor = 'var(--text-primary)',
  leftContent,
  centerContent,
  rightContent
}) => {
  const [isHamburgerOpen, setIsHamburgerOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const navRef = useRef(null);
  const cardsRef = useRef([]);
  const tlRef = useRef(null);

  const calculateHeight = () => {
    const navEl = navRef.current;
    if (!navEl) return 260;

    const isMobile = window.matchMedia('(max-width: 768px)').matches;
    if (isMobile) {
      const contentEl = navEl.querySelector('.card-nav-content');
      if (contentEl) {
        const wasVisible = contentEl.style.visibility;
        const wasPointerEvents = contentEl.style.pointerEvents;
        const wasPosition = contentEl.style.position;
        const wasHeight = contentEl.style.height;

        contentEl.style.visibility = 'visible';
        contentEl.style.pointerEvents = 'auto';
        contentEl.style.position = 'static';
        contentEl.style.height = 'auto';
        contentEl.offsetHeight;

        const topBar = 60;
        const padding = 16;
        const contentHeight = contentEl.scrollHeight;

        contentEl.style.visibility = wasVisible;
        contentEl.style.pointerEvents = wasPointerEvents;
        contentEl.style.position = wasPosition;
        contentEl.style.height = wasHeight;

        return topBar + contentHeight + padding;
      }
    }
    return 260; // Desktop height
  };

  const createTimeline = () => {
    const navEl = navRef.current;
    if (!navEl) return null;

    gsap.set(navEl, { height: 60, overflow: 'hidden' });
    gsap.set(cardsRef.current, { y: 50, opacity: 0 });

    const tl = gsap.timeline({ paused: true });

    tl.to(navEl, {
      height: calculateHeight(),
      duration: 0.4,
      ease
    });

    tl.to(cardsRef.current, { y: 0, opacity: 1, duration: 0.4, ease, stagger: 0.08 }, '-=0.1');

    return tl;
  };

  useLayoutEffect(() => {
    const tl = createTimeline();
    tlRef.current = tl;
    return () => {
      tl?.kill();
      tlRef.current = null;
    };
  }, [ease, items]);

  useLayoutEffect(() => {
    const handleResize = () => {
      if (!tlRef.current) return;
      if (isExpanded) {
        const newHeight = calculateHeight();
        gsap.set(navRef.current, { height: newHeight });
        tlRef.current.kill();
        const newTl = createTimeline();
        if (newTl) {
          newTl.progress(1);
          tlRef.current = newTl;
        }
      } else {
        tlRef.current.kill();
        const newTl = createTimeline();
        if (newTl) {
          tlRef.current = newTl;
        }
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isExpanded]);

  const toggleMenu = () => {
    const tl = tlRef.current;
    if (!tl) return;
    if (!isExpanded) {
      setIsHamburgerOpen(true);
      setIsExpanded(true);
      tl.play(0);
    } else {
      setIsHamburgerOpen(false);
      tl.eventCallback('onReverseComplete', () => setIsExpanded(false));
      tl.reverse();
    }
  };

  const setCardRef = i => el => {
    if (el) cardsRef.current[i] = el;
  };

  return (
    <div className={`card-nav-container ${className}`}>
      <nav ref={navRef} className={`card-nav ${isExpanded ? 'open' : ''}`} style={{ backgroundColor: baseColor }}>
        
        {/* TOP BAR */}
        <div className="card-nav-top">
          
          <div className="card-nav-left">
            <div
              className={`hamburger-menu ${isHamburgerOpen ? 'open' : ''}`}
              onClick={toggleMenu}
              role="button"
              aria-label={isExpanded ? 'Close menu' : 'Open menu'}
              aria-expanded={isExpanded}
              tabIndex={0}
              style={{ color: menuColor }}
            >
              <div className="hamburger-line" />
              <div className="hamburger-line" />
            </div>
            
            {leftContent ? leftContent : (
              <div className="logo-container">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                  {/* Outer lens ring */}
                  <circle cx="11" cy="11" r="8" stroke="rgba(255,255,255,0.75)" strokeWidth="2" />
                  {/* Handle */}
                  <line x1="21" y1="21" x2="16.65" y2="16.65" stroke="rgba(255,255,255,0.4)" strokeWidth="2.5" />
                  {/* Inner blue node + lines */}
                  <circle cx="11" cy="11" r="2.5" fill="#3b82f6" />
                  <line x1="5" y1="11" x2="8.5" y2="11" stroke="#3b82f6" strokeWidth="1.5" />
                  <line x1="13.5" y1="11" x2="17" y2="11" stroke="#3b82f6" strokeWidth="1.5" />
                </svg>
                <span className="logo-text">RepoLens</span>
              </div>
            )}
          </div>

          <div className="card-nav-center" style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
            {centerContent}
          </div>

          <div className="card-nav-right">
            {rightContent}
          </div>

        </div>

        {/* DROPDOWN CONTENT */}
        <div className="card-nav-content" aria-hidden={!isExpanded}>
          {(items || []).slice(0, 3).map((item, idx) => (
            <div
              key={`${item.label}-${idx}`}
              className="nav-card"
              ref={setCardRef(idx)}
              style={{ backgroundColor: item.bgColor, color: item.textColor }}
            >
              <div className="nav-card-label">{item.label}</div>
              <div className="nav-card-links">
                {item.links?.map((lnk, i) => (
                  <NavLink 
                    key={`${lnk.label}-${i}`} 
                    className="nav-card-link" 
                    to={lnk.href}
                    onClick={() => {
                      if (isExpanded) toggleMenu();
                    }}
                  >
                    <ArrowUpRight size={18} className="nav-card-link-icon" aria-hidden="true" />
                    {lnk.label}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </div>
      </nav>
    </div>
  );
};

export default CardNav;
