import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Clock } from 'lucide-react';

export function TrialBanner() {
  const navigate = useNavigate();
  const { subscription, daysLeft } = useSubscription();
  const { t } = useLanguage();

  if (subscription?.plan_type !== 'trial' || !daysLeft || daysLeft <= 0) {
    return null;
  }

  return (
    <Alert className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800 mb-6">
      <Clock className="h-4 w-4" />
      <AlertDescription className="flex items-center justify-between">
        <span>
          🎁 {t('subscription.trialMessage')}: <strong>{daysLeft} {t('subscription.trialDaysLeft')}</strong>
        </span>
        <Button variant="outline" size="sm" onClick={() => navigate('/configuracoes')}>
          {t('subscription.upgradeCTA')}
        </Button>
      </AlertDescription>
    </Alert>
  );
}
