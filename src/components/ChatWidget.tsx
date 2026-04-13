import React, { useState, useCallback, useEffect } from 'react';
import { AnimatePresence } from 'motion/react';
import { X, Zap, ChevronDown, Bot } from 'lucide-react';
import { cn } from '../lib/utils';
import { api } from '../services/api';
import type { BusinessConfig, ChatMessage, NegotiationState } from '../lib/types';

import NegotiationBar from './widget/NegotiationBar';
import MessageList from './widget/MessageList';
import InputBar from './widget/InputBar';
import PaymentPrompt from './widget/PaymentPrompt';
import BookingCalendar from './widget/BookingCalendar';

// ─── Constants ────────────────────────────────────────────────────────────────

const INITIAL_NEGOTIATION: NegotiationState = {
  productId: null,
  originalPrice: 0,
  currentOffer: 0,
  minPrice: 0,
  offerCount: 0,
  status: 'idle',
};

// ─── Widget background style helpers ─────────────────────────────────────────

function getBgStyle(style: BusinessConfig['widgetBgStyle']): string {
  switch (style) {
    case 'light': return 'bg-white/95 text-gray-900';
    case 'glass': return 'bg-white/10 backdrop-blur-2xl';
    default: return 'bg-[#0a0a0a]/90 backdrop-blur-2xl';
  }
}

function getBorderRadius(radius: BusinessConfig['widgetBorderRadius']): string {
  switch (radius) {
    case 'sharp': return 'rounded-none';
    case 'pill': return 'rounded-[2rem]';
    default: return 'rounded-3xl';
  }
}

// ─── Main Widget ──────────────────────────────────────────────────────────────

export default function ChatWidget({
  config,
  fullPage = false,
}: {
  config: BusinessConfig;
  fullPage?: boolean;
}) {
  const welcomeMessage = config.widgetWelcomeMessage
    || `Hi! I'm the AI sales agent for ${config.name}. Ask me about our products, pricing, or anything else — I'm here to help.`;

  const [isOpen, setIsOpen] = useState(fullPage);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'model', parts: welcomeMessage, timestamp: new Date() },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [negotiation, setNegotiation] = useState<NegotiationState>(INITIAL_NEGOTIATION);
  const [pendingPayment, setPendingPayment] = useState<{ productId: string; amount: number } | null>(null);
  const [showBooking, setShowBooking] = useState(false);
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerName, setCustomerName] = useState('');

  // Auto-open delay
  useEffect(() => {
    if (!fullPage && config.widgetAutoOpenDelay > 0) {
      const timer = setTimeout(() => setIsOpen(true), config.widgetAutoOpenDelay * 1000);
      return () => clearTimeout(timer);
    }
  }, [fullPage, config.widgetAutoOpenDelay]);

  // Detect negotiation intent from user message
  const updateNegotiationState = useCallback(
    (message: string, currentNeg: NegotiationState): NegotiationState => {
      if (!config.negotiationMode) return currentNeg;

      const priceMatch = message.match(
        /(?:pay|offer|give|do|accept|take|how about|what about|can you do)\s*(?:₦|N|naira)?\s*([\d,]+)/i
      );
      if (priceMatch) {
        const offeredPrice = parseInt(priceMatch[1].replace(/,/g, ''));
        let targetProduct =
          config.products.find(p => message.toLowerCase().includes(p.name.toLowerCase())) ??
          (currentNeg.productId ? config.products.find(p => p.id === currentNeg.productId) : null);
        if (!targetProduct && config.products.length === 1) targetProduct = config.products[0];

        if (targetProduct && offeredPrice > 0) {
          return {
            productId: targetProduct.id,
            originalPrice: targetProduct.price,
            currentOffer: offeredPrice,
            minPrice: targetProduct.lastPrice,
            offerCount: currentNeg.status === 'negotiating' ? currentNeg.offerCount + 1 : 1,
            status: 'negotiating',
          };
        }
      }

      const mentionedProduct = config.products.find(p =>
        message.toLowerCase().includes(p.name.toLowerCase())
      );
      if (mentionedProduct && currentNeg.status === 'idle') {
        return {
          ...currentNeg,
          productId: mentionedProduct.id,
          originalPrice: mentionedProduct.price,
          minPrice: mentionedProduct.lastPrice,
        };
      }

      return currentNeg;
    },
    [config]
  );

  const handleSend = async (text?: string) => {
    const messageText = text || input;
    if (!messageText.trim()) return;

    const userMessage: ChatMessage = { role: 'user', parts: messageText, timestamp: new Date() };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    const updatedNeg = updateNegotiationState(messageText, negotiation);
    setNegotiation(updatedNeg);

    try {
      const response = await api.chat.send({
        userId: config.userId,
        message: messageText,
        history: messages.map(m => ({ role: m.role, parts: m.parts })),
        negotiationState: updatedNeg,
        visitorEmail: customerEmail || undefined,
        visitorName: customerName || undefined,
      });

      // Handle chat limit reached
      if (response.error === 'chat_limit_reached') {
        setMessages(prev => [
          ...prev,
          {
            role: 'model',
            parts: "You've reached the chat limit for this business. Please upgrade your plan to continue.",
            timestamp: new Date(),
          },
        ]);
        setIsTyping(false);
        return;
      }

      // Save lead if email detected
      if (response.detectedEmail && response.detectedEmail !== customerEmail) {
        setCustomerEmail(response.detectedEmail);
        api.leads.create({
          userId: config.userId,
          name: response.detectedName || customerName || 'Anonymous',
          email: response.detectedEmail,
          phone: '',
        }).catch(console.error);
      }

      if (response.detectedName && !customerName) {
        setCustomerName(response.detectedName);
      }

      // Handle booking trigger
      if (response.bookingTrigger) {
        setShowBooking(true);
      }

      // Handle payment trigger
      if (response.paymentTrigger) {
        setPendingPayment(response.paymentTrigger);
        setNegotiation(prev => ({ ...prev, status: 'agreed' }));
      }

      setMessages(prev => [
        ...prev,
        {
          role: 'model',
          parts: response.text || "I'm sorry, I couldn't process that.",
          timestamp: new Date(),
        },
      ]);
    } catch (err) {
      setMessages(prev => [
        ...prev,
        {
          role: 'model',
          parts: "Something went wrong. Please try again.",
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const handlePaymentSuccess = async (ref: string) => {
    const paidAmount = pendingPayment?.amount;
    setPendingPayment(null);
    setNegotiation(INITIAL_NEGOTIATION);

    await api.transactions.create({
      userId: config.userId,
      amount: paidAmount ?? 0,
      method: config.paymentMethod,
      reference: ref,
    }).catch(console.error);

    setMessages(prev => [
      ...prev,
      {
        role: 'model',
        parts: `Payment confirmed! Reference: ${ref}. Thank you for your purchase${customerName ? `, ${customerName}` : ''}! You'll receive your product details shortly.`,
        timestamp: new Date(),
      },
    ]);
  };

  const toggleVoice = () => {
    if (!('webkitSpeechRecognition' in window)) {
      alert('Voice recognition is not supported in this browser.');
      return;
    }
    if (isListening) { setIsListening(false); return; }
    const recognition = new (window as any).webkitSpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';
    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onresult = (e: any) => handleSend(e.results[0][0].transcript);
    recognition.start();
  };

  // ─── Styles ────────────────────────────────────────────────────────────────

  const bgStyle = getBgStyle(config.widgetBgStyle);
  const borderRadius = getBorderRadius(config.widgetBorderRadius);

  const widgetClasses = fullPage
    ? `w-full h-screen flex flex-col overflow-hidden font-mono relative ${bgStyle}`
    : cn(
        `fixed bottom-6 w-[400px] h-[600px] border border-cyan-500/20 shadow-[0_0_30px_rgba(6,182,212,0.1)] flex flex-col overflow-hidden z-50 font-mono transition-all duration-300 ${bgStyle} ${borderRadius}`,
        config.widgetPosition === 'bottom-left' ? 'left-6' : 'right-6',
        isOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10 pointer-events-none'
      );

  return (
    <>
      {!fullPage && (
        <button
          onClick={() => setIsOpen(!isOpen)}
          style={{ backgroundColor: config.brandColor, boxShadow: `0 0 20px ${config.brandColor}40` }}
          className={cn(
            'fixed bottom-6 w-14 h-14 rounded-full flex items-center justify-center z-50 transition-all hover:scale-110 active:scale-95 border border-white/20',
            config.widgetPosition === 'bottom-left' ? 'left-6' : 'right-6'
          )}
        >
          {isOpen ? <X className="w-6 h-6 text-white" /> : <Zap className="w-6 h-6 text-white animate-pulse" />}
        </button>
      )}

      <div className={widgetClasses}>
        {/* Header */}
        <div className="p-6 bg-cyan-500/5 border-b border-cyan-500/10 flex items-center justify-between relative flex-shrink-0">
          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent" />
          <div className="flex items-center gap-3">
            <div
              style={{ backgroundColor: config.brandColor, boxShadow: `0 0 15px ${config.brandColor}80` }}
              className="w-10 h-10 rounded-xl flex items-center justify-center border border-white/20 overflow-hidden"
            >
              {config.widgetAvatarUrl ? (
                <img src={config.widgetAvatarUrl} alt="avatar" className="w-full h-full object-cover" />
              ) : (
                <Zap className="w-6 h-6 text-white" />
              )}
            </div>
            <div>
              <h3 className="font-black text-white text-xs uppercase tracking-tighter scifi-glow-text">
                {config.name} CORE
              </h3>
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-pulse shadow-[0_0_5px_rgba(34,211,238,1)]" />
                <span className="text-[8px] text-cyan-400/60 uppercase tracking-[0.2em] font-bold">
                  {config.aiModel ? config.aiModel.toUpperCase() : 'GEMINI'} · Neural Link Active
                </span>
              </div>
            </div>
          </div>
          {!fullPage && (
            <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-white/5 rounded-lg transition-colors">
              <ChevronDown className="w-5 h-5 text-white/40" />
            </button>
          )}
        </div>

        {/* Negotiation Bar */}
        <NegotiationBar
          negotiation={negotiation}
          onReset={() => setNegotiation(INITIAL_NEGOTIATION)}
        />

        {/* Message List */}
        <MessageList
          messages={messages}
          isTyping={isTyping}
          brandColor={config.brandColor}
          businessName={config.name}
          customerName={customerName}
        />

        {/* Booking Calendar */}
        <AnimatePresence>
          {showBooking && (
            <BookingCalendar
              userId={config.userId}
              brandColor={config.brandColor}
              onClose={() => setShowBooking(false)}
              onBooked={(bookingId) => {
                setShowBooking(false);
                setMessages(prev => [
                  ...prev,
                  {
                    role: 'model',
                    parts: `Your booking (ID: ${bookingId}) has been confirmed!`,
                    timestamp: new Date(),
                  },
                ]);
              }}
            />
          )}
        </AnimatePresence>

        {/* Payment Prompt */}
        <AnimatePresence>
          {pendingPayment && (
            <PaymentPrompt
              config={config}
              productId={pendingPayment.productId}
              amount={pendingPayment.amount}
              customerEmail={customerEmail}
              onSuccess={handlePaymentSuccess}
              onClose={() => setPendingPayment(null)}
            />
          )}
        </AnimatePresence>

        {/* Input Bar */}
        <InputBar
          input={input}
          onInputChange={setInput}
          onSend={handleSend}
          isListening={isListening}
          onToggleVoice={toggleVoice}
          brandColor={config.brandColor}
        />

        {/* Powered by badge */}
        {config.showPoweredBy && (
          <div className="text-center py-1 text-[8px] text-white/20 font-mono uppercase tracking-widest flex-shrink-0">
            Powered by <span className="text-cyan-500/40">Repliexa</span>
          </div>
        )}
      </div>
    </>
  );
}
