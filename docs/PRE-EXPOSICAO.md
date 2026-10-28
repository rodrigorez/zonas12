# Pré-exposição — o que falta antes de abrir ao público

A **Fase 8** (a ficha da obra) fechou a **2026-10-27**: a máquina está entregue e medida — `obra.html`
com o dado por CSV, o regresso ao ponto, os assets remotos, a capa por tentativas, a lei **L20** e as
baterias a passar (**25 de 25** em 796,7 s; `obra.mjs` 71, `capa.mjs` 9, `volta.mjs` 7,
`ficha-falhas` 3, `i18n` 9, `validate` 0).

Esta lista é o que **não** é fase e sim **conteúdo e decisão** — nada dela se resolve com código. Cada
ponto diz o que fazer e **como se sabe que ficou feito**.

---

## 1. O texto definitivo das obras — **feito** (2026-10-27)

As **sete salas** entraram com o texto do autor (2026-10-28): `scene1` com **7** obras, `scene2` com
**7**, `scene3` com **3**, `scene4` com **6**, `scene5` com **5**, `scene6` com **5** e `scene7` com **6** — **39** obras, com título, créditos,
descritivo, capa e site onde a obra é uma página. A folha `data/obras.tsv` é a fonte da verdade e
**nenhuma** obra fica com texto provisório: `node tools/artwork/from-csv.mjs --check` responde «a folha
não muda nada: o dado já diz o mesmo». **Uma excepção, à espera do autor:** a obra `scene5` **id 1**
(«A CASA») veio com um **ponto final** como descritivo — é o que a ficha mostra, e é o que a folha diz.

O formato é de **2026-10-27** (D67), todo em **português**, nove colunas separadas por **tabulação** e
**sem aspas**: `mundo`, `id`, `nome da obra`, `nomeAutores`, `nomeCoautores`, `nomaColaboradores`,
`Descritivo`, `endereço da imagem`, `endereço da obra`. O `mundo` e o `id` **não se mudam**.

**Se o autor entregar uma revisão de texto** (o caminho continua a ser este)

1. Abrir `data/obras.tsv` e substituir, por obra: `nome da obra`, `nomeAutores`, `nomeCoautores`,
   `nomaColaboradores` e `Descritivo`. Uma célula de crédito vazia **tira** aquele crédito da ficha.
   Vários nomes no mesmo papel vão na **mesma célula**, separados por **vírgula**: `Fulano, Beltrana`
   (a vírgula é texto, porque o separador é a tabulação).
2. Ver o que vai mudar, **sem escrever**:
   ```
   node tools/artwork/from-csv.mjs --check
   ```
3. Escrever:
   ```
   node tools/artwork/from-csv.mjs
   ```

Se preferir preencher numa folha de cálculo: `Ficheiro → Guardar como → Texto (separado por
tabulações)` — o ficheiro do Excel (UTF-16) é lido tal e qual. Também serve copiar as células e colar o
resultado no ficheiro, que é o mesmo formato.

**Ficou feito quando**

- `node tools/artwork/from-csv.mjs --check` disser **«a folha não muda nada: o dado já diz o mesmo»**;
- `node tools/scene/validate.mjs` terminar com **0** erros e **0** avisos;
- as fichas das obras de cada sala mostrarem o texto novo (no computador e no telemóvel — roteiro A1 a A6).

## 2. A obra de vídeo de laboratório — **feita** (2026-10-27)

`scene1` **id 2** era «Vídeo de teste», um vídeo do YouTube que servia só para exercitar o tipo `site`,
o embed e a cadeia da capa. A sala 1 passou a ter as sete obras do autor e essa linha desapareceu: a
folha de produção não tem nenhum endereço que não seja de uma obra real.

## 3. As capas

As **39 obras** das sete salas têm a capa no **Google Drive**, servida pelo endereço directo
`https://lh3.googleusercontent.com/d/<ID>` — o `/file/d/<ID>/view` é uma **página** e não carrega como
imagem (medido: 0 px), e o `uc?export=view&id=` falha do mesmo modo. O importador aceita um endereço
remoto **sem extensão** como imagem (D68) e escreve a capa em `capa-<id>`.

Custo medido: sete capas remotas são sete idas à rede; a sala 1 abria **1,7 s** depois do resto da
exposição (as outras salas, 0,2–0,3 s) porque as capas eram resolvidas **uma a uma** — desde
2026-10-27 são resolvidas em paralelo e a sala 1 abre em ~0,9 s. Se a exposição for para telemóveis
fracos, a alternativa é servir as capas numa versão menor (`…/d/<ID>=w800`) ou alojá-las no projeto.

**O que fazer:** abrir cada ficha e olhar para a imagem. Confirmar que é a obra certa — são os
fotogramas que o autor escolheu, uma por obra.

**Ficou feito quando** nenhuma obra mostrar a imagem de aviso, e todas forem reconhecíveis.

## 4. O ID do Google Analytics (se houver propriedade)

Cada mundo tem um campo opcional (`world.analytics.id`, formato **`G-XXXXXXX`**, lei **L21**). Sem ID a
página **não carrega script nenhum** — é de propósito.

**O que fazer:** com o servidor local, `editor.html?world=<sala>`, painel **Mundo**, escrever o ID e
gravar; repetir nas salas que devem medir. O editor recusa um ID malformado.

**Ficou feito quando** `grep -r "analytics" data/worlds/` mostrar os IDs pretendidos e as fichas
enviarem um `page_view` (DevTools → Network, ou GA4 → Tempo real).

## 5. O teto de pixelRatio do panorama (opcional, é da Fase 7)

Medido no telemóvel fraco depois do R18: o **shader** desenha **58,7** quadros/s a 1,95 e a **imagem**
(que serve de reserva) **48,6** a 2,63 nativo, com **275** quadros irregulares contra **35**. O mesmo
recurso — um teto de pixelRatio — tornaria a reserva mais fluida.

Não está feito porque muda o que se vê **quando o shader falha**. Se for para fazer, faz-se com bateria
aos dois lados (num aparelho bom a reserva fica intacta; num fraco o ratio desce até aos 45 quadros/s).

## 6. Antes de dizer «está no ar»

```
node tools/regression/all.mjs --full      # 26 de 26
git status                                 # vazio
git log -1 --format='%h %s'                # o commit que o Pages está a servir
```

E uma passagem pelo [roteiro de teste](ROTEIRO-DE-TESTE.md) numa **aba anónima** do telemóvel — porque o
browser guarda o JavaScript da visita anterior e é isso que faz uma correção parecer que não entrou.

---

## Estado, em duas linhas

| | |
| --- | --- |
| **Fase 8** | fechada em 2026-10-27, com os números no [roadmap](ROADMAP.md) (§ «Fase 8») |
| **Pré-exposição** | as sete salas entregues: pontos **1**, **2** e **3** feitos; **4** só se houver propriedade; **5** opcional |
