import type { Dictionary } from "./en";

export default {
  meta: {
    ogLocale: "pl_PL",
    dir: "ltr",
    titleTemplate: "{title} | {siteName}",
  },

  days: {
    mo: { short: "Pn", long: "Poniedziałek" },
    tu: { short: "Wt", long: "Wtorek" },
    we: { short: "Śr", long: "Środa" },
    th: { short: "Cz", long: "Czwartek" },
    fr: { short: "Pt", long: "Piątek" },
    sa: { short: "Sb", long: "Sobota" },
    su: { short: "Nd", long: "Niedziela" },
  },

  sections: {
    hoursTitle: "Godziny otwarcia",
    closed: "Zamknięte",
    address: "Adres",
    phone: "Telefon",
    email: "E-mail",
    openInMaps: "Otwórz w mapach",
    popularPlan: "Najczęściej wybierany",
    rating: "Ocena: {value} na 5",
    contactBar: "Dane kontaktowe",
  },

  common: {
    skipToContent: "Przejdź do treści",
    backToHome: "Wróć na stronę główną",
  },

  nav: {
    label: "Nawigacja główna",
    menu: "Menu",
    home: "Strona główna",
    features: "Funkcje",
    components: "Komponenty",
    contact: "Kontakt",
  },

  footer: {
    product: "Produkt",
    legal: "Informacje prawne",
    privacyPolicy: "Polityka prywatności",
    cookieSettings: "Ustawienia cookies",
    copyright: "© {year} {siteName}. Wszelkie prawa zastrzeżone.",
  },

  cookies: {
    title: "Opcjonalna analityka",
    description:
      "Używamy opcjonalnych plików cookie Google Analytics, aby zrozumieć, jak odwiedzający korzystają z tej strony. Analityka pozostaje wyłączona, dopóki jej nie zaakceptujesz.",
    privacyLink: "Polityka prywatności",
    reject: "Odrzuć",
    accept: "Akceptuj analitykę",
  },

  contactForm: {
    eyebrow: "Kontakt",
    title: "Porozmawiajmy o Twoim projekcie.",
    description: "Wyślij wiadomość, a odpowiemy najszybciej, jak to możliwe.",
    detailsTitle: "Dane kontaktowe",
    nameLabel: "Imię i nazwisko",
    emailLabel: "E-mail",
    emailHint: "Użyjemy tego adresu wyłącznie do odpowiedzi na Twoją wiadomość.",
    phoneLabel: "Telefon",
    addressLabel: "Adres",
    subjectLabel: "Temat",
    messageLabel: "Wiadomość",
    honeypotLabel: "Strona internetowa",
    privacyBefore: "Akceptuję",
    privacyLink: "politykę prywatności",
    privacyAfter: ".",
    submit: "Wyślij wiadomość",
    sending: "Wysyłanie wiadomości…",
    success: "Wiadomość została wysłana.",
    correctFields: "Popraw zaznaczone pola.",
    invalidSubmission: "Nieprawidłowe zgłoszenie formularza.",
    genericError: "Coś poszło nie tak. Spróbuj ponownie później.",
    rateLimited: "Zbyt wiele wiadomości. Spróbuj ponownie za kilka minut.",
    methodNotAllowed: "Metoda niedozwolona.",
    errors: {
      nameRequired: "Podaj imię i nazwisko.",
      nameTooShort: "Imię musi mieć co najmniej {min} znaki.",
      nameTooLong: "Imię może mieć maksymalnie {max} znaków.",
      emailRequired: "Podaj adres e-mail.",
      emailInvalid: "Podaj prawidłowy adres e-mail.",
      emailTooLong: "Adres e-mail może mieć maksymalnie {max} znaków.",
      subjectTooLong: "Temat może mieć maksymalnie {max} znaków.",
      messageRequired: "Wpisz wiadomość.",
      messageTooShort: "Wiadomość musi mieć co najmniej {min} znaków.",
      messageTooLong: "Wiadomość może mieć maksymalnie {max} znaków.",
      privacyRequired: "Musisz zaakceptować politykę prywatności.",
    },
  },

  email: {
    heading: "Nowa wiadomość ze strony {siteName}",
    subjectWithTopic: "{siteName} – kontakt: {subject}",
    subjectFromName: "{siteName} – wiadomość od {name}",
    name: "Imię i nazwisko",
    email: "E-mail",
    subject: "Temat",
    noSubject: "Bez tematu",
    message: "Wiadomość",
  },

  pages: {
    notFound: {
      title: "Nie znaleziono strony",
      heading: "Nie znaleziono strony",
      description: "Strona, której szukasz, nie istnieje lub została przeniesiona.",
    },
    serverError: {
      title: "Błąd serwera",
      heading: "Coś poszło nie tak",
      description: "Wystąpił nieoczekiwany błąd. Spróbuj ponownie za chwilę.",
    },
    privacy: {
      title: "Polityka prywatności",
      heading: "Polityka prywatności",
      placeholder:
        "To jest przykładowa polityka prywatności. Przed wdrożeniem produkcyjnym zastąp ją treścią przygotowaną dla projektu.",
      cookiesHeading: "Pliki cookie i analityka",
      cookiesText:
        "Opcjonalne analityczne pliki cookie są używane wyłącznie po wyrażeniu zgody. Zgodę możesz w każdej chwili zmienić lub wycofać.",
    },
    contactSent: {
      title: "Wiadomość wysłana",
      heading: "Dziękujemy za wiadomość",
      description: "Otrzymaliśmy Twoją wiadomość i odpowiemy najszybciej, jak to możliwe.",
    },
    contactFailed: {
      title: "Wiadomość nie została wysłana",
      heading: "Nie udało się wysłać wiadomości",
      description: "Sprawdź formularz i spróbuj ponownie za kilka minut.",
      back: "Wróć do formularza kontaktowego",
    },
    contact: {
      title: "Kontakt",
      description: "Skontaktuj się z nami przez formularz kontaktowy.",
    },
  },
} satisfies Dictionary;
