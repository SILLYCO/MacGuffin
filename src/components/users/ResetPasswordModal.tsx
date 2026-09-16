"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { KeyRound, X, AlertCircle, Eye, EyeOff, Sparkles, Check, Shield } from "lucide-react";
import { Role } from "@prisma/client";
import { RoleBadge } from "@/components/ui/RoleBadge";
import { resetUserPasswordAction } from "@/lib/actions/users";

interface ResetPasswordModalProps {
  user: {
    id: string;
    email: string;
    role: Role;
  };
  onClose: () => void;
  onSuccess: (message: string) => void;
}

export function ResetPasswordModal({ user, onClose, onSuccess }: ResetPasswordModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateSecurePassword = () => {
    const chars = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$%&*";
    let generated = "";
    for (let i = 0; i < 14; i++) {
      generated += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewPassword(generated);
    setConfirmPassword(generated);
    setShowPassword(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    const res = await resetUserPasswordAction(user.id, newPassword);
    setLoading(false);

    if (res?.error) {
      setError(res.error);
    } else {
      onSuccess(`Password for "${user.email}" was reset successfully.`);
      onClose();
    }
  };

  const passwordsMatch = newPassword.length > 0 && newPassword === confirmPassword;

  if (!mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
      <div className="bg-card border border-border shadow-2xl rounded-2xl w-full max-w-md max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-border flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 text-foreground font-bold">
            <KeyRound className="w-5 h-5 text-primary" />
            <span>Reset User Password</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1">
          {/* Target User Info Card */}
          <div className="p-3.5 rounded-xl bg-muted/40 border border-border flex items-center justify-between">
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground block">
                Target User Account
              </span>
              <span className="text-sm font-bold text-foreground block mt-0.5">
                {user.email}
              </span>
            </div>
            <RoleBadge role={user.role} />
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* New Password Input */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-foreground">
                New Password <span className="text-destructive">*</span>
              </label>
              <button
                type="button"
                onClick={generateSecurePassword}
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary hover:text-primary/80 transition-colors"
              >
                <Sparkles className="w-3 h-3" />
                Generate Secure
              </button>
            </div>

            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="At least 6 characters"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full pl-3.5 pr-10 py-2.5 text-xs font-mono bg-background border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-ring"
                required
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Confirm Password Input */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-foreground">
              Confirm New Password <span className="text-destructive">*</span>
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Re-type new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={`w-full pl-3.5 pr-10 py-2.5 text-xs font-mono bg-background border rounded-xl focus:outline-none focus:ring-2 focus:ring-ring ${
                  confirmPassword && !passwordsMatch
                    ? "border-destructive focus:ring-destructive"
                    : "border-input"
                }`}
                required
                minLength={6}
              />
              {passwordsMatch && (
                <Check className="w-4 h-4 text-emerald-500 absolute right-3 top-1/2 -translate-y-1/2" />
              )}
            </div>
            {confirmPassword && !passwordsMatch && (
              <p className="text-[11px] text-destructive">Passwords do not match.</p>
            )}
          </div>

          <div className="p-3 rounded-xl bg-primary/5 border border-primary/15 text-[11px] text-muted-foreground flex items-center gap-2">
            <Shield className="w-4 h-4 text-primary shrink-0" />
            <span>This password change will be recorded in the system audit trail.</span>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-muted-foreground hover:text-foreground"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !newPassword || !passwordsMatch}
              className="px-5 py-2 text-xs font-bold text-primary-foreground bg-primary rounded-xl hover:bg-primary/90 disabled:opacity-50 transition-all shadow-md shadow-primary/20"
            >
              {loading ? "Updating..." : "Save New Password"}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
