import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';

interface Subscription {
  id: string;
  plan_type: string;
  status: string;
  trial_ends_at: string | null;
  subscription_ends_at: string | null;
}

interface SubscriptionContextType {
  subscription: Subscription | null;
  isActive: boolean;
  daysLeft: number | null;
  loading: boolean;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const { user, role } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    if (role === 'admin') {
      setLoading(false);
      return;
    }

    const fetchSubscription = async () => {
      const { data } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      setSubscription(data);
      setLoading(false);

      if (data) {
        const now = new Date();
        const isExpired =
          (data.plan_type === 'trial' && data.trial_ends_at && new Date(data.trial_ends_at) < now) ||
          (data.subscription_ends_at && new Date(data.subscription_ends_at) < now) ||
          data.status === 'expired' ||
          data.status === 'cancelled';

        if (isExpired && location.pathname !== '/subscription-expired' && location.pathname !== '/auth') {
          navigate('/subscription-expired');
        }
      }
    };

    fetchSubscription();
  }, [user, role, navigate, location.pathname]);

  const isActive = () => {
    if (!subscription) return false;
    const now = new Date();

    if (subscription.plan_type === 'trial' && subscription.trial_ends_at) {
      return new Date(subscription.trial_ends_at) > now;
    }

    if (subscription.subscription_ends_at) {
      return new Date(subscription.subscription_ends_at) > now;
    }

    return subscription.status === 'active';
  };

  const daysLeft = () => {
    if (!subscription) return null;
    const now = new Date();

    if (subscription.plan_type === 'trial' && subscription.trial_ends_at) {
      const diff = new Date(subscription.trial_ends_at).getTime() - now.getTime();
      const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
      return days > 0 ? days : 0;
    }

    return null;
  };

  return (
    <SubscriptionContext.Provider
      value={{
        subscription,
        isActive: isActive(),
        daysLeft: daysLeft(),
        loading,
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  const context = useContext(SubscriptionContext);
  if (!context) {
    throw new Error('useSubscription must be used within SubscriptionProvider');
  }
  return context;
}
