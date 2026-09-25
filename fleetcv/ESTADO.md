# Onde isto está, em 25 de Setembro de 2026

Escrito para quem pegar nisto a seguir — inclusive eu, noutra sessão.

## A funcionar, agora

| | |
|---|---|
| **Site** | https://fleetcv-up1b.vercel.app |
| **Base de dados** | Supabase, projecto `fleetcv`, `jhjtjjyplihabowxkfhs`, eu-west-1 |
| **Código** | `Afroberd/fleetcv` (privado) — é daqui que o Vercel publica |
| **Histórico e spec** | `YAxbairro/claude`, ramo `claude/eager-turing-11lp6h` |
| **Conta do proprietário** | `yanickdrs@gmail.com` — o código foi dado em privado, não está em ficheiro nenhum |

O GPS funciona, a entrada anónima está ligada, as regras da base estão
aplicadas e provadas. Um turno verdadeiro já correu de ponta a ponta:
29,6 km gravados por GPS e um abastecimento de 2.000 CVE.

## O nó que ficou por desatar

O Vercel publica a partir de `Afroberd/fleetcv`. A sessão em que isto foi
feito só tinha acesso a `YAxbairro/fleetcv` (entretanto apagado), e não
conseguia anexar o outro por choque de nomes. Resultado: quem estiver
nessa sessão não consegue fazer chegar melhorias ao site.

**A saída é uma linha:** abrir uma sessão nova com `Afroberd/fleetcv`
como repositório. A partir daí é enviar, e o Vercel publica sozinho em
dois minutos.

Caminhos que se experimentaram e não servem, para ninguém os repetir:

- **Ligar o Vercel ao `YAxbairro/fleetcv`** — o Vercel está ligado ao
  GitHub pela conta *Afroberd* e o seletor de contas não mostra contas
  pessoais de terceiros. O «Add GitHub Scope» só junta organizações.
- **Criar projectos no Vercel pela API** — 403, o conector é só de leitura
  para isso. Publicar num projecto que já existe, esse é permitido.
- **Enviar os ficheiros pela API** — permitido, e o `upload_file` funciona;
  mas o `index.html` tem 268 kB e não cabe numa chamada.
- **O CLI do Vercel** — precisa de uma chave que a sessão não tem.

## O que falta fazer

1. **Ligar as melhorias ao site** — sessão nova com `Afroberd/fleetcv`.
2. **Dar ao proprietário como mudar o próprio código** dentro da
   aplicação. Hoje só se muda por SQL, e é a palavra-passe dele.
3. **Vigiar no piloto:** o ecrã que apaga (o navegador pára de gravar o
   caminho), e o projecto gratuito do Supabase que adormece ao fim de
   uns sete dias sem uso.
4. **Quando crescer:** as fotografias saem da tabela para o armazenamento
   do Supabase, e o tempo real tem tecto no plano gratuito por volta dos
   cinco condutores.

## Uma regra aprendida à força

Códigos e palavras-passe não entram em ficheiro nenhum que vá para o
GitHub. Aconteceu duas vezes no mesmo dia — no guia de instalação e nos
ficheiros de prova. O que resolve é trocar a senha, não apagar o
histórico.
