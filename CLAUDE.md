# Regras de poupança de tokens

- Respostas curtas e diretas; sem resumos repetidos do que já foi feito.
- Não reler ficheiros já lidos nesta conversa; ler só o intervalo necessário (offset/limit).
- Pesquisar com Grep/Glob antes de abrir ficheiros inteiros; limitar resultados (head_limit).
- Nunca abrir vídeos, `output_videos/`, `temp/`, `venv/` ou logs grandes.
- Comandos com output grande: filtrar com `| tail -n 40`, `| head`, `grep`, ou usar `rtk <cmd>` se instalado.
- Não lançar subagentes salvo pedido explícito.
- Ao mudar de tarefa, o utilizador deve usar `/clear`; em conversas longas, `/compact`.
