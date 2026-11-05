import type { Dictionary } from "./en";

export default {
  meta: {
    ogLocale: "uk_UA",
    dir: "ltr",
    titleTemplate: "{title} | {siteName}",
  },

  days: {
    mo: { short: "Пн", long: "Понеділок" },
    tu: { short: "Вт", long: "Вівторок" },
    we: { short: "Ср", long: "Середа" },
    th: { short: "Чт", long: "Четвер" },
    fr: { short: "Пт", long: "П’ятниця" },
    sa: { short: "Сб", long: "Субота" },
    su: { short: "Нд", long: "Неділя" },
  },

  sections: {
    hoursTitle: "Години роботи",
    closed: "Зачинено",
    address: "Адреса",
    phone: "Телефон",
    email: "Електронна пошта",
    openInMaps: "Відкрити на мапі",
    popularPlan: "Найпопулярніший",
    rating: "Оцінка: {value} з 5",
    contactBar: "Контактні дані",
  },

  common: {
    skipToContent: "Перейти до вмісту",
    backToHome: "Повернутися на головну",
  },

  nav: {
    label: "Головна навігація",
    menu: "Меню",
    home: "Головна",
    features: "Можливості",
    components: "Компоненти",
    contact: "Контакти",
  },

  footer: {
    product: "Продукт",
    legal: "Правова інформація",
    privacyPolicy: "Політика конфіденційності",
    cookieSettings: "Налаштування cookie",
    copyright: "© {year} {siteName}. Усі права захищено.",
  },

  cookies: {
    title: "Необов’язкова аналітика",
    description:
      "Ми використовуємо необов’язкові файли cookie Google Analytics, щоб зрозуміти, як відвідувачі користуються цим сайтом. Аналітика вимкнена, доки ви її не приймете.",
    privacyLink: "Політика конфіденційності",
    reject: "Відхилити",
    accept: "Прийняти аналітику",
  },

  contactForm: {
    eyebrow: "Контакти",
    title: "Поговорімо про ваш проєкт.",
    description: "Надішліть повідомлення, і ми відповімо якнайшвидше.",
    detailsTitle: "Контактні дані",
    nameLabel: "Ім’я",
    emailLabel: "Електронна пошта",
    emailHint: "Ми використаємо цю адресу лише для відповіді на ваше повідомлення.",
    phoneLabel: "Телефон",
    addressLabel: "Адреса",
    subjectLabel: "Тема",
    messageLabel: "Повідомлення",
    honeypotLabel: "Вебсайт",
    privacyBefore: "Я приймаю",
    privacyLink: "політику конфіденційності",
    privacyAfter: ".",
    submit: "Надіслати повідомлення",
    sending: "Надсилання повідомлення…",
    success: "Повідомлення успішно надіслано.",
    correctFields: "Виправте позначені поля.",
    invalidSubmission: "Некоректне надсилання форми.",
    genericError: "Щось пішло не так. Спробуйте пізніше.",
    rateLimited: "Забагато повідомлень. Спробуйте за кілька хвилин.",
    methodNotAllowed: "Метод не дозволено.",
    errors: {
      nameRequired: "Вкажіть ім’я.",
      nameTooShort: "Ім’я має містити щонайменше {min} символи.",
      nameTooLong: "Ім’я може містити щонайбільше {max} символів.",
      emailRequired: "Вкажіть електронну пошту.",
      emailInvalid: "Вкажіть коректну електронну адресу.",
      emailTooLong: "Електронна адреса може містити щонайбільше {max} символів.",
      subjectTooLong: "Тема може містити щонайбільше {max} символів.",
      messageRequired: "Введіть повідомлення.",
      messageTooShort: "Повідомлення має містити щонайменше {min} символів.",
      messageTooLong: "Повідомлення може містити щонайбільше {max} символів.",
      privacyRequired: "Потрібно прийняти політику конфіденційності.",
    },
  },

  email: {
    heading: "Нове повідомлення з сайту {siteName}",
    subjectWithTopic: "{siteName} – контакт: {subject}",
    subjectFromName: "{siteName} – повідомлення від {name}",
    name: "Ім’я",
    email: "Електронна пошта",
    subject: "Тема",
    noSubject: "Без теми",
    message: "Повідомлення",
  },

  pages: {
    notFound: {
      title: "Сторінку не знайдено",
      heading: "Сторінку не знайдено",
      description: "Сторінка, яку ви шукаєте, не існує або була переміщена.",
    },
    serverError: {
      title: "Помилка сервера",
      heading: "Щось пішло не так",
      description: "Сталася неочікувана помилка. Спробуйте ще раз за мить.",
    },
    privacy: {
      title: "Політика конфіденційності",
      heading: "Політика конфіденційності",
      placeholder:
        "Це зразок політики конфіденційності. Перед запуском замініть його юридичним текстом для проєкту.",
      cookiesHeading: "Файли cookie та аналітика",
      cookiesText:
        "Необов’язкові аналітичні файли cookie використовуються лише після вашої згоди. Ви можете будь-коли змінити або відкликати згоду.",
    },
    contactSent: {
      title: "Повідомлення надіслано",
      heading: "Дякуємо за ваше повідомлення",
      description: "Ми отримали ваше повідомлення і відповімо якнайшвидше.",
    },
    contactFailed: {
      title: "Повідомлення не надіслано",
      heading: "Не вдалося надіслати повідомлення",
      description: "Перевірте форму та спробуйте ще раз за кілька хвилин.",
      back: "Повернутися до контактної форми",
    },
    contact: {
      title: "Контакти",
      description: "Зв’яжіться з нами через контактну форму.",
    },
  },
} satisfies Dictionary;
