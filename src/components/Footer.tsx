import React from 'react';
import { ArrowRight } from 'lucide-react';
import FadeIn from './FadeIn';

const Instagram = ({ size = 24, className }: { size?: number; className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
  </svg>
);

const Twitter = ({ size = 24, className }: { size?: number; className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"></path>
  </svg>
);

const Facebook = ({ size = 24, className }: { size?: number; className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
  </svg>
);

const Pinterest = ({ size = 24, className }: { size?: number; className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <line x1="12" y1="12" x2="12" y2="22"></line>
    <path d="M12 12c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5z"></path>
  </svg>
);

const Footer = () => {
  return (
    <footer className="bg-[#111111] text-white pt-20 pb-8 px-4 md:px-12 overflow-hidden">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-12 mb-16">
        
        {/* Brand Section */}
        <FadeIn delay={0.1} direction="up" className="md:col-span-4">
          <h2 className="text-3xl font-bold tracking-tighter uppercase mb-6">KITENGI</h2>
          <p className="text-gray-400 font-mono text-sm leading-relaxed mb-8 max-w-sm">
            More than just a brand, we're a movement-connecting creatives, skaters, and trendsetters who define the streets.
          </p>
          <div className="flex gap-4">
            <a href="#" className="text-gray-400 hover:text-white transition-colors"><Instagram size={20} /></a>
            <a href="#" className="text-gray-400 hover:text-white transition-colors"><Twitter size={20} /></a>
            <a href="#" className="text-gray-400 hover:text-white transition-colors"><Pinterest size={20} /></a>
            <a href="#" className="text-gray-400 hover:text-white transition-colors"><Facebook size={20} /></a>
          </div>
        </FadeIn>

        {/* Links Sections */}
        <FadeIn delay={0.2} direction="up" className="md:col-span-2">
          <h3 className="font-bold text-sm uppercase tracking-wider mb-6">SHOP</h3>
          <ul className="flex flex-col gap-4 text-gray-400 font-mono text-sm">
            <li><a href="#" className="hover:text-white transition-colors">New Drops</a></li>
            <li><a href="#" className="hover:text-white transition-colors">Hoodies</a></li>
            <li><a href="#" className="hover:text-white transition-colors">T-Shirts</a></li>
            <li><a href="#" className="hover:text-white transition-colors">Pants</a></li>
            <li><a href="#" className="hover:text-white transition-colors">Accessories</a></li>
            <li><a href="#" className="hover:text-white transition-colors">All Products</a></li>
          </ul>
        </FadeIn>

        <FadeIn delay={0.3} direction="up" className="md:col-span-2">
          <h3 className="font-bold text-sm uppercase tracking-wider mb-6">COMPANY</h3>
          <ul className="flex flex-col gap-4 text-gray-400 font-mono text-sm">
            <li><a href="#" className="hover:text-white transition-colors">Our Story</a></li>
            <li><a href="#" className="hover:text-white transition-colors">Sustainability</a></li>
            <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
            <li><a href="#" className="hover:text-white transition-colors">Press</a></li>
            <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
          </ul>
        </FadeIn>

        <FadeIn delay={0.4} direction="up" className="md:col-span-2">
          <h3 className="font-bold text-sm uppercase tracking-wider mb-6">HELP</h3>
          <ul className="flex flex-col gap-4 text-gray-400 font-mono text-sm">
            <li><a href="#" className="hover:text-white transition-colors">FAQ</a></li>
            <li><a href="#" className="hover:text-white transition-colors">Shipping & Returns</a></li>
            <li><a href="#" className="hover:text-white transition-colors">Size Guide</a></li>
            <li><a href="#" className="hover:text-white transition-colors">Track Order</a></li>
            <li><a href="#" className="hover:text-white transition-colors">Support</a></li>
          </ul>
        </FadeIn>

        {/* Newsletter Section */}
        <FadeIn delay={0.5} direction="up" className="md:col-span-2">
          <h3 className="font-bold text-sm uppercase tracking-wider mb-6">NEWSLETTER</h3>
          <p className="text-gray-400 font-mono text-sm mb-4">
            Be the first to know about new drops and exclusive offers.
          </p>
          <div className="relative group">
            <input 
              type="email" 
              placeholder="Enter your email" 
              className="w-full bg-white text-black rounded-full py-3 pl-4 pr-12 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-gray-500 transition-all duration-300"
            />
            <button className="absolute right-2 top-1/2 -translate-y-1/2 text-black p-1 hover:bg-black hover:text-white rounded-full transition-all duration-300">
              <ArrowRight size={18} className="group-focus-within:rotate-45 hover:rotate-45 transition-transform duration-300" />
            </button>
          </div>
        </FadeIn>

      </div>

      {/* Bottom Footer */}
      <FadeIn delay={0.6} direction="up" className="pt-8 border-t border-gray-800 flex flex-col md:flex-row justify-between items-center gap-4 text-gray-500 font-mono text-xs">
        <p>© 2026 Kitengi. All rights reserved.</p>
        <div className="flex gap-6">
          <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
          <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
          <a href="#" className="hover:text-white transition-colors">Accessibility</a>
        </div>
      </FadeIn>
    </footer>
  );
};

export default Footer;
