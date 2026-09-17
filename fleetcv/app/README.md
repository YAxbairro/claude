# FleetCV — app (Fase 2)

Uma só página, dois papéis: **condutor** e **dono**, a partilhar a mesma base de dados.

```
frota.html    a aplicação inteira (sem dependências, sem compilação)
teste.mjs     percorre os dois papéis de ponta a ponta com GPS e fotos simuladas
```

## Porque é uma página só

A base de dados partilhada é **por artefacto**. Um painel publicado num endereço
separado teria uma base vazia e nunca veria os turnos gravados pelo condutor. Por isso
os dois papéis vivem no mesmo sítio, com um interruptor no topo.

## O que guarda

| Caminho | O quê |
|---|---|
| `config/frota` | carros e preço do combustível fixado pela ARME |
| `turnos/<id>` | o turno: km, rasto de GPS, abastecimentos, alertas, resoluções |
| `turnos/<id>/fotos/<tipo>` | fotos do quadrante e dos talões, em documentos à parte |

Sem base partilhada disponível, a app continua a funcionar e guarda tudo no telemóvel.

## Regras

Os limites são os mesmos do motor SQL da Fase 1 — 3 km de tolerância no quadrante,
15% e 25% de divergência, 500 km máximos por turno, 150 m de raio no posto. **Mudar um
limite obriga a mudá-lo nos dois sítios** (`LIM` aqui, `SPEC.md §15` e as definições da
organização no SQL).

## Testar

```bash
npm i playwright && node teste.mjs      # 17 verificações, dois papéis
```

## O que esta versão ainda não faz

- **O GPS pára quando o telemóvel adormece.** É um limite do navegador, não da app.
  Só a app Android nativa (Fase 3) grava com o ecrã apagado.
- Sem detecção de localização falsa (`mock`): a web não a expõe. O Android expõe.
- Sem leitura automática do quadrante e do talão — os números escrevem-se à mão.
