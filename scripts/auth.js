// scripts/auth.js

/**
 * Получает данные текущего пользователя.
 * @returns {Object|null}
 */
function getCurrentUser() {
    return getDBData(DB_KEYS.CURRENT_USER);
}

/**
 * Проверяет, авторизован ли пользователь.
 * @returns {boolean}
 */
function isAuthenticated() {
    return !!getCurrentUser();
}

/**
 * Перенаправляет на главную страницу или страницу входа, если не авторизован.
 */
function redirectIfUnauthenticated(redirectPath = '/log-in.html') {
    // Не перенаправляем, если уже на странице входа/регистрации
    const isAuthPage = window.location.pathname.includes('/log-in.html') || window.location.pathname.includes('/sign-up.html');

    if (!isAuthenticated() && !isAuthPage) {
        window.location.href = redirectPath;
    }
}

/**
 * Регистрирует нового пользователя.
 * @param {string} name
 * @param {string} email
 * @param {string} password
 * @param {string} role
 * @returns {boolean} true, если регистрация успешна
 */
function registerUser(name, email, password, role) {
    const users = getDBData(DB_KEYS.USERS) || [];
    if (users.some(u => u.email === email)) {
        alert('Пользователь с таким email уже существует.');
        return false;
    }

    const newUser = {
        id: Date.now(),
        name,
        email,
        password,
        role,
        portfolio: role === 'student' ? [] : undefined,
        expertise: role === 'mentor' ? '' : undefined,
        postedTasks: role === 'company' ? [] : undefined,
        experience: role === 'student' ? 0 : undefined,
        level: role === 'student' ? 'Начинающий 1' : undefined,
    };

    users.push(newUser);
    setDBData(DB_KEYS.USERS, users);

    // Автоматический вход после регистрации
    setDBData(DB_KEYS.CURRENT_USER, newUser);

    alert(`Регистрация успешна! Добро пожаловать, ${name}.`);

    // !!! ВАЖНО: Обновляем навигацию сразу после входа
    updateNavigation();

    // Перенаправление по роли
    if (role === 'student' || role === 'mentor') {
        window.location.href = '/catalog.html';
    } else if (role === 'company') {
        window.location.href = '/profile.html';
    }

    return true;
}

/**
 * Аутентифицирует пользователя.
 * @param {string} email
 * @param {string} password
 * @returns {boolean} true, если вход успешен
 */
function loginUser(email, password) {
    const users = getDBData(DB_KEYS.USERS) || [];
    const user = users.find(u => u.email === email && u.password === password);

    if (user) {
        setDBData(DB_KEYS.CURRENT_USER, user);
        alert(`Вход успешен! Добро пожаловать, ${user.name}.`);

        // !!! ВАЖНО: Обновляем навигацию сразу после входа
        updateNavigation();

        // Динамическое перенаправление по роли
        if (user.role === 'student' || user.role === 'mentor') {
            window.location.href = '/catalog.html';
        } else if (user.role === 'company') {
            window.location.href = '/profile.html';
        }
        return true;
    } else {
        alert('Неверный email или пароль.');
        return false;
    }
}

/**
 * Выполняет выход пользователя.
 */
function logoutUser() {
    localStorage.removeItem(DB_KEYS.CURRENT_USER);
    updateNavigation(); // Обновляем навигацию перед перенаправлением
    alert('Вы вышли из системы.');
    window.location.href = '/log-in.html';
}

/**
 * Динамически обновляет видимость элементов навигации в зависимости от роли пользователя.
 */
function updateNavigation() {
    const currentUser = getCurrentUser();
    const isAuthenticated = !!currentUser;

    const profileItem = document.getElementById('navProfileItem');
    const messengerItem = document.getElementById('navMessengerItem');
    const logoutBtn = document.getElementById('logoutBtn');

    const loginBtn = document.getElementById('loginBtn');
    const signupBtn = document.getElementById('signupBtn');

    const mentorsItem = document.getElementById('navMentorsItem');

    if (isAuthenticated) {
        // Показываем авторизованные элементы
        if (profileItem) profileItem.style.display = 'list-item';
        if (messengerItem) messengerItem.style.display = 'list-item';
        if (logoutBtn) logoutBtn.style.display = 'inline-flex';

        // Скрываем неавторизованные элементы
        if (loginBtn) loginBtn.style.display = 'none';
        if (signupBtn) signupBtn.style.display = 'none';

        // Управление видимостью "Менторы"
        if (currentUser.role === 'mentor' && mentorsItem) {
            mentorsItem.style.display = 'none';
        } else if (mentorsItem) {
            mentorsItem.style.display = 'list-item';
        }

        // Скрываем "Биржа задач" для компании
        const catalogItem = document.getElementById('navCatalogItem');
        if (currentUser.role === 'company' && catalogItem) {
            catalogItem.style.display = 'none';
        } else if (catalogItem) {
            catalogItem.style.display = 'list-item';
        }

    } else {
        // Пользователь не авторизован
        if (profileItem) profileItem.style.display = 'none';
        if (messengerItem) messengerItem.style.display = 'none';
        if (logoutBtn) logoutBtn.style.display = 'none';

        if (loginBtn) loginBtn.style.display = 'inline-flex';
        if (signupBtn) signupBtn.style.display = 'inline-flex';
        if (mentorsItem) mentorsItem.style.display = 'list-item';
    }
}

// Запускаем обновление навигации при загрузке каждой страницы
window.addEventListener('load', updateNavigation);

// Экспортируем функции для использования в HTML
window.getCurrentUser = getCurrentUser;
window.isAuthenticated = isAuthenticated;
window.registerUser = registerUser;
window.loginUser = loginUser;
window.logoutUser = logoutUser;
window.redirectIfUnauthenticated = redirectIfUnauthenticated;
window.updateNavigation = updateNavigation;