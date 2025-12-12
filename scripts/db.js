// scripts/db.js

const DB_KEYS = {
    USERS: 'prostartUsers',
    TASKS: 'prostartTasks',
    CHATS: 'prostartChats',
    CURRENT_USER: 'prostartCurrentUser'
};

/**
 * Инициализирует mock-данные, если они еще не существуют в localStorage.
 */
function initDB() {
    if (!localStorage.getItem(DB_KEYS.USERS)) {
        const users = [
            // Студент
            { id: 1, name: 'Иван Студентов', email: 'student@test.com', password: 'password', role: 'student', portfolio: [], level: 'Начинающий 2', experience: 150 },
            // Ментор (UI/UX)
            { id: 2, name: 'Мария Ментор', email: 'mentor@test.com', password: 'password', role: 'mentor', expertise: 'UI/UX Design' },
            // Компания
            { id: 3, name: 'ООО "ТехноСтарт"', email: 'company@test.com', password: 'password', role: 'company', postedTasks: [] },
            // Ментор (Web Dev)
            { id: 4, name: 'Алексей Кодман', email: 'alexei@test.com', password: 'password', role: 'mentor', expertise: 'Web Development' },
        ];
        localStorage.setItem(DB_KEYS.USERS, JSON.stringify(users));
    }

    if (!localStorage.getItem(DB_KEYS.TASKS)) {
        const tasks = [
            {
                id: 1,
                title: 'Разработка лендинга для SaaS-продукта',
                companyId: 3,
                companyName: 'ООО "ТехноСтарт"',
                direction: 'Web Development',
                level: 'Легкий',
                description: 'Требуется создать адаптивный лендинг с чистым кодом и современным дизайном.',
                applicants: [],
                status: 'Open'
            },
            {
                id: 2,
                title: 'Прототипирование мобильного приложения',
                companyId: 3,
                companyName: 'ООО "ТехноСтарт"',
                direction: 'UI/UX Design',
                level: 'Средний',
                description: 'Создание кликабельного прототипа в Figma для нового приложения.',
                applicants: [1], 
                status: 'In Progress',
                assignedTo: 1
            }
        ];
        localStorage.setItem(DB_KEYS.TASKS, JSON.stringify(tasks));
    }

    if (!localStorage.getItem(DB_KEYS.CHATS)) {
        const chats = [
            {
                id: 101,
                taskId: 2,
                chatType: 'task', 
                participants: [1, 3], 
                messages: [
                    { senderId: 3, text: 'Здравствуйте, Иван! У вас отличный отклик по задаче #2.', timestamp: Date.now() - 3600000 },
                    { senderId: 1, text: 'Спасибо! Я готов приступить к работе.', timestamp: Date.now() - 1800000 }
                ]
            }
        ];
        localStorage.setItem(DB_KEYS.CHATS, JSON.stringify(chats));
    }
}

/**
 * Загружает данные из localStorage по ключу.
 * @param {string} key
 * @returns {Array|Object|null}
 */
function getDBData(key) {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
}

/**
 * Сохраняет данные в localStorage по ключу.
 * @param {string} key
 * @param {Array|Object} data
 */
function setDBData(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
}

// Инициализируем базу при загрузке скрипта
initDB();

// Экспортируем функции и ключи
window.DB_KEYS = DB_KEYS;
window.getDBData = getDBData;
window.setDBData = setDBData;