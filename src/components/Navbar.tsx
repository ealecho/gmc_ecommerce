import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, ChevronDown, X, ShoppingBag, Plus, Minus, Trash2, Menu } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { formatIDR } from '../lib/currency';
import { toast } from 'sonner';
import { Product, CartItem } from '../types';

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

// Custom Pinterest Icon since Lucide doesn't have a perfect match
const Pinterest = ({ size = 24, className }: { size?: number; className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <line x1="12" y1="12" x2="12" y2="22"></line>
    <path d="M12 12c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5z"></path>
  </svg>
);

const Navbar = () => {
  const navigate = useNavigate();
  const [isCollectionsOpen, setIsCollectionsOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const { cartItems, removeFromCart, updateQuantity, cartTotal, itemCount } = useCart();
  const { user, profile, isAdmin, signOut } = useAuth();

  const handleCartAction = async (action: () => Promise<void>) => {
    try {
      await action();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const openCart = () => {
    if (!user) {
      toast.message('Sign in to use your cart.');
      navigate('/sign-in');
      return;
    }

    setIsCartOpen(true);
  };

  const handleSignOut = async () => {
    await signOut();
    setIsCartOpen(false);
    navigate('/');
  };

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 40);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header className={`w-full flex flex-col sticky top-0 z-50 transition-all duration-300 ${isScrolled ? 'bg-white/80 backdrop-blur-md shadow-sm' : 'bg-white'}`}>
      {/* Top Bar */}
      <div className={`w-full bg-black text-white px-6 flex justify-between items-center text-xs font-mono transition-all duration-300 overflow-hidden ${isScrolled ? 'h-0 py-0 opacity-0' : 'h-8 py-2 opacity-100'}`}>
        <div className="flex gap-4 items-center">
          <a href="#" className="hover:text-gray-300"><Instagram size={14} /></a>
          <a href="#" className="hover:text-gray-300"><Twitter size={14} /></a>
          <a href="#" className="hover:text-gray-300"><Pinterest size={14} /></a>
          <a href="#" className="hover:text-gray-300"><Facebook size={14} /></a>
        </div>
        <div className="flex gap-6">
          <a href="#" className="hover:text-gray-300">Contact</a>
          <a href="#" className="hover:text-gray-300">FAQ</a>
          <a href="#" className="hover:text-gray-300">Documentation</a>
          <a href="#" className="hover:text-gray-300">Support</a>
        </div>
      </div>

      {/* Main Nav */}
      <div className="w-full py-4 px-6 md:px-12 flex justify-between items-center">
        <Link to="/" className="text-2xl font-bold tracking-tighter uppercase">
          RAWBLOX
        </Link>
        
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium uppercase tracking-wide">
          <a href="#" className="hover:text-gray-600 transition-colors">Shop</a>
          
          <div 
            className="relative"
            onMouseEnter={() => setIsCollectionsOpen(true)}
            onMouseLeave={() => setIsCollectionsOpen(false)}
          >
            <a href="#" className="flex items-center gap-1 hover:text-gray-600 transition-colors py-2">
              Collections <ChevronDown size={14} className={`transition-transform duration-200 ${isCollectionsOpen ? 'rotate-180' : ''}`} />
            </a>
            
            <AnimatePresence>
              {isCollectionsOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  transition={{ duration: 0.2 }}
                  className="absolute top-full left-0 w-48 bg-white shadow-xl rounded-xl border border-gray-100 overflow-hidden"
                >
                  <div className="flex flex-col py-2">
                    <a href="#" className="px-4 py-2 hover:bg-gray-50 transition-colors">Summer '26</a>
                    <a href="#" className="px-4 py-2 hover:bg-gray-50 transition-colors">Essentials</a>
                    <a href="#" className="px-4 py-2 hover:bg-gray-50 transition-colors">Limited Edition</a>
                    <a href="#" className="px-4 py-2 hover:bg-gray-50 transition-colors">Collaborations</a>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <a href="#" className="hover:text-gray-600 transition-colors">Men</a>
          <a href="#" className="hover:text-gray-600 transition-colors">Women</a>
          <a href="#" className="hover:text-gray-600 transition-colors">Our Story</a>
          <a href="#" className="hover:text-gray-600 transition-colors">Contact</a>
          {user && <Link to="/orders" className="hover:text-gray-600 transition-colors">Orders</Link>}
          {isAdmin && <Link to="/admin/products" className="hover:text-gray-600 transition-colors">Admin</Link>}
        </nav>

        <div className="flex items-center gap-4">
          {user ? (
            <button onClick={handleSignOut} className="hidden md:inline-flex text-xs font-bold uppercase tracking-wide hover:text-gray-600">
              Sign out
            </button>
          ) : (
            <Link to="/sign-in" className="hidden md:inline-flex text-xs font-bold uppercase tracking-wide hover:text-gray-600">
              Sign in
            </Link>
          )}
          <button 
            onClick={openCart}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors relative"
          >
            <ShoppingCart size={20} />
            {itemCount > 0 && (
              <span className="absolute top-0 right-0 bg-black text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-full">
                {itemCount}
              </span>
            )}
          </button>
          
          {/* Mobile Menu Toggle */}
          <button 
            onClick={() => setIsMobileMenuOpen(true)}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors md:hidden"
          >
            <Menu size={20} />
          </button>
        </div>
      </div>

      {/* Mobile Menu Sheet */}
      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {isMobileMenuOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsMobileMenuOpen(false)}
                className="fixed inset-0 bg-black/40 z-[60] backdrop-blur-sm md:hidden"
              />
              <motion.div
                initial={{ x: '-100%' }}
                animate={{ x: 0 }}
                exit={{ x: '-100%' }}
                transition={{ type: 'spring', bounce: 0, duration: 0.4 }}
                className="fixed top-0 left-0 h-full w-full max-w-[80vw] bg-white z-[70] shadow-2xl flex flex-col md:hidden"
              >
              <div className="flex items-center justify-between p-6 border-b border-gray-100">
                <Link to="/" onClick={() => setIsMobileMenuOpen(false)} className="text-xl font-bold tracking-tighter uppercase">RAWBLOX</Link>
                <button 
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>
                <div className="flex flex-col p-6 gap-6 text-lg font-medium uppercase tracking-wide">
                  <a href="#" className="hover:text-gray-600 transition-colors">Shop</a>
                  <div className="flex flex-col gap-4">
                    <span className="text-gray-400 text-sm">Collections</span>
                    <a href="#" className="pl-4 hover:text-gray-600 transition-colors">Summer '26</a>
                    <a href="#" className="pl-4 hover:text-gray-600 transition-colors">Essentials</a>
                    <a href="#" className="pl-4 hover:text-gray-600 transition-colors">Limited Edition</a>
                  </div>
                  <a href="#" className="hover:text-gray-600 transition-colors">Men</a>
                  <a href="#" className="hover:text-gray-600 transition-colors">Women</a>
                  <a href="#" className="hover:text-gray-600 transition-colors">Our Story</a>
                  <a href="#" className="hover:text-gray-600 transition-colors">Contact</a>
                  {user && <Link to="/orders" onClick={() => setIsMobileMenuOpen(false)} className="hover:text-gray-600 transition-colors">Orders</Link>}
                  {isAdmin && <Link to="/admin/products" onClick={() => setIsMobileMenuOpen(false)} className="hover:text-gray-600 transition-colors">Admin</Link>}
                  {user ? (
                    <button onClick={handleSignOut} className="text-left hover:text-gray-600 transition-colors uppercase">Sign out</button>
                  ) : (
                    <Link to="/sign-in" onClick={() => setIsMobileMenuOpen(false)} className="hover:text-gray-600 transition-colors">Sign in</Link>
                  )}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>,
        document.body
      )}

      {/* Cart Sheet */}
      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {isCartOpen && (
            <>
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsCartOpen(false)}
                className="fixed inset-0 bg-black/40 z-[60] backdrop-blur-sm"
              />
              
              {/* Sheet */}
              <motion.div
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', bounce: 0, duration: 0.4 }}
                className="fixed top-0 right-0 h-full w-full max-w-md bg-white z-[70] shadow-2xl flex flex-col"
              >
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-100">
                  <div>
                    <h2 className="text-xl font-bold uppercase tracking-tight">Your Cart {itemCount > 0 && `(${itemCount})`}</h2>
                    {profile?.email && <p className="font-mono text-xs text-gray-500 mt-1">{profile.email}</p>}
                  </div>
                  <button 
                    onClick={() => setIsCartOpen(false)}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>

                {/* Cart Content */}
                {cartItems.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
                    <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mb-6">
                      <ShoppingBag size={40} strokeWidth={1.5} className="text-gray-400" />
                    </div>
                    <h3 className="text-xl font-bold uppercase mb-3">Your cart is empty</h3>
                    <p className="text-gray-500 font-mono text-sm mb-8 max-w-[250px]">
                      Looks like you haven't added anything to your cart yet.
                    </p>
                    <button 
                      onClick={() => setIsCartOpen(false)}
                      className="w-full bg-black text-white py-4 rounded-full font-medium uppercase tracking-wide hover:bg-gray-800 transition-colors"
                    >
                      Continue Shopping
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="flex-1 overflow-y-auto p-6">
                      <div className="flex flex-col gap-6">
                        {cartItems.map((item) => (
                          <div key={item.id} className="flex gap-4">
                            <div className="w-24 h-32 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                              <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                            </div>
                            <div className="flex-1 flex flex-col justify-between py-1">
                              <div>
                                <div className="flex justify-between items-start mb-1">
                                  <h3 className="font-bold uppercase text-sm">{item.name}</h3>
                                  <button 
                                    onClick={() => handleCartAction(() => removeFromCart(item.id))}
                                    className="text-gray-400 hover:text-red-500 transition-colors"
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                </div>
                                <p className="font-mono text-gray-500 text-xs">{formatIDR(item.price)}</p>
                              </div>
                              
                              <div className="flex justify-between items-end">
                                <div className="flex items-center border border-gray-200 rounded-full">
                                  <button 
                                    onClick={() => handleCartAction(() => updateQuantity(item.id, item.quantity - 1))}
                                    className="p-2 hover:bg-gray-50 rounded-l-full transition-colors"
                                  >
                                    <Minus size={14} />
                                  </button>
                                  <span className="font-mono text-sm w-8 text-center">{item.quantity}</span>
                                  <button 
                                    onClick={() => handleCartAction(() => updateQuantity(item.id, item.quantity + 1))}
                                    className="p-2 hover:bg-gray-50 rounded-r-full transition-colors"
                                  >
                                    <Plus size={14} />
                                  </button>
                                </div>
                                <p className="font-bold">{formatIDR(item.price * item.quantity)}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    {/* Footer */}
                    <div className="p-6 border-t border-gray-100 bg-gray-50">
                      <div className="flex justify-between items-center mb-6">
                        <span className="font-mono text-sm text-gray-500 uppercase">Subtotal</span>
                        <span className="text-2xl font-bold">{formatIDR(cartTotal)}</span>
                      </div>
                    <button 
                      onClick={() => {
                        setIsCartOpen(false);
                        navigate('/checkout');
                      }}
                      className="w-full bg-black text-white py-4 rounded-full font-medium uppercase tracking-wide hover:bg-gray-800 transition-colors"
                    >
                      Checkout
                    </button>
                    </div>
                  </>
                )}
              </motion.div>
            </>
          )}
        </AnimatePresence>,
        document.body
      )}
    </header>
  );
};

export default Navbar;
