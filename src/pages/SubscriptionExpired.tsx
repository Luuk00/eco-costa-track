import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

export default function SubscriptionExpired() {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-4xl">
        <CardHeader className="text-center space-y-4">
          <CardTitle className="text-3xl">{t('subscription.expired')}</CardTitle>
          <CardDescription className="text-lg">
            {t('subscription.expiredMessage')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="border-2">
              <CardHeader>
                <CardTitle>{t('subscription.monthly')}</CardTitle>
                <div className="text-3xl font-bold">{t('subscription.monthlyPrice')}</div>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-2">
                  <li className="flex items-center">
                    <Check className="mr-2 h-4 w-4 text-green-600" />
                    {t('subscription.feature1')}
                  </li>
                  <li className="flex items-center">
                    <Check className="mr-2 h-4 w-4 text-green-600" />
                    {t('subscription.feature2')}
                  </li>
                  <li className="flex items-center">
                    <Check className="mr-2 h-4 w-4 text-green-600" />
                    {t('subscription.feature3')}
                  </li>
                </ul>
                <Button className="w-full" size="lg" disabled>
                  {t('subscription.subscribe')}
                </Button>
                <p className="text-xs text-center text-muted-foreground">
                  {t('subscription.comingSoon')}
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 border-primary relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <Badge className="text-sm">{t('subscription.bestValue')}</Badge>
              </div>
              <CardHeader>
                <CardTitle>{t('subscription.annual')}</CardTitle>
                <div className="text-3xl font-bold">{t('subscription.annualPrice')}</div>
                <p className="text-sm text-muted-foreground">{t('subscription.save17')}</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-2">
                  <li className="flex items-center">
                    <Check className="mr-2 h-4 w-4 text-green-600" />
                    {t('subscription.feature1')}
                  </li>
                  <li className="flex items-center">
                    <Check className="mr-2 h-4 w-4 text-green-600" />
                    {t('subscription.feature2')}
                  </li>
                  <li className="flex items-center">
                    <Check className="mr-2 h-4 w-4 text-green-600" />
                    {t('subscription.feature3')}
                  </li>
                  <li className="flex items-center">
                    <Check className="mr-2 h-4 w-4 text-green-600" />
                    {t('subscription.feature4')}
                  </li>
                </ul>
                <Button className="w-full" size="lg" variant="default" disabled>
                  {t('subscription.subscribe')}
                </Button>
                <p className="text-xs text-center text-muted-foreground">
                  {t('subscription.comingSoon')}
                </p>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
