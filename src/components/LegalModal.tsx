import React, { useState, useEffect } from 'react';
import { X, ShieldCheck, FileText, Lock, Scale, Building2, CheckCircle2 } from 'lucide-react';

export type LegalDocType = 'privacy' | 'terms';

interface LegalModalProps {
  isOpen: boolean;
  initialDoc?: LegalDocType;
  onClose: () => void;
}

export const LegalModal: React.FC<LegalModalProps> = ({
  isOpen,
  initialDoc = 'privacy',
  onClose,
}) => {
  const [activeDoc, setActiveDoc] = useState<LegalDocType>(initialDoc);

  useEffect(() => {
    if (isOpen && initialDoc) {
      setActiveDoc(initialDoc);
    }
  }, [isOpen, initialDoc]);

  if (!isOpen) return null;

  return (
    <div
      id="legal-modal-overlay"
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 sm:p-6 transition-opacity animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        id="legal-modal-container"
        className="relative w-full max-w-3xl max-h-[90vh] flex flex-col rounded-3xl border border-amber-500/30 bg-[#0a1128] text-slate-100 shadow-2xl shadow-black/80 overflow-hidden"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-800 bg-[#070c1e] px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              {activeDoc === 'privacy' ? (
                <ShieldCheck className="h-5 w-5" />
              ) : (
                <Scale className="h-5 w-5" />
              )}
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-100 font-heading">
                {activeDoc === 'privacy' ? 'Privacy Policy' : 'Terms of Service'}
              </h2>
              <p className="text-[11px] text-amber-300/70 flex items-center gap-1.5 font-medium">
                <Building2 className="h-3 w-3" />
                <span>ROBLIN25 SERVICES • Sanctuary Legal Framework</span>
              </p>
            </div>
          </div>

          {/* Simple Gold Close Button at top right */}
          <div className="flex items-center gap-2">
            <button
              id="legal-modal-close-btn"
              type="button"
              onClick={onClose}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-amber-400/50 bg-amber-500/10 hover:bg-amber-500/20 text-xs font-semibold text-amber-300 hover:text-amber-200 transition-all cursor-pointer active:scale-95 shadow-sm"
              aria-label="Close legal modal"
            >
              <span>Close</span>
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-800 bg-[#080e22] px-6 pt-2">
          <button
            id="tab-privacy-policy"
            type="button"
            onClick={() => setActiveDoc('privacy')}
            className={`flex items-center gap-2 pb-2.5 px-3 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
              activeDoc === 'privacy'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>Privacy Policy</span>
          </button>
          <button
            id="tab-terms-of-service"
            type="button"
            onClick={() => setActiveDoc('terms')}
            className={`flex items-center gap-2 pb-2.5 px-3 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
              activeDoc === 'terms'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileText className="h-3.5 w-3.5" />
            <span>Terms of Service</span>
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6 text-xs sm:text-sm text-slate-300 leading-relaxed font-sans scrollbar-thin scrollbar-thumb-amber-500/20">
          {activeDoc === 'privacy' ? (
            <div className="space-y-6">
              <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4 text-xs text-amber-200/90 flex items-start gap-3">
                <Lock className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-amber-300 mb-0.5">
                    Spiritual Sanctuary & Privacy Commitment
                  </p>
                  <p className="text-[11px] text-amber-200/80">
                    Your prayer records, sermon reflections, and audio files represent intimate, personal spiritual journeys. ROBLIN25 SERVICES enforces strict data isolation and privacy protection protocols.
                  </p>
                </div>
              </div>

              <div>
                <p className="text-[11px] text-slate-400 mb-1 font-semibold uppercase tracking-wider">
                  Effective Date: January 1, 2026 • Last Revised: 2026
                </p>
                <h3 className="text-base font-bold text-slate-100 font-heading">
                  1. Information We Collect
                </h3>
                <p className="mt-2 text-slate-300">
                  When you access or use <strong>RitualNotes</strong> (operated by <strong>ROBLIN25 SERVICES</strong>), we collect the following categories of information:
                </p>
                <ul className="list-disc pl-5 mt-2 space-y-1.5 text-slate-300">
                  <li>
                    <strong className="text-slate-200">Account Credentials:</strong> Name, email address, and profile preferences saved during onboarding or authenticated sessions.
                  </li>
                  <li>
                    <strong className="text-slate-200">User-Authored Devotional Content:</strong> Recorded sermon logs, sermon titles, church denominations, theological summaries, prayer requests, reflection notes, and habit streak counters.
                  </li>
                  <li>
                    <strong className="text-slate-200">Audio Stream Data:</strong> Microphone streams captured during sermon recording sessions to generate live transcriptions and AI-distilled sermon notes.
                  </li>
                  <li>
                    <strong className="text-slate-200">Billing & Transaction Metadata:</strong> When subscribing via Paystack, transaction references, billing currency (GHS), and payment channels (e.g. MTN MoMo, Telecel Cash) are logged. <em>ROBLIN25 SERVICES does not store raw credit card numbers or Mobile Money PINs.</em>
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="text-base font-bold text-slate-100 font-heading">
                  2. How We Use Your Data
                </h3>
                <p className="mt-2 text-slate-300">
                  ROBLIN25 SERVICES processes your information strictly for the following functional purposes:
                </p>
                <ul className="list-disc pl-5 mt-2 space-y-1.5 text-slate-300">
                  <li>To provide real-time audio recording, sermon playback, and AI theological distillation.</li>
                  <li>To persist sermon notes and prayer petitions in high-availability cloud storage (Supabase).</li>
                  <li>To verify active subscription entitlements (Sanctuary Pro, Sanctuary Patron) via Paystack.</li>
                  <li>To synchronize habit streaks and spiritual growth analytics across your devices.</li>
                </ul>
              </div>

              <div>
                <h3 className="text-base font-bold text-slate-100 font-heading">
                  3. Artificial Intelligence Processing
                </h3>
                <p className="mt-2 text-slate-300">
                  AI-assisted features (such as sermon structuring, biblical cross-referencing, and prayer assistance) are executed through isolated server-side API pipelines. Your private reflections and audio transcripts are <strong>never sold, shared with data brokers, or used to train public generative AI foundation models</strong>.
                </p>
              </div>

              <div>
                <h3 className="text-base font-bold text-slate-100 font-heading">
                  4. Data Security & Cloud Infrastructure
                </h3>
                <p className="mt-2 text-slate-300">
                  All transmissions are encrypted via industry-standard TLS 256-bit cryptography. Data stored in our database is safeguarded by strict row-level security policies and authentication guardrails.
                </p>
              </div>

              <div>
                <h3 className="text-base font-bold text-slate-100 font-heading">
                  5. User Rights & Data Deletion
                </h3>
                <p className="mt-2 text-slate-300">
                  You maintain unconditional ownership of your spiritual journals and sermon notes. You may export or permanently delete your sermons, prayer items, and profile at any time directly through the Profile & Sanctuary settings.
                </p>
              </div>

              <div>
                <h3 className="text-base font-bold text-slate-100 font-heading">
                  6. Contact ROBLIN25 SERVICES
                </h3>
                <p className="mt-2 text-slate-300">
                  If you have questions regarding this Privacy Policy or wish to make an inquiry, please contact our data governance office at <span className="text-amber-300 font-medium">legal@roblin25.com</span> or via support channels in RitualNotes.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4 text-xs text-amber-200/90 flex items-start gap-3">
                <CheckCircle2 className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-amber-300 mb-0.5">
                    Terms & Conditions of Service
                  </p>
                  <p className="text-[11px] text-amber-200/80">
                    Welcome to RitualNotes, provided by ROBLIN25 SERVICES. By using our website, recording tools, and AI notebooks, you agree to the terms below.
                  </p>
                </div>
              </div>

              <div>
                <p className="text-[11px] text-slate-400 mb-1 font-semibold uppercase tracking-wider">
                  Effective Date: January 1, 2026 • ROBLIN25 SERVICES
                </p>
                <h3 className="text-base font-bold text-slate-100 font-heading">
                  1. Acceptance of Terms
                </h3>
                <p className="mt-2 text-slate-300">
                  By accessing, creating an account on, or interacting with <strong>RitualNotes</strong>, you confirm that you have read, understood, and agreed to be legally bound by these Terms of Service. If you do not agree to these terms, please do not use the service.
                </p>
              </div>

              <div>
                <h3 className="text-base font-bold text-slate-100 font-heading">
                  2. Description of Sanctuary Services
                </h3>
                <p className="mt-2 text-slate-300">
                  RitualNotes provides digital church companion tools, including live sermon audio documentation, AI theological synthesis, personal prayer tracking, and cloud journal synchronization.
                </p>
              </div>

              <div>
                <h3 className="text-base font-bold text-slate-100 font-heading">
                  3. Sanctuary Etiquette & Recording Consent
                </h3>
                <p className="mt-2 text-slate-300">
                  When using audio recording features during church services, conferences, or congregational meetings, you agree to respect sanctuary etiquette and ensure compliance with all applicable local recording consent laws and church policies. ROBLIN25 SERVICES is not liable for unauthorized audio capture by end users.
                </p>
              </div>

              <div>
                <h3 className="text-base font-bold text-slate-100 font-heading">
                  4. Subscriptions, Payments & Mobile Money
                </h3>
                <p className="mt-2 text-slate-300">
                  RitualNotes offers paid subscription tiers (including Sanctuary Pro, Sanctuary Patron, and Retreat Passes). All transactions are processed in Ghanaian Cedis (GHS) through our certified payment partner, Paystack.
                </p>
                <ul className="list-disc pl-5 mt-2 space-y-1.5 text-slate-300">
                  <li>Payment options include Ghana Mobile Money (MTN MoMo, Telecel Cash, AirtelTigo Money) and debit/credit cards.</li>
                  <li>Subscriptions grant full access to extended AI sermon structuring, cloud audio storage, and priority theological processing.</li>
                  <li>You may cancel recurring subscriptions at any time through your Profile dashboard. Access remains active through the current billing period.</li>
                </ul>
              </div>

              <div>
                <h3 className="text-base font-bold text-slate-100 font-heading">
                  5. Intellectual Property
                </h3>
                <p className="mt-2 text-slate-300">
                  All branding, user interface designs, custom iconography, software code, and systems associated with RitualNotes are the intellectual property of <strong>ROBLIN25 SERVICES</strong>. However, <strong>you retain 100% intellectual property ownership</strong> over your personal reflections, custom sermon notes, and prayer journal entries.
                </p>
              </div>

              <div>
                <h3 className="text-base font-bold text-slate-100 font-heading">
                  6. Theological AI Disclaimer
                </h3>
                <p className="mt-2 text-slate-300">
                  AI-generated sermon notes, scripture cross-references, and reflections are designed for devotional enrichment and personal study. They are not intended to replace pastoral guidance, canonical theological authority, or personal scripture discernment.
                </p>
              </div>

              <div>
                <h3 className="text-base font-bold text-slate-100 font-heading">
                  7. Governing Law
                </h3>
                <p className="mt-2 text-slate-300">
                  These Terms of Service shall be governed by and construed in accordance with the laws governing commercial software services operated by ROBLIN25 SERVICES.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-800 bg-[#070c1e] px-6 py-3.5 text-xs text-slate-400">
          <p className="text-[11px] text-amber-300/80 font-medium">
            © 2026 ROBLIN25 SERVICES. All rights reserved.
          </p>
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 font-bold text-xs hover:brightness-110 active:scale-95 transition-all shadow-md shadow-amber-500/20 cursor-pointer"
          >
            I Understand & Close
          </button>
        </div>
      </div>
    </div>
  );
};
