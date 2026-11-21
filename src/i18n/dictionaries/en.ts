/**
 * English UI texts. This file defines the dictionary shape —
 * every other language must provide the same keys.
 *
 * Placeholders like {name} are filled with `format()` from "@/i18n".
 */
export const en = {
  meta: {
    /** Open Graph locale, e.g. "en_US". */
    ogLocale: "en_US",
    /** Text direction: "ltr" or "rtl" (Arabic, Hebrew…). */
    dir: "ltr",
    titleTemplate: "{title} | {siteName}",
  },

  /** `on` completes the hours status "opens {day} at 9:00" (Polish: "w poniedziałek", "we wtorek"). */
  days: {
    mo: { short: "Mon", long: "Monday", on: "on Monday" },
    tu: { short: "Tue", long: "Tuesday", on: "on Tuesday" },
    we: { short: "Wed", long: "Wednesday", on: "on Wednesday" },
    th: { short: "Thu", long: "Thursday", on: "on Thursday" },
    fr: { short: "Fri", long: "Friday", on: "on Friday" },
    sa: { short: "Sat", long: "Saturday", on: "on Saturday" },
    su: { short: "Sun", long: "Sunday", on: "on Sunday" },
  },

  sections: {
    hoursTitle: "Opening hours",
    closed: "Closed",
    address: "Address",
    phone: "Phone",
    email: "Email",
    openInMaps: "Open in maps",
    directions: "Get directions",
    /** Live status of the opening hours (computed in the browser): "Open now · until 18:00". */
    openNow: "Open now",
    openUntil: "until {time}",
    opensToday: "opens today at {time}",
    opensTomorrow: "opens tomorrow at {time}",
    opensOn: "opens {day} at {time}",
    today: "Today",
    mapLoad: "Show the map",
    mapTitle: "Map: {place}",
    popularPlan: "Most popular",
    planPrice: "Price",
    planIncluded: "Included",
    planExcluded: "Not included",
    rating: "Rating: {value} out of 5",
    contactBar: "Contact details",
    scheduleTime: "Time",
    scheduleClass: "Class",
    scheduleInstructor: "Instructor",
    scheduleLevel: "Level",
    scheduleRoom: "Room",
    scheduleDay: "Day",
    embedLoad: "Show content from {provider}",
    embedNotice: "This content is loaded from {provider}. After you click, {provider} may set cookies and receive your IP address.",
    embedOpen: "Open in {provider}",
    step: "Step {number}",
    gallery: "Gallery",
    /** Review count under an overall rating, by plural category (Intl.PluralRules). */
    reviews: { one: "{count} review", few: "{count} reviews", many: "{count} reviews", other: "{count} reviews" },
    /** Title of the contact card in the about "bio" layout. */
    letsTalk: "Let's talk",
  },

  /** faq variants: split-contact card, categories, search. */
  faq: {
    contactTitle: "Still have a question?",
    contactText: "We will gladly answer it. Get in touch.",
    /** Questions without a category when the others have one. */
    other: "Other",
    searchLabel: "Search the questions",
    searchPlaceholder: "What are you looking for?",
    filters: "Question topics",
    all: "All",
    /** Result count while searching, by plural category (Intl.PluralRules). */
    results: { one: "{count} question found", few: "{count} questions found", many: "{count} questions found", other: "{count} questions found" },
    noResults: "No question matches “{query}”.",
    askLead: "Didn't find your question?",
    ask: "Ask us",
  },

  slider: {
    previous: "Previous",
    next: "Next",
    label: "Scrollable list",
    page: "Show {number} of {count}",
    /** Toggle of a moving band of logos (pressed = stopped). */
    pause: "Pause scrolling",
  },

  lightbox: {
    label: "Photo viewer",
    close: "Close",
    previous: "Previous photo",
    next: "Next photo",
    status: "Photo {number} of {count}",
  },

  common: {
    skipToContent: "Skip to content",
    backToHome: "Back to home page",
  },

  nav: {
    label: "Main navigation",
    menu: "Menu",
    home: "Home",
    features: "Features",
    components: "Components",
    contact: "Contact",
  },

  footer: {
    product: "Product",
    legal: "Legal",
    privacyPolicy: "Privacy policy",
    cookieSettings: "Cookie settings",
    copyright: "© {year} {siteName}. All rights reserved.",
    contact: "Contact",
    ctaTitle: "Questions? We're happy to help.",
    getInTouch: "Get in touch",
    follow: "Follow us",
  },

  // v3.7: the Factory easter eggs (src/site/signature.ts). "Powered by mytko factory" is a brand name, not translated.
  signature: {
    comment: "{siteName} was built with Mytko Website Factory: {url}",
    commentHint: "Curious how it works? Open the browser console (F12), something is waiting for you there.",
    console: "This website was built with Mytko Website Factory. Want one like it for your business? {url}",
    consoleHint: "Psst… the next secret is waiting at {url}",
    markLabel: "How this website was made",
    title: "You found the last secret",
    text: "{siteName} was built with Mytko Website Factory.",
    factStatic: "Static pages built with Astro, so they load fast",
    factStyles: "Only the styles and scripts of the sections this site uses",
    factEngine: "Factory engine {version}",
    link: "Discover Mytko Website Factory",
    close: "Close",
    humans: {
      team: "TEAM",
      owner: "Website owner",
      website: "Website",
      madeWith: "Built with",
      studio: "Studio",
      site: "SITE",
      language: "Language",
      updated: "Last update",
      technology: "Technology",
      engine: "Engine",
      secret: "ONE MORE THING",
      hint: "One last secret is left: a small mark at the bottom of the website. Click it.",
    },
  },

  // v3.9: blog lists (posts section) and post pages (layout.article).
  blog: {
    empty: "The first posts are coming soon.",
    readMore: "Read more",
    allPosts: "All posts",
    showMore: "Show more posts",
    filterLabel: "Categories",
    filterAll: "All",
    published: "Published {date}",
    updated: "Updated {date}",
    readingTime: "{minutes} min read",
    toc: "Contents",
    related: "Read also",
    newer: "Newer post",
    older: "Older post",
    share: "Share",
    copyLink: "Copy link",
    copied: "Link copied",
    shareEmail: "E-mail",
    tags: "Tags",
    progress: "Reading progress",
    author: "Author",
    ctaTitle: "Have a question? We are happy to help.",
    ctaText: "Write or call us, we will reply as soon as we can.",
    ctaButton: "Contact us",
    photos: "Photos",
    breadcrumb: "Breadcrumb",
    rss: "RSS feed",
    feedDescription: "Posts from {siteName}.",
  },

  cookies: {
    title: "Optional analytics",
    description:
      "We use optional Google Analytics cookies to understand how visitors use this website. Analytics stays disabled unless you accept it.",
    privacyLink: "Privacy policy",
    reject: "Reject",
    accept: "Accept analytics",
  },

  contactForm: {
    eyebrow: "Contact",
    title: "Let’s build something together.",
    description: "Send a message and we will get back to you as soon as possible.",
    descriptionNoForm: "Call or write to us, and we will get back to you as soon as possible.",
    detailsTitle: "Contact details",
    nameLabel: "Name",
    emailLabel: "Email",
    emailHint: "We will use this email only to reply to your message.",
    phoneLabel: "Phone",
    addressLabel: "Address",
    callTitle: "Call us",
    writeTitle: "Send an email",
    visitTitle: "Visit us",
    directions: "Get directions",
    mapTitle: "Map: {place}",
    subjectLabel: "Subject",
    messageLabel: "Message",
    honeypotLabel: "Website",
    selectPlaceholder: "Choose…",
    privacyBefore: "I accept the",
    privacyLink: "privacy policy",
    privacyAfter: ".",
    submit: "Send message",
    sending: "Sending message…",
    success: "Your message has been sent successfully.",
    correctFields: "Please correct the highlighted fields.",
    invalidSubmission: "Invalid form submission.",
    genericError: "Something went wrong. Please try again later.",
    rateLimited: "Too many messages. Please try again in a few minutes.",
    methodNotAllowed: "Method not allowed.",
    errors: {
      nameRequired: "Name is required.",
      nameTooShort: "Name must be at least {min} characters.",
      nameTooLong: "Name can be at most {max} characters.",
      emailRequired: "Email is required.",
      emailInvalid: "Enter a valid email address.",
      emailTooLong: "Email can be at most {max} characters.",
      subjectTooLong: "Subject can be at most {max} characters.",
      messageRequired: "Message is required.",
      messageTooShort: "Message must be at least {min} characters.",
      messageTooLong: "Message can be at most {max} characters.",
      privacyRequired: "You need to accept the privacy policy.",
      fieldRequired: "{label}: this field is required.",
      fieldTooShort: "{label}: at least {min} characters.",
      fieldTooLong: "{label}: at most {max} characters.",
      checkboxRequired: "Tick this box to send the message.",
      telInvalid: "Enter a valid phone number.",
      optionInvalid: "Choose one of the options.",
      dateInvalid: "Enter a valid date.",
      numberInvalid: "Enter a number.",
    },
  },

  email: {
    heading: "New message from {siteName}",
    subjectWithTopic: "{siteName} contact: {subject}",
    subjectFromName: "{siteName} contact from {name}",
    name: "Name",
    email: "Email",
    subject: "Subject",
    noSubject: "No subject",
    checked: "yes",
    message: "Message",
  },

  pages: {
    notFound: {
      title: "Page not found",
      heading: "Page not found",
      description: "The page you are looking for does not exist or has been moved.",
    },
    serverError: {
      title: "Server error",
      heading: "Something went wrong",
      description: "An unexpected error occurred. Please try again in a moment.",
    },
    privacy: {
      title: "Privacy policy",
      heading: "Privacy policy",
      description: "How {name} processes personal data and uses cookies.",
      controllerHeading: "Data controller",
      controllerText: "The controller of your personal data is {name}{address}.",
      contactText: "For any questions about your data, write to {email}.",
      dataHeading: "What data we process",
      dataText: "When you use the contact form we process your name, email address, the subject and content of your message. Our hosting provider also records technical data (IP address, date and time of the request) for security reasons.",
      purposeHeading: "Purpose and legal basis",
      purposeText: "We use the data to reply to your message and to keep the website secure, on the basis of our legitimate interest (Art. 6(1)(f) GDPR) and of taking steps at your request before entering into a contract (Art. 6(1)(b) GDPR).",
      retentionHeading: "How long we keep the data",
      retentionText: "Messages are kept for as long as needed to handle your request, and then for up to 12 months in case of follow-up questions. Server logs are kept for up to 30 days.",
      rightsHeading: "Your rights",
      rightsText: "You have the right to access, rectify, erase and restrict the processing of your data, to object to processing, to data portability and to lodge a complaint with the data protection authority.",
      cookiesHeading: "Cookies and analytics",
      cookiesText: "Optional analytics cookies (Google Analytics) are used only after you give consent. You can change or withdraw your consent at any time.",
      noCookiesText: "This website does not use analytics or advertising cookies. A small entry in your browser storage may remember your cookie choice.",
      embedsText: "Some pages show content from {providers} (maps, booking or video). It loads only after you click it; from then on the provider receives your IP address and may set its own cookies under its own privacy policy.",
      updated: "Last updated: {date}",
    },
    contactSent: {
      title: "Message sent",
      heading: "Thank you for your message",
      description: "We have received your message and will reply as soon as possible.",
    },
    contactFailed: {
      title: "Message not sent",
      heading: "Your message could not be sent",
      description: "Please check the form and try again in a few minutes.",
      back: "Back to the contact form",
    },
    contact: {
      title: "Contact",
      description: "Get in touch using the contact form.",
    },
  },
};

export default en;

type DictionaryShape<T> = {
  [Key in keyof T]: T[Key] extends string ? string : DictionaryShape<T[Key]>;
};

export type Dictionary = DictionaryShape<typeof en>;
