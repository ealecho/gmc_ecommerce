import { useEffect, useState } from 'react';
import { ArrowRight, ShoppingCart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../lib/api';
import { formatKES } from '../lib/currency';
import { toast } from 'sonner';
import ImageLoader from './ImageLoader';
import FadeIn from './FadeIn';
import { Product } from '../types';

const NewDrops = () => {
  const { addToCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    apiRequest('/api/products', { auth: false })
      .then(({ products: nextProducts }) => setProducts(nextProducts))
      .catch((nextError: any) => setError(nextError.message))
      .finally(() => setIsLoading(false));
  }, []);

  const handleAddToCart = async (e: React.MouseEvent, product: Product) => {
    e.stopPropagation();
    if (!user) {
      toast.message('Sign in to add items to your cart.');
      navigate('/sign-in');
      return;
    }

    try {
      await addToCart(product);
      toast.success(`${product.name} added to cart!`);
    } catch (nextError: any) {
      toast.error(nextError.message);
    }
  };

  return (
    <section className="px-4 md:px-12 py-16">
      <FadeIn direction="up">
        <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
          <div className="max-w-2xl">
            <h2 className="text-4xl font-bold tracking-tight mb-4 uppercase">NEW DROPS</h2>
            <p className="text-gray-500 font-mono text-sm">
              Stand out with our latest collection—bold designs, premium fabrics, and street-ready fits. Once they're gone, they're gone. Don't miss out!
            </p>
          </div>
          <button className="group flex items-center gap-2 border border-gray-300 rounded-full px-6 py-2 hover:bg-black hover:text-white hover:border-black transition-all duration-300 whitespace-nowrap font-medium">
            View all drops <ArrowRight size={16} className="group-hover:rotate-45 transition-transform duration-300" />
          </button>
        </div>
      </FadeIn>

      {isLoading && <p className="font-mono text-sm text-gray-500">Loading products...</p>}
      {error && <p className="font-mono text-sm text-red-500">{error}</p>}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {products.map((product: Product, index: number) => (
          <FadeIn key={product.id} delay={index * 0.1} direction="up">
            <div className="group cursor-pointer">
              <div className="relative aspect-[4/5] mb-6 rounded-2xl overflow-hidden bg-gray-100">
                <ImageLoader 
                  src={product.image} 
                  alt={product.name} 
                  className="w-full h-full group-hover:scale-105 transition-transform duration-500"
                />
                {product.isNew && (
                  <div className="absolute top-4 left-4 bg-black text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                    NEW
                  </div>
                )}
                
                {/* Add to Cart Button (Hover only) */}
                <button 
                  onClick={(e) => handleAddToCart(e, product)}
                  className="absolute bottom-4 right-4 bg-white text-black p-3 rounded-full opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 shadow-lg hover:bg-black hover:text-white"
                >
                  <ShoppingCart size={20} />
                </button>
              </div>
              <h3 className="text-xl font-bold mb-2 uppercase">{product.name}</h3>
              <p className="text-gray-500 text-sm mb-4 font-mono leading-relaxed line-clamp-2">
                {product.description}
              </p>
              <div className="flex items-center gap-3">
                <span className="text-lg font-bold">{formatKES(product.price)}</span>
                {product.originalPrice && (
                  <span className="text-gray-400 line-through text-sm">{formatKES(product.originalPrice)}</span>
                )}
              </div>
            </div>
          </FadeIn>
        ))}
      </div>
    </section>
  );
};

export default NewDrops;
