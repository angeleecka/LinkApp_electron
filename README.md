# LinkApp v2 — Модульная версия

Приложение для организации ссылок с поддержкой страниц, секций и удобного управления.

---

## 📁 Структура проекта

```
Linkapp/modul_version/
├─ assets/
│   ├─ icons/
│   │   └─ logo.png
│   └─ css/
│       ├─ base.css          # Базовые стили + токены темы
│       ├─ layout.css        # Стили компонентов UI
│       ├─ buttons.css
│       ├─ header.css
│       ├─ history.css
│       ├─ modals.css
│       ├─ pages.css
│       ├─ pagination.css
│       ├─ panel.css
│       ├─ sections.css
│       ├─ statusbar.css
│       ├─ toast.css
│       └─ theme.css         # (опционально) Дополнительные темы
│
├─ core/                     # Ядро приложения
│   ├─ app.js                # Главный модуль приложения
│   ├─ config.js             # Конфигурация (настройки)
│   ├─ event-bus.js          # Система событий
│   ├─ platform.js
│   ├─ storage.js            # Хранилище данных (localStorage)
│   └─ theme.js              # Управление темой
│
├─ desktop/                  # упаковка в Electron
│   ├─ electron-main.mjs
│   ├─ package-lock.json
│   ├─ package.json
│   └─ preload.cjs
│
├─ ui/                       # UI-модули
│   ├─ buttons.js            # Логика кнопок-ссылок
│   ├─ sections.js           # Логика секций
│   ├─ pages.js              # Рендеринг страниц
│   ├─ pagination.js         # Пагинатор
│   ├─ panel-study.js
│   ├─ history.js            # Корзина удалений
│   ├─ header.js             # Шапка приложения
│   ├─ layout.js             # Инициализация layout
│   ├─ skeleton.js           # Создание каркаса UI
│   ├─ statusbar.js
│   ├─ modal-service.js      # Сервис модальных окон
│   ├─ modal-about.js        # Модалка "О приложении"
│   ├─ toast.js              # Система уведомлений
│   └─ modals/               # Модальные окна
│       ├─ modal-edit-button.js    # Редактирование кнопки
│       ├─ modal-edit-section.js   # Редактирование секции
│       ├─ modal-history.js        # История удалений
│       ├─ modal-settings.js
│       ├─ modal-sessions.js
│       └─ modal-confirm.js        # Подтверждение действий
│
├─ platform/
│   └─ launcher-web.js       # Адаптер для открытия ссылок (web)
│
├─ favicon.png
├─ index.html                # Главная HTML-страница
├─ main.js                   # Точка входа (инициализация)
└─ README.md                 # Этот файл
```

---

## 🚀 Как запустить

### Вариант 1: Локально (через файловую систему)

1. Скачай всю папку `modul_version/`
2. Открой `index.html` в браузере

### Вариант 2: Через локальный сервер

```bash
# С помощью Python
python -m http.server 8000

# С помощью Node.js (npx)
npx serve

# Затем открой http://localhost:8000
```

---

## 🎯 Основные функции

### 📄 Страницы (Pages)

- Создавай несколько страниц для организации ссылок
- Переключайся между страницами через пагинатор
- Удаляй страницы (кроме последней)

### 📦 Секции (Sections)

- Группируй ссылки по темам
- Редактируй названия секций
- Удаляй секции (все кнопки попадают в историю)

### 🔗 Кнопки-ссылки (Buttons)

- Добавляй ссылки с названиями
- Редактируй название и URL
- Удаляй кнопки (попадают в историю)
- Клик по кнопке → открытие ссылки в браузере

### 🗑️ История удалений (History)

- Все удалённые элементы сохраняются
- Восстанавливай кнопки и секции
- Очищай историю полностью

### 💾 Сохранение/Загрузка

- **Save** — экспорт данных в JSON-файл
- **Open** — импорт данных из JSON-файла
- Автоматическое сохранение в localStorage

### 🎨 Темы

- **System** — следует за темой системы
- **Light** — светлая тема
- **Dark** — тёмная тема
- Переключение: Alt+T или клик по статус-бару

---

## ⌨️ Горячие клавиши

| Клавиша    | Действие                                  |
| ---------- | ----------------------------------------- |
| **Alt+T**  | Переключение темы (system → light → dark) |
| **Enter**  | Сохранить изменения в модалке             |
| **Escape** | Закрыть модалку                           |

---

## 🔧 Архитектура

### Event Bus (Система событий)

Все модули общаются через события:

```javascript
// Отправка события
eventBus.emit("button:save", { buttonId, text, href });

// Подписка на событие
eventBus.on("button:save", (data) => {
  // обработка
});
```

### Storage (Хранилище данных)

Единственный источник правды:

```javascript
// Получить данные
const data = storage.get();

// Обновить данные
storage.update((data) => {
  data.pages[0].name = "New Name";
});
```

### Модули UI

Каждый модуль отвечает за свою часть интерфейса и логики:

- **buttons.js** — кнопки-ссылки
- **sections.js** — секции
- **pages.js** — страницы
- **pagination.js** — пагинатор
- **history.js** — корзина удалений

---

## 📊 Структура данных

```javascript
{
  "currentPageIndex": 0,
  "pages": [
    {
      "id": "page-1",
      "name": "Page 1",
      "sections": {
        "section-1": {
          "text": "Work Links",
          "buttons": [
            {
              "id": "button-1",
              "text": "GitHub",
              "href": "https://github.com"
            }
          ]
        }
      }
    }
  ],
  "deletedItemsHistory": [
    {
      "type": "button",
      "name": "Old Link",
      "link": "https://example.com",
      "deletedAt": "2025-01-15T10:30:00.000Z"
    }
  ]
}
```

---

## 🛠️ Дальнейшее развитие

### Планируемые функции:

- [ ] Drag & Drop для перестановки секций и кнопок
- [ ] Вложенные секции (подразделы)
- [ ] Поиск по ссылкам (fuzzy search)
- [ ] Теги и фильтры
- [ ] Избранные ссылки
- [ ] Проверка "мёртвых" ссылок
- [ ] Экспорт в форматы (HTML, CSV)
- [ ] Синхронизация через облако

### Плагины:

- **linkapp-collector** — браузерное расширение для сбора ссылок
- **linkapp-calendar** — интеграция с календарём

---

## 🔌 Интеграция в другие приложения

LinkApp построен модульно и может быть встроен в другие проекты:

```javascript
// Импортируй нужные модули
import { storage } from "./core/storage.js";
import { renderButtons } from "./ui/buttons.js";

// Используй в своём приложении
storage.init();
const container = document.getElementById("my-container");
renderButtons("section-1", container);
```

---

## 🐛 Отладка

### Открой консоль браузера (F12) и проверь:

- Загружены ли данные: `storage.get()`
- Текущая тема: `getTheme()`
- События: `eventBus` логирует все действия

### Сброс данных:

```javascript
localStorage.removeItem("linkapp-data");
location.reload();
```

---

## 📝 Логирование

Каждый модуль выводит в консоль статус инициализации:

```
🚀 Bootstrapping LinkApp v2...
✅ Config loaded
✅ Theme initialized
✅ UI skeleton created
✅ Storage initialized
✅ Buttons module initialized
✅ Sections module initialized
✅ Pages module initialized
...
✅ LinkApp v2 fully initialized
```

---

## 📄 Лицензия

Проект создан для личного использования. Автор: **Angevicka Bond**

---

## 📧 Обратная связь

Нашёл баг или хочешь предложить функцию? Открой модалку "About" в приложении и используй форму обратной связи.

---

**Версия:** 2.0.0  
**Дата последнего обновления:** Октябрь 2025
