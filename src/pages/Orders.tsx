import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowLeft, PackageCheck } from 'lucide-react';
import { toast } from 'sonner';
import { apiRequest } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { formatIDR } from '../lib/currency';

// Tailwind classes per order status for the badge.
const statusStyles: Record<string, string> = {
  pending: 'bg-amber-500',
  paid: 'bg-emerald-600',
  fulfilled: 'bg-blue-600',
  cancelled: 'bg-gray-400',
};

const Orders = () => {
  const { isLoading: authLoading, user } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchParams] = useSearchParams();
  const returnedOrderId = searchParams.get('order');

  // Wait for auth to settle before fetching. Coming back from Mayar is a full
  // page load, so the access token may not be ready on first render; fetching
  // too early yields a spurious "Authentication required." error.
  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setIsLoading(false);
      setError('Please sign in to view your orders.');
      return;
    }

    let cancelled = false;
    let attempts = 0;
    // If we just returned from payment, the webhook may land a moment later,
    // so poll a few times until the order flips to paid.
    const maxAttempts = returnedOrderId ? 6 : 1;

    const load = async () => {
      try {
        const { orders: nextOrders } = await apiRequest('/api/orders');
        if (cancelled) return;
        setOrders(nextOrders);
        setError('');

        const target = returnedOrderId
          ? nextOrders.find((o: any) => o.id === returnedOrderId)
          : null;
        attempts += 1;
        if (target && target.status === 'pending' && attempts < maxAttempts) {
          setTimeout(load, 2500);
          return;
        }
      } catch (nextError: any) {
        if (!cancelled) setError(nextError.message);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [authLoading, user, returnedOrderId]);

  // When Mayar redirects back with ?order=<id>, acknowledge the return.
  useEffect(() => {
    if (returnedOrderId) {
      toast.success('Thanks! We are confirming your payment.');
    }
  }, [returnedOrderId]);

  return (
    <div className="max-w-5xl mx-auto px-4 md:px-12 py-12">
      <Link to="/" className="inline-flex items-center gap-2 text-sm font-medium uppercase tracking-wide hover:text-gray-600 transition-colors mb-8">
        <ArrowLeft size={16} /> Back to Shop
      </Link>

      <div className="flex items-end justify-between gap-6 mb-8">
        <div>
          <h1 className="text-3xl font-bold uppercase tracking-tight">Orders</h1>
          <p className="text-gray-500 font-mono text-sm mt-2">Your submitted RAWBLOX orders.</p>
        </div>
      </div>

      {isLoading && <p className="font-mono text-sm text-gray-500">Loading orders...</p>}
      {error && <p className="font-mono text-sm text-red-500">{error}</p>}

      {!isLoading && !error && orders.length === 0 && (
        <div className="rounded-3xl border border-gray-200 bg-gray-50 p-10 text-center">
          <PackageCheck size={36} className="mx-auto mb-4 text-gray-400" />
          <h2 className="text-xl font-bold uppercase mb-2">No orders yet</h2>
          <p className="font-mono text-sm text-gray-500">Place your first order from the shop.</p>
        </div>
      )}

      <div className="space-y-6">
        {orders.map((order) => (
          <article key={order.id} className="rounded-3xl border border-gray-200 bg-white p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 border-b border-gray-100 pb-4 mb-4">
              <div>
                <p className="font-mono text-xs text-gray-500 uppercase">Order #{order.id.slice(0, 8)}</p>
                <h2 className="text-xl font-bold uppercase mt-1">{formatIDR(order.total)}</h2>
              </div>
              <div className="text-left md:text-right">
                <span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold uppercase text-white ${statusStyles[order.status] || 'bg-black'}`}>
                  {order.status}
                </span>
                <p className="font-mono text-xs text-gray-500 mt-2">{new Date(order.createdAt).toLocaleString()}</p>
                {order.status === 'pending' && order.paymentLink && (
                  <a
                    href={order.paymentLink}
                    className="mt-3 inline-flex rounded-full bg-black px-4 py-2 text-xs font-bold uppercase text-white hover:bg-gray-800 transition-colors"
                  >
                    Pay now
                  </a>
                )}
              </div>
            </div>

            <div className="space-y-3">
              {order.items.map((item: any) => (
                <div key={item.id} className="flex justify-between gap-4 font-mono text-sm">
                  <span>{item.name} x {item.quantity}</span>
                  <span>{formatIDR(item.price * item.quantity)}</span>
                </div>
              ))}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
};

export default Orders;
