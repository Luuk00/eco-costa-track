import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CreditCard, Globe, User, Building2 } from 'lucide-react';

export default function Configuracoes() {
  const { user, profile } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const queryClient = useQueryClient();
  const [nome, setNome] = useState(profile?.nome || '');
  const [nomePersonalizado, setNomePersonalizado] = useState('');

  const { data: subscription } = useQuery({
    queryKey: ['subscription', user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user?.id)
        .maybeSingle();
      return data;
    },
    enabled: !!user,
  });

  const { data: empresa } = useQuery({
    queryKey: ['empresa', profile?.empresa_id],
    queryFn: async () => {
      const { data } = await supabase
        .from('empresas')
        .select('*')
        .eq('id', profile?.empresa_id)
        .maybeSingle();
      return data;
    },
    enabled: !!profile?.empresa_id,
  });

  useEffect(() => {
    if (empresa) {
      setNomePersonalizado(empresa.nome_personalizado || '');
    }
  }, [empresa]);

  useEffect(() => {
    if (profile) {
      setNome(profile.nome || '');
    }
  }, [profile]);

  const updateNomeMutation = useMutation({
    mutationFn: async (novoNome: string) => {
      const { error } = await supabase
        .from('profiles')
        .update({ nome: novoNome })
        .eq('id', user?.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(t('settings.saveSuccess'));
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });

  const updateEmpresaMutation = useMutation({
    mutationFn: async (nomePersonalizado: string) => {
      const { error } = await supabase
        .from('empresas')
        .update({ nome_personalizado: nomePersonalizado })
        .eq('id', profile?.empresa_id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(t('settings.companySaveSuccess'));
      queryClient.invalidateQueries({ queryKey: ['empresa'] });
    },
  });

  const handleSaveNome = () => {
    if (nome.trim().length < 3) {
      toast.error(t('settings.nameMinLength'));
      return;
    }
    updateNomeMutation.mutate(nome);
  };

  const handleSaveEmpresa = () => {
    updateEmpresaMutation.mutate(nomePersonalizado);
  };

  const getSubscriptionBadge = () => {
    if (!subscription) return null;
    
    const badges = {
      trial: { label: t('subscription.trial'), variant: 'secondary' as const },
      monthly: { label: t('subscription.monthly'), variant: 'default' as const },
      annual: { label: t('subscription.annual'), variant: 'default' as const },
    };

    const badge = badges[subscription.plan_type as keyof typeof badges];
    return badge ? <Badge variant={badge.variant}>{badge.label}</Badge> : null;
  };

  const getTrialDaysLeft = () => {
    if (subscription?.plan_type !== 'trial' || !subscription.trial_ends_at) return null;
    const daysLeft = Math.ceil(
      (new Date(subscription.trial_ends_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );
    return daysLeft > 0 ? daysLeft : 0;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{t('settings.title')}</h1>
        <p className="text-muted-foreground">{t('settings.description')}</p>
      </div>

      <Tabs defaultValue="account" className="space-y-6">
        <TabsList>
          <TabsTrigger value="account">
            <User className="mr-2 h-4 w-4" />
            {t('settings.account')}
          </TabsTrigger>
          <TabsTrigger value="company">
            <Building2 className="mr-2 h-4 w-4" />
            {t('settings.company')}
          </TabsTrigger>
          <TabsTrigger value="plan">
            <CreditCard className="mr-2 h-4 w-4" />
            {t('settings.plan')}
          </TabsTrigger>
          <TabsTrigger value="language">
            <Globe className="mr-2 h-4 w-4" />
            {t('settings.language')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="account">
          <Card>
            <CardHeader>
              <CardTitle>{t('settings.personalData')}</CardTitle>
              <CardDescription>{t('settings.personalDataDescription')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">{t('auth.email')}</Label>
                <Input id="email" value={user?.email || ''} disabled />
              </div>
              <div className="space-y-2">
                <Label htmlFor="nome">{t('auth.name')}</Label>
                <Input
                  id="nome"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder={t('settings.namePlaceholder')}
                />
              </div>
              <Button onClick={handleSaveNome} disabled={updateNomeMutation.isPending}>
                {updateNomeMutation.isPending ? t('common.saving') : t('common.save')}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="company">
          <Card>
            <CardHeader>
              <CardTitle>{t('settings.companySettings')}</CardTitle>
              <CardDescription>{t('settings.companyDescription')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="empresa-nome">{t('settings.companyName')}</Label>
                <Input id="empresa-nome" value={empresa?.nome || ''} disabled />
              </div>
              <div className="space-y-2">
                <Label htmlFor="nome-personalizado">{t('settings.customCompanyName')}</Label>
                <Input
                  id="nome-personalizado"
                  value={nomePersonalizado}
                  onChange={(e) => setNomePersonalizado(e.target.value)}
                  placeholder={t('settings.customCompanyPlaceholder')}
                />
                <p className="text-sm text-muted-foreground">
                  {t('settings.customCompanyHint')}
                </p>
              </div>
              <Button onClick={handleSaveEmpresa} disabled={updateEmpresaMutation.isPending}>
                {updateEmpresaMutation.isPending ? t('common.saving') : t('common.save')}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="plan">
          <Card>
            <CardHeader>
              <CardTitle>{t('settings.currentPlan')}</CardTitle>
              <CardDescription>{t('settings.planDescription')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{t('subscription.currentPlan')}</p>
                  <p className="text-sm text-muted-foreground">{user?.email}</p>
                </div>
                {getSubscriptionBadge()}
              </div>

              {subscription?.plan_type === 'trial' && (
                <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
                  <p className="text-sm font-medium">
                    🎁 {getTrialDaysLeft()} {t('subscription.trialDaysLeft')}
                  </p>
                </div>
              )}

              <Separator />

              <div className="space-y-4">
                <h3 className="font-semibold">{t('subscription.upgradePlans')}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>{t('subscription.monthly')}</CardTitle>
                      <CardDescription className="text-2xl font-bold">
                        {t('subscription.monthlyPrice')}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button className="w-full" disabled>
                        {t('subscription.subscribe')}
                      </Button>
                      <p className="text-xs text-muted-foreground mt-2 text-center">
                        {t('subscription.comingSoon')}
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="border-primary">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle>{t('subscription.annual')}</CardTitle>
                        <Badge variant="default">{t('subscription.save17')}</Badge>
                      </div>
                      <CardDescription className="text-2xl font-bold">
                        {t('subscription.annualPrice')}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button className="w-full" disabled>
                        {t('subscription.subscribe')}
                      </Button>
                      <p className="text-xs text-muted-foreground mt-2 text-center">
                        {t('subscription.comingSoon')}
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="language">
          <Card>
            <CardHeader>
              <CardTitle>{t('settings.language')}</CardTitle>
              <CardDescription>{t('settings.languageDescription')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Select value={language} onValueChange={(val) => setLanguage(val as any)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pt-BR">🇧🇷 Português (Brasil)</SelectItem>
                  <SelectItem value="en-US">🇺🇸 English (US)</SelectItem>
                  <SelectItem value="es-ES">🇪🇸 Español (España)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                {t('settings.languageHint')}
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
