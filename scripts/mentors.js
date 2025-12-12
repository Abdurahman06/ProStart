// scripts/mentors.js

/**
 * Рендерит список менторов.
 * @param {Array<Object>} [mentorsToRender] - Менторы для рендера.
 */
function renderMentors(mentorsToRender) {
    const mentorsListElement = document.getElementById('mentorsList');
    if (!mentorsListElement) return;

    const allUsers = getDBData(DB_KEYS.USERS) || [];
    const allMentors = allUsers.filter(u => u.role === 'mentor');
    const mentors = mentorsToRender || allMentors;

    mentorsListElement.innerHTML = ''; // Очистка списка

    if (mentors.length === 0) {
        mentorsListElement.innerHTML = `<p style="color: var(--color-subtle-text); padding: 20px;">
            Менторы по заданному критерию не найдены.
        </p>`;
        return;
    }

    mentors.forEach(mentor => {
        const cardHTML = `
            <div class="mentor-card card">
                <div class="mentor-card__header">
                    <div class="mentor-card__avatar">
                        <img class="mentor-avatar_img" src="/assets/images/free-icon-girl-201634.png">
                    </div>
                    <div>
                        <h3 class="mentor-card__name">${mentor.name}</h3>
                        <p class="mentor-card__role">Ментор</p>
                    </div>
                </div>
                <div class="mentor-card__expertise-tag">
                    ${mentor.expertise || 'Общая экспертиза'}
                </div>
                <p class="mentor-card__description">
                    Опытный специалист в области ${mentor.expertise || 'разработки и дизайна'}, готов помочь вам с реальными проектами.
                </p>
                <div class="mentor-card__actions">
                    <button class="button button--primary" onclick="startMentorChat(${mentor.id})">
                        Написать
                    </button>
                    <button class="button button--secondary">
                        Посмотреть профиль
                    </button>
                </div>
            </div>
        `;
        mentorsListElement.innerHTML += cardHTML;
    });
}

/**
 * Фильтрует менторов по экспертизе.
 */
function filterMentors() {
    const search = document.getElementById('mentorSearch').value.toLowerCase();
    const expertise = document.getElementById('expertiseFilter').value;

    const allUsers = getDBData(DB_KEYS.USERS) || [];
    const allMentors = allUsers.filter(u => u.role === 'mentor');

    const filteredMentors = allMentors.filter(mentor => {
        const matchesSearch = mentor.name.toLowerCase().includes(search) ||
            (mentor.expertise && mentor.expertise.toLowerCase().includes(search));
        const matchesExpertise = expertise ? mentor.expertise === expertise : true;

        return matchesSearch && matchesExpertise;
    });

    renderMentors(filteredMentors);
}

/**
 * Запуск чата с ментором. Для прототипа, просто перенаправляем.
 * @param {number} mentorId
 */
function startMentorChat(mentorId) {
    if (!isAuthenticated()) {
        alert('Для начала чата необходимо авторизоваться.');
        window.location.href = '/log-in.html';
        return;
    }

    // В реальном приложении здесь будет логика создания или поиска чата между CU и ментором
    localStorage.setItem('prostartCurrentChatMentor', mentorId);
    alert(`Вы будете перенаправлены в чат с ментором (ID: ${mentorId}).`);
    window.location.href = '/messenger.html';
}


// Запускаем рендеринг при загрузке страницы (без обязательной авторизации)
window.addEventListener('load', () => {
    renderMentors();
    // Добавляем обработчики фильтров
    document.getElementById('mentorSearch')?.addEventListener('input', filterMentors);
    document.getElementById('expertiseFilter')?.addEventListener('change', filterMentors);
});

window.startMentorChat = startMentorChat;