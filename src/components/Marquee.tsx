import React from 'react';

const MarqueeText = () => (
  <div className="flex items-center">
    <span className="mx-6">KITENGI</span><span className="text-gray-600">•</span>
    <span className="mx-6">NEW DROPS</span><span className="text-gray-600">•</span>
    <span className="mx-6">COMMUNITY DRIVEN</span><span className="text-gray-600">•</span>
    <span className="mx-6">STREETWEAR</span><span className="text-gray-600">•</span>
  </div>
);

const Marquee = () => {
  return (
    <div className="w-full bg-black text-white py-4 overflow-hidden flex whitespace-nowrap border-y border-gray-800">
      <div className="animate-marquee flex items-center font-bold uppercase tracking-widest text-xl">
        <MarqueeText />
        <MarqueeText />
        <MarqueeText />
        <MarqueeText />
      </div>
    </div>
  );
};

export default Marquee;
