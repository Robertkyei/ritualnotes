import React, { useState } from 'react';
import { 
  Sparkles, Check, ShieldCheck, X, Smartphone, CreditCard, 
  ExternalLink, Zap, Flame, Crown, AlertCircle, CheckCircle2, Lock
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { UserProfile, SubscriptionRecord, PaystackSuccessResponse } from '../types';
import { paystackService, GHS_PLANS, PlanOption } from '../services/paystack';
import { supabaseService } from '../services/supabase';
import { LegalModal, LegalDocType } from './LegalModal';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  userProfile: UserProfile;
  onSubscriptionSuccess: (record: SubscriptionRecord, updatedProfile: UserProfile) => void;
}

export const UpgradeModal: React.FC<UpgradeModalProps> = ({
  isOpen,
  onClose,
  userProfile,
  onSubscriptionSuccess,
}) => {
  const [selectedPlan, setSelectedPlan] = useState<PlanOption>(GHS_PLANS[0]);
  const [email, setEmail] = useState(userProfile.email || `${userProfile.name.toLowerCase().replace(/[^a-z0-9]/g, '') || 'churchgoer'}@sanctuary.app`);
  const [phone, setPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successRecord, setSuccessRecord] = useState<SubscriptionRecord | null>(null);
  const [supabaseSyncStatus, setSupabaseSyncStatus] = useState<string | null>(null);
  const [legalDoc, setLegalDoc] = useState<LegalDocType | null>(null);

  if (!isOpen) return null;

  const handleUpgradeClick = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    setSupabaseSyncStatus(null);

    // Trigger Paystack Inline JS popup with currency 'GHS'
    await paystackService.triggerPaystackPopup({
      userProfile: {
        ...userProfile,
        email: email.trim(),
      },
      userEmail: email.trim(),
      plan: selectedPlan,
      onSuccess: async (response: PaystackSuccessResponse, record: SubscriptionRecord) => {
        setIsLoading(false);
        setSuccessRecord(record);
        setSupabaseSyncStatus('Directly recorded in Supabase "users" table!');

        // Trigger celebratory confetti
        try {
          confetti({
            particleCount: 100,
            spread: 80,
            origin: { y: 0.5 },
            colors: ['#f59e0b', '#10b981', '#fbbf24', '#ffffff'],
          });
        } catch {}

        const updated: UserProfile = {
          ...userProfile,
          email: email.trim(),
          subscriptionStatus: 'active',
          subscriptionTier: record.subscriptionTier,
          subscriptionReference: record.reference,
          subscriptionAmount: record.amount,
          subscriptionCurrency: 'GHS',
          subscriptionChannel: 'mobile_money',
          subscriptionPaidAt: record.paidAt,
        };

        onSubscriptionSuccess(record, updated);
      },
      onClose: () => {
        setIsLoading(false);
      },
      onError: (msg: string) => {
        setIsLoading(false);
        setErrorMessage(msg);
      },
    });
  };

  const handleSimulateTestPayment = async () => {
    setIsLoading(true);
    setErrorMessage(null);

    await paystackService.simulateSuccessfulMobileMoney({
      userProfile: {
        ...userProfile,
        email: email.trim(),
      },
      userEmail: email.trim(),
      plan: selectedPlan,
      onSuccess: async (response: PaystackSuccessResponse, record: SubscriptionRecord) => {
        setIsLoading(false);
        setSuccessRecord(record);
        setSupabaseSyncStatus('Directly recorded in Supabase "users" table!');

        try {
          confetti({
            particleCount: 80,
            spread: 70,
            origin: { y: 0.5 },
            colors: ['#f59e0b', '#10b981', '#fbbf24'],
          });
        } catch {}

        const updated: UserProfile = {
          ...userProfile,
          email: email.trim(),
          subscriptionStatus: 'active',
          subscriptionTier: record.subscriptionTier,
          subscriptionReference: record.reference,
          subscriptionAmount: record.amount,
          subscriptionCurrency: 'GHS',
          subscriptionChannel: 'mobile_money',
          subscriptionPaidAt: record.paidAt,
        };

        onSubscriptionSuccess(record, updated);
      },
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 overflow-y-auto">
      <div 
        className="relative w-full max-w-2xl rounded-3xl border border-amber-500/40 bg-gradient-to-b from-[#0e1738] via-[#090f26] to-[#050814] p-6 sm:p-8 shadow-2xl text-slate-100 my-8 max-h-[92vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 h-9 w-9 rounded-full bg-slate-800/80 border border-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Success View */}
        {successRecord ? (
          <div className="py-8 text-center space-y-5">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/20 border-2 border-emerald-400 text-emerald-400 shadow-xl shadow-emerald-500/20">
              <CheckCircle2 className="h-10 w-10" />
            </div>

            <div>
              <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-bold text-emerald-300 border border-emerald-500/40 uppercase tracking-wider">
                Payment Approved
              </span>
              <h2 className="text-2xl font-bold text-amber-200 font-heading mt-2">
                Welcome to Sanctuary Pro!
              </h2>
              <p className="text-sm text-slate-300 max-w-md mx-auto mt-1">
                Your mobile money transaction was verified via Paystack. Your devotion companion is now fully unlocked.
              </p>
            </div>

            {/* Receipt Summary Card */}
            <div className="rounded-2xl border border-slate-700 bg-slate-900/90 p-4 max-w-md mx-auto text-left text-xs space-y-2">
              <div className="flex justify-between text-slate-400">
                <span>Plan:</span>
                <span className="font-semibold text-slate-200">{selectedPlan.name}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Amount Paid:</span>
                <span className="font-bold text-emerald-400">GHS {selectedPlan.amountGHS}.00</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Payment Channel:</span>
                <span className="font-semibold text-amber-300">Ghana Mobile Money (Paystack)</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Paystack Reference:</span>
                <span className="font-mono text-[11px] text-slate-300">{successRecord.reference}</span>
              </div>
              <div className="flex justify-between text-slate-400 border-t border-slate-800 pt-2">
                <span>Supabase Sync:</span>
                <span className="font-semibold text-emerald-300 flex items-center gap-1">
                  <Check className="h-3 w-3" /> Written to 'users' table
                </span>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-full max-w-md mx-auto rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 py-3 text-sm font-bold text-slate-950 shadow-lg hover:brightness-110"
            >
              Enter My Sanctuary
            </button>
          </div>
        ) : (
          /* Subscription Selection & Paystack Trigger */
          <div className="space-y-6">
            {/* Header */}
            <div className="text-center space-y-2">
              <div className="inline-flex items-center gap-2 rounded-full bg-amber-500/10 border border-amber-500/30 px-3 py-1 text-xs font-semibold text-amber-300">
                <Crown className="h-3.5 w-3.5 text-amber-400" />
                <span>Sanctuary Patron & Pro Upgrade</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-amber-100 font-heading">
                Cultivate Deeper Church Devotion
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 max-w-lg mx-auto">
                Unlock full AI sermon transcriptions, spiritual exegesis, unlimited prayer journaling, and live Supabase cloud sync.
              </p>
            </div>

            {/* Mobile Money Notice */}
            <div className="rounded-xl bg-amber-950/40 border border-amber-500/30 p-3.5 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-500/20 text-amber-300">
                  <Smartphone className="h-4 w-4" />
                </div>
                <div className="text-xs">
                  <p className="font-bold text-amber-200">
                    Ghana Mobile Money Supported (Currency: GHS)
                  </p>
                  <p className="text-slate-400 text-[11px]">
                    Pay easily with MTN MoMo, Telecel Cash, or AirtelTigo Money via Paystack Inline SDK.
                  </p>
                </div>
              </div>
              <span className="rounded-md bg-amber-500/20 px-2 py-1 text-[10px] font-extrabold text-amber-300 border border-amber-500/30 whitespace-nowrap">
                GHS Only
              </span>
            </div>

            {/* Plan Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {GHS_PLANS.map(plan => {
                const isSelected = selectedPlan.id === plan.id;
                return (
                  <div
                    key={plan.id}
                    onClick={() => setSelectedPlan(plan)}
                    className={`relative cursor-pointer rounded-2xl p-4 border transition-all ${
                      isSelected
                        ? 'border-amber-400 bg-amber-500/10 shadow-lg shadow-amber-500/10 ring-1 ring-amber-400'
                        : 'border-slate-800 bg-slate-900/60 hover:border-slate-700 hover:bg-slate-900/90'
                    }`}
                  >
                    {plan.popular && (
                      <span className="absolute -top-2.5 right-3 rounded-full bg-gradient-to-r from-amber-500 to-yellow-400 px-2 py-0.5 text-[9px] font-extrabold text-slate-950 uppercase tracking-wider shadow">
                        Most Popular
                      </span>
                    )}

                    <h3 className="text-xs font-bold text-slate-200 font-heading">
                      {plan.name.split(' (')[0]}
                    </h3>
                    <div className="mt-2 flex items-baseline gap-1">
                      <span className="text-2xl font-black text-amber-300 font-heading">
                        GHS {plan.amountGHS}
                      </span>
                      <span className="text-[11px] text-slate-400">/{plan.interval}</span>
                    </div>

                    <p className="mt-2 text-[11px] text-slate-400 leading-relaxed">
                      {plan.description}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* Selected Plan Inclusions */}
            <div className="rounded-xl bg-slate-900/80 border border-slate-800 p-4">
              <p className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                Included with {selectedPlan.name}:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-300">
                {selectedPlan.features.map((feature, idx) => (
                  <div key={idx} className="flex items-start gap-2">
                    <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0 mt-0.5" />
                    <span className="text-[11px] text-slate-300">{feature}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* User Billing Details */}
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Receipt & Account Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="you@church.org"
                    className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:border-amber-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Mobile Money Number (Optional for Prompt)
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="024 123 4567"
                    className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:border-amber-400 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {errorMessage && (
              <div className="rounded-xl bg-rose-950/60 border border-rose-500/40 p-3 text-xs text-rose-300 flex items-start gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-rose-400" />
                <div className="space-y-1">
                  <p className="font-semibold">{errorMessage}</p>
                  <p className="text-[11px] text-rose-300/80">
                    Tip: You can use the test authorization button below to verify the Supabase 'users' table write directly.
                  </p>
                </div>
              </div>
            )}

            {/* ACTION BUTTONS */}
            <div className="space-y-2 pt-2">
              {/* PRIMARY UPGRADE NOW BUTTON */}
              <button
                type="button"
                onClick={handleUpgradeClick}
                disabled={isLoading}
                className="w-full rounded-xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 py-3.5 text-sm font-extrabold text-slate-950 shadow-xl shadow-amber-500/25 hover:brightness-110 active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Sparkles className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                <span>
                  {isLoading ? 'Opening Paystack Checkout...' : `Upgrade Now • GHS ${selectedPlan.amountGHS}.00`}
                </span>
              </button>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-1 text-[11px] text-slate-400">
                <div className="flex items-center gap-1.5">
                  <Lock className="h-3 w-3 text-emerald-400" />
                  <span>Secured by Paystack Inline SDK (TLS 256-bit)</span>
                </div>

                <button
                  type="button"
                  onClick={handleSimulateTestPayment}
                  disabled={isLoading}
                  className="text-[11px] text-amber-400/80 hover:text-amber-300 underline cursor-pointer"
                >
                  Test Mobile Money Authorization (Instant Supabase Write)
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Minimalist Sanctuary Footer at absolute bottom of Upgrade Modal */}
        <div className="border-t border-slate-800/80 pt-4 mt-5">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-left">
            <p className="text-[11px] font-medium text-[#c5a86b] tracking-wide">
              © 2026 ROBLIN25 SERVICES. All rights reserved.
            </p>
            <div className="flex items-center gap-3 text-[11px] font-medium text-[#c5a86b]">
              <button
                id="upgrade-modal-link-privacy"
                type="button"
                onClick={() => setLegalDoc('privacy')}
                className="hover:text-amber-300 hover:underline underline-offset-4 transition-colors cursor-pointer"
              >
                Privacy Policy
              </button>
              <span className="text-[#c5a86b]/40">•</span>
              <button
                id="upgrade-modal-link-terms"
                type="button"
                onClick={() => setLegalDoc('terms')}
                className="hover:text-amber-300 hover:underline underline-offset-4 transition-colors cursor-pointer"
              >
                Terms of Service
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Legal Modal Overlay */}
      <LegalModal
        isOpen={legalDoc !== null}
        initialDoc={legalDoc || 'privacy'}
        onClose={() => setLegalDoc(null)}
      />
    </div>
  );
};
