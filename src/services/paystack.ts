import { PaystackConfig, PaystackSuccessResponse, SubscriptionRecord, UserProfile } from '../types';
import { supabaseService } from './supabase';
import { storageService } from './storage';

declare global {
  interface Window {
    PaystackPop?: {
      setup: (config: PaystackConfig) => {
        openIframe: () => void;
      };
    };
  }
}

// Helper to fetch client-side environment variable safely
const getEnvVar = (key: string): string => {
  try {
    const metaEnv = (import.meta as any)?.env || {};
    if (metaEnv[key]) return metaEnv[key];
  } catch {}
  try {
    if (typeof window !== 'undefined' && (window as any)?.__ENV__?.[key]) {
      return (window as any).__ENV__[key];
    }
  } catch {}
  return '';
};

// Default or configured Paystack Public Key
const envPublicKey = getEnvVar('VITE_PAYSTACK_PUBLIC_KEY');
// If no key is set in environment, use a test key format
const DEFAULT_TEST_KEY = 'pk_test_a041f1737e408ecbb6e42b292723c316279f5383';

export interface PlanOption {
  id: string;
  name: string;
  amountGHS: number;
  pesewas: number;
  interval: 'month' | 'year' | 'week';
  description: string;
  features: string[];
  popular?: boolean;
}

export const GHS_PLANS: PlanOption[] = [
  {
    id: 'pro-monthly',
    name: 'Sanctuary Pro (Monthly)',
    amountGHS: 49,
    pesewas: 4900,
    interval: 'month',
    description: 'Full access to AI sermon transcription, reflection deep-dives, and cloud sync.',
    features: [
      'Unlimited AI Sermon Audio Transcriptions',
      'Advanced Exegesis & Theological Themes',
      'Unlimited Prayer Habitation & Daily Streaks',
      'Real-time Supabase Cloud Synchronization',
      'Instant Mobile Money (MTN MoMo, Telecel, AirtelTigo)',
    ],
    popular: true,
  },
  {
    id: 'patron-annual',
    name: 'Sanctuary Patron (Annual)',
    amountGHS: 399,
    pesewas: 39900,
    interval: 'year',
    description: 'Year-round devotion companion with church mission support. Save over 30%.',
    features: [
      'All Sanctuary Pro Features for 12 Months',
      'Church Archive Export (PDF & Study Guides)',
      'Direct Pastor Note Distribution',
      'VIP Priority Audio Processing',
      'Saved ~GHS 189 compared to monthly',
    ],
  },
  {
    id: 'pass-weekly',
    name: 'Retreat Pass (Weekly)',
    amountGHS: 15,
    pesewas: 1500,
    interval: 'week',
    description: 'Perfect for church conferences, conventions, and prayer revivals.',
    features: [
      '7 Days Full Pro Feature Access',
      'High-Speed Conference Recording Transcripts',
      'Conference Prayer Request Circles',
    ],
  },
];

export const paystackService = {
  cachedServerKey: '',

  async fetchServerPublicKey(): Promise<string> {
    if (this.cachedServerKey) return this.cachedServerKey;
    try {
      const res = await fetch('/api/subscription/config');
      if (res.ok) {
        const data = await res.json();
        if (data.publicKey && data.publicKey.startsWith('pk_')) {
          this.cachedServerKey = data.publicKey;
          return data.publicKey;
        }
      }
    } catch {}
    return '';
  },

  getPublicKey(): string {
    const customKey = localStorage.getItem('ritualnotes_paystack_key');
    if (customKey && customKey.trim().startsWith('pk_')) {
      return customKey.trim();
    }
    if (this.cachedServerKey && this.cachedServerKey.startsWith('pk_')) {
      return this.cachedServerKey;
    }
    const currentEnvKey = getEnvVar('VITE_PAYSTACK_PUBLIC_KEY');
    if (currentEnvKey && currentEnvKey.trim().startsWith('pk_') && !currentEnvKey.includes('xxxxxxxx')) {
      return currentEnvKey.trim();
    }
    return DEFAULT_TEST_KEY;
  },

  setCustomPublicKey(key: string) {
    if (key.trim()) {
      localStorage.setItem('ritualnotes_paystack_key', key.trim());
    } else {
      localStorage.removeItem('ritualnotes_paystack_key');
    }
  },

  isKeyConfigured(): boolean {
    const key = this.getPublicKey();
    return Boolean(key && key !== 'pk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx');
  },

  formatGHS(amount: number): string {
    return new Intl.NumberFormat('en-GH', {
      style: 'currency',
      currency: 'GHS',
      minimumFractionDigits: 2,
    }).format(amount);
  },

  /**
   * Ensures the Paystack Inline SDK script is available in the DOM
   */
  async loadScript(): Promise<boolean> {
    if (typeof window === 'undefined') return false;
    if (window.PaystackPop) return true;

    return new Promise((resolve) => {
      // Check if script already exists in document
      const existingScript = document.querySelector('script[src*="paystack.co"]');
      if (existingScript) {
        existingScript.addEventListener('load', () => resolve(true));
        // Give a small delay in case it already finished
        setTimeout(() => resolve(Boolean(window.PaystackPop)), 500);
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://js.paystack.co/v1/inline.js';
      script.async = true;
      script.onload = () => resolve(true);
      script.onerror = () => {
        console.warn('Failed to load Paystack Inline JS script dynamically');
        resolve(false);
      };
      document.head.appendChild(script);
    });
  },

  /**
   * Main Trigger: Opens the Paystack Inline JS Popup in Ghanaian Cedis (GHS)
   * Supporting Mobile Money (MTN MoMo, Telecel Cash, AirtelTigo) and Card.
   */
  async triggerPaystackPopup({
    userProfile,
    userEmail,
    plan,
    onSuccess,
    onClose,
    onError,
  }: {
    userProfile: UserProfile;
    userEmail?: string;
    plan: PlanOption;
    onSuccess: (response: PaystackSuccessResponse, record: SubscriptionRecord) => Promise<void> | void;
    onClose?: () => void;
    onError?: (errorMsg: string) => void;
  }) {
    const isLoaded = await this.loadScript();
    await this.fetchServerPublicKey();
    const effectiveKey = this.getPublicKey();

    // Fallback email: authenticated user email, profile email, or formatted sanctuary email
    const cleanEmail = (
      userEmail ||
      userProfile.email ||
      `${userProfile.name.toLowerCase().replace(/[^a-z0-9]/g, '') || 'believer'}@sanctuary.app`
    ).trim();

    const reference = `RN_GHS_${Date.now()}_${Math.floor(Math.random() * 1000000)}`;

    if (!window.PaystackPop) {
      const err = 'Paystack Inline SDK is initializing. Please check your internet connection or try again in a moment.';
      if (onError) onError(err);
      return;
    }

    try {
      const handler = window.PaystackPop.setup({
        key: effectiveKey,
        email: cleanEmail,
        amount: plan.pesewas, // Amount in pesewas for GHS
        currency: 'GHS',     // Explicitly currency 'GHS'
        ref: reference,
        channels: ['mobile_money', 'card'], // Mobile money (MTN, Telecel, AirtelTigo) + Card
        metadata: {
          custom_fields: [
            {
              display_name: 'Sanctuary Plan',
              variable_name: 'plan_name',
              value: plan.name,
            },
            {
              display_name: 'Member Name',
              variable_name: 'member_name',
              value: userProfile.name,
            },
            {
              display_name: 'Home Church',
              variable_name: 'church_name',
              value: userProfile.churchName,
            },
            {
              display_name: 'Preferred Currency',
              variable_name: 'currency',
              value: 'GHS (Ghanaian Cedis)',
            },
          ],
        },
        callback: async (response: PaystackSuccessResponse) => {
          console.log('Paystack Mobile Money Transaction Response:', response);

          const record: SubscriptionRecord = {
            userId: userProfile.id,
            email: cleanEmail,
            name: userProfile.name,
            subscriptionStatus: 'active',
            subscriptionTier: plan.id.includes('patron') ? 'patron' : 'pro',
            reference: response.reference || reference,
            amount: plan.amountGHS,
            currency: 'GHS',
            paymentChannel: 'mobile_money',
            paidAt: new Date().toISOString(),
          };

          // 1. Write subscription status directly to 'users' table in Supabase
          const supabaseResult = await supabaseService.writeUserSubscription(record);
          if (!supabaseResult.success) {
            console.warn('Notice from Supabase users table write:', supabaseResult.error);
          }

          // 2. Update local UserProfile storage
          const updatedProfile: UserProfile = {
            ...userProfile,
            email: cleanEmail,
            subscriptionStatus: 'active',
            subscriptionTier: plan.id.includes('patron') ? 'patron' : 'pro',
            subscriptionReference: response.reference || reference,
            subscriptionAmount: plan.amountGHS,
            subscriptionCurrency: 'GHS',
            subscriptionChannel: 'mobile_money',
            subscriptionPaidAt: new Date().toISOString(),
          };
          storageService.saveUserProfile(updatedProfile);

          // 3. Trigger success callback
          await onSuccess(response, record);
        },
        onClose: () => {
          console.log('Paystack payment popup closed by user');
          if (onClose) onClose();
        },
      });

      handler.openIframe();
    } catch (err: any) {
      console.error('Error opening Paystack popup:', err);
      if (onError) onError(err?.message || 'Failed to open Paystack payment modal.');
    }
  },

  /**
   * Helper simulator for environments where Paystack popups are blocked in iframes or sandboxes
   * Executes the exact same payload and direct Supabase 'users' table write.
   */
  async simulateSuccessfulMobileMoney({
    userProfile,
    userEmail,
    plan,
    onSuccess,
  }: {
    userProfile: UserProfile;
    userEmail?: string;
    plan: PlanOption;
    onSuccess: (response: PaystackSuccessResponse, record: SubscriptionRecord) => Promise<void> | void;
  }) {
    const cleanEmail = (
      userEmail ||
      userProfile.email ||
      `${userProfile.name.toLowerCase().replace(/[^a-z0-9]/g, '') || 'believer'}@sanctuary.app`
    ).trim();

    const mockRef = `RN_GHS_SIM_${Date.now()}_${Math.floor(Math.random() * 100000)}`;

    const mockResponse: PaystackSuccessResponse = {
      reference: mockRef,
      trans: `trx_${Date.now()}`,
      status: 'success',
      message: 'Approved Mobile Money GHS Transaction (Paystack SDK)',
      transaction: mockRef,
    };

    const record: SubscriptionRecord = {
      userId: userProfile.id,
      email: cleanEmail,
      name: userProfile.name,
      subscriptionStatus: 'active',
      subscriptionTier: plan.id.includes('patron') ? 'patron' : 'pro',
      reference: mockRef,
      amount: plan.amountGHS,
      currency: 'GHS',
      paymentChannel: 'mobile_money',
      paidAt: new Date().toISOString(),
    };

    // Write subscription status directly to 'users' table in Supabase
    await supabaseService.writeUserSubscription(record);

    // Update local profile
    const updatedProfile: UserProfile = {
      ...userProfile,
      email: cleanEmail,
      subscriptionStatus: 'active',
      subscriptionTier: plan.id.includes('patron') ? 'patron' : 'pro',
      subscriptionReference: mockRef,
      subscriptionAmount: plan.amountGHS,
      subscriptionCurrency: 'GHS',
      subscriptionChannel: 'mobile_money',
      subscriptionPaidAt: new Date().toISOString(),
    };
    storageService.saveUserProfile(updatedProfile);

    await onSuccess(mockResponse, record);
  },
};
