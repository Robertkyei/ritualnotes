import React from 'react';
import { LegalDocType } from './LegalModal';

interface FooterProps {
  onOpenLegal: (docType: LegalDocType) => void;
  className?: string;
}

export const Footer: React.FC<FooterProps> = ({ onOpenLegal, className = '' }) => {
  return (
    <footer
      id="app-legal-footer"
      className={`w-full py-6 border-t border-slate-800/80 mt-10 transition-colors ${className}`}
    >
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
        {/* Muted gold copyright note */}
        <p className="text-xs font-medium text-[#c5a86b] tracking-wide">
          © 2026 ROBLIN25 SERVICES. All rights reserved.
        </p>

        {/* Clickable Legal Route Links */}
        <div className="flex items-center gap-4 text-xs font-medium text-[#c5a86b]">
          <button
            id="footer-link-privacy"
            type="button"
            onClick={() => onOpenLegal('privacy')}
            className="hover:text-amber-300 hover:underline underline-offset-4 transition-colors cursor-pointer focus:outline-none"
          >
            Privacy Policy
          </button>
          <span className="text-[#c5a86b]/40">•</span>
          <button
            id="footer-link-terms"
            type="button"
            onClick={() => onOpenLegal('terms')}
            className="hover:text-amber-300 hover:underline underline-offset-4 transition-colors cursor-pointer focus:outline-none"
          >
            Terms of Service
          </button>
        </div>
      </div>
    </footer>
  );
};
