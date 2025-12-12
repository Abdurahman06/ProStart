// scripts/tasks.js

/**
 * Рендерит список задач на странице.
 * @param {Array<Object>} [tasksToRender] - Задачи для рендера (по умолчанию - все).
 */
function renderTasks(tasksToRender) {
    const taskListElement = document.getElementById('taskList');
    const noTasksMessage = document.getElementById('noTasksMessage');
    const allTasks = getDBData(DB_KEYS.TASKS) || [];
    const tasks = tasksToRender || allTasks;
    const currentUser = getCurrentUser();
    taskListElement.innerHTML = ''; // Очистка списка

    if (tasks.length === 0) {
        noTasksMessage.style.display = 'block';
        return;
    } else {
        noTasksMessage.style.display = 'none';
    }

    tasks.forEach(task => {
        const isApplicant = currentUser && task.applicants && Array.isArray(task.applicants) && task.applicants.includes(currentUser.id);
        const isAssigned = currentUser && task.assignedTo === currentUser.id;

        const actionButton = (currentUser && currentUser.role === 'student') ?
            `<button class="button ${isApplicant ? 'button--secondary' : 'button--primary'}" 
                     data-task-id="${task.id}" 
                     onclick="applyToTask(this)" 
                     ${isApplicant ? 'disabled' : ''}>
                ${isApplicant ? 'Откликнут' : 'Откликнуться'}
            </button>` : '';

        const chatButton = (isApplicant || isAssigned) ?
            `<button class="button button--secondary" 
                     data-task-id="${task.id}"
                     onclick="goToChat(${task.id})">
                Чат
            </button>` : '';

        // Отображение уровня задачи с учетом новых названий
        function mapLevel(level) {
            switch (level) {
                case 'Junior': return 'Легчайший';
                case 'Middle': return 'Легкий';
                case 'Senior': return 'Средний';
                default: return level;
            }
        }
        const cardHTML = `
            <div class="task-card card" style="cursor: pointer;" onclick="viewTaskDetails(${task.id})">
                <div class="task-card__header">
                    <div>
                        <h3 class="task-card__title">${task.title}</h3>
                        <p style="color: var(--color-text); font-weight: 500;">${task.companyName}</p>
                    </div>
                    <div style="display: flex; flex-direction: column; align-items: flex-end;">
                        <span class="task-card__direction">${task.direction}</span>
                        <span class="task-card__level" style="margin-top: 5px;">${mapLevel(task.level)}</span>
                    </div>
                </div>
                <p>${task.description.substring(0, 150)}...</p>
                <div class="task-card__actions" onclick="event.stopPropagation();">
                    ${actionButton}
                    ${chatButton}
                </div>
            </div>
        `;
        taskListElement.innerHTML += cardHTML;
    });
}

/**
 * Фильтрует задачи по заданным критериям и вызывает рендер.
 */
function filterTasks() {
    const search = document.getElementById('search').value.toLowerCase();
    const direction = document.getElementById('direction').value;
    const level = document.getElementById('level').value;

    const allTasks = getDBData(DB_KEYS.TASKS) || [];

    const filteredTasks = allTasks.filter(task => {
        const matchesSearch = task.title.toLowerCase().includes(search) ||
            task.description.toLowerCase().includes(search);
        const matchesDirection = direction ? task.direction === direction : true;
        const matchesLevel = level ? task.level === level : true;

        return matchesSearch && matchesDirection && matchesLevel;
    });

    renderTasks(filteredTasks);
}

/**
 * Функция отклика на задачу. Сохраняет отклик в localStorage.
 * @param {HTMLElement} buttonElement
 */
function applyToTask(buttonElement) {
    if (!isAuthenticated()) {
        alert('Для отклика необходимо авторизоваться.');
        window.location.href = '/log-in.html';
        return;
    }

    const taskId = parseInt(buttonElement.dataset.taskId);
    const currentUser = getCurrentUser();

    if (currentUser.role !== 'student') {
        alert('Откликаться на задачи могут только студенты.');
        return;
    }

    const tasks = getDBData(DB_KEYS.TASKS);
    const taskIndex = tasks.findIndex(t => t.id === taskId);

    if (taskIndex !== -1 && !tasks[taskIndex].applicants.includes(currentUser.id)) {
        tasks[taskIndex].applicants.push(currentUser.id);
        setDBData(DB_KEYS.TASKS, tasks);

        // Обновляем кнопку в DOM
        buttonElement.textContent = 'Откликнут';
        buttonElement.classList.remove('button--primary');
        buttonElement.classList.add('button--secondary');
        buttonElement.disabled = true;

        alert(`Вы успешно откликнулись на задачу "${tasks[taskIndex].title}"!`);
    } else {
        alert('Ошибка при отклике или вы уже откликнулись.');
    }
}

/**
 * Перенаправляет на страницу чата.
 * @param {number} taskId
 */
function goToChat(taskId) {
    // В реальном приложении здесь будет логика создания или поиска чата по taskId.
    // Для прототипа просто перенаправляем в мессенджер с ID задачи.
    localStorage.setItem('prostartCurrentChatTask', taskId);
    window.location.href = '/messenger.html';
}

/**
 * Перенаправляет на страницу деталей задачи.
 * @param {number} taskId
 */
function viewTaskDetails(taskId) {
    localStorage.setItem('prostartViewTaskId', taskId);
    window.location.href = '/task-details.html';
}

// Экспортируем функции
window.renderTasks = renderTasks;
window.filterTasks = filterTasks;
window.applyToTask = applyToTask;
window.goToChat = goToChat;
window.viewTaskDetails = viewTaskDetails;