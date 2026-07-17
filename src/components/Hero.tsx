import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import ImageLoader from './ImageLoader';
import FadeIn from './FadeIn';

const SLIDE_DURATION = 6000; // ms per slide

const slides = [
  {
    num: '01',
    title: 'Limited Drops.\nMaximum Impact.',
    description:
      'Exclusive releases in tight quantities. Once a drop sells out, it never comes back—so move fast.',
    image:
      'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=2000&auto=format&fit=crop',
    alt: 'Model in oversized streetwear hoodie',
  },
  {
    num: '02',
    title: 'Built for\nthe Streets',
    description:
      'Heavyweight fabrics and reinforced stitching engineered to take a beating and still look sharp.',
    image:
      'https://images.unsplash.com/photo-1578587018452-892bacefd3f2?q=80&w=2000&auto=format&fit=crop',
    alt: 'Urban streetwear jacket detail',
  },
  {
    num: '03',
    title: 'Art Meets\nAttitude',
    description:
      'Hand-drawn graphics and bold prints from artists who live and breathe street culture.',
    image:
      'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=2000&auto=format&fit=crop',
    alt: 'Graphic hoodie with custom print',
  },
  {
    num: '04',
    title: 'Future-Ready\nFashion',
    description:
      'Technical details and reflective accents designed for the way the city moves after dark.',
    image:
      'https://images.unsplash.com/photo-1506629082955-511b1aa562c8?q=80&w=2000&auto=format&fit=crop',
    alt: 'Neon-accented streetwear piece',
  },
  {
    num: '05',
    title: 'Community-Driven\nCulture',
    description:
      "More than just a brand, we're a movement—connecting creatives, skaters, and trendsetters who define the streets.",
    image:
      'https://images.unsplash.com/photo-1556821840-3a63f95609a7?q=80&w=2000&auto=format&fit=crop',
    alt: 'Model wearing black hoodie',
  },
];

const Hero = () => {
  const [active, setActive] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const timeoutRef = useRef<number | null>(null);

  const goTo = useCallback((index: number) => {
    setActive(((index % slides.length) + slides.length) % slides.length);
  }, []);

  const next = useCallback(() => {
    setActive((current) => (current + 1) % slides.length);
  }, []);

  // Auto-advance unless paused (on hover/focus or reduced motion).
  useEffect(() => {
    const prefersReduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (isPaused || prefersReduced) return undefined;

    timeoutRef.current = setTimeout(next, SLIDE_DURATION);
    return () => clearTimeout(timeoutRef.current);
  }, [active, isPaused, next]);

  const currentSlide = slides[active];

  return (
    <section className="px-4 md:px-12 py-4">
      <FadeIn direction="up">
        <div
          className="relative w-full h-[600px] md:h-[700px] rounded-[2rem] overflow-hidden bg-zinc-900 text-white"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          onFocusCapture={() => setIsPaused(true)}
          onBlurCapture={() => setIsPaused(false)}
          aria-roledescription="carousel"
          aria-label="Featured collections"
        >
          {/* Background image crossfade */}
          <AnimatePresence initial={false} mode="sync">
            <motion.div
              key={active}
              className="absolute inset-0"
              initial={{ opacity: 0, scale: 1.05 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ opacity: { duration: 0.8 }, scale: { duration: 6, ease: 'linear' } }}
            >
              <ImageLoader
                src={currentSlide.image}
                alt={currentSlide.alt}
                className="absolute inset-0 w-full h-full opacity-60"
              />
            </motion.div>
          </AnimatePresence>

          {/* Dark gradient for text legibility */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent pointer-events-none" />

          {/* Content overlay */}
          <div className="absolute inset-0 flex flex-col justify-between p-8 md:p-16">
            <div className="max-w-2xl mt-auto mb-12">
              <AnimatePresence mode="wait">
                <motion.div
                  key={active}
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -16 }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                >
                  <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 uppercase whitespace-pre-line">
                    {currentSlide.title}
                  </h1>
                  <p className="text-lg md:text-xl text-gray-300 mb-8 max-w-lg font-mono">
                    {currentSlide.description}
                  </p>
                </motion.div>
              </AnimatePresence>

              <button className="group bg-white text-black px-6 py-3 rounded-full font-medium flex items-center gap-3 hover:bg-black hover:text-white transition-all duration-300">
                Shop now
                <div className="bg-black text-white p-1 rounded-full group-hover:bg-white group-hover:text-black transition-all duration-300">
                  <ArrowRight size={16} className="group-hover:rotate-45 transition-transform duration-300" />
                </div>
              </button>
            </div>

            {/* Slide indicators / navigation */}
            <div className="w-full flex gap-4 overflow-x-auto pb-4 scrollbar-hide" role="tablist" aria-label="Carousel slides">
              {slides.map((item, index) => {
                const isActive = index === active;
                return (
                  <button
                    key={item.num}
                    type="button"
                    onClick={() => goTo(index)}
                    role="tab"
                    aria-selected={isActive}
                    aria-label={`Go to slide ${item.num}: ${item.title.replace(/\n/g, ' ')}`}
                    className="flex-1 min-w-[150px] text-left group focus:outline-none"
                  >
                    <div className="h-1 w-full mb-3 rounded-full bg-white/30 overflow-hidden">
                      {isActive ? (
                        <motion.div
                          key={`progress-${active}-${isPaused}`}
                          className="h-full bg-white rounded-full"
                          initial={{ width: isPaused ? '100%' : '0%' }}
                          animate={{ width: '100%' }}
                          transition={{ duration: isPaused ? 0 : SLIDE_DURATION / 1000, ease: 'linear' }}
                        />
                      ) : (
                        <div className="h-full w-0 bg-white rounded-full group-hover:w-1/3 transition-all duration-300" />
                      )}
                    </div>
                    <div className="font-mono text-xs mb-1 opacity-70">{item.num}</div>
                    <div className={`text-sm font-medium transition-colors ${isActive ? 'text-white' : 'text-white/70 group-hover:text-white'}`}>
                      {item.title.replace(/\n/g, ' ')}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </FadeIn>
    </section>
  );
};

export default Hero;
