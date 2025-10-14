import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { record } = await req.json();
    const userId = record.id;
    const email = record.email;
    const nome = record.raw_user_meta_data?.nome || email;

    console.log('Processing signup for user:', userId);

    // 1. Criar empresa
    const { data: empresa, error: empresaError } = await supabase
      .from('empresas')
      .insert({
        nome: `Empresa ${email}`,
        nome_personalizado: null,
      })
      .select()
      .single();

    if (empresaError) throw empresaError;

    // 2. Atualizar profile
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ empresa_id: empresa.id })
      .eq('id', userId);

    if (profileError) throw profileError;

    // 3. Criar subscription trial
    const { error: subscriptionError } = await supabase
      .from('subscriptions')
      .insert({
        user_id: userId,
        empresa_id: empresa.id,
        plan_type: 'trial',
        status: 'active',
        trial_ends_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      });

    if (subscriptionError) throw subscriptionError;

    // 4. Criar role 'colaborador' (usuário normal)
    const { error: roleError } = await supabase
      .from('user_roles')
      .insert({
        user_id: userId,
        role: 'colaborador',
      });

    if (roleError) throw roleError;

    // 5. Criar preferências padrão
    const { error: prefError } = await supabase
      .from('user_preferences')
      .insert({
        user_id: userId,
        language: 'pt-BR',
      });

    if (prefError) throw prefError;

    console.log('Signup completed successfully for user:', userId);

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in handle-signup:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
