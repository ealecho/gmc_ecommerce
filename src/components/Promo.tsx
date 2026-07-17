import React from 'react';
import { ArrowRight, Globe } from 'lucide-react';
import ImageLoader from './ImageLoader';
import FadeIn from './FadeIn';

const Promo = () => {
  return (
    <section className="px-4 md:px-12 py-16 bg-gray-50">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
        
        {/* Left Column */}
        <FadeIn delay={0.1} direction="right" className="flex flex-col justify-center h-full pr-4">
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-6 uppercase leading-tight">
            SHIP YOUR WEBSITE<br />QUICKLY WITH<br />FRAMEBLOX
          </h2>
          <p className="text-gray-600 font-mono text-sm mb-8 leading-relaxed max-w-sm">
            Use prebuilt templates and components for a professional, stunning look. Save time and focus on content with our user-friendly, customizable design solutions.
          </p>
          <div>
            <button className="group bg-black text-white px-6 py-3 rounded-full font-medium flex items-center gap-3 hover:bg-white hover:text-black border border-transparent hover:border-black transition-all duration-300 w-fit">
              Explore templates
              <div className="bg-white/20 p-1 rounded-full group-hover:bg-black group-hover:text-white transition-all duration-300">
                <ArrowRight size={16} className="text-white group-hover:rotate-45 transition-transform duration-300" />
              </div>
            </button>
          </div>
        </FadeIn>

        {/* Middle Column - Image */}
        <FadeIn delay={0.2} direction="up" className="h-[400px] md:h-[500px] rounded-3xl overflow-hidden relative">
          <ImageLoader 
            src="https://images.unsplash.com/photo-1578681994506-b8f463449011?q=80&w=1000&auto=format&fit=crop" 
            alt="Person in orange hoodie" 
            className="w-full h-full"
          />
        </FadeIn>

        {/* Right Column - Dark Card */}
        <FadeIn delay={0.3} direction="left" className="bg-black text-white rounded-3xl p-8 md:p-12 flex flex-col justify-end h-[400px] md:h-[500px]">
          <Globe size={32} className="mb-6 opacity-80" />
          <h3 className="text-2xl font-bold mb-4 uppercase leading-tight">
            BUILT BY THE STREETS,<br />MADE FOR YOU
          </h3>
          <p className="text-gray-400 font-mono text-sm leading-relaxed">
            Kitengi is more than fashion—it's a way of life. Join the movement.
          </p>
        </FadeIn>

      </div>
    </section>
  );
};

export default Promo;
