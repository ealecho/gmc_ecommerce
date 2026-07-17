import React from 'react';
import { Star, ShieldCheck, Truck, RefreshCcw } from 'lucide-react';
import FadeIn from './FadeIn';

const benefits = [
  {
    icon: <Star size={24} strokeWidth={1.5} />,
    title: 'PREMIUM QUALITY',
    description: 'Top-tier fabrics built to last.'
  },
  {
    icon: <ShieldCheck size={24} strokeWidth={1.5} />,
    title: 'SECURE PAYMENT',
    description: 'Safe & encrypted checkout.'
  },
  {
    icon: <Truck size={24} strokeWidth={1.5} />,
    title: 'FAST SHIPPING',
    description: 'Quick delivery, no long waits.'
  },
  {
    icon: <RefreshCcw size={24} strokeWidth={1.5} />,
    title: 'EASY RETURNS',
    description: 'Hassle-free returns within 30 days.'
  }
];

const Benefits = () => {
  return (
    <section className="px-4 md:px-12 py-16 border-t border-gray-200 bg-white overflow-hidden">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 divide-y sm:divide-y-0 sm:divide-x divide-gray-200">
        {benefits.map((benefit, index) => (
          <FadeIn key={index} delay={index * 0.1} direction="up" className={`flex items-start gap-4 ${index !== 0 ? 'sm:pl-8 pt-8 sm:pt-0' : ''}`}>
            <div className="text-black mt-1">
              {benefit.icon}
            </div>
            <div>
              <h4 className="font-bold text-sm mb-1 uppercase tracking-wide">{benefit.title}</h4>
              <p className="text-gray-500 font-mono text-xs">{benefit.description}</p>
            </div>
          </FadeIn>
        ))}
      </div>
    </section>
  );
};

export default Benefits;
