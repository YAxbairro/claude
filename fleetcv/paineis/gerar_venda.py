# -*- coding: utf-8 -*-
"""As páginas de venda das instituições e do rent-a-car.

Saem da página principal (index.html): o mesmo cabeçalho, as mesmas
cores e letras, o mesmo rodapé — só o miolo muda. Correr de novo
depois de mexer no index.html:   python3 paineis/gerar_venda.py
"""
import io, os, re

AQUI = os.path.dirname(os.path.abspath(__file__))
SITE = os.path.join(os.path.dirname(AQUI), 'site')
idx = io.open(os.path.join(SITE, 'index.html'), encoding='utf-8').read()

cabeca = idx[:idx.index('<header class="topo">')]
cabeca = re.sub(r'<script>.*?</script>\n', '', cabeca, count=1, flags=re.S)  # o salto para /app é só da principal
rodape = idx[idx.index('<footer>'):]

V = ('<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" '
     'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg>')
IC = {
 'guia': '<path d="M7 3h10v18H7z"/><path d="M10 8h4M10 12h4M10 16h2"/>',
 'relogio': '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
 'zona': '<circle cx="12" cy="12" r="9" stroke-dasharray="3 3"/><circle cx="12" cy="12" r="2"/>',
 'deps': '<path d="M4 20V9l8-5 8 5v11"/><path d="M9 20v-6h6v6"/>',
 'docs': '<path d="M6 3h9l3 3v15H6z"/><path d="M9 12l2 2 4-4"/>',
 'excel': '<path d="M4 4h16v16H4z"/><path d="M4 10h16M10 4v16"/>',
 'foto': '<path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/>',
 'conta': '<path d="M6 3v18l2-1.3 2 1.3 2-1.3 2 1.3 2-1.3 2 1.3V3l-2 1.3-2-1.3-2 1.3-2-1.3-2 1.3z"/><path d="M9.5 9h5M9.5 13h5"/>',
 'atraso': '<circle cx="12" cy="13" r="8"/><path d="M12 9v4M12 16.5v.01M9 2h6"/>',
 'carros': '<path d="M5 16l1.5-5h11L19 16"/><path d="M4 16h16v3H4z"/><circle cx="8" cy="19" r="1"/><circle cx="16" cy="19" r="1"/>',
}
def icone(n):
    return ('<span class="ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" '
            'stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'
            + IC[n] + '</svg></span>')

def pagina(d):
    h = cabeca
    h = re.sub(r'<meta name="description" content="[^"]*">',
               '<meta name="description" content="%s">' % d['descricao'], h)
    h = h.replace('<title>FleetCV</title>', '<title>%s</title>' % d['titulo'])
    h += ('<header class="topo">\n  <div class="env">\n'
          '    <a class="marca" href="/" style="text-decoration:none"><span class="pt"></span>FleetCV</a>\n'
          '    <nav>\n      <a href="#como" class="esconde">Como funciona</a>\n'
          '      <a href="#planos" class="esconde">Preços</a>\n'
          '      <a href="/app#dono">Entrar</a>\n'
          '      <a class="bt pri" href="/app#criar-%s">Criar conta</a>\n    </nav>\n  </div>\n</header>\n' % d['tipo'])
    h += d['miolo']
    h += rodape
    return h

def provas(itens):
    return '<div class="provas">' + ''.join(
        '<div class="prova">%s<h3>%s</h3><p>%s</p></div>' % (icone(i), t, p) for i, t, p in itens) + '</div>'

def passos(itens):
    return '<div class="passos">' + ''.join(
        '<div class="passo"><span class="n"></span><h3>%s</h3><p>%s</p></div>' % x for x in itens) + '</div>'

def perguntas(itens):
    return '<div class="perg">' + ''.join(
        '<details%s><summary>%s</summary><p class="resp">%s</p></details>' % (' open' if i == 0 else '', q, r)
        for i, (q, r) in enumerate(itens)) + '</div>'

def ficha(chapa, quem, quando, linhas, n, t):
    return ('<div class="ficha"><div class="cab"><span class="chapa">%s</span><span class="qm">%s</span>'
            '<span class="qd">%s</span></div><div class="linhas">' % (chapa, quem, quando) +
            ''.join('<div class="lh"><span class="r">%s</span><span class="v">%s</span></div>' % l for l in linhas) +
            '</div><div class="alerta"><span class="n">%s</span><span class="t">%s</span></div></div>' % (n, t))

def planos(tipo, nome_meio, quem):
    return ('<section class="risca" id="planos"><div class="env"><div class="cabec">'
      '<p class="olho">Preços</p><h2>Paga-se por carro, com proposta à medida</h2>'
      '<p>%s</p></div><div class="planos">'
      '<div class="plano"><span class="nm">Experimentar</span><div class="preco"><span class="v">Grátis</span>'
      '<span class="u">30 dias</span></div><ul><li>%sCom os seus carros verdadeiros</li>'
      '<li>%sSem cartão e sem compromisso</li><li>%sNo fim, decide se fica</li></ul>'
      '<a class="bt sec" href="/app#criar-%s">Criar conta</a></div>'
      '<div class="plano destaque"><span class="fita">Proposta</span><span class="nm">%s</span>'
      '<div class="preco"><span class="v">Por carro</span><span class="u">por mês, com factura</span></div>'
      '<ul><li>%sDiga-nos quantas viaturas tem</li><li>%sMandamos a proposta escrita</li>'
      '<li>%sPagamento por transferência ou Vinti4</li></ul>'
      '<a class="bt pri" href="https://wa.me/2389557882">Pedir proposta no WhatsApp</a></div>'
      '</div></div></section>') % (quem, V, V, V, tipo, nome_meio, V, V, V)

def fecho(tipo, titulo, texto):
    return ('<section id="falar"><div class="env"><div class="fecho"><h2>%s</h2><p>%s</p>'
      '<div class="accoes"><a class="bt pri" href="/app#criar-%s">Criar conta grátis</a>'
      '<a class="bt sec" href="https://wa.me/2389557882">Falar no WhatsApp</a></div>'
      '<p class="pe-heroi">WhatsApp <a href="https://wa.me/2389557882" style="color:var(--accent)">'
      '+238 955 78 82</a> · <a href="/" style="color:var(--accent)">FleetCV para táxis</a></p>'
      '</div></div></section>\n') % (titulo, texto, tipo)

INST = {
 'tipo': 'instituicao', 'titulo': 'FleetCV Instituições',
 'descricao': 'Controlo dos carros de serviço para câmaras, ministérios, empresas e ONG: guia de marcha digital, uso fora de horas, zona autorizada, departamentos e documentos — com o telemóvel do motorista.',
 'miolo': '<div class="heroi"><div class="env"><div>'
   '<span class="selo"><span class="pt"></span>Câmaras · Ministérios · Empresas · ONG</span>'
   '<h1>Os carros de serviço,<br><em>ao serviço</em>.</h1>'
   '<p class="sub">Quem levou o carro, para onde, porquê — e os km que andou sem serviço aberto. '
   'Sem rastreador: com o telemóvel do motorista e uma guia de marcha digital.</p>'
   '<div class="accoes"><a class="bt pri" href="/app#criar-instituicao">Criar conta grátis</a>'
   '<a class="bt sec" href="https://wa.me/2389557882">Pedir uma demonstração</a></div>'
   '<p class="pe-heroi">30 dias grátis, sem cartão. Os motoristas não precisam de conta.</p></div>' +
   ficha('ST-10-CM', 'Rui Tavares', 'sábado · 19h40 — 22h15', [
     ('Guia de marcha', 'Assomada<span class="nota">vistoria da obra da escola</span>'),
     ('Horário de serviço', 'seg–sex, 08:00–18:00'),
     ('Percurso medido por GPS', '64,2 km'),
     ('Zona autorizada', 'Cidade da Praia<span class="nota">chegou a 26 km dela</span>')],
     '2', '<b>Alertas importantes:</b> serviço ao sábado e fora da zona. O gestor vê-os no mesmo dia.') +
   '</div></div>'
   '<section class="risca"><div class="env"><div class="cabec"><p class="olho">O que fica controlado</p>'
   '<h2>Seis coisas que deixam de depender da palavra de alguém</h2></div>' +
   provas([
     ('guia', 'Guia de marcha digital', 'Antes de sair, o motorista escreve para onde vai e porquê. Sem isso, o serviço não começa.'),
     ('relogio', 'Fora de horas', 'Um serviço aberto fora do horário dá alerta. E se o carro andar sem serviço aberto, os km a mais aparecem no serviço seguinte, pela foto do conta-quilómetros.'),
     ('zona', 'Zona autorizada', 'A cidade ou a ilha onde os carros podem andar. Se o GPS os puser mais longe, fica registado.'),
     ('deps', 'Departamentos', 'Cada carro no seu departamento, e as contas — km, combustível, serviços — saem separadas.'),
     ('docs', 'Documentos e manutenção', 'Seguro, inspecção, licença e óleo: a aplicação avisa 30 dias antes de caducar.'),
     ('excel', 'Relatório para auditoria', 'Cada serviço numa linha, com motorista, destino, motivo e alertas. Abre no Excel.')]) +
   '</div></section>'
   '<section class="risca" id="como"><div class="env"><div class="cabec"><p class="olho">Como funciona</p>'
   '<h2>Em três passos, sem instalar nada nos carros</h2></div>' +
   passos([
     ('O gestor prepara', 'Junta os carros e os motoristas, marca o horário de serviço, a zona e os departamentos.'),
     ('O motorista sai', 'No telemóvel, escolhe o carro, fotografa o conta-quilómetros e escreve o destino e o motivo.'),
     ('O gestor vê', 'O carro no mapa ao vivo, os alertas no mesmo dia e, no fim do mês, o relatório para o Excel.')]) +
   '</div></section>' +
   planos('instituicao', 'Instituição', 'O motorista não paga nem tem conta. Para instituições públicas, '
          'preparamos a proposta e os documentos que o processo de compra pedir.') +
   '<section class="risca"><div class="env"><div class="cabec"><p class="olho">Perguntas</p>'
   '<h2>O que as instituições perguntam primeiro</h2></div>' +
   perguntas([
     ('É preciso rastreador nos carros?', 'Não. O GPS é o do telemóvel do motorista (ou um telemóvel do serviço que fica no carro). Com a aplicação Android, continua a gravar com o ecrã apagado.'),
     ('E a privacidade dos funcionários?', 'A localização só é registada com o serviço aberto, e enquanto grava aparece uma notificação fixa. Na ajuda há um <a href="/ajuda#aviso" style="color:var(--accent)">aviso pronto</a> para cada motorista assinar.'),
     ('Onde ficam os dados?', 'Numa base de dados em servidores na União Europeia. Cada instituição fica fechada sobre si: ninguém de fora lhe chega. Pode descarregar tudo e apagar a conta quando quiser.'),
     ('Podemos ter vários gestores?', 'Para já, cada instituição tem uma conta de gestor. Os vários gestores com níveis (chefe do parque, direcção, só ver) estão a chegar — diga-nos se é o seu caso.'),
     ('Funciona em todas as ilhas?', 'Sim. O mapa é o de Cabo Verde inteiro, com as ruas e os nomes, e a zona autorizada pode ser a cidade ou a ilha.')]) +
   '</div></section>' +
   fecho('instituicao', 'Experimente com dois ou três carros', 'Crie a conta, marque o horário, junte um motorista e mande-lhe o acesso pelo WhatsApp. Se preferir, fazemos a demonstração consigo.'),
}

RENT = {
 'tipo': 'rentacar', 'titulo': 'FleetCV Rent-a-car',
 'descricao': 'Para agências de aluguer de viaturas: entrega e devolução com fotografias, km e combustível, e a conta do aluguer feita sozinha e enviada ao cliente pelo WhatsApp.',
 'miolo': '<div class="heroi"><div class="env"><div>'
   '<span class="selo"><span class="pt"></span>Aluguer de viaturas · Cabo Verde</span>'
   '<h1>Cada carro volta<br><em>com a conta certa</em>.</h1>'
   '<p class="sub">Entrega e devolução com fotografias, km e combustível. Na devolução, os dias, '
   'os km a mais, o combustível em falta e os danos fazem-se sozinhos — e seguem para o cliente pelo WhatsApp.</p>'
   '<div class="accoes"><a class="bt pri" href="/app#criar-rentacar">Criar conta grátis</a>'
   '<a class="bt sec" href="https://wa.me/2389557882">Pedir uma demonstração</a></div>'
   '<p class="pe-heroi">30 dias grátis, sem cartão. O cliente não instala nada.</p></div>' +
   ficha('ST-77-RC', 'John Smith', '2 dias · Praia', [
     ('Entregue', '10.000 km<span class="nota">depósito cheio · 4 fotografias</span>'),
     ('Devolvido', '10.800 km<span class="nota">meio depósito · 4 fotografias</span>'),
     ('2 dias × 4.000 CVE', '8.000 CVE'),
     ('200 km a mais · 24 litros em falta', '8.480 CVE'),
     ('Risco na porta', '2.000 CVE')],
     '18.480', '<b>CVE de conta, feita na hora.</b> O cliente recebe-a no WhatsApp, com as fotografias como prova.') +
   '</div></div>'
   '<section class="risca"><div class="env"><div class="cabec"><p class="olho">O que muda</p>'
   '<h2>Acabaram-se as discussões no balcão</h2></div>' +
   provas([
     ('foto', 'Fotografias na entrega e na devolução', 'Frente, trás, os lados e os riscos que já havia. Com data e hora: a prova do estado do carro.'),
     ('conta', 'A conta faz-se sozinha', 'Dias, km incluídos e a mais, combustível em falta e danos. Sem calculadora, sem esquecimentos.'),
     ('atraso', 'Atrasos à vista', 'Um carro que devia ter voltado aparece logo como atrasado, com o telefone do cliente.'),
     ('carros', 'Na rua e disponíveis', 'Quantos carros estão alugados, quantos estão livres e quanto entrou este mês, num ecrã.'),
     ('docs', 'Documentos e manutenção', 'Seguro, inspecção, licença e óleo de cada carro: aviso 30 dias antes de caducar.'),
     ('excel', 'Receita para o Excel', 'Cada aluguer numa linha — cliente, dias, km, extras e total — para a contabilidade.')]) +
   '</div></section>'
   '<section class="risca" id="como"><div class="env"><div class="cabec"><p class="olho">Como funciona</p>'
   '<h2>Entregar, receber, mandar a conta</h2></div>' +
   passos([
     ('Entregar', 'Escolhe o carro livre, escreve o cliente e a data de devolução, tira as fotografias. Os km e o preço vêm sozinhos.'),
     ('Receber', 'Escreve os km, marca o combustível, fotografa e aponta um dano, se houver.'),
     ('Mandar a conta', 'A conta aparece feita. Um toque e segue para o cliente pelo WhatsApp.')]) +
   '</div></section>' +
   planos('rentacar', 'Agência', 'Paga por carro da frota, não por aluguer. Quanto mais carros, menos por carro.') +
   '<section class="risca"><div class="env"><div class="cabec"><p class="olho">Perguntas</p>'
   '<h2>O que as agências perguntam primeiro</h2></div>' +
   perguntas([
     ('O cliente precisa de instalar alguma coisa?', 'Não. Quem usa a aplicação é a sua equipa, no balcão ou na entrega. O cliente só recebe a conta no WhatsApp.'),
     ('E se o cliente disser que o risco já lá estava?', 'As fotografias da entrega ficam guardadas com data e hora, ao lado das da devolução. É isso que se mostra.'),
     ('Dá para ver onde andam os carros alugados?', 'Ainda não: o cliente não usa a nossa aplicação. Seguir os carros alugados por GPS precisa de um pequeno aparelho no carro, e estamos a preparar essa ligação. A sua equipa já pode usar a aplicação nas entregas e transferências.'),
     ('Funciona em todas as ilhas?', 'Sim — Sal, Boa Vista, São Vicente, Santiago. O mapa é o de Cabo Verde inteiro.'),
     ('Os dados dos clientes ficam seguros?', 'Ficam na sua conta, numa base em servidores na União Europeia, fechada a quem não é da sua agência. Pode descarregar tudo e apagar a conta quando quiser.')]) +
   '</div></section>' +
   fecho('rentacar', 'Experimente no próximo aluguer', 'Crie a conta, junte um carro e faça a próxima entrega com o FleetCV. Na devolução, veja a conta sair sozinha.'),
}

for nome, d in (('instituicoes.html', INST), ('rentacar.html', RENT)):
    io.open(os.path.join(SITE, nome), 'w', encoding='utf-8').write(pagina(d))
    print(nome, len(pagina(d).encode('utf-8')), 'bytes')
