# data/csv — as folhas que se estão a testar

Ponha aqui as folhas que quer experimentar. **Nada nesta pasta é o dado da exposição**: o dado a sério
é o [`data/obras.tsv`](../obras.tsv), e é esse que o importador lê quando não lhe dizem outro. Os
ficheiros desta pasta são **rascunhos**: não entram no repositório (estão no `.gitignore`) e podem
apagar-se quando já não servirem.

## Como se testa uma folha daqui

Da raiz do projeto:

```
node tools/artwork/from-csv.mjs --file data/csv/<o-seu-ficheiro>.tsv --check
```

O `--check` **não escreve nada**: lê a folha, compara com o que os mundos já dizem e lista o que
mudaria. É o primeiro comando a correr, sempre.

Quando estiver de acordo, sem o `--check`:

```
node tools/artwork/from-csv.mjs --file data/csv/<o-seu-ficheiro>.tsv
```

Isso escreve nos ficheiros de `data/worlds/`. Para desfazer, e enquanto a folha for de teste:

```
git checkout -- data/worlds/
```

## O formato, em duas linhas

O padrão é de **2026-10-27** e está todo em **português** (o conteúdo é português; a interface é que
muda com `?lang=en`). Nove colunas, por esta ordem, **separadas por tabulação e sem aspas nenhumas**:

```
mundo	id	nome da obra	nomeAutores	nomeCoautores	nomaColaboradores	Descritivo	endereço da imagem	endereço da obra
```

A tabulação é de propósito: não há **nada** que uma sinopse portuguesa possa ter dentro de si e que
seja o separador — uma **vírgula** é uma vírgula, um **ponto e vírgula** é um ponto e vírgula, e
**nenhum texto precisa de aspas**. É também o formato em que uma folha de cálculo põe as células na
área de transferência: copiar do Calc/Excel e colar aqui dá o ficheiro certo.

**Como se grava a folha:** no Excel ou no Calc, «Guardar como» → *Texto (separado por tabulações)*
(`.txt`) ou, melhor, guardar com a extensão `.tsv` (a mesma coisa, com outro nome). O importador lê as
duas. Os ficheiros `.csv` com `;` ou `,` a separar também continuam a ser lidos — mas aí um `;` (ou uma
`,` no caso da vírgula) **dentro de um texto** desloca as colunas em silêncio: nos `.tsv` isso não
existe, e é por isso que o padrão passou a ser tabulação.

As aspas são sempre **delimitadores**: nunca chegam ao dado nem ao ecrã (e uma aspa escrita duas vezes
`""` é uma aspa no texto). Num `.tsv` só seriam precisas para um **texto com uma tabulação lá dentro**
— que é o caso em que a linha fica com células a mais; aí o importador **recusa** e diz qual é a linha.

O **[MODELO.tsv](MODELO.tsv)** desta pasta é a folha de produção copiada tal e qual: as **28 obras**
das cinco salas com o `mundo` e o `id` certos e o texto do autor. Copie-o, mude as células, corra com
`--file`. É a forma de não trocar um `id` sem querer.

| Coluna | Regras |
| --- | --- |
| `mundo` / `id` | **não se mudam**. O `mundo` é a sala (`scene1`, `scene2`, `scene3`, `scene4`, `scene5`, `scene6`, `scene7`, `scene8`, `scene9`, `scene10`, `scene11`) e é ele que diz ao importador onde está a obra — os `id` **não são únicos** no projeto (o `id 0` existe em onze mundos) |
| `nome da obra` | o nome na ficha e no rótulo da sala |
| `nomeAutores` | quem fez a obra. Vários nomes no **mesmo campo**, separados por vírgula: `Fulano, Beltrana` |
| `nomeCoautores` | co-autoria, com a mesma regra |
| `nomaColaboradores` | colaborações, com a mesma regra (aceita-se também `nomeColaboradores`) |
| `Descritivo` | o texto da ficha (a sinopse); o cartão cresce com ele |
| `endereço da imagem` | um caminho do projeto (`assets/artworks/eiffel.jpg`) ou um endereço; **vazio** = fica a que já está; `-` = tira a capa. Um endereço **sem extensão** é aceite como imagem (é o caso das capas no Google Drive: `https://lh3.googleusercontent.com/d/<ID>`) |
| `endereço da obra` | o site, se a obra for um jogo ou uma escultura interactiva: **um**, a começar por `http://` ou `https://`. Vazio tira o site — e então a linha tem de dar uma **imagem** na coluna anterior |

O cabeçalho é comparado **sem acentos, sem maiúsculas e sem espaços a mais**: `Endereço da imagem`,
`endereco_da_imagem` e `ENDEREÇO DA IMAGEM` são a mesma coluna.

**Os três créditos aparecem na ficha assim** — uma linha por papel, e só as que têm nomes:

```
Autor: <nomeAutores>
Coautor: <nomeCoautores>
Colaborador: <nomaColaboradores>
```

As etiquetas são da **interface** (em inglês ficam «Author / Co-author / Collaborator»); o dado guarda
só os nomes, porque nomes não se traduzem — e **as aspas do ficheiro nunca aparecem no ecrã**: são
delimitadores, não conteúdo. Uma célula de crédito vazia **tira** aquele crédito do dado.

Uma linha que começa por `#` é ignorada (é onde ficam as instruções). A codificação é **UTF-8**
(senão os acentos chegam trocados) — mas o «Texto separado por tabulações» do Excel em português, que
é **UTF-16**, também é descodificado: o BOM diz qual é, e o BOM nunca entra no texto.

## O que o importador recusa, em vez de escrever

- uma `endereço da imagem` que não existe no projeto (ou um endereço que não é `http(s)`);
- uma `endereço da obra` sem `http://` ou `https://`;
- uma obra que era um site, perde o site e não ganha uma **imagem** de capa (ficaria invisível);
- um `mundo` que não existe em `data/worlds/`, ou um `id` que aquele mundo não tem.

Em qualquer destes casos ele **diz qual é a linha e a coluna** e não escreve nenhum ficheiro — é
assim que uma folha de teste nunca estraga o dado.

## Um exemplo pronto a copiar

O **[MODELO.tsv](MODELO.tsv)** desta pasta é a folha de produção tal e qual (as **28 obras** das
cinco salas, com o `mundo` e o `id` certos): copie-o, mude as células, corra com `--file`.

O [`data/obras.exemplo.tsv`](../obras.exemplo.tsv) é outra coisa: é a folha de **demonstração** do
projeto, escrita para os mundos de produção mas com texto de exemplo — serve para ver o formato e o
que a ficha faz com cada tipo de obra (os três créditos, só autor, sem créditos, vários autores na
mesma célula, uma obra com site), **não** para aplicar.
