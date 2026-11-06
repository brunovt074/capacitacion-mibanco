const STORAGE_KEY = 'mibanco-diagnostico-mock-v2';
history.scrollRestoration = 'manual';
const CASES = [
  {
    id: 'MB-CN-C01', title: 'El taller de confección y la campaña escolar', short: 'Taller de confección',
    video: 'Formato 9 16 Esp Perú Banca.mp4',
    source: 'Formato 9:16 · Video local de referencia',
    context: 'Rosaura tiene un taller de confección y necesita financiar la campaña escolar. Solicita un préstamo a doce meses, aunque espera cobrar la venta de la mercadería a los noventa días. Antes de cotizar, el asesor debe comprender cómo funciona su negocio y conversar sobre su necesidad de financiamiento.',
    question: '¿Qué intervención conductual debe realizar el asesor antes de cotizar el préstamo para Rosaura?',
    options: [
      { id: 'A', category: 'Logrado', points: 2, text: 'Parafrasear el ciclo de cobranza a noventa días y validar si prefiere ajustar el plazo para evitar pagar intereses innecesarios.' },
      { id: 'B', category: 'En desarrollo', points: 1, text: 'Explicar que un plazo de doce meses encarece la deuda y sugerir directamente que acepte amortizar el crédito en tres cuotas.' },
      { id: 'C', category: 'No demostrado', points: 0, text: 'Cotizar de inmediato el cronograma a doce meses solicitado para asegurar que la cuota mensual resulte cómoda para su caja.' },
      { id: 'D', category: 'Error Crítico', points: 0, text: 'Configurar el desembolso a noventa días asumiendo que el retorno total de la mercadería garantiza el pago sin consultar a Rosaura.' }
    ]
  },
  {
    id: 'MB-CN-C02', title: 'El excedente agrícola temporal', short: 'Excedente agrícola',
    video: 'https://videos.pexels.com/video-files/7659662/7659662-uhd_2560_1440_25fps.mp4',
    source: 'Video de stock · Reunión de equipo · 15 s',
    credit: 'https://www.pexels.com/video/team-having-meeting-7659662/',
    poster: 'https://images.pexels.com/videos/7659662/adult-brainstorming-business-chair-7659662.jpeg?auto=compress&w=960',
    context: 'Hernán trabaja en el sector agrícola y dispone de un excedente temporal. Solicita colocar sus fondos en un depósito a trescientos sesenta días. Durante su próxima campaña también deberá comprar insumos. La conversación con el asesor permite conocer el calendario y las necesidades de su actividad.',
    question: '¿Qué conducta debe priorizar el asesor frente a la solicitud del depósito de Hernán?',
    options: [
      { id: 'A', category: 'Logrado', points: 2, text: 'Indagar las fechas de compra de insumos para validar qué monto requiere disponible antes de contratar el plazo fijo.' },
      { id: 'B', category: 'En desarrollo', points: 1, text: 'Advertirle que un año es demasiado tiempo para el sector agrícola y sugerirle abrir una cuenta de ahorro tradicional.' },
      { id: 'C', category: 'No demostrado', points: 0, text: 'Tramitar la apertura del depósito a trescientos sesenta días respetando el monto y el plazo que solicitó el cliente.' },
      { id: 'D', category: 'Error Crítico', points: 0, text: 'Abrir el depósito a doce meses asegurándole que podrá retirar sus fondos antes de tiempo sin ninguna penalización financiera.' }
    ]
  }
];
const app = document.querySelector('#app');
let storageAvailable = true;
function loadState() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || { index: 0, watched: {}, answers: {}, order: {} };
  } catch {
    storageAvailable = false;
    return { index: 0, watched: {}, answers: {}, order: {} };
  }
}
let state = loadState();
function saveState() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
  catch { storageAvailable = false; }
  const notice = document.querySelector('#storage-notice');
  if (notice) notice.hidden = storageAvailable;
}
function shuffled(values) {
  const result = [...values];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
for (const item of CASES) {
  if (!state.order[item.id]) state.order[item.id] = shuffled(item.options.map(option => option.id));
}
function showCase() {
  const item = CASES[state.index];
  const completed = Object.keys(state.answers).length;
  app.innerHTML = `
    <div class="intro">
      <div><span class="eyebrow">Etapa 2 · Semana 2</span><h1>Diagnóstico inicial</h1>
      <p>No se trata de saberlo todo. Se trata de reconocer cómo acompañamos a nuestros clientes.</p></div>
      <div class="progress"><strong>${completed} de 2</strong> casos respondidos<progress value="${completed}" max="2" aria-label="Casos respondidos"></progress></div>
    </div>
    <ol class="steps" aria-label="Casos del diagnóstico">${CASES.map((entry, index) => `<li class="${index === state.index ? 'active' : ''}" ${index === state.index ? 'aria-current="step"' : ''}><span>${state.answers[entry.id] ? '✓' : '0' + (index + 1)}</span>${entry.short}</li>`).join('')}</ol>
    <section aria-labelledby="case-title">
      <div class="case-heading"><span class="eyebrow">Conocimiento del negocio · Caso ${state.index + 1} de 2</span>
      <h2 id="case-title">${item.title}</h2><p>Mira el video. Al terminar, aparecerán las opciones debajo.</p></div>
      <div class="video-shell"><video id="case-video" controls playsinline preload="metadata" aria-label="Video de referencia del caso ${state.index + 1}" ${item.poster ? `poster="${item.poster}"` : ''} src="${item.video}"></video>
      <p class="media-error" id="media-error" hidden>No se pudo cargar el video. <a href="${item.video}" target="_blank" rel="noopener">Abrir el archivo de referencia</a>. Puedes leer el contexto mientras revisas la conexión.</p></div>
      <div class="video-caption"><span>${item.source}</span>${item.credit ? `<a href="${item.credit}" target="_blank" rel="noopener">Alena Darmel / Pexels ↗</a>` : '<span>Material ilustrativo del mockup</span>'}</div>
      <details><summary>Transcripción y contexto del caso</summary><div class="transcript">
        <p class="notice">Texto de ejemplo basado en el caso y en el análisis del proyecto. No es una transcripción literal: el video es de referencia.</p>
        <p>${item.context}</p>
        <p>En Mibanco, el propósito de transformar vidas y acompañar a los emprendedores da contexto a esta práctica: conocer la realidad de cada negocio antes de ofrecer una solución financiera.</p>
      </div></details>
      <p class="waiting" id="waiting" ${state.watched[item.id] ? 'hidden' : ''}><span aria-hidden="true"></span>Las opciones se habilitan al finalizar el video.</p>
      <section class="question" id="question" aria-labelledby="question-title" ${state.watched[item.id] ? '' : 'hidden'}></section>
      <p class="small" id="storage-notice" role="status" ${storageAvailable ? 'hidden' : ''}>El navegador no permite guardar datos. Las respuestas solo se conservarán mientras esta página permanezca abierta; no estarán disponibles en /admin.</p>
    </section>`;
  const video = document.querySelector('#case-video');
  const centerVideo = () => document.querySelector('.video-shell').scrollIntoView({ behavior: 'auto', block: 'center' });
  video.addEventListener('play', centerVideo);
  requestAnimationFrame(centerVideo);
  video.addEventListener('error', () => { document.querySelector('#media-error').hidden = false; });
  video.addEventListener('ended', () => {
    state.watched[item.id] = true;
    saveState();
    document.querySelector('#waiting').hidden = true;
    document.querySelector('#question').hidden = false;
    showQuestion(item);
    document.querySelector('#question-title').focus({ preventScroll: true });
    document.querySelector('#question').scrollIntoView({ behavior: 'auto', block: 'start' });
  });
  if (state.watched[item.id]) showQuestion(item);
}
function showQuestion(item) {
  const answer = state.answers[item.id];
  const question = document.querySelector('#question');
  question.innerHTML = `
    <span class="eyebrow">Tu decisión cuenta</span><h2 id="question-title" tabindex="-1">${item.question}</h2>
    <p>Piensa en la situación del cliente y selecciona una sola respuesta.</p>
    <fieldset ${answer ? 'disabled' : ''}><legend>¿Qué harías en esta situación?</legend><div class="options">
    ${state.order[item.id].map((id, index) => {
      const option = item.options.find(entry => entry.id === id);
      return `<label class="option"><input type="radio" name="answer" value="${id}" ${answer?.option === id ? 'checked' : ''}><span><span class="option-number">Opción ${index + 1}</span>${option.text}</span></label>`;
    }).join('')}</div></fieldset>
    ${answer ? '<p class="saved" role="status">✓ Respuesta registrada. Ya no se puede modificar.</p>' : ''}
    <div class="actions"><button class="button" id="continue" ${answer ? '' : 'disabled'}>${answer ? (state.index === 0 ? 'Continuar al caso 2' : 'Finalizar diagnóstico') : 'Enviar respuesta'} <span aria-hidden="true">→</span></button>
    <span class="small">${answer ? 'Tu respuesta quedó guardada en este navegador.' : 'Podrás revisar tu elección antes de enviarla.'}</span></div>`;
  const button = document.querySelector('#continue');
  question.addEventListener('change', () => { button.disabled = false; }, { once: true });
  button.onclick = () => {
    if (state.answers[item.id]) {
      state.index++;
      saveState();
      render();
      window.scrollTo(0, 0);
      app.focus();
      return;
    }
    document.querySelector('#confirm-dialog').returnValue = '';
    document.querySelector('#confirm-dialog').showModal();
  };
}
const dialog = document.querySelector('#confirm-dialog');
if (dialog) dialog.addEventListener('close', () => {
  if (dialog.returnValue !== 'send') return;
  const item = CASES[state.index];
  const selected = document.querySelector('input[name="answer"]:checked');
  if (!selected || state.answers[item.id]) return;
  state.answers[item.id] = { option: selected.value, at: new Date().toISOString() };
  saveState();
  showQuestion(item);
  document.querySelector('progress').value = Object.keys(state.answers).length;
  document.querySelector('.progress strong').textContent = `${Object.keys(state.answers).length} de 2`;
  document.querySelector('#continue').focus();
});
function showComplete() {
  app.innerHTML = `<section class="complete"><div class="complete-mark" aria-hidden="true">✓</div>
    <span class="eyebrow">Diagnóstico inicial · Completado</span><h1>Un paso más para acompañar mejor.</h1>
    <p>Gracias, Ana. Registramos tus respuestas a los dos casos de esta demostración.</p>
    <p>Este diagnóstico es un punto de partida: el resultado no bloquea tu aprendizaje.</p>
    <div class="next-step"><h3>Lo que viene</h3><p>Píldoras de aprendizaje · Semanas 3 a 5.</p><p>En el programa real, recibirás el aviso por WhatsApp según el calendario.</p></div>
    <div class="actions"><button class="button secondary" id="review">Revisar mis respuestas</button></div></section>`;
  document.querySelector('#review').onclick = () => { state.index = 0; saveState(); render(); };
}
function showAdmin() {
  const answers = CASES.filter(item => state.answers[item.id]);
  const total = answers.reduce((sum, item) => sum + item.options.find(option => option.id === state.answers[item.id].option).points, 0);
  app.innerHTML = `<div class="intro"><div><span class="eyebrow">Vista del equipo · /admin</span><h1>Registro de respuestas</h1><p>Diagnóstico inicial · Ana (participante ficticia).</p></div><a href="../prototipo-caso-mibanco.html">Volver al diagnóstico ↗</a></div>
    <p class="admin-note">Demo sin autenticación. Solo muestra las respuestas guardadas en este navegador.</p>
    <div class="stats"><div class="stat"><strong>${answers.length} / 2</strong><span>Casos respondidos</span></div><div class="stat"><strong>${total} / 4</strong><span>Puntos registrados</span></div></div>
    <p class="small">El umbral de aprobación está pendiente de definir. Este diagnóstico no bloquea el aprendizaje.</p>
    <div class="records-heading"><h2>Respuestas por caso</h2><p class="small">Conocimiento del negocio</p></div>
    <div class="records">
    ${CASES.map((item, index) => {
      const answer = state.answers[item.id];
      const option = answer && item.options.find(entry => entry.id === answer.option);
      const categoryClass = option?.points === 2 ? 'good' : option?.points === 1 ? 'developing' : option?.category === 'Error Crítico' ? 'critical' : '';
      return `<article class="response-card" aria-labelledby="record-${index}">
        <div class="record-meta"><span class="eyebrow">Caso 0${index + 1}</span><span class="tag ${answer ? 'good' : ''}">${answer ? 'Registrada' : 'Pendiente'}</span></div>
        <h3 id="record-${index}">${item.title}</h3>
        ${option ? `<div class="chosen-answer"><span class="answer-label">Respuesta elegida</span><p>${option.text}</p></div>
        <div class="result-row"><span class="tag ${categoryClass}">${option.category}</span><strong>${option.points}<small> / 2 puntos</small></strong></div>` : '<p class="pending-answer">Este caso todavía no tiene una respuesta.</p>'}
        <details class="record-trace"><summary>Ver trazabilidad</summary><dl>
          <dt>Caso</dt><dd>${item.id} · CN1</dd>
          ${option ? `<dt>Opción</dt><dd>${item.id}-${option.id}</dd><dt>Registrada</dt><dd>${new Date(answer.at).toLocaleString('es-PE')}</dd>` : ''}
          <dt>Orden mostrado</dt><dd>${state.order[item.id].join(' · ')}</dd>
        </dl></details>
      </article>`;
    }).join('')}</div><p class="small records-note">Una respuesta errónea y un error crítico valen 0 puntos, pero se registran como categorías distintas.</p>`;
}
function render() {
  if (document.body.dataset.page === 'admin') return showAdmin();
  if (state.index >= CASES.length) return showComplete();
  showCase();
}
window.addEventListener('storage', event => {
  if (event.key === STORAGE_KEY && document.body.dataset.page === 'admin') {
    state = loadState();
    render();
  }
});
saveState();
render();
