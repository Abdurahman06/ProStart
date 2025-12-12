// scripts/chat.js

const chatState = {
    currentChatId: null,
    currentUser: null,
};

/**
 * Ищет или создает чат для текущего пользователя и заданной задачи.
 * Чат создается между студентом и компанией по задаче.
 * @param {number} taskId
 * @returns {Object} Объект чата.
 */
function findOrCreateChatByTask(taskId) {
    if (!chatState.currentUser) {
        console.error('Пользователь не авторизован');
        return null;
    }
    
    const chats = getDBData(DB_KEYS.CHATS) || [];
    const tasks = getDBData(DB_KEYS.TASKS) || [];
    const task = tasks.find(t => t.id === taskId);

    if (!task) {
        console.error('Задача не найдена');
        return null;
    }

    // Чат по задаче создается между студентом и компанией
    const companyId = task.companyId;
    const currentUserId = chatState.currentUser.id;

    // Сортируем ID для единообразия поиска
    const participants = [currentUserId, companyId].sort((a, b) => a - b);

    // Ищем чат с теми же участниками И привязанный к той же задаче
    let chat = chats.find(c => {
        if (c.taskId !== taskId) return false; // Чат должен быть привязан к задаче
        if (c.participants.length !== participants.length) return false;
        return c.participants.every((p, index) => p === participants[index]);
    });

    if (!chat) {
        // Создаем новый чат по задаче
        chat = {
            id: Date.now(),
            taskId: taskId,
            chatType: 'task', // Тип чата: по задаче
            participants: participants,
            messages: [{
                senderId: 0,
                text: `Чат по задаче: "${task.title}" создан.`,
                timestamp: Date.now()
            }]
        };
        chats.push(chat);
        setDBData(DB_KEYS.CHATS, chats);
    }

    return chat;
}

/**
 * Ищет или создает прямой чат между двумя пользователями (не по задаче).
 * @param {number} otherUserId - ID другого участника
 * @param {string} chatType - Тип чата: 'mentor-student' или 'direct'
 * @returns {Object} Объект чата.
 */
function findOrCreateDirectChat(otherUserId, chatType = 'direct') {
    if (!chatState.currentUser) {
        console.error('Пользователь не авторизован');
        return null;
    }
    
    const chats = getDBData(DB_KEYS.CHATS) || [];
    const currentUserId = chatState.currentUser.id;

    // Сортируем ID для единообразия поиска
    const participants = [currentUserId, otherUserId].sort((a, b) => a - b);

    // Ищем прямой чат (без taskId) с теми же участниками
    let chat = chats.find(c => {
        if (c.taskId !== null) return false; // Прямой чат не привязан к задаче
        if (c.participants.length !== participants.length) return false;
        return c.participants.every((p, index) => p === participants[index]);
    });

    if (!chat) {
        const users = getDBData(DB_KEYS.USERS) || [];
        const otherUser = users.find(u => u.id === otherUserId);
        const currentUser = users.find(u => u.id === currentUserId);
        
        // Создаем новый прямой чат
        chat = {
            id: Date.now(),
            taskId: null,
            chatType: chatType,
            participants: participants,
            messages: [{
                senderId: 0,
                text: `Чат между "${currentUser ? currentUser.name : 'Вы'}" и "${otherUser ? otherUser.name : 'Пользователь'}" создан.`,
                timestamp: Date.now()
            }]
        };
        chats.push(chat);
        setDBData(DB_KEYS.CHATS, chats);
    }

    return chat;
}


/**
 * Рендерит список диалогов.
 */
function renderDialogs() {
    const dialogsList = document.getElementById('dialogsList');
    if (!dialogsList || !chatState.currentUser) return;

    const chats = getDBData(DB_KEYS.CHATS) || [];
    const users = getDBData(DB_KEYS.USERS) || [];
    const tasks = getDBData(DB_KEYS.TASKS) || [];
    const currentUserId = chatState.currentUser.id;

    // Фильтруем чаты, в которых участвует текущий пользователь
    let userChats = chats.filter(c => c.participants.includes(currentUserId));
    
    // Для ментора показываем только чаты со студентами
    if (chatState.currentUser.role === 'mentor') {
        userChats = userChats.filter(chat => {
            const otherParticipantId = chat.participants.find(id => id !== currentUserId);
            const otherUser = users.find(u => u.id === otherParticipantId);
            return otherUser && otherUser.role === 'student';
        });
    }
    
    dialogsList.innerHTML = '';

    userChats.forEach(chat => {
        const otherParticipantId = chat.participants.find(id => id !== currentUserId);
        const otherUser = users.find(u => u.id === otherParticipantId);
        const task = tasks.find(t => t.id === chat.taskId);

        // Находим последнее несистемное сообщение
        const nonSystemMessages = chat.messages.filter(msg => msg.senderId !== 0);
        const lastMessage = nonSystemMessages.length > 0 ? nonSystemMessages[nonSystemMessages.length - 1] : { text: 'Нет сообщений' };

        // Определяем тип чата для отображения
        let chatTypeLabel = '';
        if (chat.taskId) {
            chatTypeLabel = `Задача: ${task ? task.title.substring(0, 20) + '...' : 'Н/Д'}`;
        } else {
            // Прямой чат - определяем роль собеседника
            if (otherUser) {
                if (otherUser.role === 'mentor') {
                    chatTypeLabel = 'Ментор';
                } else if (otherUser.role === 'company') {
                    chatTypeLabel = 'Компания';
                } else if (otherUser.role === 'student') {
                    chatTypeLabel = 'Студент';
                } else {
                    chatTypeLabel = 'Чат';
                }
            } else {
                chatTypeLabel = 'Чат';
            }
        }

        const dialogHTML = `
            <div class="dialog-list__item ${chatState.currentChatId === chat.id ? 'dialog-list__item--active' : ''}" 
                 data-chat-id="${chat.id}" 
                 onclick="openChat(${chat.id})">
                <div class="dialog-list__title">
                    ${otherUser ? otherUser.name : 'Неизвестный'}
                </div>
                <div class="dialog-list__subtitle">
                    ${chatTypeLabel}
                </div>
                <p class="dialog-list__message-preview">
                    ${lastMessage.text.substring(0, 40)}
                </p>
            </div>
        `;
        dialogsList.innerHTML += dialogHTML;
    });
}

/**
 * Открывает выбранный чат и рендерит сообщения.
 * @param {number} chatId
 */
function openChat(chatId) {
    chatState.currentChatId = chatId;
    localStorage.removeItem('prostartCurrentChatTask'); // Удаляем временный ID задачи

    const chats = getDBData(DB_KEYS.CHATS) || [];
    const chat = chats.find(c => c.id === chatId);
    const users = getDBData(DB_KEYS.USERS) || [];
    const chatWindow = document.getElementById('chatWindow');
    const chatHeader = document.getElementById('chatHeader');
    const messageInput = document.getElementById('messageInput');
    const sendButton = document.getElementById('sendButton');

    if (!chat || !chatWindow || !chatState.currentUser) return;

    const otherParticipantId = chat.participants.find(id => id !== chatState.currentUser.id);
    const otherUser = users.find(u => u.id === otherParticipantId);

    // Обновление заголовка с указанием типа чата
    if (chatHeader) {
        let headerText = `Чат с: ${otherUser ? otherUser.name : 'Пользователь'}`;
        if (chat.taskId) {
            const tasks = getDBData(DB_KEYS.TASKS) || [];
            const task = tasks.find(t => t.id === chat.taskId);
            if (task) {
                headerText += ` (по задаче: "${task.title}")`;
            }
        } else {
            // Прямой чат
            if (otherUser) {
                if (otherUser.role === 'mentor') {
                    headerText += ' (Ментор)';
                } else if (otherUser.role === 'company') {
                    headerText += ' (Компания)';
                } else if (otherUser.role === 'student') {
                    headerText += ' (Студент)';
                }
            }
        }
        chatHeader.innerHTML = headerText;
    }

    // Рендер сообщений (скрываем системные сообщения с senderId === 0)
    chatWindow.innerHTML = chat.messages
        .filter(msg => msg.senderId !== 0) // Скрываем системные сообщения
        .map(msg => {
            const isSelf = msg.senderId === chatState.currentUser.id;
            const sender = users.find(u => u.id === msg.senderId);
            const senderName = isSelf ? 'Вы' : (sender ? sender.name : 'Пользователь');

            return `
                <div class="chat-message ${isSelf ? 'chat-message--self' : 'chat-message--other'}">
                    <div class="chat-message__sender">${senderName}</div>
                    <div class="chat-message__text">${msg.text}</div>
                    <div class="chat-message__time">${new Date(msg.timestamp).toLocaleTimeString()}</div>
                </div>
            `;
        }).join('');
    
    // Если нет сообщений после фильтрации, показываем сообщение
    if (chatWindow.innerHTML.trim() === '') {
        chatWindow.innerHTML = '<p style="text-align: center; color: var(--color-subtle-text); padding: 20px;">Начните общение, отправив первое сообщение</p>';
    }

    // Прокрутка вниз
    chatWindow.scrollTop = chatWindow.scrollHeight;

    // Активация формы отправки
    messageInput.disabled = false;
    sendButton.disabled = false;

    // Обновляем стили активного диалога
    renderDialogs();
}

/**
 * Отправляет новое сообщение в текущий чат.
 */
function sendMessage() {
    const messageInput = document.getElementById('messageInput');
    const text = messageInput.value.trim();

    if (!text || !chatState.currentChatId || !chatState.currentUser) return;

    const chats = getDBData(DB_KEYS.CHATS);
    const chatIndex = chats.findIndex(c => c.id === chatState.currentChatId);

    if (chatIndex !== -1) {
        const newMessage = {
            senderId: chatState.currentUser.id,
            text: text,
            timestamp: Date.now()
        };
        chats[chatIndex].messages.push(newMessage);
        setDBData(DB_KEYS.CHATS, chats);

        messageInput.value = ''; // Очистка инпута
        openChat(chatState.currentChatId); // Перерендеринг чата
    }
}

/**
 * Инициализация страницы мессенджера.
 */
function initMessenger() {
    redirectIfUnauthenticated();
    chatState.currentUser = getCurrentUser();
    
    if (!chatState.currentUser) {
        window.location.href = '/log-in.html';
        return;
    }

    // 1. Проверяем, пришли ли мы из каталога по кнопке "Чат"
    const taskIdFromCatalog = localStorage.getItem('prostartCurrentChatTask');

    if (taskIdFromCatalog) {
        const chat = findOrCreateChatByTask(parseInt(taskIdFromCatalog));
        if (chat) {
            chatState.currentChatId = chat.id;
        }
    }
    
    // 2. Проверяем, пришли ли мы со страницы менторов (для студентов)
    const mentorIdFromMentors = localStorage.getItem('prostartCurrentChatMentor');
    if (mentorIdFromMentors) {
        const mentorId = parseInt(mentorIdFromMentors);
        const users = getDBData(DB_KEYS.USERS) || [];
        const mentor = users.find(u => u.id === mentorId);
        
        if (mentor && chatState.currentUser.role === 'student') {
            // Студент создает чат с ментором
            const chat = findOrCreateDirectChat(mentorId, 'mentor-student');
            if (chat) {
                chatState.currentChatId = chat.id;
            }
        }
        localStorage.removeItem('prostartCurrentChatMentor');
    }

    // 3. Проверяем, пришли ли мы из профиля студента (для ментора)
    const studentIdFromProfile = localStorage.getItem('prostartCurrentChatStudent');
    if (studentIdFromProfile) {
        const studentId = parseInt(studentIdFromProfile);
        const users = getDBData(DB_KEYS.USERS) || [];
        const student = users.find(u => u.id === studentId);
        
        if (student && chatState.currentUser.role === 'mentor') {
            // Ментор создает чат со студентом
            const chat = findOrCreateDirectChat(studentId, 'mentor-student');
            if (chat) {
                chatState.currentChatId = chat.id;
            }
        }
        localStorage.removeItem('prostartCurrentChatStudent');
    }

    // 4. Рендерим диалоги
    renderDialogs();

    // 5. Открываем первый чат или чат по задаче
    if (chatState.currentChatId) {
        openChat(chatState.currentChatId);
    } else {
        const chats = getDBData(DB_KEYS.CHATS) || [];
        if (chats.length > 0) {
            openChat(chats[0].id);
        } else {
            document.getElementById('chatHeader').textContent = 'У вас пока нет активных диалогов.';
        }
    }

    // 6. Назначаем обработчик на форму отправки
    const sendForm = document.getElementById('sendMessageForm');
    if (sendForm) {
        sendForm.addEventListener('submit', (e) => {
            e.preventDefault();
            sendMessage();
        });
    }
}

// Запускаем инициализацию при загрузке страницы
window.addEventListener('load', initMessenger);
window.openChat = openChat;
window.findOrCreateDirectChat = findOrCreateDirectChat;