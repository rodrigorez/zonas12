// The controls a panel is made of.
//
// One place builds a labelled control and binds it to the model, so that no panel invents its own way
// of writing a number — and so that every label is a catalogue key and not a literal (D12). Each
// builder appends to a host and returns the element (so a panel can hide it) and a `set` (so a button
// can put a value back without repainting everything).
//
// Every input carries `name`: the catalogue key it came from, or whatever the panel asked for — it is
// how a measurement finds a field and how the DOM says what it is.
import { t } from '../i18n.js';

function caption(host, options, tag) {
  const box = document.createElement(tag || 'label');
  box.className = 'campo';
  const text = document.createElement(tag === 'fieldset' ? 'legend' : 'span');
  if (options.labelKey) {
    text.setAttribute('data-i18n', options.labelKey);
    text.textContent = t(options.labelKey);
  } else {
    text.textContent = options.label || '';
  }
  box.appendChild(text);
  host.appendChild(box);
  return box;
}

const nameOf = (options) => options.name || options.labelKey || '';

const asNumber = (raw) => {
  const value = Number(raw);
  return Number.isFinite(value) ? value : null;
};

export function heading(host, key) {
  const title = document.createElement('h2');
  title.setAttribute('data-i18n', key);
  title.textContent = t(key);
  host.appendChild(title);
  return title;
}

export function numberField(host, options) {
  const input = document.createElement('input');
  input.type = 'number';
  input.name = nameOf(options);
  if (options.step !== undefined) input.step = String(options.step);
  if (options.min !== undefined) input.min = String(options.min);
  if (options.max !== undefined) input.max = String(options.max);
  input.value = options.value === undefined || options.value === null ? '' : String(options.value);
  input.addEventListener('input', () => {
    const value = asNumber(input.value);
    if (value !== null) options.onChange(value);
  });
  const box = caption(host, options);
  box.appendChild(input);
  return {
    element: box,
    input: input,
    set: (value) => { input.value = value === undefined || value === null ? '' : String(value); }
  };
}

export function textField(host, options) {
  const input = document.createElement('input');
  input.type = 'text';
  input.name = nameOf(options);
  input.spellcheck = false;
  input.value = options.value === undefined || options.value === null ? '' : String(options.value);
  input.addEventListener('input', () => options.onChange(input.value));
  if (options.datalist) input.setAttribute('list', options.datalist);
  const box = caption(host, options);
  box.appendChild(input);
  return {
    element: box,
    input: input,
    set: (value) => { input.value = value === undefined || value === null ? '' : String(value); }
  };
}

// Um campo de cor (`<input type="color">`), que escreve `#rrggbb` — o formato que o dado guarda e que
// o `THREE.Color` lê. Existe para o fundo liso de uma dimensão (D56); qualquer outro sítio que peça
// uma cor usa este.
export function colorField(host, options) {
  const input = document.createElement('input');
  input.type = 'color';
  input.name = nameOf(options);
  input.value = options.value || '#000000';
  input.addEventListener('input', () => options.onChange(input.value));
  const box = caption(host, options);
  box.appendChild(input);
  return {
    element: box,
    input: input,
    set: (value) => { input.value = value || '#000000'; }
  };
}

export function selectField(host, options) {  const select = document.createElement('select');
  select.name = nameOf(options);
  for (const entry of options.options) {
    const option = document.createElement('option');
    option.value = entry.value;
    option.textContent = entry.label;
    select.appendChild(option);
  }
  select.value = options.value === undefined || options.value === null ? '' : String(options.value);
  select.addEventListener('change', () => options.onChange(select.value));
  const box = caption(host, options);
  box.appendChild(select);
  return {
    element: box,
    input: select,
    set: (value) => { select.value = String(value); }
  };
}

export function checkboxField(host, options) {
  const input = document.createElement('input');
  input.type = 'checkbox';
  input.name = nameOf(options);
  input.checked = options.checked === true;
  input.addEventListener('change', () => options.onChange(input.checked));
  const box = caption(host, options);
  box.appendChild(input);
  return {
    element: box,
    input: input,
    set: (value) => { input.checked = value === true; }
  };
}

// Three numbers under one caption. The axes are codes, not text to translate.
export function vec3Field(host, options) {
  const box = caption(host, options, 'fieldset');
  const start = Array.isArray(options.value) ? options.value : [0, 0, 0];
  const inputs = ['x', 'y', 'z'].map((axis, index) => {
    const input = document.createElement('input');
    input.type = 'number';
    input.name = nameOf(options) + '.' + axis;
    input.setAttribute('aria-label', axis);
    if (options.step !== undefined) input.step = String(options.step);
    input.value = String(start[index]);
    input.addEventListener('input', () => {
      const values = inputs.map((field) => asNumber(field.value));
      if (values.some((value) => value === null)) return;
      options.onChange(values);
    });
    box.appendChild(input);
    return input;
  });
  return {
    element: box,
    set: (values) => {
      const next = Array.isArray(values) ? values : [0, 0, 0];
      inputs.forEach((input, index) => { input.value = String(next[index]); });
    }
  };
}

export function button(host, options) {
  const element = document.createElement('button');
  element.type = 'button';
  if (options.labelKey) {
    element.setAttribute('data-i18n', options.labelKey);
    element.textContent = t(options.labelKey);
  } else {
    element.textContent = options.label || '';
  }
  if (options.name) element.name = options.name;
  if (options.disabled === true) element.disabled = true;
  element.addEventListener('click', () => options.onClick());
  host.appendChild(element);
  return element;
}

export function note(host, text, className) {
  const element = document.createElement('p');
  element.className = className || 'nota';
  element.textContent = text || '';
  host.appendChild(element);
  return element;
}

// A field is typed one character at a time. Writing the model on every keystroke is right (the value
// is what it is); rebuilding geometry on every keystroke is not. 120 ms is below what the eye notices
// and above the speed of typing (D33).
export function debounce(fn, ms) {
  let timer = null;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms === undefined ? 120 : ms);
  };
}
