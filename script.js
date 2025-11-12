// Food Tracker — script.js
// модель: массив записей {id, name, calories, time, created}
const STORAGE_KEY = "foodtracker:data";
let meals = [];
let goal = 2000;

document.addEventListener('DOMContentLoaded', () => {
  cacheElements();
  bindEvents();
  loadFromStorage();
  renderAll();
});

/* ====== cache ====== */
let els = {};
function cacheElements(){
  els.navBtns = document.querySelectorAll('.nav-btn');
  els.pages = document.querySelectorAll('.page');
  els.form = document.getElementById('meal-form');
  els.name = document.getElementById('meal-name');
  els.cal = document.getElementById('meal-cal');
  els.time = document.getElementById('meal-time');
  els.mealsList = document.getElementById('meals-list');
  els.mealsCount = document.getElementById('meals-count');
  els.totalCal = document.getElementById('total-cal');
  els.avgCal = document.getElementById('avg-cal');
  els.maxCal = document.getElementById('max-cal');
  els.recentList = document.getElementById('recent-list');
  els.clearBtn = document.getElementById('clear-btn');
  els.goalRange = document.getElementById('goal-range');
  els.goalLabel = document.getElementById('goal-label');
  els.progressFill = document.getElementById('progress-fill');
}

/* ====== events ====== */
function bindEvents(){
  document.querySelectorAll('.nav-btn').forEach(btn=>btn.addEventListener('click', navHandler));
  els.form.addEventListener('submit', onAddMeal);
  els.clearBtn.addEventListener('click', clearDay);
  els.goalRange.addEventListener('input', onGoalChange);
  // keyboard shortcut: Enter in calories adds
  els.cal.addEventListener('keydown', (e)=>{ if(e.key === 'Enter'){ els.form.requestSubmit(); }});
}

/* ====== nav ====== */
function navHandler(e){
  const target = e.currentTarget.dataset.target;
  document.querySelectorAll('.nav-btn').forEach(b=>b.classList.toggle('active', b.dataset.target === target));
  document.querySelectorAll('.page').forEach(p=>p.classList.toggle('active', p.id === target));
}

/* ====== CRUD ====== */
function onAddMeal(e){
  e.preventDefault();
  const name = els.name.value.trim();
  const calories = parseInt(els.cal.value, 10);
  const time = els.time.value || new Date().toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'});

  if(!name || isNaN(calories) || calories < 0){
    alert('Пожалуйста, введите корректное название и калории.');
    return;
  }

  const item = {
    id: Date.now(),
    name,
    calories,
    time,
    created: new Date().toISOString()
  };
  meals.unshift(item); // последние сверху
  saveToStorage();
  renderAll();
  els.form.reset();
  els.name.focus();
}

function removeMeal(id){
  meals = meals.filter(m => m.id !== id);
  saveToStorage();
  renderAll();
}

function clearDay(){
  if(!confirm('Очистить все записи за сегодня?')) return;
  meals = [];
  saveToStorage();
  renderAll();
}

/* ====== storage ====== */
function saveToStorage(){
  try{
    localStorage.setItem(STORAGE_KEY, JSON.stringify({meals, goal}));
  }catch(e){
    console.error('Не удалось сохранить', e);
  }
}
function loadFromStorage(){
  try{
    const raw = localStorage.getItem(STORAGE_KEY);
    if(raw){
      const parsed = JSON.parse(raw);
      meals = parsed.meals || [];
      goal = parsed.goal || goal;
      els.goalRange.value = goal;
      els.goalLabel.textContent = goal;
    }
  }catch(e){
    console.error('Ошибка чтения storage', e);
  }
}

/* ====== rendering ====== */
function renderAll(){
  renderList();
  renderSummary();
  renderStats();
  renderRecent();
  renderProgress();
}

function renderList(){
  els.mealsList.innerHTML = '';
  if(meals.length === 0){
    const li = document.createElement('li');
    li.className = 'card';
    li.textContent = 'Записей пока нет. Добавьте первый приём пищи.';
    els.mealsList.appendChild(li);
    return;
  }
  meals.forEach(m=>{
    const li = document.createElement('li');
    li.className = 'meal-item';
    const info = document.createElement('div');
    info.className = 'meal-info';
    info.innerHTML = `<strong>${escapeHtml(m.name)}</strong><small>${m.time} • ${m.calories} ккал</small>`;
    const actions = document.createElement('div');
    actions.className='meal-actions';
    const del = document.createElement('button');
    del.textContent = 'Удалить';
    del.style.background='transparent';
    del.style.border='1px solid rgba(255,255,255,0.04)';
    del.style.color='var(--muted)';
    del.addEventListener('click', ()=>{ if(confirm('Удалить запись?')) removeMeal(m.id);});
    actions.appendChild(del);
    li.appendChild(info);
    li.appendChild(actions);
    els.mealsList.appendChild(li);
  });
}

function renderSummary(){
  const total = meals.reduce((s,m)=>s+m.calories,0);
  els.mealsCount.textContent = meals.length;
  els.totalCal.textContent = total;
}

function renderStats(){
  if(meals.length === 0){
    els.avgCal.textContent = 0;
    els.maxCal.textContent = '—';
    return;
  }
  const avg = Math.round(meals.reduce((s,m)=>s+m.calories,0)/meals.length);
  const max = meals.reduce((a,b)=> a.calories > b.calories ? a : b).calories;
  els.avgCal.textContent = avg;
  els.maxCal.textContent = max + ' ккал';
}

function renderRecent(){
  els.recentList.innerHTML = '';
  meals.slice(0,5).forEach(m=>{
    const li = document.createElement('li');
    li.textContent = `${m.name} — ${m.calories} ккал (${m.time})`;
    els.recentList.appendChild(li);
  });
}
function onGoalChange(e){
  goal = parseInt(e.target.value,10);
  els.goalLabel.textContent = goal;
  saveToStorage();
  renderProgress();
}
function renderProgress(){
  const total = meals.reduce((s,m)=>s+m.calories,0);
  const pct = Math.min(100, Math.round((total / goal) * 100));
  els.progressFill.style.width = pct + '%';
}

/* ====== util ====== */
function escapeHtml(str){
  return str.replace(/[&<>"']/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":"&#39;"}[s]));
}