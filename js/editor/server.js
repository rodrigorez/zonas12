// A ponte com o servidor da ferramenta (Fase 5, decisões D48 e D49).
//
// A página publicada não tem quem lhe aceite um ficheiro, e isso não é um erro: é a D2, e é por isso
// que o «Exportar» continua a ser o caminho de todos os dias. A pergunta «há servidor?» é feita
// **uma vez**, em silêncio, e a resposta decide se o botão «Gravar» chega a aparecer — uma página no
// GitHub Pages não traz o cabeçalho e não mostra botão nenhum, sem dizer nada à consola.
const WORLDS = 'api/worlds/';

let canWrite = false;

// A pergunta é feita à **página**, não a um endereço só daqui (D49): um `HEAD` na raiz devolve 200
// em qualquer host — o que muda é o cabeçalho que a ferramenta põe em todas as respostas. Perguntar
// por `/api/ping` daria um 404 na consola de uma página publicada, e a consola limpa é uma regra.
const MARK = 'x-zonas12-serve';

export async function probe() {
  try {
    const response = await fetch('./', { method: 'HEAD', cache: 'no-store' });
    canWrite = response.ok && response.headers.get(MARK) === '1';
  } catch {
    // Sem rede, sem servidor, ou servida por outro host: não há como gravar, e não há o que dizer.
    canWrite = false;
  }
  return canWrite;
}

export const canSave = () => canWrite;

// Grava o texto do mundo no ficheiro que já existe no disco. O que sai daqui é o que o «Exportar»
// descarregaria (o mesmo `exportWorld`), e o servidor recusa-o pelas mesmas regras — erros de
// validação, slug trocado, mundo que não existe —, para não haver duas respostas sobre o mesmo
// ficheiro. Um erro traz a resposta do servidor em `report`, com a lista do validador.
export async function save(slug, text) {
  const response = await fetch(WORLDS + encodeURIComponent(slug), {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: text
  });
  const answer = await response.json().catch(() => null);
  if (!response.ok) {
    const error = new Error((answer && answer.error) || 'HTTP ' + response.status);
    error.report = answer;
    throw error;
  }
  return answer;
}
