import React, { useState } from 'react';
import { motion } from 'motion/react';
import { X, CreditCard } from 'lucide-react';
import type { BusinessConfig } from '../../lib/types';

// ─── Paystack Inline Checkout ─────────────────────────────────────────────────

function loadPaystack(): Promise<void> {
  return new Promise((resolve) => {
    if ((window as any).PaystackPop) return resolve();
    const script = document.createElement('script');
    script.src = 'https://js.paystack.co/v1/inline.js';
    script.onload = () => resolve();
    document.body.appendChild(script);
  });
}

async function initiatePaystackPayment(opts: {
  publicKey: string;
  email: string;
  amount: number;
  productName: string;
  onSuccess: (ref: string) => void;
  onClose: () => void;
}) {
  await loadPaystack();
  const handler = (window as any).PaystackPop.setup({
    key: opts.publicKey,
    email: opts.email,
    amount: opts.amount * 100,
    currency: 'NGN',
    ref: `TXN-${Date.now()}`,
    metadata: {
      custom_fields: [{ display_name: 'Product', variable_name: 'product', value: opts.productName }],
    },
    callback: (response: any) => opts.onSuccess(response.reference),
    onClose: opts.onClose,
  });
  handler.openIframe();
}

// ─── Flutterwave Inline Checkout ─────────────────────────────────────────────

function loadFlutterwave(): Promise<void> {
  return new Promise((resolve) => {
    if ((window as any).FlutterwaveCheckout) return resolve();
    const script = document.createElement('script');
    script.src = 'https://checkout.flutterwave.com/v3.js';
    script.onload = () => resolve();
    document.body.appendChild(script);
  });
}

async function initiateFlutterwavePayment(opts: {
  publicKey: string;
  email: string;
  amount: number;
  currency: string;
  productName: string;
  onSuccess: (ref: string) => void;
  onClose: () => void;
}) {
  await loadFlutterwave();
  const ref = `FLW-${Date.now()}`;
  (window as any).FlutterwaveCheckout({
    public_key: opts.publicKey,
    tx_ref: ref,
    amount: opts.amount,
    currency: opts.currency || 'NGN',
    payment_options: 'card,banktransfer,ussd',
    customer: { email: opts.email, name: opts.email },
    customizations: {
      title: opts.productName,
      description: `Payment for ${opts.productName}`,
    },
    callback: (response: any) => {
      if (response.status === 'successful') opts.onSuccess(response.tx_ref);
      else opts.onClose();
    },
    onclose: opts.onClose,
  });
}

// ─── Stripe Checkout ──────────────────────────────────────────────────────────

async function initiateStripePayment(opts: {
  publicKey: string;
  email: string;
  amount: number;
  currency: string;
  productName: string;
  userId: string;
  onSuccess: (ref: string) => void;
  onClose: () => void;
}) {
  // Dynamically load Stripe.js
  if (!(window as any).Stripe) {
    await new Promise<void>((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://js.stripe.com/v3/';
      script.onload = () => resolve();
      document.body.appendChild(script);
    });
  }

  // Create a pending transaction to get a reference
  const txRes = await fetch('/api/transactions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId: opts.userId,
      amount: opts.amount,
      currency: opts.currency,
      method: 'stripe',
    }),
  });
  const { reference } = await txRes.json();

  // For Stripe we redirect to Stripe Checkout (simplest integration)
  // In production you'd create a PaymentIntent server-side
  // For now, open a Stripe payment link with the reference in metadata
  const stripe = (window as any).Stripe(opts.publicKey);
  const { error } = await stripe.redirectToCheckout({
    lineItems: [{ price_data: { currency: opts.currency.toLowerCase(), product_data: { name: opts.productName }, unit_amount: opts.amount * 100 }, quantity: 1 }],
    mode: 'payment',
    successUrl: `${window.location.origin}/payment-success?ref=${reference}`,
    cancelUrl: window.location.href,
    customerEmail: opts.email,
  });
  if (error) opts.onClose();
}

// ─── PaymentPrompt Component ──────────────────────────────────────────────────

interface PaymentPromptProps {
  config: BusinessConfig;
  productId: string;
  amount: number;
  customerEmail: string;
  onSuccess: (ref: string) => void;
  onClose: () => void;
}

export default function PaymentPrompt({
  config,
  productId,
  amount,
  customerEmail,
  onSuccess,
  onClose,
}: PaymentPromptProps) {
  const product = config.products.find(p => p.id === productId);
  const [email, setEmail] = useState(customerEmail);
  const [loading, setLoading] = useState(false);

  const currencySymbol = config.currency === 'NGN' ? '₦' : config.currency === 'USD' ? '$' : config.currency === 'EUR' ? '€' : '£';

  const handlePay = async () => {
    if (!email) return;
    setLoading(true);
    try {
      if (config.paymentMethod === 'paystack' && config.paystackKeys?.publicKey) {
        await initiatePaystackPayment({
          publicKey: config.paystackKeys.publicKey,
          email,
          amount,
          productName: product?.name ?? 'Product',
          onSuccess,
          onClose,
        });
      } else if (config.paymentMethod === 'flutterwave' && config.flutterwaveKeys?.publicKey) {
        await initiateFlutterwavePayment({
          publicKey: config.flutterwaveKeys.publicKey,
          email,
          amount,
          currency: config.currency ?? 'NGN',
          productName: product?.name ?? 'Product',
          onSuccess,
          onClose,
        });
      } else if (config.paymentMethod === 'stripe' && config.stripeKeys?.publicKey) {
        await initiateStripePayment({
          publicKey: config.stripeKeys.publicKey,
          email,
          amount,
          currency: config.currency ?? 'USD',
          productName: product?.name ?? 'Product',
          userId: config.userId,
          onSuccess,
          onClose,
        });
      }
    } finally {
      setLoading(false);
    }
  };

  if (config.paymentMethod === 'manual') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-4 mb-4 p-4 bg-cyan-500/10 border border-cyan-500/30 rounded-2xl space-y-3"
      >
        <p className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest">Manual Transfer</p>
        <p className="text-xs text-white/80">
          Send <span className="font-bold text-white">{currencySymbol}{amount.toLocaleString()}</span> to:
        </p>
        <div className="p-3 bg-black/40 rounded-xl font-mono text-xs text-cyan-300 space-y-1">
          <p>Bank: {config.bankDetails?.bankName}</p>
          <p>Account: {config.bankDetails?.accountNumber}</p>
        </div>
        <p className="text-[10px] text-white/40">
          Send your receipt after payment and we'll confirm manually.
        </p>
        <button
          onClick={onClose}
          className="w-full py-2 bg-white/10 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-white/20 transition-all"
        >
          Done
        </button>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-4 mb-4 p-4 bg-cyan-500/10 border border-cyan-500/30 rounded-2xl space-y-3"
    >
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest">Complete Purchase</p>
        <button onClick={onClose} className="text-white/20 hover:text-white">
          <X className="w-4 h-4" />
        </button>
      </div>
      <p className="text-xs text-white/60">
        {product?.name} — <span className="font-bold text-white">{currencySymbol}{amount.toLocaleString()}</span>
      </p>
      <input
        type="email"
        placeholder="Your email for receipt"
        value={email}
        onChange={e => setEmail(e.target.value)}
        className="w-full bg-black/40 border border-cyan-500/20 rounded-xl p-3 text-xs outline-none focus:border-cyan-500 transition-all"
      />
      <button
        onClick={handlePay}
        disabled={!email || loading}
        style={{ backgroundColor: config.brandColor }}
        className="w-full py-3 text-white rounded-xl text-xs font-bold uppercase tracking-widest disabled:opacity-50 transition-all flex items-center justify-center gap-2"
      >
        <CreditCard className="w-4 h-4" />
        {loading ? 'Opening checkout...' : `Pay ${currencySymbol}${amount.toLocaleString()} via ${config.paymentMethod}`}
      </button>
    </motion.div>
  );
}
