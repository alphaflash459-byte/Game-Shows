/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type SubscriptionTier = 'daily' | 'monthly' | 'yearly';

export interface Subscription {
  active: boolean;
  tier: SubscriptionTier | null;
  startDate: string | null;
  expiryDate: string | null;
  autoRenew: boolean;
  paymentMethod: 'aba' | 'acleda' | 'wing' | 'card' | null;
}

export interface Transaction {
  id: string;
  date: string;
  tier: SubscriptionTier;
  amount: number;
  currency: 'USD' | 'KHR';
  paymentMethod: string;
  status: 'SUCCESS' | 'PENDING' | 'FAILED';
  autoPaid: boolean;
}

export interface GameStats {
  tictactoe: {
    wins: number;
    losses: number;
    draws: number;
  };
  chess: {
    wins: number;
    losses: number;
    draws: number;
  };
}
