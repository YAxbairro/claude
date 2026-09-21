/* ════════════════════════════════════════════════════════════
   AS SUAS DUAS CHAVES

   Troque os dois valores abaixo pelos do seu projecto Supabase e
   guarde. É a única coisa que tem de editar à mão em todo o FleetCV.

   Onde os encontrar:
     Supabase → o seu projecto → Project Settings → API
       · Project URL        →  supabaseUrl
       · anon / public key  →  supabaseChave

   A chave "anon" é para andar à vista — é com ela que o telemóvel do
   condutor fala com a base de dados. Quem manda são as regras que
   estão dentro da base (ver supabase/esquema.sql), não esta chave.

   A OUTRA chave, a "service_role", nunca ponha aqui nem em lado
   nenhum que vá para a internet. Essa abre tudo.
   ════════════════════════════════════════════════════════════ */
window.FLEETCV_CONFIG = {
  supabaseUrl:   'https://XXXXXXXXXXXX.supabase.co',
  supabaseChave: 'COLE-AQUI-A-CHAVE-ANON'
};
