const CASES = {
  'MB-CN-C01': {
    title: 'El taller de confección y la campaña escolar',
    video: '/' + encodeURIComponent('Formato 9 16 Esp Perú Banca.mp4'),
    source: 'Video de referencia del caso.',
    question: '¿Qué intervención conductual debe realizar el asesor antes de cotizar el préstamo para Rosaura?',
    options: {
      A: 'Parafrasear el ciclo de cobranza a noventa días y validar si prefiere ajustar el plazo para evitar pagar intereses innecesarios.',
      B: 'Explicar que un plazo de doce meses encarece la deuda y sugerir directamente que acepte amortizar el crédito en tres cuotas.',
      C: 'Cotizar de inmediato el cronograma a doce meses solicitado para asegurar que la cuota mensual resulte cómoda para su caja.',
      D: 'Configurar el desembolso a noventa días asumiendo que el retorno total de la mercadería garantiza el pago sin consultar a Rosaura.'
    },
    context: 'Rosaura tiene un taller de confección y necesita financiar la campaña escolar. Solicita un préstamo a doce meses, aunque espera cobrar la venta de la mercadería a los noventa días. Antes de cotizar, el asesor debe comprender cómo funciona su negocio y conversar sobre su necesidad de financiamiento.'
  },
  'MB-CN-C02': {
    title: 'El excedente agrícola temporal',
    video: 'https://videos.pexels.com/video-files/7659662/7659662-uhd_2560_1440_25fps.mp4',
    source: 'Video de stock de referencia (Pexels): muestra una reunión de equipo y no corresponde a los personajes del caso.',
    credit: 'https://www.pexels.com/video/team-having-meeting-7659662/',
    question: '¿Qué conducta debe priorizar el asesor frente a la solicitud del depósito de Hernán?',
    options: {
      A: 'Indagar las fechas de compra de insumos para validar qué monto requiere disponible antes de contratar el plazo fijo.',
      B: 'Advertirle que un año es demasiado tiempo para el sector agrícola y sugerirle abrir una cuenta de ahorro tradicional.',
      C: 'Tramitar la apertura del depósito a trescientos sesenta días respetando el monto y el plazo que solicitó el cliente.',
      D: 'Abrir el depósito a doce meses asegurándole que podrá retirar sus fondos antes de tiempo sin ninguna penalización financiera.'
    },
    context: 'Hernán trabaja en el sector agrícola y dispone de un excedente temporal. Solicita colocar sus fondos en un depósito a trescientos sesenta días. Durante su próxima campaña también deberá comprar insumos. La conversación con el asesor permite conocer el calendario y las necesidades de su actividad.'
  }
};
const STORAGE_KEY = 'mibanco-diagnostico-mock-v2';
const OPTION_IDS = ['A', 'B', 'C', 'D'];
const app = document.querySelector('#app');

function shuffled(values) {
  const result = [...values];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function validOrder(order) {
  return Array.isArray(order) && order.length === OPTION_IDS.length && OPTION_IDS.every(option => order.includes(option));
}

function loadState(caseId) {
  let parsed = null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    parsed = raw ? JSON.parse(raw) : null;
  } catch (error) {
    if (error instanceof SyntaxError) parsed = null;
    else throw error;
  }
  const state = isPlainObject(parsed) ? parsed : {};
  if (!Number.isInteger(state.index)) state.index = 0;
  if (!isPlainObject(state.watched)) state.watched = {};
  if (!isPlainObject(state.answers)) state.answers = {};
  if (!isPlainObject(state.order)) state.order = {};
  for (const id of Object.keys(CASES)) {
    if (!validOrder(state.order[id])) state.order[id] = shuffled(OPTION_IDS);
  }
  return state;
}

function saveState(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function buildQuestion(caseId, item, onError) {
  const section = el('section', 'question');
  section.setAttribute('aria-labelledby', 'question-title');
  section.hidden = true;

  const heading = el('h2', '', item.question);
  heading.id = 'question-title';
  heading.tabIndex = -1;

  const form = document.createElement('form');
  form.noValidate = true;
  const fieldset = el('fieldset');
  fieldset.append(el('legend', '', 'Selecciona una sola respuesta'));
  const options = el('div', 'options');
  fieldset.append(options);

  const storageNote = el('p', 'storage-note', 'Tu respuesta se guarda solo en este navegador. No se envía a WhatsApp ni a ningún otro lugar.');
  const feedback = el('p', 'notice');
  feedback.hidden = true;
  feedback.setAttribute('role', 'alert');
  const saved = el('p', 'saved', 'Respuesta registrada en este navegador. Ya no se puede modificar.');
  saved.hidden = true;
  saved.setAttribute('role', 'status');
  const submit = el('button', 'submit-button', 'Enviar respuesta');
  submit.type = 'submit';

  let state = null;
  const setLocked = () => {
    fieldset.disabled = true;
    submit.hidden = true;
    saved.hidden = false;
  };

  const prepare = () => {
    feedback.hidden = true;
    try {
      state = loadState(caseId);
    } catch (error) {
      state = null;
      fieldset.disabled = true;
      submit.disabled = true;
      feedback.textContent = 'No se puede usar el almacenamiento de este navegador, por lo que no es posible registrar tu respuesta aquí. Revisa que no estés en modo privado o con el almacenamiento bloqueado, o vuelve a WhatsApp para continuar.';
      feedback.hidden = false;
    }
    if (!state) {
      options.replaceChildren();
      return;
    }
    const answer = state.answers[caseId];
    const answered = isPlainObject(answer) && OPTION_IDS.includes(answer.option);
    options.replaceChildren(...state.order[caseId].map((optionId, index) => {
      const label = el('label', 'option');
      const input = document.createElement('input');
      input.type = 'radio';
      input.name = 'answer';
      input.value = optionId;
      input.required = true;
      if (answered && answer.option === optionId) input.checked = true;
      const text = el('span');
      text.append(el('span', 'option-number', 'Opción ' + (index + 1)), item.options[optionId]);
      label.append(input, text);
      return label;
    }));
    if (answered) setLocked();
  };

  form.addEventListener('submit', event => {
    event.preventDefault();
    if (!state || fieldset.disabled) return;
    feedback.hidden = true;
    const selected = form.querySelector('input[name="answer"]:checked');
    if (!selected) {
      feedback.textContent = 'Selecciona una opción antes de enviar tu respuesta.';
      feedback.hidden = false;
      return;
    }
    try {
      const fresh = loadState(caseId);
      if (isPlainObject(fresh.answers[caseId]) && OPTION_IDS.includes(fresh.answers[caseId].option)) {
        state = fresh;
        prepare();
        return;
      }
      fresh.order[caseId] = state.order[caseId];
      fresh.answers[caseId] = { option: selected.value, at: new Date().toISOString() };
      saveState(fresh);
      state = fresh;
    } catch (error) {
      feedback.textContent = 'No se pudo guardar tu respuesta en este navegador. Revisa que el almacenamiento no esté bloqueado e inténtalo de nuevo.';
      feedback.hidden = false;
      return;
    }
    setLocked();
    saved.focus();
  });
  saved.tabIndex = -1;

  form.append(fieldset, storageNote, feedback, saved, submit);
  section.append(el('span', 'eyebrow', 'Tu decisión cuenta'), heading, form);
  section.show = () => {
    prepare();
    section.hidden = false;
  };
  return section;
}

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function showError(message) {
  document.title = 'Video no disponible · Mibanco';
  const section = el('section');
  section.append(
    el('span', 'eyebrow', 'Video de capacitación'),
    el('h1', '', 'No pudimos mostrar el video'),
    el('p', 'notice', message),
    el('p', 'next', 'Vuelve a WhatsApp y solicita nuevamente el enlace de tu video.')
  );
  section.querySelector('.notice').setAttribute('role', 'alert');
  app.replaceChildren(section);
  app.focus();
}

function render(item, caseId) {
  document.title = item.title + ' · Mibanco';
  const section = el('section');
  const titleId = 'video-title';
  const heading = el('h1', '', item.title);
  heading.id = titleId;
  section.setAttribute('aria-labelledby', titleId);

  const video = document.createElement('video');
  video.controls = true;
  video.playsInline = true;
  video.setAttribute('playsinline', '');
  video.preload = 'metadata';
  video.setAttribute('aria-labelledby', titleId);
  video.src = item.video;
  video.textContent = 'Tu navegador no puede reproducir este video.';

  const player = el('div', 'player');
  player.append(video);

  const status = el('p', 'notice');
  status.hidden = true;
  status.setAttribute('role', 'alert');
  video.addEventListener('error', () => {
    status.textContent = 'No se pudo cargar el video. Revisa tu conexión y vuelve a abrir el enlace, o regresa a WhatsApp y pide uno nuevo.';
    status.hidden = false;
  });
  const centerVideo = () => player.scrollIntoView({ behavior: 'auto', block: 'center' });
  video.addEventListener('loadedmetadata', () => {
    status.hidden = true;
    centerVideo();
  });
  video.addEventListener('play', centerVideo);

  const source = el('p', 'source', item.source);
  if (item.credit) {
    const link = el('a', '', 'Ver video en Pexels');
    link.href = item.credit;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    source.append(' ', link);
  }

  const details = el('details', 'transcript');
  const transcriptBody = el('div', 'transcript-body');
  const transcriptNote = el('p', 'transcript-note', 'Texto de ejemplo basado en el caso y en el análisis del proyecto. No es una transcripción literal: el video es de referencia.');
  transcriptBody.append(
    transcriptNote,
    el('p', '', item.context),
    el('p', '', 'En Mibanco, el propósito de transformar vidas y acompañar a los emprendedores da contexto a esta práctica: conocer la realidad de cada negocio antes de ofrecer una solución financiera.')
  );
  details.append(el('summary', '', 'Transcripción y contexto del caso'), transcriptBody);

  const question = buildQuestion(caseId, item);
  video.addEventListener('ended', () => {
    question.show();
    question.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  const next = el('div', 'next');
  const businessNumber = new URLSearchParams(location.search).get('whatsapp');
  const instruction = el('p', '', 'Cuando termines el video, responde la pregunta aquí y luego vuelve a WhatsApp.');
  next.append(instruction);
  if (/^\d{8,15}$/.test(businessNumber || '')) {
    const link = el('a', 'whatsapp-button', 'Volver a WhatsApp');
    link.href = `whatsapp://send?phone=${businessNumber}&text=${encodeURIComponent('CONTINUAR')}`;
    link.hidden = true;
    const fallback = el('p', 'whatsapp-fallback');
    fallback.hidden = true;
    const fallbackLink = el('a', '', 'abrir mediante enlace web');
    fallbackLink.href = `https://wa.me/${businessNumber}?text=${encodeURIComponent('CONTINUAR')}`;
    fallback.append('¿No se abrió WhatsApp? Puedes ', fallbackLink, '.');
    video.addEventListener('ended', () => {
      link.hidden = false;
      fallback.hidden = false;
      instruction.textContent = 'Responde la pregunta aquí y luego vuelve al chat para enviar el mensaje preparado.';
    });
    next.append(link, fallback);
  } else {
    next.append(el('p', '', 'Después, en el chat, escribe CONTINUAR.'));
  }

  section.append(
    el('span', 'eyebrow', 'Video de capacitación'),
    heading,
    el('p', 'context', item.context),
    player,
    status,
    source,
    details,
    question,
    next
  );
  app.replaceChildren(section);
  app.focus();
}

const id = new URLSearchParams(location.search).get('case');
if (!id) {
  showError('Falta el identificador del caso en el enlace.');
} else if (!Object.prototype.hasOwnProperty.call(CASES, id)) {
  showError('El identificador del caso no es válido.');
} else {
  render(CASES[id], id);
}
