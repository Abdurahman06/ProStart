// scripts/profile.js

/**
 * Определяет название роли на русском.
 * @param {string} roleKey
 * @returns {string}
 */
function getRoleName(roleKey) {
    switch (roleKey) {
        case 'student':
            return 'Студент';
        case 'mentor':
            return 'Ментор';
        case 'company':
            return 'Компания-работодатель';
        default:
            return 'Пользователь';
    }
}

/**
 * Рассчитывает уровень студента на основе опыта.
 * @param {Object} student - Объект студента
 * @returns {string} Уровень студента
 */
function calculateStudentLevel(student) {
    // Если уровень уже установлен, возвращаем его
    if (student.level) {
        return student.level;
    }

    // Рассчитываем опыт (по умолчанию 0)
    const experience = student.experience || 0;
    
    // Система уровней:
    // Начинающий 1: 0-49 опыта
    // Начинающий 2: 50-99 опыта
    // Начинающий 3: 100-149 опыта
    // Средний 1: 150-199 опыта
    // Средний 2: 200-249 опыта
    // Средний 3: 250-299 опыта
    // Продвинутый 1: 300-349 опыта
    // Продвинутый 2: 350-399 опыта
    // Продвинутый 3: 400+ опыта

    if (experience < 50) {
        return 'Начинающий 1';
    } else if (experience < 100) {
        return 'Начинающий 2';
    } else if (experience < 150) {
        return 'Начинающий 3';
    } else if (experience < 200) {
        return 'Средний 1';
    } else if (experience < 250) {
        return 'Средний 2';
    } else if (experience < 300) {
        return 'Средний 3';
    } else if (experience < 350) {
        return 'Продвинутый 1';
    } else if (experience < 400) {
        return 'Продвинутый 2';
    } else {
        return 'Продвинутый 3';
    }
}

/**
 * Обрабатывает отправку формы публикации задачи.
 */
function publishTask(e) {
    e.preventDefault();
    const currentUser = getCurrentUser();

    if (currentUser.role !== 'company') {
        alert('У вас нет прав для публикации задач.');
        return;
    }

    // 1. Сбор данных
    const title = document.getElementById('taskTitle').value.trim();
    const description = document.getElementById('taskDescription').value.trim();
    const direction = document.getElementById('taskDirection').value;
    const level = document.getElementById('taskLevel').value;

    if (!title || !description || !direction || !level) {
        alert('Заполните все обязательные поля.');
        return;
    }

    // 2. Создание объекта и сохранение в DB
    const tasks = getDBData(DB_KEYS.TASKS) || [];
    const newTask = {
        id: Date.now(),
        companyId: currentUser.id,
        companyName: currentUser.name,
        title,
        description,
        direction,
        level,
        status: 'Open',
        applicants: []
    };

    tasks.push(newTask);
    setDBData(DB_KEYS.TASKS, tasks);

    alert(`Задача "${title}" успешно опубликована!`);

    // 3. Обновление UI
    document.getElementById('createTaskForm').reset(); // Очистка формы
    document.getElementById('taskFormContainer').style.display = 'none'; // Скрытие
    document.getElementById('publishTaskButton').textContent = 'Опубликовать новую задачу';

    renderProfile(); // Перерендеринг списка задач
}

/**
 * Рендерит данные профиля текущего пользователя и управляет UI.
 */
function renderProfile() {
    redirectIfUnauthenticated();
    const currentUser = getCurrentUser();
    if (!currentUser) return;

    // Заполнение основной информации
    document.getElementById('profileName').textContent = currentUser.name;
    document.getElementById('profileEmail').textContent = currentUser.email;
    document.getElementById('profileRole').textContent = getRoleName(currentUser.role);
    
    // Обновляем аватар в зависимости от роли
    const profileAvatar = document.getElementById('profileAvatar');
    if (profileAvatar) {
        const avatarImg = profileAvatar.querySelector('img');
        if (currentUser.role === 'company') {
            // Для компании используем SVG иконку здания
            profileAvatar.innerHTML = `
                <svg width="60" height="60" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M3 21H21" stroke="#718096" stroke-width="2" stroke-linecap="round"/>
                    <path d="M5 21V7L13 2L21 7V21" stroke="#718096" stroke-width="2" stroke-linejoin="round"/>
                    <path d="M9 9V13" stroke="#718096" stroke-width="2" stroke-linecap="round"/>
                    <path d="M15 9V13" stroke="#718096" stroke-width="2" stroke-linecap="round"/>
                    <path d="M9 17V21" stroke="#718096" stroke-width="2" stroke-linecap="round"/>
                    <path d="M15 17V21" stroke="#718096" stroke-width="2" stroke-linecap="round"/>
                </svg>
            `;
        } else if (currentUser.role === 'mentor') {
            // Для ментора используем существующую иконку
            profileAvatar.innerHTML = `<img class="mentor-avatar_img" style="width: 50px;" src="/assets/images/free-icon-girl-201634.png" alt="">`;
        } else {
            // Для студента используем существующую иконку
            profileAvatar.innerHTML = `<img class="student-avatar_img" style="width: 50px;" src="/assets/images/free-icon-hacker-924915.png" alt="">`;
        }
    }
    
    // Показываем уровень для студентов
    const studentLevel = document.getElementById('studentLevel');
    if (currentUser.role === 'student' && studentLevel) {
        const level = calculateStudentLevel(currentUser);
        studentLevel.textContent = `Уровень: ${level}`;
        studentLevel.style.display = 'block';
    } else if (studentLevel) {
        studentLevel.style.display = 'none';
    }

    // Показываем экспертизу для менторов
    const mentorExpertise = document.getElementById('mentorExpertise');
    if (currentUser.role === 'mentor' && currentUser.expertise && mentorExpertise) {
        mentorExpertise.textContent = `Экспертиза: ${currentUser.expertise}`;
        mentorExpertise.style.display = 'block';
    } else if (mentorExpertise) {
        mentorExpertise.style.display = 'none';
    }

    // Показываем кнопку Premium только для студентов
    const premiumButton = document.getElementById('premiumButton');
    if (premiumButton) {
        if (currentUser.role === 'student') {
            premiumButton.style.display = 'inline-flex';
        } else {
            premiumButton.style.display = 'none';
        }
    }

    const taskListElement = document.getElementById('completedTasksList');
    taskListElement.innerHTML = '';
    const tasks = getDBData(DB_KEYS.TASKS) || [];
    let relevantTasks = [];

    // ===============================================
    // === ЛОГИКА КОМПАНИИ (УПРАВЛЕНИЕ ФОРМОЙ) ===
    // ===============================================
    const publishButton = document.getElementById('publishTaskButton');
    const taskFormContainer = document.getElementById('taskFormContainer');

    if (currentUser.role === 'company') {
        if (publishButton) publishButton.style.display = 'inline-flex';

        // Привязываем логику переключения видимости к кнопке
        if (publishButton && taskFormContainer) {
            // Убедимся, что обработчик привязан только один раз
            publishButton.onclick = null;
            publishButton.onclick = () => {
                const isVisible = taskFormContainer.style.display === 'block';
                taskFormContainer.style.display = isVisible ? 'none' : 'block';
                publishButton.textContent = isVisible ? 'Опубликовать новую задачу' : 'Скрыть форму публикации';
            };
        }

        relevantTasks = tasks.filter(t => t.companyId === currentUser.id);
        document.getElementById('taskListTitle').textContent = 'Опубликованные задачи';

    } else {
        // Студент и Ментор
        if (publishButton) publishButton.style.display = 'none';
        if (taskFormContainer) taskFormContainer.style.display = 'none';

        if (currentUser.role === 'student') {
            relevantTasks = tasks.filter(t => t.assignedTo === currentUser.id);
            document.getElementById('taskListTitle').textContent = 'Мои активные/выполненные задачи';
        } else if (currentUser.role === 'mentor') {
            // Для менторов показываем задачи, на которые откликнулись студенты, с которыми ментор работает
            // В упрощенной версии показываем все задачи, где есть отклики
            relevantTasks = tasks.filter(t => t.applicants && t.applicants.length > 0);
            document.getElementById('taskListTitle').textContent = 'Задачи с откликами студентов';
        }
    }
    // ===============================================

    if (relevantTasks.length === 0) {
        taskListElement.innerHTML = `<li style="color: var(--color-subtle-text); padding: 10px;">Нет задач для отображения.</li>`;
        return;
    }

    // Рендеринг списка задач
    function mapLevel(level) {
        switch (level) {
            case 'Junior': return 'Легчайший';
            case 'Middle': return 'Легкий';
            case 'Senior': return 'Средний';
            default: return level;
        }
    }
    relevantTasks.forEach(task => {
        const statusText = task.status === 'In Progress' ? 'В работе' : 'Открыта';
        let taskItem = '';
        
        if (currentUser.role === 'company') {
            const applicantsCount = task.applicants && Array.isArray(task.applicants) ? task.applicants.length : 0;
            taskItem = `
                <li class="task-item card" style="padding: 15px; margin-bottom: 10px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                        <div>
                            <span style="font-weight: 600; font-size: 1.1rem;">${task.title}</span>
                            <span style="font-size: 0.9rem; color: ${task.status === 'In Progress' ? '#48BB78' : '#718096'}; margin-left: 10px;">${statusText}</span>
                        </div>
                        <button class="button button--primary" onclick="viewTaskApplicants(${task.id})" style="font-size: 0.9rem; padding: 8px 16px;">
                            Отклики (${applicantsCount})
                        </button>
                    </div>
                    <p style="font-size: 0.9rem; color: var(--color-subtle-text); margin-top: 5px;">
                        Направление: ${task.direction} / Уровень: ${mapLevel(task.level)}
                    </p>
                </li>
            `;
        } else {
            taskItem = `
                <li class="task-item card" style="padding: 15px; margin-bottom: 10px;">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <span style="font-weight: 600;">${task.title}</span>
                        <span style="font-size: 0.9rem; color: ${task.status === 'In Progress' ? '#48BB78' : '#718096'};">${statusText}</span>
                    </div>
                    <p style="font-size: 0.9rem; color: var(--color-subtle-text); margin-top: 5px;">
                        Направление: ${task.direction} / Уровень: ${mapLevel(task.level)}
                    </p>
                </li>
            `;
        }
        taskListElement.innerHTML += taskItem;
    });

}

/**
 * Переключает режим просмотра/редактирования профиля.
 */
function toggleEditProfile() {
    const profileView = document.getElementById('profileView');
    const profileEdit = document.getElementById('profileEdit');
    
    if (profileView.style.display === 'none') {
        // Переключаемся на просмотр
        profileView.style.display = 'block';
        profileEdit.style.display = 'none';
    } else {
        // Переключаемся на редактирование
        const currentUser = getCurrentUser();
        if (!currentUser) return;

        document.getElementById('editName').value = currentUser.name;
        document.getElementById('editEmail').value = currentUser.email;
        
        const editExpertiseGroup = document.getElementById('editExpertiseGroup');
        const editExpertise = document.getElementById('editExpertise');
        if (currentUser.role === 'mentor') {
            editExpertiseGroup.style.display = 'block';
            editExpertise.value = currentUser.expertise || '';
        } else {
            editExpertiseGroup.style.display = 'none';
        }

        profileView.style.display = 'none';
        profileEdit.style.display = 'block';
    }
}

/**
 * Сохраняет изменения профиля.
 * @param {Event} e
 */
function saveProfileChanges(e) {
    e.preventDefault();
    const currentUser = getCurrentUser();
    if (!currentUser) return;

    const newName = document.getElementById('editName').value.trim();
    const newEmail = document.getElementById('editEmail').value.trim();
    const newExpertise = document.getElementById('editExpertise').value.trim();

    if (!newName || !newEmail) {
        alert('Заполните все обязательные поля.');
        return;
    }

    // Проверяем, не занят ли email другим пользователем
    const users = getDBData(DB_KEYS.USERS) || [];
    const emailExists = users.some(u => u.email === newEmail && u.id !== currentUser.id);
    
    if (emailExists) {
        alert('Пользователь с таким email уже существует.');
        return;
    }

    // Обновляем данные пользователя
    const userIndex = users.findIndex(u => u.id === currentUser.id);
    if (userIndex !== -1) {
        users[userIndex].name = newName;
        users[userIndex].email = newEmail;
        
        if (currentUser.role === 'mentor') {
            users[userIndex].expertise = newExpertise;
        }

        setDBData(DB_KEYS.USERS, users);
        
        // Обновляем текущего пользователя
        const updatedUser = users[userIndex];
        setDBData(DB_KEYS.CURRENT_USER, updatedUser);

        alert('Профиль успешно обновлен!');
        
        // Переключаемся обратно на просмотр и обновляем данные
        toggleEditProfile();
        renderProfile();
    }
}

// Привязка событий после загрузки
window.addEventListener('load', () => {
    // Важно, чтобы auth.js загрузился первым
    renderProfile();

    const form = document.getElementById('createTaskForm');
    if (form) {
        // Привязываем функцию публикации к событию submit формы
        form.addEventListener('submit', publishTask);
    }
});

/**
 * Показывает список откликов на задачу для компании.
 * @param {number} taskId
 */
function viewTaskApplicants(taskId) {
    const tasks = getDBData(DB_KEYS.TASKS) || [];
    const task = tasks.find(t => t.id === taskId);
    const users = getDBData(DB_KEYS.USERS) || [];
    
    if (!task) {
        alert('Задача не найдена.');
        return;
    }
    
    const applicants = task.applicants && Array.isArray(task.applicants) ? task.applicants : [];
    
    if (applicants.length === 0) {
        alert('На эту задачу пока нет откликов.');
        return;
    }
    
    // Создаем модальное окно с откликами
    const modal = document.createElement('div');
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
        padding: 20px;
    `;
    
    let applicantsHTML = '';
    applicants.forEach(applicantId => {
        const applicant = users.find(u => u.id === applicantId);
        if (applicant) {
            applicantsHTML += `
                <div class="card" style="padding: 20px; margin-bottom: 15px; display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <h4 style="font-weight: 600; margin-bottom: 5px;">${applicant.name}</h4>
                        <p style="color: var(--color-subtle-text); font-size: 0.9rem;">${applicant.email}</p>
                        ${applicant.role === 'student' && applicant.portfolio && applicant.portfolio.length > 0 ? 
                            `<p style="color: var(--color-subtle-text); font-size: 0.85rem; margin-top: 5px;">Портфолио: ${applicant.portfolio.length} проектов</p>` : ''}
                    </div>
                    <button class="button button--primary" onclick="viewStudentProfile(${applicant.id}); document.body.removeChild(this.closest('div[style*=\"position: fixed\"]'));">
                        Просмотреть профиль
                    </button>
                </div>
            `;
        }
    });
    
    modal.innerHTML = `
        <div class="card" style="max-width: 600px; width: 100%; max-height: 80vh; overflow-y: auto; padding: 30px; position: relative;">
            <button onclick="this.closest('div[style*=\"position: fixed\"]').remove()" 
                    style="position: absolute; top: 15px; right: 15px; background: none; border: none; font-size: 1.5rem; cursor: pointer; color: var(--color-subtle-text);">
                ×
            </button>
            <h2 style="font-size: 1.5rem; font-weight: 700; margin-bottom: 20px;">Отклики на задачу: "${task.title}"</h2>
            <div id="applicantsList">
                ${applicantsHTML}
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Закрытие по клику вне модального окна
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            document.body.removeChild(modal);
        }
    });
}

/**
 * Просмотр профиля студента.
 * @param {number} studentId
 */
function viewStudentProfile(studentId) {
    localStorage.setItem('prostartViewStudentId', studentId);
    window.location.href = '/student-profile.html';
}

/**
 * Открывает модальное окно Premium подписки.
 */
function openPremiumModal() {
    const modal = document.getElementById('premiumModal');
    if (modal) {
        modal.style.display = 'flex';
    }
}

/**
 * Закрывает модальное окно Premium подписки.
 */
function closePremiumModal() {
    const modal = document.getElementById('premiumModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

/**
 * Обрабатывает оформление Premium подписки.
 */
function subscribePremium() {
    const currentUser = getCurrentUser();
    if (!currentUser || currentUser.role !== 'student') {
        alert('Premium подписка доступна только для студентов.');
        return;
    }

    // В реальном приложении здесь будет интеграция с платежной системой
    alert('Спасибо за интерес к Premium подписке! В данный момент функция находится в разработке. Мы свяжемся с вами в ближайшее время.');
    closePremiumModal();
}

// Закрытие модального окна при клике вне его
document.addEventListener('DOMContentLoaded', () => {
    const premiumModal = document.getElementById('premiumModal');
    if (premiumModal) {
        premiumModal.addEventListener('click', (e) => {
            if (e.target === premiumModal) {
                closePremiumModal();
            }
        });
    }
});

// Экспорт для использования в HTML
window.renderProfile = renderProfile;
window.publishTask = publishTask;
window.getRoleName = getRoleName;
window.calculateStudentLevel = calculateStudentLevel;
window.toggleEditProfile = toggleEditProfile;
window.saveProfileChanges = saveProfileChanges;
window.viewTaskApplicants = viewTaskApplicants;
window.viewStudentProfile = viewStudentProfile;
window.openPremiumModal = openPremiumModal;
window.closePremiumModal = closePremiumModal;
window.subscribePremium = subscribePremium;