// ✅ CORRECTED: This uses your ACTUAL Render Backend URL
const API_URL = 'https://student-task-manager-dkzn.onrender.com/api';

// --- STATE ---
let token = localStorage.getItem('token');
let user = JSON.parse(localStorage.getItem('user') || '{}');

// --- DOM ELEMENTS ---
const authScreen = document.getElementById('auth-screen');
const dashboardScreen = document.getElementById('dashboard-screen');
const notification = document.getElementById('notification');

// --- INIT ---
function init() {
    if (token) {
        showDashboard();
    } else {
        showAuth();
    }
}

// --- VIEW SWITCHING ---
function toggleAuth(view) {
    if(view === 'register') {
        document.getElementById('login-box').classList.add('hidden');
        document.getElementById('register-box').classList.remove('hidden');
    } else {
        document.getElementById('login-box').classList.remove('hidden');
        document.getElementById('register-box').classList.add('hidden');
    }
}

function showAuth() {
    dashboardScreen.classList.add('hidden');
    authScreen.classList.remove('hidden');
}

function showDashboard() {
    authScreen.classList.add('hidden');
    dashboardScreen.classList.remove('hidden');
    document.getElementById('user-display').textContent = user.name || 'Student';
    fetchTasks();
}

// --- AUTHENTICATION ---
async function handleAuth(endpoint, data) {
    try {
        const res = await fetch(`${API_URL}/auth/${endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        // 1. CHECK IF RESPONSE IS OK BEFORE PARSING
        const isJson = res.headers.get('content-type')?.includes('application/json');
        const result = isJson ? await res.json() : null; 

        if (!res.ok) {
            const errorText = result && result.msg ? result.msg : await res.text();
            throw new Error(errorText || 'Something went wrong');
        }
        
        localStorage.setItem('token', result.token);
        localStorage.setItem('user', JSON.stringify(result.user));
        token = result.token;
        user = result.user;
        showDashboard();
    } catch (err) {
        alert(err.message); 
    }
}

// Login Listener
document.getElementById('login-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    handleAuth('login', { email, password });
});

// Register Listener
document.getElementById('register-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('reg-name').value;
    const email = document.getElementById('reg-email').value;
    const password = document.getElementById('reg-password').value;
    handleAuth('register', { name, email, password });
});

// --- LOGOUT ---
document.getElementById('logout-btn').addEventListener('click', () => {
    localStorage.clear();
    // Redirects to index.html (Landing Page) in the same folder
    window.location.href = 'index.html';
});

// --- TASKS & KANBAN LOGIC ---
async function fetchTasks() {
    try {
        const res = await fetch(`${API_URL}/tasks`, {
            headers: { 'x-auth-token': token }
        });
        const tasks = await res.json();
        renderKanban(tasks);
        updateStats(tasks);
    } catch (err) {
        console.error("Error fetching tasks:", err);
    }
}

function renderKanban(tasks) {
    // Clear columns
    const cols = {
        todo: document.getElementById('col-todo'),
        inprogress: document.getElementById('col-inprogress'),
        done: document.getElementById('col-done')
    };
    
    // Clear Content
    Object.values(cols).forEach(col => col.innerHTML = '');

    // Counters
    const counts = { todo: 0, inprogress: 0, done: 0 };

    tasks.forEach(task => {
        const status = task.status || 'todo'; // Default to todo if status missing
        if(counts[status] !== undefined) counts[status]++;

        const card = document.createElement('div');
        card.className = 'task-card';
        card.draggable = true; 
        
        // Format Date
        const dateStr = task.dueDate ? new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'No Date';

        card.innerHTML = `
            <div class="task-title">${task.title}</div>
            <p class="task-desc">${task.description || ''}</p>
            <div class="task-footer">
                <div class="task-date"><i class="far fa-calendar"></i> ${dateStr}</div>
                <div class="task-actions">
                    ${status !== 'done' ? `<i class="fas fa-arrow-right action-btn" onclick="moveTask('${task._id}', '${status}')" title="Move Next"></i>` : ''}
                    <i class="fas fa-trash delete-btn action-btn" onclick="deleteTask('${task._id}')" title="Delete"></i>
                </div>
            </div>
        `;
        
        if (cols[status]) cols[status].appendChild(card);
    });

    // Update Counts
    document.getElementById('count-todo').textContent = counts.todo;
    document.getElementById('count-inprogress').textContent = counts.inprogress;
    document.getElementById('count-done').textContent = counts.done;
}

function updateStats(tasks) {
    const total = tasks.length;
    const completed = tasks.filter(t => t.status === 'done').length;
    const today = new Date().toISOString().split('T')[0];
    const dueToday = tasks.filter(t => t.dueDate && t.dueDate.startsWith(today) && t.status !== 'done').length;

    document.getElementById('stat-total').textContent = total;
    document.getElementById('stat-completed').textContent = completed;
    document.getElementById('stat-due').textContent = dueToday;
}

// --- ACTIONS ---
window.moveTask = async (id, currentStatus) => {
    let newStatus = 'todo';
    if(currentStatus === 'todo') newStatus = 'inprogress';
    if(currentStatus === 'inprogress') newStatus = 'done';

    try {
        await fetch(`${API_URL}/tasks/${id}`, {
            method: 'PUT',
            headers: { 
                'Content-Type': 'application/json',
                'x-auth-token': token
            },
            body: JSON.stringify({ status: newStatus })
        });
        fetchTasks();
    } catch(err) { console.error(err); }
};

window.deleteTask = async (id) => {
    if(!confirm("Delete this task?")) return;
    try {
        await fetch(`${API_URL}/tasks/${id}`, {
            method: 'DELETE',
            headers: { 'x-auth-token': token }
        });
        fetchTasks();
    } catch(err) { console.error(err); }
};

// --- MODAL ---
const modal = document.getElementById('task-modal');
window.openModal = () => modal.classList.remove('hidden');
window.closeModal = () => modal.classList.add('hidden');

document.getElementById('task-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const task = {
        title: document.getElementById('task-title').value,
        description: document.getElementById('task-desc').value,
        category: document.getElementById('task-category').value,
        dueDate: document.getElementById('task-date').value,
        status: document.getElementById('task-status').value
    };

    try {
        await fetch(`${API_URL}/tasks`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'x-auth-token': token
            },
            body: JSON.stringify(task)
        });
        closeModal();
        e.target.reset();
        fetchTasks();
    } catch(err) { alert('Failed to add task'); }
});

// Start
init();