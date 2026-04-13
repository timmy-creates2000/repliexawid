import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Lock } from 'lucide-react';
import { motion } from 'motion/react';
import { useUser } from '@clerk/clerk-react';
import { cn } from '../../lib/utils';
import { BusinessConfig, Product } from '../../lib/types';
import { api } from '../../services/api';
import { getPlan, isWithinLimit } from '../../lib/plans';

interface Props {
  config: BusinessConfig;
  setConfig: React.Dispatch<React.SetStateAction<BusinessConfig>>;
}

export default function ProductsTab({ config, setConfig }: Props) {
  const { user } = useUser();
  const [isAdding, setIsAdding] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: '',
    price: '',
    lastPrice: '',
    type: 'digital' as 'digital' | 'service' | 'physical',
    description: '',
  });
  const plan = getPlan(config.plan);
  const atLimit = !isWithinLimit(config.plan, 'maxProducts', config.products.length);

  useEffect(() => {
    if (user) {
      api.products
        .list(user.id)
        .then((data) => {
          if (Array.isArray(data)) {
            setConfig((prev) => ({ ...prev, products: data }));
          }
        })
        .catch((err) => console.error('Products fetch error:', err));
    }
  }, [user]);

  const addProduct = async () => {
    if (!newProduct.name || !newProduct.price || !user) return;
    const product: Product = {
      id: Date.now().toString(),
      name: newProduct.name,
      price: Number(newProduct.price),
      lastPrice: Number(newProduct.lastPrice),
      type: newProduct.type,
      description: newProduct.description,
    };

    try {
      const response = await api.products.save({ ...product, userId: user.id });
      if (response.success) {
        setConfig((prev) => ({ ...prev, products: [...prev.products, product] }));
        setNewProduct({ name: '', price: '', lastPrice: '', type: 'digital', description: '' });
        setIsAdding(false);
      }
    } catch (error) {
      console.error('Failed to add product:', error);
    }
  };

  const deleteProduct = async (id: string) => {
    try {
      const response = await api.products.delete(id);
      if (response.success) {
        setConfig((prev) => ({ ...prev, products: prev.products.filter((p) => p.id !== id) }));
      }
    } catch (error) {
      console.error('Failed to delete product:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Your Products</h2>
        <button
          onClick={() => (atLimit ? null : setIsAdding(true))}
          disabled={atLimit}
          title={
            atLimit
              ? `Upgrade to add more products (${plan.name} limit: ${plan.features.maxProducts})`
              : ''
          }
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all border',
            atLimit
              ? 'bg-white/5 border-white/10 text-white/20 cursor-not-allowed'
              : 'bg-cyan-600 border-cyan-400/50 hover:bg-cyan-500 shadow-[0_0_15px_rgba(8,145,178,0.3)]',
          )}
        >
          {atLimit ? <Lock className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {atLimit ? `Limit reached (${plan.name})` : 'Add Product'}
        </button>
      </div>

      {isAdding && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-6 bg-white/5 border border-white/10 rounded-2xl space-y-4"
        >
          <div className="grid grid-cols-2 gap-4">
            <input
              placeholder="Product Name"
              className="bg-black/40 border border-cyan-500/20 rounded-lg p-3 text-xs font-mono outline-none focus:border-cyan-500 transition-all"
              value={newProduct.name}
              onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
            />
            <select
              className="bg-black/40 border border-cyan-500/20 rounded-lg p-3 text-xs font-mono outline-none focus:border-cyan-500 transition-all"
              value={newProduct.type}
              onChange={(e) =>
                setNewProduct({ ...newProduct, type: e.target.value as 'digital' | 'service' | 'physical' })
              }
            >
              <option value="digital">Digital Product</option>
              <option value="service">Service/Booking</option>
              <option value="physical">Physical Item</option>
            </select>
          </div>
          <textarea
            placeholder="Product Description"
            className="w-full bg-black/40 border border-cyan-500/20 rounded-lg p-3 text-xs font-mono outline-none focus:border-cyan-500 h-24 transition-all"
            value={newProduct.description}
            onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
          />
          <div className="grid grid-cols-2 gap-4">
            <input
              type="number"
              placeholder="Original Price"
              className="bg-black/40 border border-cyan-500/20 rounded-lg p-3 text-xs font-mono outline-none focus:border-cyan-500 transition-all"
              value={newProduct.price}
              onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
            />
            <input
              type="number"
              placeholder="Last Price (Min)"
              className="bg-black/40 border border-cyan-500/20 rounded-lg p-3 text-xs font-mono outline-none focus:border-cyan-500 transition-all"
              value={newProduct.lastPrice}
              onChange={(e) => setNewProduct({ ...newProduct, lastPrice: e.target.value })}
            />
          </div>
          <div className="flex justify-end gap-3">
            <button
              onClick={() => setIsAdding(false)}
              className="px-4 py-2 text-xs font-bold uppercase tracking-widest text-white/40 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={addProduct}
              className="px-6 py-2 bg-cyan-600 text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-cyan-500 transition-all shadow-[0_0_15px_rgba(8,145,178,0.3)] border border-cyan-400/50"
            >
              Save Product
            </button>
          </div>
        </motion.div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {config.products.map((p) => (
          <div
            key={p.id}
            className="p-6 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-between group"
          >
            <div>
              <h4 className="font-bold text-lg">{p.name}</h4>
              <p className="text-sm text-white/40 uppercase tracking-widest">{p.type}</p>
              <div className="mt-4 flex items-center gap-4">
                <div>
                  <p className="text-[10px] text-white/40 uppercase">Price</p>
                  <p className="font-bold">₦{p.price.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-[10px] text-white/40 uppercase">Min Price</p>
                  <p className="font-bold text-cyan-400 scifi-glow-text">₦{p.lastPrice.toLocaleString()}</p>
                </div>
              </div>
            </div>
            <button
              onClick={() => deleteProduct(p.id)}
              className="p-3 bg-red-500/10 text-red-500 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500 hover:text-white"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
