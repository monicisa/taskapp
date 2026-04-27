const API = '/api/tasks';
let tasks = [];
let currentFilter = 'all';

async function loadTasks() {
  showLoading(true);
  try {
    const res = await fetch(API);
    if (!res.ok) throw new Error('Error');
    tasks = await res.json();
    render();
  } catch (err) {
    showError('No se pudieron cargar las tareas.');
  } finally {
    showLoading(false);
  }
}

function render() {
  const filtered = filterTasks(tasks);
  const list = document.getElementById('taskList');
  const empty = document.getElementById('emptyState');
  updateCounter();
  if (filtered.length === 0) {
    list.innerHTML = '';
    empty.classList.remove('d-none');
    return;
  }
  empty.classList.add('d-none');
  list.innerHTML = filtered.map(taskHTML).join('');
}

function filterTasks(all) {
  if (currentFilter === 'pending') return all.filter(t => !t.completed);
  if (currentFilter === 'completed') return all.filter(t => t.completed);
  return all;
}

function taskHTML(task) {
  const date = new Date(task.created_at).toLocaleDateString('es-MX', { month: 'short', day: 'numeric' });
  const completedClass = task.completed ? 'completed' : '';
  const checkmark = task.completed ? '✓' : '';
  const badge = task.completed ? `<span class="badge-completed">listo</span>` : '';
  return `
    <div class="task-item ${completedClass}" id="task-${task.id}">
      <div class="task-checkbox" onclick="toggleTask(${task.id})">${checkmark}</div>
      <span class="task-text">${escapeHTML(task.title)}</span>
      <div class="task-meta">${badge}<span class="task-date">${date}</span></div>
      <button class="btn-delete" onclick="deleteTask(${task.id})">✕</button>
    </div>
  `;
}

function updateCounter() {
  const pending = tasks.filter(t => !t.completed).length;
  document.getElementById('taskCounter').textContent = `${pending} de ${tasks.length} pendientes`;
}

async function addTask() {
  const input = document.getElementById('taskInput');
  const errorEl = document.getElementById('inputError');
  const title = input.value.trim();
  if (!title) { errorEl.classList.remove('d-none'); input.focus(); return; }
  errorEl.classList.add('d-none');
  const btn = document.getElementById('addBtn');
  btn.disabled = true;
  try {
    const res = await fetch(API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title })
    });
    if (!res.ok) throw new Error('Error');
    const newTask = await res.json();
    tasks.unshift(newTask);
    input.value = '';
    render();
  } catch (err) {
    alert('Error al agregar la tarea.');
  } finally {
    btn.disabled = false;
    input.focus();
  }
}

async function toggleTask(id) {
  try {
    const res = await fetch(`${API}/${id}/toggle`, { method: 'PUT' });
    if (!res.ok) throw new Error('Error');
    const updated = await res.json();
    const idx = tasks.findIndex(t => t.id === id);
    if (idx !== -1) tasks[idx] = updated;
    render();
  } catch (err) {
    alert('Error al actualizar la tarea.');
  }
}

async function deleteTask(id) {
  const el = document.getElementById(`task-${id}`);
  if (el) { el.style.opacity = '0.4'; el.style.transition = 'opacity 0.15s'; }
  try {
    const res = await fetch(`${API}/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Error');
    tasks = tasks.filter(t => t.id !== id);
    render();
  } catch (err) {
    if (el) el.style.opacity = '1';
    alert('Error al eliminar la tarea.');
  }
}

function setFilter(filter, btn) {
  currentFilter = filter;
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  render();
}

function showLoading(show) {
  const el = document.getElementById('loadingState');
  if (el) el.style.display = show ? 'block' : 'none';
}

function showError(msg) {
  document.getElementById('taskList').innerHTML =
    `<div class="empty-state"><div class="empty-icon">⚠</div><p>${msg}</p></div>`;
}

function escapeHTML(str) {
  const div = document.createElement('div');
  div.appendChild(document.createTextNode(str));
  return div.innerHTML;
}

document.addEventListener('DOMContentLoaded', () => {
  loadTasks();
  document.getElementById('taskInput').addEventListener('keydown', e => {
    if (e.key === 'Enter') addTask();
  });
  document.getElementById('taskInput').addEventListener('input', () => {
    document.getElementById('inputError').classList.add('d-none');
  });
});