// Kanban Board - Self-contained module
(function() {
  var kanbanInitialized = false;
  
  function initKanban() {
    if (kanbanInitialized) return;
    kanbanInitialized = true;
    
    var container = document.getElementById('kanban-container');
    if (!container) return;
    
    container.innerHTML = 
      '<div style="padding:0 8px;">' +
        '<h2 style="color:#e4e4e7;margin-bottom:16px;font-size:20px;">📋 Task Board</h2>' +
        '<div id="kanban-stats" style="display:flex;gap:12px;margin-bottom:20px;flex-wrap:wrap;"></div>' +
        '<div id="kanban-columns" style="display:grid;grid-template-columns:repeat(4,1fr);gap:16px;min-height:400px;"></div>' +
      '</div>';
    
    loadTasks();
    setInterval(loadTasks, 15000);
  }
  
  function loadTasks() {
    fetch('/api/tasks').then(function(r) { return r.json(); }).then(function(data) {
      renderStats(data);
      renderColumns(data.tasks, data.currentTask);
    }).catch(function() {});
  }
  
  function renderStats(data) {
    var statsDiv = document.getElementById('kanban-stats');
    if (!statsDiv) return;
    var s = data.stats || {};
    var ps = data.projectStatus || {};
    statsDiv.innerHTML = 
      statCard('Completed', (s.totalTasksCompleted || 0), '#10b981') +
      statCard('Spawns', (s.totalRunsSpawned || 0), '#6366f1') +
      statCard('Blocked', (s.totalTasksBlocked || 0), '#ef4444') +
      Object.keys(ps).map(function(p) {
        var colors = { active: '#10b981', paused: '#f59e0b', 'on-hold': '#71717a', blocked: '#ef4444' };
        return statCard(p, ps[p], colors[ps[p]] || '#71717a');
      }).join('');
  }
  
  function statCard(label, value, color) {
    return '<div style="background:#1f1f2e;border:1px solid #2a2a3a;border-radius:8px;padding:12px 16px;min-width:100px;">' +
      '<div style="font-size:11px;color:#71717a;text-transform:uppercase;">' + label + '</div>' +
      '<div style="font-size:20px;font-weight:600;color:' + color + ';">' + value + '</div></div>';
  }
  
  function renderColumns(tasks, currentTask) {
    var cols = document.getElementById('kanban-columns');
    if (!cols) return;
    
    var columns = {
      queued: { title: '📥 Queued', color: '#71717a', tasks: [] },
      'in-progress': { title: '🔨 In Progress', color: '#f59e0b', tasks: [] },
      review: { title: '🔍 Review', color: '#6366f1', tasks: [] },
      done: { title: '✅ Done', color: '#10b981', tasks: [] }
    };
    
    tasks.forEach(function(t) {
      var status = t.done ? 'done' : (t.status || 'queued').toLowerCase().replace(/_/g, '-');
      if (t.id === currentTask) status = 'in-progress';
      if (status === 'needs-redo') status = 'queued';
      if (!columns[status]) status = 'queued';
      columns[status].tasks.push(t);
    });
    
    cols.innerHTML = Object.keys(columns).map(function(key) {
      var col = columns[key];
      return '<div style="background:#13131a;border:1px solid #2a2a3a;border-radius:12px;padding:12px;">' +
        '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;padding-bottom:8px;border-bottom:2px solid ' + col.color + ';">' +
          '<span style="font-weight:600;color:#e4e4e7;font-size:13px;">' + col.title + '</span>' +
          '<span style="background:#2a2a3a;color:#a1a1aa;font-size:11px;padding:2px 8px;border-radius:10px;">' + col.tasks.length + '</span>' +
        '</div>' +
        (col.tasks.length === 0 ? '<div style="color:#71717a;font-size:12px;text-align:center;padding:20px 0;">No tasks</div>' :
        col.tasks.map(function(t) {
          var priColors = { P0: '#ef4444', P1: '#f59e0b', P2: '#71717a' };
          return '<div style="background:#1f1f2e;border:1px solid #2a2a3a;border-radius:8px;padding:10px;margin-bottom:8px;cursor:default;">' +
            '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">' +
              '<span style="font-size:11px;color:#6366f1;font-family:monospace;">' + t.id + '</span>' +
              '<span style="font-size:10px;color:' + (priColors[t.priority] || '#71717a') + ';font-weight:600;">' + (t.priority || '') + '</span>' +
            '</div>' +
            '<div style="font-size:13px;color:#e4e4e7;line-height:1.3;">' + (t.title || t.id) + '</div>' +
          '</div>';
        }).join('')) +
      '</div>';
    }).join('');
  }
  
  document.addEventListener('DOMContentLoaded', function() {
    document.querySelectorAll('.nav-item').forEach(function(item) {
      item.addEventListener('click', function() {
        if (item.dataset.page === 'tasks') setTimeout(initKanban, 100);
      });
    });
    var observer = new MutationObserver(function() {
      var page = document.getElementById('tasks');
      if (page && page.style.display !== 'none') initKanban();
    });
    observer.observe(document.body, { attributes: true, subtree: true, attributeFilter: ['style', 'class'] });
  });
})();
