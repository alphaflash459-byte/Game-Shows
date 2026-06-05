/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Check, 
  X, 
  CreditCard, 
  QrCode, 
  History, 
  Calendar, 
  ShieldCheck, 
  AlertCircle, 
  RefreshCw, 
  CheckCircle2, 
  Wallet,
  Coins,
  Receipt,
  Sparkles,
  Info
} from 'lucide-react';
import { Subscription, SubscriptionTier, Transaction } from '../types';
import { sound } from '../utils/sound';

interface SubscriptionManagerProps {
  subscription: Subscription;
  setSubscription: React.Dispatch<React.SetStateAction<Subscription>>;
  transactions: Transaction[];
  setTransactions: React.Dispatch<React.SetStateAction<Transaction[]>>;
  currency: 'USD' | 'KHR';
  setCurrency: (c: 'USD' | 'KHR') => void;
}

export default function SubscriptionManager({
  subscription,
  setSubscription,
  transactions,
  setTransactions,
  currency,
  setCurrency
}: SubscriptionManagerProps) {
  const [showQRModal, setShowQRModal] = useState<boolean>(false);
  const [selectedTier, setSelectedTier] = useState<SubscriptionTier | null>(null);
  const [paymentProvider, setPaymentProvider] = useState<'aba' | 'acleda' | 'wing' | 'card'>('card');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [qrStep, setQrStep] = useState<'qr' | 'success'>('qr');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Visa Card Interactive Form States
  const [cardNumber, setCardNumber] = useState<string>('');
  const [cardName, setCardName] = useState<string>('');
  const [cardExpiry, setCardExpiry] = useState<string>('');
  const [cardCvv, setCardCvv] = useState<string>('');
  const [cardError, setCardError] = useState<string | null>(null);

  // App Owner (Merchant) Config States for Payouts
  const [merchantCard, setMerchantCard] = useState<string>(() => {
    return localStorage.getItem('khmer_gamers_merchant_card') || '4000 1234 5678 9010';
  });
  const [merchantName, setMerchantName] = useState<string>(() => {
    return localStorage.getItem('khmer_gamers_merchant_name') || 'KHMER GAMERS CO., LTD';
  });
  const [merchantGateway, setGateway] = useState<'stripe' | 'cybersource'>(() => {
    return (localStorage.getItem('khmer_gamers_merchant_gateway') as 'stripe' | 'cybersource') || 'stripe';
  });
  const [merchantId, setMerchantId] = useState<string>(() => {
    return localStorage.getItem('khmer_gamers_merchant_id') || 'mch_v582937418';
  });
  const [showOwnerPanel, setShowOwnerPanel] = useState<boolean>(false);

  // Input Formatting Handlers
  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    let formatted = '';
    for (let i = 0; i < val.length && i < 16; i++) {
      if (i > 0 && i % 4 === 0) formatted += ' ';
      formatted += val[i];
    }
    setCardNumber(formatted);
    setCardError(null);
  };

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    let formatted = '';
    if (val.length > 0) {
      formatted += val.substring(0, 2);
      if (val.length > 2) {
        formatted += '/' + val.substring(2, 4);
      }
    }
    setCardExpiry(formatted.substring(0, 5));
    setCardError(null);
  };

  const handleCvvChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/[^0-9]/gi, '').substring(0, 3);
    setCardCvv(val);
    setCardError(null);
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCardName(e.target.value.toUpperCase());
    setCardError(null);
  };

  // Prices definitions
  const prices = {
    daily: { usd: 0.35, khr: 1500 },
    monthly: { usd: 2.99, khr: 12000 },
    yearly: { usd: 24.99, khr: 100000 }
  };

  const getPriceString = (tier: SubscriptionTier) => {
    if (currency === 'USD') {
      return `$${prices[tier].usd.toFixed(2)}`;
    } else {
      return `${prices[tier].khr.toLocaleString()} ៛`;
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Simulating auto-payments periodically if auto-renew stays enabled
  useEffect(() => {
    if (!subscription.active || !subscription.autoRenew || !subscription.expiryDate) return;

    const interval = setInterval(() => {
      // Simulate that time passes and subscription auto-renews.
      // For quick demo, we simulate a check if subscription would expire.
      const now = new Date();
      const exp = new Date(subscription.expiryDate || '');
      
      // If hypothetical "expiration" is reached (or just simulate randomized background auto-billing renewal every 45 secs for real visual feedback!)
      // Since it's a demonstration of "Auto Payment", having a background simulator log a renewal is extremely engaging.
      const randomTrigger = Math.random() < 0.15; // 15% chance every 10s to simulate an auto-billing cycle
      if (randomTrigger) {
        processAutoPayment();
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [subscription]);

  const processAutoPayment = () => {
    if (!subscription.active || !subscription.tier || !subscription.paymentMethod) return;

    sound.playSuccess();
    
    const tierDuration = subscription.tier;
    const newStartDate = new Date();
    const newExpiryDate = new Date();
    
    if (tierDuration === 'daily') newExpiryDate.setDate(newExpiryDate.getDate() + 1);
    else if (tierDuration === 'monthly') newExpiryDate.setMonth(newExpiryDate.getMonth() + 1);
    else if (tierDuration === 'yearly') newExpiryDate.setFullYear(newExpiryDate.getFullYear() + 1);

    const price = prices[subscription.tier][currency === 'USD' ? 'usd' : 'khr'];

    const newTx: Transaction = {
      id: 'TXN-' + Math.floor(100000 + Math.random() * 900000),
      date: new Date().toLocaleString('km-KH'),
      tier: subscription.tier,
      amount: price,
      currency: currency,
      paymentMethod: 'VISA AutoPay 🔄',
      status: 'SUCCESS',
      autoPaid: true
    };

    setTransactions(prev => [newTx, ...prev]);
    setSubscription(prev => ({
      ...prev,
      startDate: newStartDate.toISOString(),
      expiryDate: newExpiryDate.toISOString()
    }));

    showToast(`🔄 ការបង់ប្រាក់ស្វ័យប្រវត្ត (Auto Payment) ${getPriceString(subscription.tier)} ត្រូវបានកាត់ចេញពីកាត VISA ជោគជ័យ! (ផ្ទេរចូលគណនីម្ចាស់: ${merchantName})`);
  };

  const handleSubscribeClick = (tier: SubscriptionTier) => {
    sound.playClick();
    setSelectedTier(tier);
    
    // Clear card fields on modal open
    setCardNumber('');
    setCardName('');
    setCardExpiry('');
    setCardCvv('');
    setCardError(null);
    
    setShowQRModal(true);
    setQrStep('qr');
    setIsProcessing(false);
  };

  const confirmPaymentSimulation = () => {
    // Perform Visa inputs validation
    const digitsOnly = cardNumber.replace(/\s+/g, '');
    if (digitsOnly.length < 16) {
      setCardError('សូមបំពេញលេខកាតឥណពន្ធឱ្យបានត្រឹមត្រូវ ១៦ ខ្ទង់! (Please enter a valid 16-digit Visa card number)');
      return;
    }
    if (!cardExpiry || cardExpiry.length < 5 || !cardExpiry.includes('/')) {
      setCardError('សូមបំពេញកាលបរិច្ឆេទផុតកំណត់ឱ្យបានត្រឹមត្រូវ! (e.g., MM/YY)');
      return;
    }
    const [expMonth, expYear] = cardExpiry.split('/');
    const monthVal = parseInt(expMonth, 10);
    if (!monthVal || monthVal < 1 || monthVal > 12) {
      setCardError('ខែផុតកំណត់មិនត្រឹមត្រូវ! (Month must be 01-12)');
      return;
    }
    if (cardCvv.length < 3) {
      setCardError('សូមបំពេញកូដសម្ងាត់ CVV ៣ ខ្ទង់ឱ្យបានត្រឹមត្រូវ! (CVV must be 3 digits)');
      return;
    }
    if (!cardName.trim()) {
      setCardError('សូមបំពេញឈ្មោះម្ចាស់កាត! (Please enter Cardholder Name)');
      return;
    }

    setCardError(null);
    sound.playClick();
    setIsProcessing(true);

    setTimeout(() => {
      setIsProcessing(false);
      setQrStep('success');
      sound.playSuccess();

      const newStartDate = new Date();
      const newExpiryDate = new Date();

      if (selectedTier === 'daily') newExpiryDate.setDate(newExpiryDate.getDate() + 1);
      else if (selectedTier === 'monthly') newExpiryDate.setMonth(newExpiryDate.getMonth() + 1);
      else if (selectedTier === 'yearly') newExpiryDate.setFullYear(newExpiryDate.getFullYear() + 1);

      const price = prices[selectedTier!][currency === 'USD' ? 'usd' : 'khr'];

      // Add to transactions list
      const newTx: Transaction = {
        id: 'TXN-' + Math.floor(100000 + Math.random() * 900000),
        date: new Date().toLocaleString('km-KH'),
        tier: selectedTier!,
        amount: price,
        currency: currency,
        paymentMethod: `VISA (ending ${digitsOnly.slice(-4)})`,
        status: 'SUCCESS',
        autoPaid: false
      };

      setTransactions(prev => [newTx, ...prev]);
      setSubscription({
        active: true,
        tier: selectedTier,
        startDate: newStartDate.toISOString(),
        expiryDate: newExpiryDate.toISOString(),
        autoRenew: true,
        paymentMethod: 'card'
      });

      showToast(`🎉 ជោគជ័យ! អ្នកបានភ្ជាប់គម្រោង ${selectedTier === 'daily' ? 'ប្រចាំថ្ងៃ' : selectedTier === 'monthly' ? 'ប្រចាំខែ' : 'ប្រចាំឆ្នាំ'} តាមរយៈកាត VISA រួចរាល់។`);
    }, 2000);
  };

  const cancelSubscription = () => {
    sound.playClick();
    if (confirm('តើអ្នកពិតជាចង់លុបចោលការបង់ប្រាក់ស្វ័យប្រវត្ត (Auto Payment) មែនទេ?')) {
      setSubscription({
        active: false,
        tier: null,
        startDate: null,
        expiryDate: null,
        autoRenew: false,
        paymentMethod: null
      });
      showToast('⚠️ ការបង់ប្រាក់ស្វ័យប្រវត្តត្រូវបានលុបចោល។ សិទ្ធិលេងនឹងហួសកំណត់។');
    }
  };

  const toggleAutoRenew = () => {
    sound.playClick();
    const nextState = !subscription.autoRenew;
    setSubscription(prev => ({
      ...prev,
      autoRenew: nextState
    }));
    showToast(nextState ? '🔄 បើកការបង់ប្រាក់ស្វ័យប្រវត្ត (Auto-Renew ON)' : '📴 បិទការបង់ប្រាក់ស្វ័យប្រវត្ត (Auto-Renew OFF)');
  };

  return (
    <div className="space-y-8" id="subscription-container">
      {/* Dynamic Toast System */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 max-w-md bg-zinc-900 border border-emerald-500/30 text-zinc-100 px-4 py-3 rounded-xl shadow-xl flex items-center space-x-3 animate-bounce">
          <div className="bg-emerald-500/20 p-1.5 rounded-lg text-emerald-400">
            <CheckCircle2 size={18} />
          </div>
          <p className="text-xs font-sans Khmer-font leading-relaxed">{toastMessage}</p>
        </div>
      )}

      {/* Subscription Status Card */}
      <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-6 relative overflow-hidden" id="status-card">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none"></div>
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <span className={`w-3 h-3 rounded-full ${subscription.active ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`}></span>
              <h2 className="text-xl font-bold font-sans tracking-tight text-white Khmer-font">
                ស្ថានភាពគណនីបច្ចុប្បន្ន 
              </h2>
            </div>
            
            {subscription.active ? (
              <div className="space-y-1">
                <p className="text-sm text-zinc-400 Khmer-font">
                  អ្នកកំពុងប្រើប្រាស់: <span className="text-emerald-400 font-semibold capitalize font-mono">{subscription.tier === 'daily' ? 'គម្រោងប្រចាំថ្ងៃ (Daily)' : subscription.tier === 'monthly' ? 'គម្រោងប្រចាំខែ (Monthly)' : 'គម្រោងប្រចាំឆ្នាំ (Yearly)'}</span>
                </p>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-zinc-500 font-mono">
                  <div className="flex items-center space-x-1">
                    <Calendar size={13} />
                    <span>ចាប់ផ្តើម: {new Date(subscription.startDate || '').toLocaleDateString('km-KH')}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Calendar size={13} />
                    <span>ផុតកំណត់: {new Date(subscription.expiryDate || '').toLocaleDateString('km-KH')}</span>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-sm text-zinc-400 Khmer-font">
                អ្នកមិនទាន់មានគម្រោងសកម្មនៅឡើយទេ។ សូមភ្ជាប់គម្រោងណាមួយខាងក្រោមដើម្បីលេងពេញលេញ និងគ្មានដែនកំណត់!
              </p>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            {subscription.active && (
              <>
                <button
                  id="auto-pay-toggle"
                  onClick={toggleAutoRenew}
                  className={`flex items-center justify-between space-x-2 px-4 py-2.5 rounded-xl border transition-all text-xs font-mono font-medium ${
                    subscription.autoRenew 
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                      : 'bg-zinc-800 border-zinc-700 text-zinc-400'
                  }`}
                >
                  <RefreshCw size={14} className={subscription.autoRenew ? 'animate-spin' : ''} />
                  <span className="Khmer-font">បង់ប្រាក់ស្វ័យប្រវត្ត: {subscription.autoRenew ? 'បើក (ON)' : 'បិទ (OFF)'}</span>
                </button>

                <button
                  id="btn-cancel-sub"
                  onClick={cancelSubscription}
                  className="px-4 py-2.5 rounded-xl border border-rose-500/20 bg-rose-500/5 text-rose-400 hover:bg-rose-500/10 transition-colors text-xs Khmer-font"
                >
                  លុបគម្រោងចោល
                </button>
              </>
            )}

            {/* Currency Selector */}
            <div className="bg-zinc-800/80 border border-zinc-700 p-1 rounded-xl flex items-center space-x-1">
              <button
                onClick={() => { sound.playClick(); setCurrency('USD'); }}
                className={`px-2.5 py-1 text-xs font-mono rounded-lg transition-all ${currency === 'USD' ? 'bg-emerald-500 text-black font-semibold' : 'text-zinc-400'}`}
              >
                USD
              </button>
              <button
                onClick={() => { sound.playClick(); setCurrency('KHR'); }}
                className={`px-2.5 py-1 text-xs font-mono rounded-lg transition-all ${currency === 'KHR' ? 'bg-emerald-500 text-black font-semibold' : 'text-zinc-400'}`}
              >
                KHR (៛)
              </button>
            </div>
          </div>
        </div>

        {subscription.active && (
          <div className="mt-4 pt-4 border-t border-zinc-800/80 flex items-center space-x-2 text-xs text-zinc-500 font-sans Khmer-font">
            <Info size={14} className="text-emerald-500 hover:scale-110 transition-transform" />
            <span>
              កាត់ប្រាក់ស្វ័យប្រវត្តតាមប្រព័ន្ធ <strong className="text-zinc-200">Visa Secure Payout Agreement</strong>។ រៀបចំឡើងដោយ <strong className="text-emerald-400 uppercase font-mono">{merchantGateway === 'stripe' ? 'STRIPE API GATEWAY' : 'ABA CYBERSOURCE'} (Merchant: {merchantName})</strong>។
            </span>
          </div>
        )}
      </div>

      {/* Admin Payout & Visa Merchant Configuration Dashboard */}
      <div className="flex justify-end" id="admin-toggle-wrapper">
        <button
          onClick={() => { sound.playClick(); setShowOwnerPanel(!showOwnerPanel); }}
          className="flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-semibold bg-amber-500/10 border border-amber-500/30 hover:bg-amber-500/20 text-amber-400 Khmer-font transition-all transition-colors cursor-pointer shadow-sm active:scale-95"
        >
          <span>🔑 ផ្ទាំងម្ចាស់វេបសាយ: របៀបរៀបចំដើម្បីបានប្រាក់ចូលកាតយើង (Admin Visa Payout Guide)</span>
          <span className="text-[10px] bg-amber-500/25 px-1.5 py-0.5 rounded text-amber-300 font-mono">
            {showOwnerPanel ? 'លាក់ (Hide)' : 'បង្ហាញ (Show)'}
          </span>
        </button>
      </div>

      {showOwnerPanel && (
        <div className="bg-zinc-950 border border-amber-500/40 rounded-3xl p-6 relative overflow-hidden space-y-6 animate-fade-in" id="owner-payout-panel">
          <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl pointer-events-none"></div>
          
          <div className="flex items-center space-x-3 text-amber-400">
            <Sparkles size={20} className="animate-pulse" />
            <div className="space-y-0.5">
              <h3 className="font-bold Khmer-font text-white text-md">រៀបចំដំណើរការទទួលប្រាក់ទូទាត់ពីអតិថិជន (Visa Card Merchant Dashboard)</h3>
              <p className="text-[11px] font-mono text-zinc-500">How to get customer subscription funds deposited directly into your Visa Card</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 text-xs text-zinc-300 Khmer-font">
            
            {/* Guide column */}
            <div className="space-y-4 leading-relaxed">
              <p className="text-zinc-400 text-[13px]">
                ដើម្បីទទួលបានប្រាក់ដែលអតិថិជនបានបង់តាមរយៈកាត <strong>Visa Card</strong> របស់ពួកគេរត់ចូលមកកាន់កាត ឬគណនីធនាគារផ្ទាល់ខ្លួនរបស់អ្នក (ឧ. ABA, ACLEDA,...) លោកអ្នកត្រូវឆ្លងកាត់ដៃគូទូទាត់ប្រាក់ (Payment Gateway Partner)។ ការបំពេញលេខកាតលើវេបសាយធម្មតាមិនអាចទាញប្រាក់ចូលកាតដោយគ្មាន Gateway មានអាជ្ញាប័ណ្ណត្រឹមត្រូវឡើយ។
              </p>
              
              <div className="space-y-3 pt-2">
                <h4 className="font-bold text-white text-sm border-b border-zinc-850 pb-1 flex items-center gap-2">
                  <span className="inline-block w-1.5 h-3 bg-amber-500"></span>
                  ជំហានដំណើរការលម្អិតទាំង ៤ (The Visa Payout Cycle):
                </h4>
                <div className="relative pl-6 border-l border-zinc-850 space-y-5">
                  <div className="relative">
                    <span className="absolute -left-[31px] top-0.5 flex items-center justify-center w-5 h-5 rounded-full bg-amber-400 text-black text-[10px] font-bold">1</span>
                    <strong className="text-zinc-200 block text-[13px]">ចុះឈ្មោះគណនីអាជីវកម្ម (Merchant Gate Account):</strong>
                    <p className="text-zinc-400 text-[11px] mt-1">
                      ចុះឈ្មោះប្រើប្រាស់គណនីអាជីវកម្មជាមួយសេវាកម្មទូទាត់ប្រាក់អន្តរជាតិល្បីៗដូចជា <strong className="text-amber-400 font-mono">Stripe</strong>, <strong className="text-amber-400 font-mono">PayPal</strong> ឬសេវាកម្មទូទាត់របស់ធនាគារក្នុងស្រុកដូចជា <strong className="text-emerald-400 font-sans font-bold">ABA CyberSource</strong> ឬ <strong className="text-emerald-400 font-sans">ACLEDA IPG</strong>។
                    </p>
                  </div>
                  
                  <div className="relative">
                    <span className="absolute -left-[31px] top-0.5 flex items-center justify-center w-5 h-5 rounded-full bg-amber-400 text-black text-[10px] font-bold">2</span>
                    <strong className="text-zinc-200 block text-[13px]">ភ្ជាប់កូដ API Keys ចូលមកកាន់ Server:</strong>
                    <p className="text-zinc-400 text-[11px] mt-1">
                      ប្រើប្រាស់កូដ SDK ឬ API keys ផ្លូវការ (ឧទាហរណ៍: <code className="text-amber-400 font-mono bg-zinc-900 border border-zinc-800 px-1 py-0.5 rounded text-[10px]">process.env.STRIPE_SECRET_KEY</code>) យកមកកំណត់បញ្ចូលក្នុងប្រព័ន្ធគ្រប់គ្រងសាច់ប្រាក់របស់ Server API routes ដើម្បីដំណើរការកិច្ចព្រមព្រៀងកាត់ប្រាក់ស្វ័យប្រវត្ត (Visa Card Recurring Billing / Tokenization)។
                    </p>
                  </div>
                  
                  <div className="relative">
                    <span className="absolute -left-[31px] top-0.5 flex items-center justify-center w-5 h-5 rounded-full bg-amber-400 text-black text-[10px] font-bold">3</span>
                    <strong className="text-zinc-200 block text-[13px]">អតិថិជនបំពេញកូដកាត និង OTP:</strong>
                    <p className="text-zinc-400 text-[11px] mt-1">
                      រាល់ពេលអតិថិជនវាយបញ្ចូលលេខកាត Visa ការពារដោយកម្រិតសុវត្ថិភាព 3D-Secure ពួកគេនឹងត្រូវផ្ទៀងផ្ទាត់ OTP សារ SMS ហើយសាច់ប្រាក់នឹងផ្ទេរភ្លាមៗពីកាតពួកគេ ទៅកាន់គណនី Merchant Gateway របស់អ្នកដោយសុវត្ថិភាពខ្ពស់។
                    </p>
                  </div>
                  
                  <div className="relative">
                    <span className="absolute -left-[31px] top-0.5 flex items-center justify-center w-5 h-5 rounded-full bg-amber-400 text-black text-[10px] font-bold">4</span>
                    <strong className="text-zinc-200 block text-[13px]">ផ្ទេរប្រាក់ស្វ័យប្រវត្ត (Auto Payout) ចូលកាតរបស់អ្នក:</strong>
                    <p className="text-zinc-400 text-[11px] mt-1">
                      ក្រោយការទូទាត់ប្រាក់បានជោគជ័យ ប្រព័ន្ធ Gateway នឹងប្រមូលសាច់ប្រាក់សន្សំ រួចផ្ទេរដោយស្វ័យប្រវត្ត (<strong className="text-emerald-400">Merchant Payout</strong>) ទៅកាន់ Visa Card ឬគណនីធនាគារផ្ទាល់ខ្លួនរបស់អ្នកដែលមានទំនាក់ទំនងជាប្រចាំ (ឧ. រៀងរាល់ ២៤ ម៉ោង ឬកាត់កាលវិភាគប្រចាំសប្តាហ៍)។
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Interactive simulated Admin setup Panel */}
            <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-5 space-y-4">
              <div className="space-y-1">
                <h4 className="font-bold text-white flex items-center gap-1.5 text-xs text-amber-400">
                  <CreditCard size={14} /> តំបន់កំណត់៖ ការទទួលប្រាក់លាក់របស់ម្ចាស់ (Interactive Visa Card Receiver Configurations)
                </h4>
                <p className="text-[11px] text-zinc-500">
                  សូមសាកល្បងកែប្រែលេខកាត Visa ទទួលប្រាក់ និង Merchant ID ខាងក្រោម។ ការផ្លាស់ប្តូរនេះនឹងធ្វើបច្ចុប្បន្នភាពលើផ្ទាំង Checkout របស់អតិថិជនភ្លាមៗសម្រាប់ទិដ្ឋភាពសាកល្បង!
                </p>
              </div>

              <div className="space-y-3 font-mono text-[11px]">
                
                {/* Gateway selection */}
                <div className="space-y-1">
                  <label className="text-zinc-400 Khmer-font block">ជ្រើសរើសច្រកទូទាត់ប្រាក់ (Select Gateway Processor):</label>
                  <div className="grid grid-cols-2 gap-2 text-center text-xs">
                    <button
                      onClick={() => { sound.playClick(); setGateway('stripe'); localStorage.setItem('khmer_gamers_merchant_gateway', 'stripe'); }}
                      className={`py-2 px-3 rounded-xl border text-center transition-all cursor-pointer ${
                        merchantGateway === 'stripe' 
                          ? 'border-emerald-500 bg-emerald-500/15 text-emerald-400 font-bold' 
                          : 'border-zinc-800 bg-zinc-950 text-zinc-400 font-medium hover:border-zinc-700'
                      }`}
                    >
                      Stripe Gateway
                    </button>
                    <button
                      onClick={() => { sound.playClick(); setGateway('cybersource'); localStorage.setItem('khmer_gamers_merchant_gateway', 'cybersource'); }}
                      className={`py-2 px-3 rounded-xl border text-center transition-all cursor-pointer ${
                        merchantGateway === 'cybersource' 
                          ? 'border-emerald-400 bg-emerald-500/15 text-emerald-400 font-bold' 
                          : 'border-zinc-800 bg-zinc-950 text-zinc-400 font-medium hover:border-zinc-700'
                      }`}
                    >
                      ABA CyberSource
                    </button>
                  </div>
                </div>

                {/* Recipient Visa Card number */}
                <div>
                  <label className="text-zinc-400 Khmer-font block mb-1">លេខ Visa Card របស់ម្ចាស់ (Merchant Payout Visa Card):</label>
                  <input
                    type="text"
                    value={merchantCard}
                    onChange={(e) => {
                      setMerchantCard(e.target.value);
                      localStorage.setItem('khmer_gamers_merchant_card', e.target.value);
                    }}
                    placeholder="4000 1234 5678 9010"
                    className="w-full bg-zinc-950 border border-zinc-800 py-2 px-3 rounded-xl text-emerald-400 font-bold focus:outline-none focus:border-amber-500 select-all"
                  />
                  <span className="text-[10px] text-zinc-500 mt-1 block Khmer-font">✓ សាច់ប្រាក់ពី Gateway នឹងត្រូវវេរស្វ័យប្រវត្តចូលលេខកាតខាងលើនេះ។</span>
                </div>

                {/* Merchant Name */}
                <div>
                  <label className="text-zinc-400 Khmer-font block mb-1">ឈ្មោះក្រុមហ៊ុន ឬឈ្មោះម្ចាស់ (Merchant / Brand Beneficiary Name):</label>
                  <input
                    type="text"
                    value={merchantName}
                    onChange={(e) => {
                      setMerchantName(e.target.value);
                      localStorage.setItem('khmer_gamers_merchant_name', e.target.value);
                    }}
                    placeholder="KHMER GAMERS CO., LTD"
                    className="w-full bg-zinc-950 border border-zinc-800 py-2 px-3 rounded-xl text-zinc-100 focus:outline-none focus:border-amber-500 capitalize"
                  />
                </div>

                {/* Merchant ID */}
                <div>
                  <label className="text-zinc-400 Khmer-font block mb-1">អត្តសញ្ញាណ Merchant ID សម្ងាត់:</label>
                  <input
                    type="text"
                    value={merchantId}
                    onChange={(e) => {
                      setMerchantId(e.target.value);
                      localStorage.setItem('khmer_gamers_merchant_id', e.target.value);
                    }}
                    placeholder="mch_v582937418"
                    className="w-full bg-zinc-950 border border-zinc-800 py-2 px-3 rounded-xl text-zinc-300 focus:outline-none focus:border-amber-500"
                  />
                </div>

              </div>

              {/* Dynamic Transaction flow chart diagram */}
              <div className="border border-zinc-800 bg-zinc-950 p-4 rounded-xl space-y-3 text-[10px] font-mono select-none">
                <span className="text-zinc-400 Khmer-font block uppercase font-bold text-[9px] tracking-widest text-center border-b border-zinc-900 pb-1.5">ប្លង់លំហូរចរន្តប្រាក់បញ្ញើ (Live Interactive Cash Flow Map)</span>
                <div className="flex items-center justify-between gap-1 text-center py-1 text-[9px] relative">
                  
                  {/* Step 1 */}
                  <div className="flex-1 bg-zinc-900 border border-zinc-800 py-2.5 px-1 rounded-xl">
                    <span className="block font-bold text-white uppercase text-[8px] tracking-wider mb-0.5">1. អ្នកលេង (Customer)</span>
                    <span className="text-zinc-500 text-[8px] block Khmer-font">កាត Visa របស់ Player</span>
                  </div>

                  <div className="text-emerald-500 font-bold px-0.5 animate-pulse text-[14px]">➔</div>

                  {/* Step 2 */}
                  <div className="flex-1 bg-emerald-500/5 border border-emerald-500/30 py-2.5 px-1 rounded-xl relative">
                    <span className="block font-bold text-emerald-400 uppercase text-[8px] tracking-wider mb-0.5">2. ច្រក Gateway</span>
                    <span className="text-zinc-400 font-sans text-[8px] block font-bold truncate">
                      {merchantGateway === 'stripe' ? 'STRIPE API' : 'ABA CYBERSOURCE'}
                    </span>
                    <span className="text-[7.5px] text-zinc-500 font-mono block truncate mt-0.5 opacity-80">{merchantId}</span>
                  </div>

                  <div className="text-emerald-400 font-bold px-0.5 animate-pulse text-[14px]">➔</div>

                  {/* Step 3 */}
                  <div className="flex-1 bg-amber-500/5 border border-amber-500/30 py-2.5 px-1 rounded-xl">
                    <span className="block font-bold text-amber-400 uppercase text-[8px] tracking-wider mb-0.5">3. កាតម្ចាស់ (Owner)</span>
                    <span className="text-amber-500 text-[8.5px] font-bold block truncate font-mono">
                      Visa ending {merchantCard.replace(/\s+/g, '').slice(-4) || '9010'}
                    </span>
                    <span className="text-[7px] text-zinc-500 block truncate uppercase mt-0.5 font-bold">{merchantName.slice(0, 15)}...</span>
                  </div>

                </div>
                <div className="bg-amber-500/5 border border-amber-500/10 p-2.5 rounded-lg text-amber-300 text-[10px] Khmer-font leading-relaxed">
                  💡 <strong>ចំណាំសម្រាប់ម្ចាស់៖</strong> នៅក្នុងតំបន់ Real Production, រាល់ការទូទាត់ប្រាក់ពីកាតអ្នកលេងនឹងត្រូវបានកាត់ផ្ទេរចេញទៅ <strong className="text-white">សរុបស្វ័យប្រវត្ត</strong> រាល់ចន្លោះពេល Payout cycle នៃ Gateway (Stripe/Bank) ទៅកាន់ Visa Card របស់អ្នកដោយសុវត្ថិភាពខ្ពស់ និងស្របច្បាប់។
                </div>
              </div>
              
            </div>

          </div>
        </div>
      )}

      {/* Pricing Cards Grid */}
      <div className="space-y-4">
        <div className="text-center md:text-left space-y-1">
          <h3 className="text-lg font-semibold Khmer-font text-white flex items-center gap-2">
            <Sparkles size={18} className="text-amber-500" /> ជ្រើសរើសផែនការការលេងហ្គេមរបស់អ្នក
          </h3>
          <p className="text-xs text-zinc-400 Khmer-font">
            បង់ប្រាក់កាន់តែងាយស្រួល ជាមួយប្រព័ន្ធកាត់ប្រាក់ស្វ័យប្រវត្ត (Auto Payment) សុវត្ថិភាព 100%
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Daily */}
          <div className={`bg-zinc-900 border rounded-2xl p-5 flex flex-col justify-between relative transition-all duration-300 hover:scale-[1.02] ${
            subscription.tier === 'daily' ? 'border-emerald-500 ring-1 ring-emerald-500/20' : 'border-zinc-800'
          }`} id="tier-card-daily">
            <div className="space-y-4">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <h4 className="font-bold Khmer-font text-white text-md">គម្រោងប្រចាំថ្ងៃ</h4>
                  <span className="text-xs font-mono text-zinc-500">Daily Access Pass</span>
                </div>
                <span className="bg-zinc-800/80 border border-zinc-700 text-zinc-300 text-[10px] font-mono px-2 py-0.5 rounded-full uppercase">
                  លឿនរហ័ស
                </span>
              </div>

              <div className="space-y-1">
                <span className="text-2xl font-mono font-bold text-emerald-400">{getPriceString('daily')}</span>
                <span className="text-xs text-zinc-500 Khmer-font block">/ ម្នាក់សម្រាប់ ២៤ ម៉ោង</span>
              </div>

              <hr className="border-zinc-800" />

              <ul className="space-y-2 text-xs Khmer-font text-zinc-400">
                <li className="flex items-center space-x-2">
                  <Check size={14} className="text-emerald-500 shrink-0" />
                  <span>លេងហ្គេម X & O មិនកំណត់</span>
                </li>
                <li className="flex items-center space-x-2">
                  <Check size={14} className="text-emerald-500 shrink-0" />
                  <span>លេងហ្គេមចត្រង្គ (Chess) ទល់នឹង AI មធ្យម</span>
                </li>
                <li className="flex items-center space-x-2 text-zinc-600 line-through">
                  <X size={14} className="text-rose-500 shrink-0" />
                  <span>គ្មានស្បែកក្តារប្រណីតឡើងគ្រង</span>
                </li>
              </ul>
            </div>

            <button
              id="sub-daily"
              onClick={() => handleSubscribeClick('daily')}
              className={`w-full mt-6 py-2.5 px-4 rounded-xl text-xs font-bold transition-all Khmer-font ${
                subscription.tier === 'daily' 
                  ? 'bg-emerald-500 text-black hover:bg-emerald-400' 
                  : 'bg-zinc-800 text-zinc-200 hover:bg-zinc-750'
              }`}
            >
              {subscription.tier === 'daily' ? 'គម្រោងសកម្មបច្ចុប្បន្ន' : 'ភ្ជាប់គម្រោងឥឡូវនេះ'}
            </button>
          </div>

          {/* Card 2: Monthly */}
          <div className={`bg-zinc-900 border rounded-2xl p-5 flex flex-col justify-between relative transition-all duration-300 hover:scale-[1.02] ${
            subscription.tier === 'monthly' ? 'border-emerald-500 ring-2 ring-emerald-500/25' : 'border-zinc-800/80 ring-1 ring-zinc-700/10'
          }`} id="tier-card-monthly">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-500 text-zinc-900 text-[10px] uppercase font-bold px-3 py-1 rounded-full shadow-lg Khmer-font tracking-wider">
              ពេញនិយមបំផុត ⭐
            </div>

            <div className="space-y-4 mt-2">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <h4 className="font-bold Khmer-font text-white text-md">គម្រោងប្រចាំខែ</h4>
                  <span className="text-xs font-mono text-zinc-500">Monthly Pro Gamer</span>
                </div>
                <span className="bg-emerald-500/10 text-emerald-400 text-[10px] font-mono px-2 py-0.5 rounded-full uppercase">
                  សន្សំសំចៃ
                </span>
              </div>

              <div className="space-y-1">
                <span className="text-2xl font-mono font-bold text-emerald-400">{getPriceString('monthly')}</span>
                <span className="text-xs text-zinc-500 Khmer-font block">/ សម្រាប់ ៣០ ថ្ងៃ</span>
              </div>

              <hr className="border-zinc-800" />

              <ul className="space-y-2 text-xs Khmer-font text-zinc-400">
                <li className="flex items-center space-x-2">
                  <Check size={14} className="text-emerald-500 shrink-0" />
                  <span>លេងហ្គេមទាំងអស់បានគ្មានដែនកំណត់</span>
                </li>
                <li className="flex items-center space-x-2">
                  <Check size={14} className="text-emerald-500 shrink-0" />
                  <span>Chess AI (កម្រិតពិបាក Minimax ខ្ពស់)</span>
                </li>
                <li className="flex items-center space-x-2">
                  <Check size={14} className="text-emerald-500 shrink-0" />
                  <span>បើកសោស្បែកក្តារ Chess និង X & O ថ្មីៗ</span>
                </li>
                <li className="flex items-center space-x-2">
                  <Check size={14} className="text-emerald-500 shrink-0" />
                  <span>មុខងារគាំទ្រលេង ២ នាក់ Local & PvP Mode</span>
                </li>
              </ul>
            </div>

            <button
              id="sub-monthly"
              onClick={() => handleSubscribeClick('monthly')}
              className={`w-full mt-6 py-2.5 px-4 rounded-xl text-xs font-bold transition-all Khmer-font ${
                subscription.tier === 'monthly' 
                  ? 'bg-emerald-500 text-black hover:bg-emerald-400' 
                  : 'bg-emerald-500/90 text-black hover:bg-emerald-400 shadow-md shadow-emerald-500/10'
              }`}
            >
              {subscription.tier === 'monthly' ? 'គម្រោងសកម្មបច្ចុប្បន្ន' : 'ភ្ជាប់គម្រោងឥឡូវនេះ'}
            </button>
          </div>

          {/* Card 3: Yearly */}
          <div className={`bg-zinc-900 border rounded-2xl p-5 flex flex-col justify-between relative transition-all duration-300 hover:scale-[1.02] ${
            subscription.tier === 'yearly' ? 'border-emerald-500 ring-1 ring-emerald-500/20' : 'border-zinc-800'
          }`} id="tier-card-yearly">
            <div className="space-y-4">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <h4 className="font-bold Khmer-font text-white text-md">គម្រោងប្រចាំឆ្នាំ</h4>
                  <span className="text-xs font-mono text-zinc-500">Yearly Diamond Club</span>
                </div>
                <span className="bg-amber-500/10 text-amber-400 text-[10px] font-mono px-2 py-0.5 rounded-full uppercase">
                  បញ្ចុះតម្លៃ ២០%
                </span>
              </div>

              <div className="space-y-1">
                <span className="text-2xl font-mono font-bold text-emerald-400">{getPriceString('yearly')}</span>
                <span className="text-xs text-zinc-500 Khmer-font block">/ សម្រាប់ ៣៦៥ ថ្ងៃ</span>
              </div>

              <hr className="border-zinc-800" />

              <ul className="space-y-2 text-xs Khmer-font text-zinc-400">
                <li className="flex items-center space-x-2">
                  <Check size={14} className="text-emerald-500 shrink-0" />
                  <span>លក្ខណៈពិសេសទាំងអស់របស់ Pro+ ពេញមួយឆ្នាំ</span>
                </li>
                <li className="flex items-center space-x-2">
                  <Check size={14} className="text-emerald-500 shrink-0" />
                  <span>អាទិភាពស៊ុមរូបតំណាង Diamond Badge</span>
                </li>
                <li className="flex items-center space-x-2">
                  <Check size={14} className="text-emerald-500 shrink-0" />
                  <span>បង់ប្រាក់ស្វ័យប្រវត្តម្តងក្នុងឆ្នាំ កាត់បន្ថយការភ័ន្តច្រឡំ</span>
                </li>
                <li className="flex items-center space-x-2">
                  <Check size={14} className="text-emerald-500 shrink-0" />
                  <span>ជំនួយ និងការអភិវឌ្ឍន៍ផ្ទាល់ពីអ្នកបង្កើត</span>
                </li>
              </ul>
            </div>

            <button
              id="sub-yearly"
              onClick={() => handleSubscribeClick('yearly')}
              className={`w-full mt-6 py-2.5 px-4 rounded-xl text-xs font-bold transition-all Khmer-font ${
                subscription.tier === 'yearly' 
                  ? 'bg-emerald-500 text-black hover:bg-emerald-400' 
                  : 'bg-zinc-800 text-zinc-200 hover:bg-zinc-750'
              }`}
            >
              {subscription.tier === 'yearly' ? 'គម្រោងសកម្មបច្ចុប្បន្ន' : 'ភ្ជាប់គម្រោងឥឡូវនេះ'}
            </button>
          </div>
        </div>
      </div>

      {/* Auto Payment Agreements Information */}
      <div className="bg-zinc-950/60 border border-zinc-900 rounded-2xl p-5 flex items-start gap-4">
        <ShieldCheck className="text-emerald-500 h-6 w-6 mt-0.5 shrink-0" />
        <div className="space-y-1">
          <h4 className="text-sm font-semibold Khmer-font text-zinc-200">
            អំពីលក្ខខណ្ឌការបង់ប្រាក់ស្វ័យប្រវត្ត (Auto-Debit Agreement)
          </h4>
          <p className="text-xs text-zinc-400 Khmer-font leading-relaxed">
            នៅពេលលោកអ្នកជ្រើសរើសការបង់ប្រាក់ Auto Payment តាមរយៈកាតឥណពន្ធ Visa របស់លោកអ្នក ប្រព័ន្ធនឹងដំណើរការពន្យារពេលភ្ជាប់គម្រោងដោយស្វ័យប្រវត្តនៅពេលគម្រោងជិតហួសកំណត់។ លោកអ្នកអាចបិទ ឬលុបចោលកិច្ចព្រមព្រៀងនេះបានគ្រប់ពេលតាមរយៈប៊ូតុង <strong>លុបគម្រោងចោល</strong> ដោយគ្មានការផាកពិន័យឡើយ។
          </p>
        </div>
      </div>

      {/* Invoicing and Billing Logs */}
      <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-5" id="transactions-section">
        <div className="flex items-center justify-between mb-4 pb-2 border-b border-zinc-850">
          <h3 className="text-sm font-semibold Khmer-font text-white flex items-center gap-2">
            <History size={16} className="text-zinc-400" /> ប្រវត្តិកាត់ប្រាក់ និងវិក្កយបត្រ (Billing History)
          </h3>
          <span className="text-[10px] font-mono text-zinc-500">
            សរុបមាន ({transactions.length}) វិក្កយបត្រ
          </span>
        </div>

        {transactions.length === 0 ? (
          <div className="text-center py-6">
            <Receipt className="mx-auto text-zinc-700 h-8 w-8 mb-2" />
            <p className="text-xs text-zinc-500 Khmer-font">មិនទាន់មានការកាត់ប្រាក់នៅឡើយទេ</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="text-zinc-500 border-b border-zinc-850">
                  <th className="py-2.5 px-3 Khmer-font font-medium text-left">លេខកូដវិក្កយបត្រ</th>
                  <th className="py-2.5 px-3 Khmer-font font-medium text-left">កាលបរិច្ឆេទ</th>
                  <th className="py-2.5 px-3 Khmer-font font-medium text-left">ប្រភេទគម្រោង</th>
                  <th className="py-2.5 px-3 Khmer-font font-medium text-left">វិធីសាស្ត្រ</th>
                  <th className="py-2.5 px-3 Khmer-font font-medium text-right">ទឹកប្រាក់កាត់សរុប</th>
                  <th className="py-2.5 px-3 Khmer-font font-medium text-center">ស្ថានភាព</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-850 text-zinc-300">
                {transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-zinc-900/30 transition-colors">
                    <td className="py-3 px-3 text-emerald-400 font-semibold">{tx.id}</td>
                    <td className="py-3 px-3 text-zinc-400 text-[11px]">{tx.date}</td>
                    <td className="py-3 px-3 capitalize">
                      {tx.tier === 'daily' ? 'ប្រចាំថ្ងៃ (Daily)' : tx.tier === 'monthly' ? 'ប្រចាំខែ (Monthly)' : 'ប្រចាំឆ្នាំ (Yearly)'}
                    </td>
                    <td className="py-3 px-3">
                      <span className="bg-zinc-850 border border-zinc-750 px-2 py-0.5 rounded text-[10px] font-sans">
                        {tx.paymentMethod}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right font-bold">
                      {tx.currency === 'USD' ? `$${tx.amount.toFixed(2)}` : `${tx.amount.toLocaleString()} ៛`}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        {tx.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* High-fidelity Visa Card Checkout Modal */}
      {showQRModal && selectedTier && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in" id="payment-modal">
          <div className="bg-zinc-950 border border-zinc-800 rounded-3xl max-w-sm w-full overflow-hidden shadow-2xl relative">
            
            {/* Header */}
            <div className="p-5 border-b border-zinc-850 flex items-center justify-between">
              <div className="flex items-center space-x-2 text-white">
                <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
                  <CreditCard size={18} />
                </div>
                <div className="space-y-0.5">
                  <h3 className="font-bold Khmer-font text-white text-xs">ទូទាត់ប្រាក់ Visa Card ស្វ័យប្រវត្ត</h3>
                  <span className="text-[9px] font-mono text-zinc-500 block uppercase tracking-wider">Visa Secure Recurrent Pay</span>
                </div>
              </div>
              <button 
                onClick={() => { sound.playClick(); setShowQRModal(false); }}
                className="text-zinc-500 hover:text-white p-1 rounded-full bg-zinc-900 transition-colors cursor-pointer"
                aria-label="Close"
              >
                <X size={16} />
              </button>
            </div>

            {qrStep === 'qr' ? (
              <div className="p-5 space-y-5">
                
                {/* Visual Premium Visa Debit Card Graphic (Live Updates!) */}
                <div className="bg-gradient-to-br from-zinc-850 via-zinc-900 to-zinc-950 border border-zinc-800 p-4 rounded-2xl shadow-xl text-white font-mono space-y-6 relative overflow-hidden select-none">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none"></div>
                  
                  <div className="flex justify-between items-center relative z-10">
                    <span className="text-[8px] text-zinc-500 font-bold tracking-wider uppercase">RECURRING MEMBERSHIP</span>
                    <span className="text-sm italic font-black text-white bg-zinc-800/40 px-2 py-0.5 rounded-md">VISA</span>
                  </div>

                  <div className="space-y-3 relative z-10">
                    {/* Live Card Number */}
                    <div className="text-md text-zinc-100 tracking-widest font-semibold min-h-[22px]">
                      {cardNumber || '•••• •••• •••• ••••'}
                    </div>

                    <div className="flex justify-between items-end">
                      <div className="max-w-[180px]">
                        <span className="text-[7px] text-zinc-500 block">CARD HOLDER</span>
                        <span className="text-[10px] font-bold text-zinc-300 uppercase truncate block">
                          {cardName || 'YOUR FULL NAME'}
                        </span>
                      </div>
                      <div className="flex space-x-3 text-right">
                        <div>
                          <span className="text-[7px] text-zinc-500 block">EXPIRES</span>
                          <span className="text-[10px] font-bold text-zinc-300">
                            {cardExpiry || 'MM/YY'}
                          </span>
                        </div>
                        <div>
                          <span className="text-[7px] text-zinc-500 block">CVV</span>
                          <span className="text-[10px] font-bold text-zinc-300">
                            {cardCvv ? '•••' : '***'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Tiny Security Strip Indicator */}
                  <div className="absolute right-3 top-1 text-[8px] text-emerald-500 flex items-center gap-1 opacity-80 uppercase font-sans">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                    <span>{merchantGateway === 'stripe' ? 'STRIPE SECURE' : 'ABA CYBERSOURCE'}</span>
                  </div>
                </div>

                {/* Submitting Alert message/errors */}
                {cardError && (
                  <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[10px] px-3 py-2 rounded-xl flex items-start gap-2 animate-pulse Khmer-font leading-relaxed">
                    <X size={14} className="shrink-0 mt-0.5" />
                    <span>{cardError}</span>
                  </div>
                )}

                {/* Payment recipient context info */}
                <div className="bg-zinc-900/60 border border-zinc-850 py-2.5 px-3 rounded-xl space-y-1 text-[10px] text-zinc-400 Khmer-font font-sans">
                  <div className="flex justify-between">
                    <span>គម្រោងជ្រើសរើស:</span>
                    <strong className="text-zinc-200 capitalize font-mono">
                      {selectedTier === 'daily' ? 'ប្រចាំថ្ងៃ' : selectedTier === 'monthly' ? 'ប្រចាំខែ' : 'ប្រចាំឆ្នាំ'} ({getPriceString(selectedTier)})
                    </strong>
                  </div>
                  <div className="flex justify-between">
                    <span>វេរប្រាក់ចូល៖</span>
                    <strong className="text-emerald-400 truncate max-w-[150px]">{merchantName}</strong>
                  </div>
                </div>

                {/* Secure Input fields */}
                <div className="space-y-3 text-xs Khmer-font">
                  <div>
                    <label className="text-zinc-400 font-semibold block mb-1">ឈ្មោះម្ចាស់កាត (Cardholder Name)</label>
                    <input
                      type="text"
                      value={cardName}
                      onChange={handleNameChange}
                      placeholder="e.g. ALPHA USER"
                      className="w-full bg-zinc-900 border border-zinc-850 py-2.5 px-3 rounded-xl text-zinc-200 focus:outline-none focus:border-emerald-500 font-mono text-sm uppercase"
                    />
                  </div>

                  <div>
                    <label className="text-zinc-400 font-semibold block mb-1">លេខកាតឥណពន្ធ (Card Number)</label>
                    <div className="relative">
                      <input
                        type="text"
                        value={cardNumber}
                        onChange={handleCardNumberChange}
                        maxLength={19}
                        placeholder="4242 4242 4242 4242"
                        className="w-full bg-zinc-900 border border-zinc-850 py-2.5 px-3 rounded-xl text-zinc-200 focus:outline-none focus:border-emerald-500 font-mono text-sm tracking-wider"
                      />
                      <span className="absolute right-3 top-2.5 text-[10px] text-zinc-500 uppercase tracking-widest font-black">VISA</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-zinc-400 font-semibold block mb-1">Expiry (MM/YY)</label>
                      <input
                        type="text"
                        value={cardExpiry}
                        onChange={handleExpiryChange}
                        maxLength={5}
                        placeholder="MM/YY"
                        className="w-full bg-zinc-900 border border-zinc-850 py-2.5 px-3 rounded-xl text-zinc-200 focus:outline-none focus:border-emerald-500 font-mono text-sm text-center"
                      />
                    </div>
                    <div>
                      <label className="text-zinc-400 font-semibold block mb-1">CVV / CVC</label>
                      <input
                        type="password"
                        value={cardCvv}
                        onChange={handleCvvChange}
                        maxLength={3}
                        placeholder="***"
                        className="w-full bg-zinc-900 border border-zinc-850 py-2.5 px-3 rounded-xl text-zinc-200 focus:outline-none focus:border-emerald-500 font-mono text-sm text-center"
                      />
                    </div>
                  </div>
                </div>

                {/* Footer Buttons */}
                <div className="flex items-center gap-3 pt-2">
                  <button
                    onClick={() => { sound.playClick(); setShowQRModal(false); }}
                    className="flex-1 py-2.5 text-xs text-zinc-400 hover:text-white bg-zinc-900 hover:bg-zinc-850 rounded-xl transition-colors font-medium Khmer-font cursor-pointer border border-zinc-850/40"
                  >
                    លុបចោល
                  </button>

                  <button
                    id="btn-confirm-payment"
                    disabled={isProcessing}
                    onClick={confirmPaymentSimulation}
                    className="flex-1 py-2.5 bg-emerald-500 text-black hover:bg-emerald-400 disabled:bg-emerald-500/20 active:scale-95 disabled:text-zinc-500 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 Khmer-font cursor-pointer"
                  >
                    {isProcessing ? (
                      <>
                        <RefreshCw className="animate-spin h-3 w-3 inline" />
                        កំពុងទូទាត់...
                      </>
                    ) : (
                      'បង់ប្រាក់ឥឡូវនេះ'
                    )}
                  </button>
                </div>
              </div>
            ) : (
              /* Success confirmation Screen */
              <div className="p-6 text-center space-y-5 animate-fade-in">
                <div className="inline-flex p-3.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-full animate-bounce">
                  <CheckCircle2 size={36} />
                </div>

                <div className="space-y-2">
                  <h4 className="text-md font-bold text-white Khmer-font">
                    ការភ្ជាប់គម្រោងទទួលបានជោគជ័យ!
                  </h4>
                  <p className="text-xs text-zinc-400 Khmer-font px-2 leading-relaxed">
                    គណនីរបស់អ្នកត្រូវបានធ្វើសមាជិកភាពទៅជា <span className="text-emerald-400 capitalize font-bold font-mono">{selectedTier === 'daily' ? 'គម្រោងប្រចាំថ្ងៃ (Daily)' : selectedTier === 'monthly' ? 'គម្រោងប្រចាំខែ (Monthly)' : 'គម្រោងប្រចាំឆ្នាំ (Yearly)'}</span> ហើយកិច្ចព្រមព្រៀងកាត់ថ្លៃដោយស្វ័យប្រវត្ត (Visa Auto Pay Agreement) ត្រូវបានចុះបញ្ជីរួចរាល់។
                  </p>
                </div>

                {/* Dynamic Receipt Detail referencing Owner Configuration directly! */}
                <div className="bg-zinc-900/60 border border-zinc-850 p-4 rounded-2xl text-left text-xs font-mono space-y-2.5 max-w-sm mx-auto">
                  <div className="flex justify-between items-center">
                    <span className="text-zinc-500 Khmer-font font-medium text-[10px]">ច្រកទូទាត់របស់ម្ចាស់:</span>
                    <span className="text-zinc-100 uppercase font-bold text-[10px]">
                      {merchantGateway === 'stripe' ? 'STRIPE VISA GATE' : 'ABA CYBERSOURCE'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center border-t border-zinc-850/50 pt-2">
                    <span className="text-zinc-500 Khmer-font font-medium text-[10px]">គណនីទទួលបានប្រាក់:</span>
                    <span className="text-amber-400 font-bold text-[10px] max-w-[160px] truncate uppercase block">
                      {merchantName}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-zinc-500 Khmer-font font-medium text-[10px]">កាតម្ចាស់ទទួលលុយ:</span>
                    <span className="text-emerald-400 font-bold font-mono text-[10px]">
                      Card ending {merchantCard.replace(/\s+/g, '').slice(-4) || '9010'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center border-t border-zinc-850/50 pt-2">
                    <span className="text-zinc-500 Khmer-font font-medium text-[10px]">ទឹកប្រាក់បង់សរុប:</span>
                    <span className="text-emerald-400 font-bold text-sm tracking-tight">{getPriceString(selectedTier)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-zinc-500 Khmer-font font-medium text-[10px]">ស្ថានភាព Recurring:</span>
                    <span className="text-emerald-400 flex items-center gap-1 font-semibold text-[10px]">
                      <RefreshCw size={10} className="animate-spin text-emerald-400 shrink-0" /> បើកការកាត់ប្រាក់
                    </span>
                  </div>
                </div>

                <button
                  id="btn-close-sub-success"
                  onClick={() => { sound.playClick(); setShowQRModal(false); }}
                  className="w-full py-2.5 bg-emerald-500 text-black hover:bg-emerald-400 font-bold rounded-xl text-xs transition-colors Khmer-font cursor-pointer"
                >
                  ចូលរួមលេងគម្រោង VIP
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
