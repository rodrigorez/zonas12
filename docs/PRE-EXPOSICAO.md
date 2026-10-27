# Pré-exposição — o que falta antes de abrir ao público

A **Fase 8** (a ficha da obra) fechou a **2026-10-27**: a máquina está entregue e medida — `obra.html`
com o dado por CSV, o regresso ao ponto, os assets remotos, a capa por tentativas, a lei **L20** e as
baterias a passar (**25 de 25** em 796,7 s; `obra.mjs` 71, `capa.mjs` 9, `volta.mjs` 7,
`ficha-falhas` 3, `i18n` 9, `validate` 0).

Esta lista é o que **não** é fase e sim **conteúdo e decisão** — nada dela se resolve com código. Cada
ponto diz o que fazer e **como se sabe que ficou feito**.

---

## 1. O texto definitivo das obras (obrigatório)

Hoje o `data/obras.tsv` está preenchido com texto **provisório**, para aprovação do circuito: autores
`autorA`/`autorB`/`AutorC` e sinopses «Texto provisório: …». Um visitante leria isso.

O formato é de **2026-10-27** (D67), todo em **português**, nove colunas separadas por **tabulação** e
**sem aspas**: `mundo`, `id`, `nome da obra`, `nomeAutores`, `nomeCoautores`, `nomaColaboradores`,
`Descritivo`, `endereço da imagem`, `endereço da obra`. O `mundo` e o `id` **não se mudam**.

**O que fazer**

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
- as fichas das 10 obras mostrarem o texto novo (no computador e no telemóvel — roteiro A1 a A6).

## 2. A obra de vídeo de laboratório (obrigatório)

`scene1` **id 2** é «Vídeo de teste»: aponta para um vídeo do YouTube que serve **só** para exercitar o
tipo `site`, o embed e a cadeia da capa. Não é uma obra da exposição.

**Duas saídas, e a escolha é sua**

- **Sem site:** apagar o `endereço da obra` da linha na folha **e dar-lhe uma imagem** na coluna
  `endereço da imagem` (a obra passa a ser essa imagem), com um nome, créditos e descritivo de verdade
  no mesmo passo que o ponto 1. A célula `endereço da obra` vazia tira o site; o importador **recusa**
  se a linha não disser o que a obra passa a mostrar — é de propósito, porque um «site» sem site
  deixaria a obra invisível;
- **Sem obra:** retirar a obra da sala no editor, ou no dado. Nesse caso o `id` fica livre e as linhas
  seguintes da folha mantêm o seu.

**Ficou feito quando** a ficha `/obra.html?mundo=scene1&id=2` não tiver o leitor do YouTube, e nenhuma
ficha de produção tiver um endereço que não seja de uma obra real.

## 3. As capas (obrigatório)

As dez obras apontam o `endereço da imagem` para ficheiros do projeto; a do vídeo vem do YouTube. A
cadeia do D65 mostra a **imagem padrão** («Capa indisponível · avisar o administrador») quando nada
carrega — e isso é a rede, não o resultado desejado.

**O que fazer:** abrir cada ficha e olhar para a imagem. Confirmar que é a obra certa (e não o panorama
de outra sala, por exemplo — `Cidade, na praia` a apontar para a cidade está certo; `Floresta` a apontar
para `cidade-d0-forest.jpg` também).

**Ficou feito quando** nenhuma das dez mostrar a imagem de aviso, e as dez forem reconhecíveis.

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
node tools/regression/all.mjs --full      # 25 de 25
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
| **Pré-exposição** | pontos **1, 2, 3** obrigatórios; **4** só se houver propriedade; **5** opcional |
