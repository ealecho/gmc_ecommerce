import React from 'react';
import Hero from '../components/Hero';
import Marquee from '../components/Marquee';
import NewDrops from '../components/NewDrops';
import Promo from '../components/Promo';
import Benefits from '../components/Benefits';

const Home = () => {
  return (
    <main>
      <Hero />
      <Marquee />
      <NewDrops />
      <Promo />
      <Benefits />
    </main>
  );
};

export default Home;
