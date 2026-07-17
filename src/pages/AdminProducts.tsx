import React, { useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { ArrowUp, ArrowDown, Upload } from 'lucide-react';
import { apiRequest, uploadFile } from '../lib/api';
import { formatKES } from '../lib/currency';

import { Product } from '../types';

const emptyProduct: any = {
  name: '',
  slug: '',
  description: '',
  price: '',
  originalPrice: '',
  image: '',
  isNew: false,
  isActive: true,
};

const AdminProducts = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [form, setForm] = useState<any>(emptyProduct);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [orderDirty, setOrderDirty] = useState(false);
  const [isSavingOrder, setIsSavingOrder] = useState(false);
  const fileInputRef = useRef(null);

  const editingProduct = useMemo(
    () => products.find((product) => product.id === editingId),
    [editingId, products],
  );

  const loadProducts = async () => {
    const { products: nextProducts } = await apiRequest('/api/products?includeInactive=true');
    setProducts(nextProducts);
    setOrderDirty(false);
  };

  useEffect(() => {
    loadProducts()
      .catch((error: any) => toast.error(error.message))
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    if (!editingProduct) {
      setForm(emptyProduct);
      return;
    }

    setForm({
      name: editingProduct.name,
      slug: editingProduct.slug,
      description: editingProduct.description,
      price: editingProduct.price,
      originalPrice: editingProduct.originalPrice || '',
      image: editingProduct.image,
      isNew: editingProduct.isNew,
      isActive: editingProduct.isActive,
    });
  }, [editingProduct]);

  const updateField = (field: string, value: any) => {
    setForm((current: any) => ({ ...current, [field]: value }));
  };

  const resetForm = () => {
    setEditingId(null);
    setForm(emptyProduct);
  };

  const handleImageUpload = async (event: any) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const { url } = await uploadFile('/api/media', file);
      updateField('image', url);
      toast.success('Image uploaded');
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) (fileInputRef.current as HTMLInputElement).value = '';
    }
  };

  const saveProduct = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSaving(true);

    try {
      const path = editingId ? `/api/products/${editingId}` : '/api/products';
      const method = editingId ? 'PATCH' : 'POST';
      await apiRequest(path, { method, body: form });
      await loadProducts();
      toast.success(editingId ? 'Product updated' : 'Product created');
      resetForm();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const deleteProduct = async (product: Product) => {
    if (!window.confirm(`Delete ${product.name}? This cannot be undone.`)) return;

    try {
      await apiRequest(`/api/products/${product.id}`, { method: 'DELETE' });
      await loadProducts();
      toast.success('Product deleted');
      if (editingId === product.id) resetForm();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const moveProduct = (index: number, direction: number) => {
    const target = index + direction;
    if (target < 0 || target >= products.length) return;

    setProducts((current: any) => {
      const next = [...current];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
    setOrderDirty(true);
  };

  const saveOrder = async () => {
    setIsSavingOrder(true);
    try {
      const ids = products.map((product) => product.id);
      const { products: nextProducts } = await apiRequest('/api/products/reorder', {
        method: 'PATCH',
        body: { ids },
      });
      setProducts(nextProducts);
      setOrderDirty(false);
      toast.success('Order saved');
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsSavingOrder(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-12 py-12">
      <div className="mb-10">
        <p className="font-mono text-xs text-gray-500 uppercase mb-2">Admin</p>
        <h1 className="text-3xl font-bold uppercase tracking-tight">Product Management</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[420px_1fr] gap-8 items-start">
        <form onSubmit={saveProduct} className="rounded-3xl border border-gray-200 bg-white p-6 space-y-4 sticky top-32">
          <h2 className="text-xl font-bold uppercase">{editingId ? 'Edit Product' : 'Create Product'}</h2>

          <input value={form.name} onChange={(event) => updateField('name', event.target.value)} placeholder="Name" className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-black" />
          <input value={form.slug} onChange={(event) => updateField('slug', event.target.value)} placeholder="Slug (optional)" className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-black" />
          <textarea value={form.description} onChange={(event) => updateField('description', event.target.value)} placeholder="Description" rows={4} className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-black" />

          <div className="space-y-3">
            {form.image && (
              <img src={form.image} alt="Preview" className="w-full h-44 rounded-2xl object-cover bg-gray-100" />
            )}
            <div className="flex gap-3">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/avif,image/gif"
                onChange={handleImageUpload}
                className="hidden"
                id="product-image-upload"
              />
              <label
                htmlFor="product-image-upload"
                className={`flex items-center justify-center gap-2 flex-1 border border-gray-300 rounded-xl px-4 py-3 font-mono text-sm cursor-pointer hover:bg-gray-50 ${isUploading ? 'opacity-60 pointer-events-none' : ''}`}
              >
                <Upload size={16} />
                {isUploading ? 'Uploading...' : 'Upload image'}
              </label>
            </div>
            <input value={form.image} onChange={(event) => updateField('image', event.target.value)} placeholder="Or paste image URL" className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-black" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <input value={form.price} onChange={(event) => updateField('price', event.target.value)} placeholder="Price (KES)" type="number" step="1" min="0" className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-black" />
            <input value={form.originalPrice} onChange={(event) => updateField('originalPrice', event.target.value)} placeholder="Original price (KES)" type="number" step="1" min="0" className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-black" />
          </div>

          <label className="flex items-center gap-2 font-mono text-sm">
            <input type="checkbox" checked={form.isNew} onChange={(event) => updateField('isNew', event.target.checked)} className="accent-black" />
            Mark as new
          </label>
          <label className="flex items-center gap-2 font-mono text-sm">
            <input type="checkbox" checked={form.isActive} onChange={(event) => updateField('isActive', event.target.checked)} className="accent-black" />
            Active in storefront
          </label>

          <div className="flex gap-3">
            <button type="submit" disabled={isSaving} className="flex-1 bg-black text-white py-3 rounded-full font-bold uppercase tracking-wide hover:bg-gray-800 disabled:opacity-60">
              {isSaving ? 'Saving...' : 'Save'}
            </button>
            {editingId && (
              <button type="button" onClick={resetForm} className="px-5 py-3 rounded-full border border-gray-300 font-bold uppercase tracking-wide hover:bg-gray-50">
                Cancel
              </button>
            )}
          </div>
        </form>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="font-mono text-xs text-gray-500 uppercase">
              Storefront order — top item shows first
            </p>
            {orderDirty && (
              <button
                onClick={saveOrder}
                disabled={isSavingOrder}
                className="rounded-full bg-black px-5 py-2 text-xs font-bold uppercase text-white hover:bg-gray-800 disabled:opacity-60"
              >
                {isSavingOrder ? 'Saving...' : 'Save order'}
              </button>
            )}
          </div>

          {isLoading && <p className="font-mono text-sm text-gray-500">Loading products...</p>}
          {products.map((product, index) => (
            <article key={product.id} className="rounded-3xl border border-gray-200 bg-white p-4 flex flex-col md:flex-row gap-5">
              <div className="flex md:flex-col items-center justify-center gap-2">
                <button
                  onClick={() => moveProduct(index, -1)}
                  disabled={index === 0}
                  aria-label="Move up"
                  className="rounded-full border border-gray-300 p-2 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ArrowUp size={16} />
                </button>
                <span className="font-mono text-xs text-gray-400 w-6 text-center">{index + 1}</span>
                <button
                  onClick={() => moveProduct(index, 1)}
                  disabled={index === products.length - 1}
                  aria-label="Move down"
                  className="rounded-full border border-gray-300 p-2 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ArrowDown size={16} />
                </button>
              </div>
              <img src={product.image} alt={product.name} className="w-full md:w-32 h-40 md:h-32 rounded-2xl object-cover bg-gray-100" />
              <div className="flex-1">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-bold uppercase">{product.name}</h3>
                    <p className="font-mono text-xs text-gray-500">{product.slug}</p>
                  </div>
                  <div className="flex gap-2">
                    {product.isNew && <span className="rounded-full bg-black px-3 py-1 text-xs font-bold uppercase text-white">New</span>}
                    <span className={`rounded-full px-3 py-1 text-xs font-bold uppercase ${product.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {product.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
                <p className="text-sm text-gray-500 mt-3 line-clamp-2">{product.description}</p>
                <div className="flex items-center justify-between mt-4">
                  <p className="font-bold">{formatKES(product.price)}</p>
                  <div className="flex gap-2">
                    <button onClick={() => setEditingId(product.id)} className="rounded-full border border-gray-300 px-4 py-2 text-xs font-bold uppercase hover:bg-gray-50">
                      Edit
                    </button>
                    <button onClick={() => deleteProduct(product)} className="rounded-full border border-red-200 px-4 py-2 text-xs font-bold uppercase text-red-600 hover:bg-red-50">
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminProducts;
