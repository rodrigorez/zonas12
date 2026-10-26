// A medição de cada sala (D62) — o Google Analytics previsto, ainda sem IDs.
//
// O autor vai ter **uma propriedade por mundo** (uma para a cidade, uma para a floresta, uma para a
// praia) e uma para o portão. O ID mora no dado do mundo, em `world.analytics.id`, e este módulo é o
// único sítio que fala com a GA: a exposição chama-o depois de construir a sala, e a ficha da obra
// chama-o depois de desenhar a obra — com o ID do mundo a que a obra pertence, para a visita contar
// na propriedade dessa exposição.
//
// Enquanto não há IDs não acontece **nada**: sem um ID bem formado não se carrega script, não se
// escreve na consola e não se faz um pedido a nenhum servidor. É o que mantém a bateria do console
// (T8) e o funcionamento offline intactos, e é por isso que a ausência de ID é um estado normal e não
// um erro.
//
// Quem escreve o snippet é este ficheiro, não o HTML: assim há **uma** forma de medir, e a
// configuração leva `send_page_view: false` — a página vista é enviada quando o conteúdo está
// desenhado, com o título certo (o nome da obra, não o endereço).
export const MEASUREMENT_SCRIPT_HOST = 'https://www.googletagmanager.com/gtag/js';

// Um ID de medição GA4: `G-` e o resto em maiúsculas. A forma é validada porque um ID mal escrito
// falha em silêncio no browser (a GA ignora-o) e ninguém daria por isso.
export function measurementIdWellFormed(id) {
  return typeof id === 'string' && /^G-[A-Z0-9]{6,}$/.test(id.trim().toUpperCase());
}

export function gtagScriptUrl(id) {
  return MEASUREMENT_SCRIPT_HOST + '?id=' + encodeURIComponent(String(id || '').trim());
}

// O endereço que a GA guarda. Um mundo é uma pasta e a ficha é uma obra: o caminho diz qual é, e os
// parâmetros que sobram são só os que identificam a obra (`mundo`, `id`) — `lang` e o `bust` dos
// instrumentos ficariam a partir a mesma obra em duas linhas do relatório.
export function pageLocation(href, keepParameters) {
  const url = new URL(String(href));
  const keep = Array.isArray(keepParameters) ? keepParameters : [];
  const parameters = new URLSearchParams();
  for (const name of keep) {
    const value = url.searchParams.get(name);
    if (value !== null) parameters.set(name, value);
  }
  const query = parameters.toString();
  return url.origin + url.pathname + (query ? '?' + query : '');
}

// Arranca a medição e envia **uma** página vista. Devolve o que fez, para quem chamar poder dizer
// (ou medir) se a sala está a ser contada: `{ started, reason, id }`.
export function startAnalytics({ id, title, location }) {
  if (!measurementIdWellFormed(id)) return { started: false, reason: 'sem-id', id: null };
  const measured = id.trim().toUpperCase();
  if (typeof window.gtag !== 'function') {
    window.dataLayer = window.dataLayer || [];
    window.gtag = function gtag() { window.dataLayer.push(arguments); };
    window.gtag('js', new Date());
    window.gtag('config', measured, { send_page_view: false });
    const script = document.createElement('script');
    script.async = true;
    script.src = gtagScriptUrl(measured);
    document.head.appendChild(script);
  }
  window.gtag('event', 'page_view', {
    page_title: String(title || ''),
    page_location: String(location || '')
  });
  return { started: true, reason: 'contada', id: measured };
}
