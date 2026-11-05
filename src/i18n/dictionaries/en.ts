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

  days: {
    mo: { short: "Mon", long: "Monday" },
    tu: { short: "Tue", long: "Tuesday" },
    we: { short: "Wed", long: "Wednesday" },
    th: { short: "Thu", long: "Thursday" },
    fr: { short: "Fri", long: "Friday" },
    sa: { short: "Sat", long: "Saturday" },
    su: { short: "Sun", long: "Sunday" },
  },

  sections: {
    hoursTitle: "Opening hours",
    closed: "Closed",
    address: "Address",
    phone: "Phone",
    email: "Email",
    openInMaps: "Open in maps",
    popularPlan: "Most popular",
    rating: "Rating: {value} out of 5",
    contactBar: "Contact details",
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
    detailsTitle: "Contact details",
    nameLabel: "Name",
    emailLabel: "Email",
    emailHint: "We will use this email only to reply to your message.",
    phoneLabel: "Phone",
    addressLabel: "Address",
    subjectLabel: "Subject",
    messageLabel: "Message",
    honeypotLabel: "Website",
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
      placeholder:
        "This is a placeholder privacy policy. Replace it with project-specific legal content before production deployment.",
      cookiesHeading: "Cookies and analytics",
      cookiesText:
        "Optional analytics cookies are used only after you give consent. You can change or withdraw your consent at any time.",
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
