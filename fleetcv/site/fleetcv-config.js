/* ════════════════════════════════════════════════════════════
   AS DUAS CHAVES DESTA FROTA

   Projecto Supabase: fleetcv  ·  região eu-west-1 (Irlanda, a mais
   perto de Cabo Verde das que há).

   A chave "publishable" é para andar à vista — é com ela que o
   telemóvel do condutor fala com a base de dados. Quem manda são as
   regras que estão dentro da base (ver supabase/esquema.sql), não
   esta chave. Se algum dia um telemóvel se perder, troca-se esta
   chave no Supabase e mais nada.

   A OUTRA chave, a "service_role", nunca ponha aqui nem em lado
   nenhum que vá para a internet. Essa abre tudo.
   ════════════════════════════════════════════════════════════ */
window.FLEETCV_CONFIG = {
  supabaseUrl:   'https://jhjtjjyplihabowxkfhs.supabase.co',
  supabaseChave: 'sb_publishable_wYOl-KJg755TF38iEkq5jA_1K6f1N_R'
};
