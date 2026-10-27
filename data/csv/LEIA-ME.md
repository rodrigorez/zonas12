# data/csv — as folhas que se estão a testar

Ponha aqui os CSV que quer experimentar. **Nada nesta pasta é o dado da exposição**: o dado a sério
é o [`data/obras.csv`](../obras.csv), e é esse que o importador lê quando não lhe dizem outro. Os
ficheiros desta pasta são **rascunhos**: não entram no repositório (estão no `.gitignore`) e podem
apagar-se quando já não servirem.

## Como se testa uma folha daqui

Da raiz do projeto:

```
node tools/artwork/from-csv.mjs --file data/csv/<o-seu-ficheiro>.csv --check
```

O `--check` **não escreve nada**: lê a folha, compara com o que os mundos já dizem e lista o que
mudaria. É o primeiro comando a correr, sempre.

Quando estiver de acordo, sem o `--check`:

```
node tools/artwork/from-csv.mjs --file data/csv/<o-seu-ficheiro>.csv
```

Isso escreve nos ficheiros de `data/worlds/`. Para desfazer, e enquanto a folha for de teste:

```
git checkout -- data/worlds/
```

## O formato, em duas linhas

A primeira coluna é o **mundo** (`scene1`, `scene2`, `scene3`) e a segunda o **id** da obra — essas
duas **não se mudam**, é por elas que o importador sabe de que obra está a falar. As outras são, por
esta ordem:

```
mundo,id,titulo_pt,titulo_en,autor,sinopse_pt,sinopse_en,site,capa
```

O **[MODELO.csv](MODELO.csv)** desta pasta é a folha de produção copiada tal e qual: as dez obras com
o `mundo` e o `id` certos e o texto provisório. Copie-o, mude as células, corra com `--file`. É a
forma de não trocar um `id` sem querer.

| Coluna | Regras |
| --- | --- |
| `titulo_pt` / `titulo_en` | o nome da obra; sem ele a ficha mostra o id do asset |
| `autor` | mais do que um autor vai na **mesma célula**, entre aspas: `"Fulano, Beltrana"` |
| `sinopse_pt` / `sinopse_en` | uma frase ou duas; o cartão cresce com ele |
| `site` | **um** endereço por obra, a começar por `http://` ou `https://`. Célula **vazia tira o site** — mas então a linha tem de dizer o que a obra passa a ser, com uma **imagem** na `capa` (ver abaixo) |
| `capa` | caminho a partir da raiz do projeto (`assets/artworks/eiffel.jpg`) ou um endereço; **vazio** = fica a que já está; `-` = tira a capa (para a cadeia do YouTube começar do zero) |

Um texto com **vírgula** vai entre **aspas**; as aspas dentro de um texto escrevem-se a dobrar
(`""`). Uma linha que começa por `#` é ignorada, e as primeiras linhas deste tipo servem de
comentário — o `data/obras.csv` tem lá as instruções todas.

## O que o importador recusa, em vez de escrever

- uma `capa` que não existe no projeto (ou um endereço que não é `http(s)`);
- um `site` sem `http://` ou `https://`;
- uma linha com colunas a menos do que o cabeçalho;
- um `mundo` que não existe em `data/worlds/`, ou um `id` que aquele mundo não tem.

Em qualquer destes casos ele **diz qual é a linha e a coluna** e não escreve nenhum ficheiro — é
assim que uma folha de teste nunca estraga o dado.

## Um exemplo pronto a copiar

O **[MODELO.csv](MODELO.csv)** desta pasta é a folha de produção tal e qual (as dez obras, com o
`mundo` e o `id` certos e o texto provisório): copie-o, mude as células, corra com `--file`.

O [`data/obras.exemplo.csv`](../obras.exemplo.csv) é outra coisa: é a folha de **demonstração** do
projeto, escrita para os mundos de produção mas com texto de exemplo — serve para ver o formato e o
que a ficha faz com cada tipo de obra, **não** para aplicar (mudaria o texto todo e transformaria a
obra 2 numa obra de vídeo).
