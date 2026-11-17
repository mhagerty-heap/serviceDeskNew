(function () {
  var stepsContainer = document.getElementById('stepsContainer');
  var addStepBtn = document.getElementById('addStepBtn');
  var form = document.getElementById('scenario-form');
  var initialDataEl = document.getElementById('initial-scenario-data');

  var initialSteps = [];
  try { initialSteps = JSON.parse(initialDataEl.textContent || '[]'); } catch (e) {}

  function newClientId() {
    return 'new-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8);
  }

  function escapeHtml(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function chipRow(chip) {
    chip = chip || {};
    var row = document.createElement('div');
    row.className = 'ai-admin-chip-row chip-row';
    row.innerHTML =
      '<input type="text" class="chip-label-input" placeholder="Chip label" value="' + escapeHtml(chip.label) + '">' +
      '<textarea class="chip-response-input" rows="1" placeholder="Agent response">' + escapeHtml(chip.response_text) + '</textarea>' +
      '<select class="chip-next-select"></select>' +
      '<button type="button" class="btn btn-sd-outline remove-chip-btn" title="Remove chip"><i class="bi bi-x"></i></button>';
    row.querySelector('.chip-next-select').dataset.initialNext = chip.nextClientId || '';
    return row;
  }

  function stepBlock(step) {
    step = step || {};
    var clientId = step.clientId || newClientId();
    var mode = step.input_mode === 'chips' ? 'chips' : 'free_text';
    var div = document.createElement('div');
    div.className = 'ai-admin-step ai-agent-admin-step';
    div.dataset.clientId = clientId;
    div.innerHTML =
      '<div class="ai-admin-step-head">' +
        '<strong class="step-order-label"></strong>' +
        '<div class="ai-admin-actions">' +
          '<label><input type="radio" class="mode-radio" name="mode-' + clientId + '" value="free_text"' + (mode === 'free_text' ? ' checked' : '') + '> Free text</label>' +
          '<label><input type="radio" class="mode-radio" name="mode-' + clientId + '" value="chips"' + (mode === 'chips' ? ' checked' : '') + '> Chips</label>' +
          '<button type="button" class="btn btn-sd-outline remove-step-btn" title="Remove step"><i class="bi bi-trash3"></i></button>' +
        '</div>' +
      '</div>' +
      '<input type="hidden" class="input-mode-input" value="' + mode + '">' +
      '<div class="sd-form-row free-text-fields"' + (mode === 'chips' ? ' style="display:none;"' : '') + '>' +
        '<label>Agent response (any user input advances here)</label>' +
        '<textarea class="response-text-input" rows="2">' + escapeHtml(step.response_text) + '</textarea>' +
      '</div>' +
      '<div class="chips-fields"' + (mode === 'chips' ? '' : ' style="display:none;"') + '>' +
        '<div class="chips-list"></div>' +
        '<button type="button" class="btn btn-sd-outline add-chip-btn"><i class="bi bi-plus-lg"></i> Add chip</button>' +
      '</div>' +
      '<div class="sd-form-row" style="margin-top:12px;max-width:160px;">' +
        '<label>Typing delay (ms)</label>' +
        '<input type="number" class="typing-delay-input" min="0" step="100" value="' + (step.typing_delay_ms || 1200) + '">' +
      '</div>';

    var chipsList = div.querySelector('.chips-list');
    (step.chips || []).forEach(function (chip) { chipsList.appendChild(chipRow(chip)); });
    return div;
  }

  var nameEl = document.getElementById('scenario-name');
  var slugEl = document.getElementById('scenario-slug');
  if (nameEl && slugEl) {
    nameEl.addEventListener('input', function () {
      if (!window.slugEdited) slugEl.value = nameEl.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    });
    slugEl.addEventListener('input', function () { window.slugEdited = true; });
  }

  function refresh() {
    var blocks = Array.prototype.slice.call(stepsContainer.querySelectorAll('.ai-agent-admin-step'));
    var options = blocks.map(function (b, i) {
      return { clientId: b.dataset.clientId, label: 'Step ' + (i + 1) };
    });
    blocks.forEach(function (b, i) {
      b.querySelector('.step-order-label').textContent = 'Step ' + (i + 1);
      b.id = 'scenario-step-' + (i + 1);
      b.querySelector('.remove-step-btn').id = 'btn-remove-step-' + (i + 1);
      b.querySelector('.add-chip-btn').id = 'btn-add-chip-' + (i + 1);
      b.querySelector('.typing-delay-input').id = 'step-' + (i + 1) + '-delay';
      b.querySelector('.response-text-input').id = 'step-' + (i + 1) + '-response';
      b.querySelectorAll('.mode-radio').forEach(function (r) { r.id = 'step-' + (i + 1) + '-mode-' + r.value; });
      b.querySelectorAll('.chip-row').forEach(function (row, j) {
        var n = (i + 1) + '-' + (j + 1);
        row.querySelector('.chip-label-input').id = 'chip-label-' + n;
        row.querySelector('.chip-response-input').id = 'chip-response-' + n;
        row.querySelector('.chip-next-select').id = 'chip-next-' + n;
        row.querySelector('.remove-chip-btn').id = 'btn-remove-chip-' + n;
      });
      var selects = b.querySelectorAll('.chip-next-select');
      selects.forEach(function (select) {
        var current = select.options.length ? select.value : (select.dataset.initialNext || '');
        select.innerHTML = '<option value="">End conversation</option>' +
          options.filter(function (o) { return o.clientId !== b.dataset.clientId; })
            .map(function (o) { return '<option value="' + o.clientId + '"' + (o.clientId === current ? ' selected' : '') + '>' + o.label + '</option>'; })
            .join('');
      });
    });
  }

  function addStep(step) {
    stepsContainer.appendChild(stepBlock(step));
    refresh();
  }

  stepsContainer.addEventListener('click', function (e) {
    if (e.target.closest('.remove-step-btn')) {
      e.target.closest('.ai-agent-admin-step').remove();
      refresh();
    } else if (e.target.closest('.add-chip-btn')) {
      var stepEl = e.target.closest('.ai-agent-admin-step');
      stepEl.querySelector('.chips-list').appendChild(chipRow());
      refresh();
    } else if (e.target.closest('.remove-chip-btn')) {
      e.target.closest('.chip-row').remove();
      refresh();
    }
  });

  stepsContainer.addEventListener('change', function (e) {
    if (e.target.classList.contains('mode-radio')) {
      var stepEl = e.target.closest('.ai-agent-admin-step');
      var mode = e.target.value;
      stepEl.querySelector('.input-mode-input').value = mode;
      stepEl.querySelector('.free-text-fields').style.display = mode === 'free_text' ? '' : 'none';
      stepEl.querySelector('.chips-fields').style.display = mode === 'chips' ? '' : 'none';
    }
  });

  addStepBtn.addEventListener('click', function () { addStep(); });

  if (initialSteps.length) {
    initialSteps.forEach(function (step) { addStep(step); });
  } else {
    addStep();
  }

  function addHidden(container, name, value) {
    var input = document.createElement('input');
    input.type = 'hidden';
    input.name = name;
    input.value = value;
    container.appendChild(input);
  }

  form.addEventListener('submit', function () {
    var existing = document.getElementById('serializedFields');
    if (existing) existing.remove();

    var container = document.createElement('div');
    container.id = 'serializedFields';
    container.style.display = 'none';

    var blocks = Array.prototype.slice.call(stepsContainer.querySelectorAll('.ai-agent-admin-step'));
    blocks.forEach(function (block, i) {
      addHidden(container, 'steps[' + i + '][client_id]', block.dataset.clientId);
      addHidden(container, 'steps[' + i + '][input_mode]', block.querySelector('.input-mode-input').value);
      addHidden(container, 'steps[' + i + '][response_text]', block.querySelector('.response-text-input').value);
      addHidden(container, 'steps[' + i + '][typing_delay_ms]', block.querySelector('.typing-delay-input').value);
      var chipRows = Array.prototype.slice.call(block.querySelectorAll('.chip-row'));
      chipRows.forEach(function (chipEl, j) {
        addHidden(container, 'steps[' + i + '][chips][' + j + '][label]', chipEl.querySelector('.chip-label-input').value);
        addHidden(container, 'steps[' + i + '][chips][' + j + '][response_text]', chipEl.querySelector('.chip-response-input').value);
        addHidden(container, 'steps[' + i + '][chips][' + j + '][next_client_id]', chipEl.querySelector('.chip-next-select').value);
      });
    });

    form.appendChild(container);
  });
})();
