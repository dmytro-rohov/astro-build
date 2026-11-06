/**
 * Writes the fixture sites in sites/_fixtures/: three Polish businesses, each in
 * two clearly different designs built from the SAME content (what the
 * orchestrator does for a brief: one content, two proposals).
 *
 *   dance-elegant / dance-energetic      dance school, 4 pages
 *   auto-corporate / auto-bold           car repair, one page; corporate = contact "remote"
 *   cafe-warm / cafe-premium-dark        café, 2 pages; premium-dark = dark site
 *
 * Images are generated abstract compositions in each business's palette (no
 * stock photos, no licences). The sites are committed; re-run this script only
 * after changing the content here:  npx tsx scripts/site/make-fixtures.ts
 */
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { loadSite, SiteValidationError } from "../../src/site/loader";

const ROOT = path.resolve("sites/_fixtures");

type Json = Record<string, unknown>;
type Design = {
  id: string;
  archetype: string;
  /** Accent of this design; default: the brand accent. Two designs never share a color family. */
  accent?: string;
  contact?: Json;
  navbar: string;
  footer: string;
  /** Variant (and props) per section id. */
  variants: Record<string, [variant: string, props?: Json]>;
};
type Business = {
  key: string;
  /** Brand color from the brief (design A); design B picks another family (npm run site:compare). */
  accent: string;
  palette: { from: string; to: string; blobs: string[]; line: string };
  motif: "ribbons" | "bands" | "rings";
  images: Record<string, { width: number; height: number; alt: string; focal?: { x: number; y: number } }>;
  /** Hand-drawn SVG assets (partner logos). */
  svgAssets?: Record<string, { svg: string; alt: string }>;
  site: Json;
  navbarCta: Json;
  footerContent: Json;
  pages: { id: string; slug: string; title: string; description: string; nav?: Json; sections: { id: string; type: string; content: Json }[] }[];
  navigation?: Json;
  designs: Design[];
};

const HERO = { width: 1440, height: 1080 };
const ABOUT = { width: 960, height: 1200 };
const PHOTO = { width: 1200, height: 900 };

// ─── Szkoła tańca ──────────────────────────────────────────────────────────

const dance: Business = {
  key: "dance",
  accent: "#9b3d6b",
  palette: { from: "#2b1330", to: "#7a2e4f", blobs: ["#f2a7b8", "#c2577a", "#f6d2a2", "#9b3d6b"], line: "#fbe4ea" },
  motif: "ribbons",
  images: {
    hero: { ...HERO, alt: "Abstrakcyjna kompozycja w kolorach szkoły — płynne linie jak ruch w tańcu", focal: { x: 60, y: 45 } },
    about: { ...ABOUT, alt: "Abstrakcyjna kompozycja w odcieniach różu i śliwki" },
    "g-1": { ...PHOTO, alt: "Grafika: zajęcia salsy" },
    "g-2": { ...PHOTO, alt: "Grafika: lekcja baletu dla dorosłych" },
    "g-3": { ...PHOTO, alt: "Grafika: pokaz na koniec semestru" },
    "g-4": { ...PHOTO, alt: "Grafika: zajęcia hip-hopu dla dzieci" },
    "g-5": { ...PHOTO, alt: "Grafika: próba pierwszego tańca" },
    "g-6": { ...PHOTO, alt: "Grafika: wieczorek taneczny w sali" },
    "team-1": { width: 720, height: 900, alt: "Grafika w miejscu portretu: Anna Wrona" },
    "team-2": { width: 720, height: 900, alt: "Grafika w miejscu portretu: Michał Wrona" },
    "team-3": { width: 720, height: 900, alt: "Grafika w miejscu portretu: Julia Sowa" },
  },
  site: {
    lang: "pl",
    meta: {
      name: "Szkoła Tańca Pas de Deux",
      description: "Szkoła tańca w centrum Krakowa: salsa, bachata, balet dla dorosłych, pierwszy taniec i zajęcia dla dzieci. Pierwsza lekcja za darmo.",
      url: "https://pasdedeux.example",
      seo: { imageAlt: "Szkoła Tańca Pas de Deux w Krakowie" },
    },
    business: {
      type: "DanceSchool",
      name: "Pas de Deux Szkoła Tańca",
      email: "kontakt@pasdedeux.example",
      phone: "+48 12 345 67 89",
      address: { street: "ul. Długa 42", city: "Kraków", postalCode: "31-146", country: "PL" },
      hours: [
        { days: ["mo", "tu", "we", "th", "fr"], opens: "16:00", closes: "22:00" },
        { days: ["sa"], opens: "10:00", closes: "15:00" },
        { days: ["su"], closed: true },
      ],
      priceRange: "45–480 zł",
    },
  },
  navbarCta: { label: "Lekcja próbna", href: "/kontakt" },
  footerContent: {
    description: "Szkoła tańca dla dorosłych i dzieci w centrum Krakowa. Małe grupy, cierpliwi instruktorzy, dobra atmosfera.",
    groups: [
      { title: "Szkoła", links: [{ label: "Zajęcia", href: "/zajecia" }, { label: "Cennik", href: "/cennik" }, { label: "Kontakt", href: "/kontakt" }] },
      { title: "Informacje", links: [{ label: "Pytania i odpowiedzi", href: "/cennik#pytania" }, { label: "Polityka prywatności", href: "/privacy" }] },
    ],
  },
  pages: [
    {
      id: "home",
      slug: "/",
      title: "Szkoła Tańca Pas de Deux — Kraków",
      description: "Szkoła tańca w centrum Krakowa: salsa, bachata, balet dla dorosłych, pierwszy taniec i zajęcia dla dzieci. Pierwsza lekcja za darmo.",
      nav: { label: "Start", order: 0 },
      sections: [
        {
          id: "start",
          type: "hero",
          content: {
            eyebrow: "Szkoła tańca w Krakowie",
            title: "Taniec, który daje radość od pierwszego kroku",
            description: "Salsa, bachata, balet dla dorosłych i pierwszy taniec weselny. Małe grupy, cierpliwi instruktorzy i przestronna sala przy ul. Długiej.",
            primaryAction: { label: "Umów lekcję próbną", href: "/kontakt" },
            secondaryAction: { label: "Zobacz zajęcia", href: "/zajecia" },
            image: "asset:hero",
            highlights: [
              { id: "lata", value: "od 2009", label: "uczymy w Krakowie" },
              { id: "grupy", value: "max 12", label: "osób w grupie" },
              { id: "proba", value: "0 zł", label: "pierwsza lekcja" },
            ],
          },
        },
        {
          id: "o-nas",
          type: "about",
          content: {
            eyebrow: "O nas",
            title: "Uczymy tańczyć dorosłych i dzieci od 2009 roku",
            body:
              "Pas de Deux założyli **Anna i Michał Wronowie** — para taneczna z dwudziestoletnim stażem scenicznym. Od początku stawiamy na małe grupy i atmosferę, w której nikt nie boi się pomylić kroku.\n\n" +
              "Przychodzą do nas osoby, które nigdy nie tańczyły, i pary przygotowujące się do ślubu. Jeśli nie wiesz, od czego zacząć, [umów bezpłatną konsultację](/kontakt).",
            image: "asset:about",
            highlights: [
              { id: "lata", value: "15 lat", label: "na parkiecie w Krakowie" },
              { id: "grupy", value: "12 osób", label: "maksymalnie w grupie" },
              { id: "style", value: "9 stylów", label: "tańca w grafiku" },
            ],
            action: { label: "Zobacz grafik zajęć", href: "/zajecia" },
          },
        },
        {
          id: "dlaczego-my",
          type: "features",
          content: {
            eyebrow: "Dlaczego my",
            title: "Dobra szkoła tańca to coś więcej niż kroki",
            description: "Dbamy o to, żeby każda lekcja była przyjemnością — niezależnie od tego, czy tańczysz od tygodnia, czy od lat.",
            items: [
              { id: "proba", eyebrow: "Na start", title: "Lekcja próbna za darmo", description: "Przyjdź na pierwsze zajęcia bez zobowiązań i sprawdź, czy styl i grupa są dla Ciebie.", icon: "gift" },
              { id: "godziny", eyebrow: "Grafik", title: "Wieczory i soboty", description: "Zajęcia od 17:00 do 22:00 w tygodniu i przedpołudniami w soboty — po pracy i po szkole.", icon: "clock" },
              { id: "partner", eyebrow: "Bez stresu", title: "Bez partnera? Żaden problem", description: "W zajęciach w parach rotujemy partnerów, więc możesz przyjść sam lub sama.", icon: "users" },
              { id: "centrum", eyebrow: "Lokalizacja", title: "Sala w samym centrum", description: "Pięć minut pieszo od Rynku, przystanek tramwajowy Plac Inwalidów tuż obok.", icon: "map-pin" },
            ],
          },
        },
        {
          id: "instruktorzy",
          type: "team",
          content: {
            eyebrow: "Instruktorzy",
            title: "Poznaj osoby, które nauczą Cię tańczyć",
            members: [
              { id: "anna", name: "Anna Wrona", role: "Salsa, bachata", bio: "Wicemistrzyni Polski w salsie, tańczy od 20 lat. Uczy cierpliwie i z humorem.", photo: "asset:team-1" },
              { id: "michal", name: "Michał Wrona", role: "Salsa, pierwszy taniec", bio: "Choreograf ponad 300 pierwszych tańców. Przygotuje Was nawet w pięć lekcji.", photo: "asset:team-2" },
              { id: "julia", name: "Julia Sowa", role: "Balet, hip-hop dla dzieci", bio: "Absolwentka szkoły baletowej, prowadzi zajęcia dla dorosłych i najmłodszych.", photo: "asset:team-3" },
            ],
          },
        },
        {
          id: "opinie",
          type: "testimonials",
          content: {
            eyebrow: "Opinie",
            title: "Co mówią nasi kursanci",
            items: [
              {
                id: "kasia",
                quote: "Przyszłam bez żadnego doświadczenia i po trzech miesiącach tańczę salsę na imprezach. Anna tłumaczy wszystko tak, że nawet ja łapię rytm.",
                author: "Katarzyna M.",
                role: "salsa, grupa początkująca",
                rating: 5,
              },
              {
                id: "tomek",
                quote: "Pierwszy taniec przygotowaliśmy w pięć lekcji. Goście do dziś pytają, gdzie się uczyliśmy — polecamy każdej parze młodej.",
                author: "Tomasz i Ola",
                role: "pierwszy taniec",
                rating: 5,
              },
              {
                id: "ewa",
                quote: "Balet dla dorosłych to moja godzina dla siebie w tygodniu. Świetna atmosfera, nikt nikogo nie ocenia.",
                author: "Ewa K.",
                role: "balet dla dorosłych",
                rating: 5,
              },
            ],
          },
        },
        {
          id: "zapisy",
          type: "cta",
          content: {
            eyebrow: "Zapisy trwają",
            title: "Pierwsza lekcja jest na nasz koszt",
            description: "Napisz lub zadzwoń, a dobierzemy grupę do Twojego poziomu i grafiku. Nowe grupy startują co miesiąc.",
            primaryAction: { label: "Umów lekcję próbną", href: "/kontakt" },
            secondaryAction: { label: "Sprawdź cennik", href: "/cennik" },
          },
        },
      ],
    },
    {
      id: "zajecia",
      slug: "/zajecia",
      title: "Zajęcia taneczne",
      description: "Salsa, bachata, balet dla dorosłych, pierwszy taniec, hip-hop i zajęcia dla dzieci — grafik i opis stylów w Szkole Tańca Pas de Deux.",
      nav: { label: "Zajęcia", order: 1 },
      sections: [
        {
          id: "style",
          type: "services",
          content: {
            eyebrow: "Zajęcia",
            title: "Wybierz styl dla siebie",
            description: "Każdy kurs ma grupę początkującą i średniozaawansowaną. Nie wiesz, który styl wybrać? Przyjdź na lekcję próbną.",
            items: [
              { id: "salsa", title: "Salsa kubańska", description: "Energiczny taniec w parach i w kole (rueda). Najlepszy wybór na początek przygody z tańcem.", price: "od 180 zł / mies.", icon: "music" },
              { id: "bachata", title: "Bachata", description: "Zmysłowy taniec z Dominikany. Uczymy prowadzenia i podążania krok po kroku.", price: "od 180 zł / mies.", icon: "footprints" },
              { id: "balet", title: "Balet dla dorosłych", description: "Technika, postawa i rozciąganie przy drążku. Bez wymagań — wystarczą wygodne ubrania.", price: "od 200 zł / mies.", icon: "person-standing" },
              { id: "pierwszy-taniec", title: "Pierwszy taniec", description: "Indywidualne lekcje dla par młodych, z choreografią do wybranej piosenki.", price: "480 zł / 5 lekcji", icon: "heart" },
              { id: "hip-hop", title: "Hip-hop dla dzieci", description: "Zajęcia dla dzieci od 7 do 12 lat: rytm, koordynacja i mnóstwo zabawy.", price: "160 zł / mies.", icon: "baby" },
              { id: "zumba", title: "Zumba", description: "Taneczny trening cardio przy muzyce latino. Spalasz kalorie i nie myślisz o tym.", price: "45 zł / wejście", icon: "flame" },
            ],
          },
        },
        {
          id: "grafik",
          type: "schedule",
          content: {
            eyebrow: "Grafik",
            title: "Grafik zajęć",
            description: "Aktualny grafik na sezon jesienno-zimowy. Na każde zajęcia można przyjść na lekcję próbną.",
            items: [
              { id: "c1", day: "mo", start: "17:00", end: "18:00", title: "Salsa — początkujący", instructor: "Anna Wrona", level: "Początkujący" },
              { id: "c2", day: "mo", start: "18:15", end: "19:15", title: "Bachata — średniozaawansowani", instructor: "Anna Wrona", level: "Średni" },
              { id: "c3", day: "mo", start: "19:30", end: "20:30", title: "Zumba", instructor: "Julia Sowa", level: "Otwarte" },
              { id: "c4", day: "tu", start: "17:00", end: "17:45", title: "Hip-hop dla dzieci 7–9 lat", instructor: "Julia Sowa", level: "Dzieci" },
              { id: "c5", day: "tu", start: "18:00", end: "19:00", title: "Balet dla dorosłych", instructor: "Julia Sowa", level: "Początkujący" },
              { id: "c6", day: "tu", start: "19:15", end: "20:15", title: "Salsa — średniozaawansowani", instructor: "Michał Wrona", level: "Średni" },
              { id: "c7", day: "we", start: "17:00", end: "18:00", title: "Bachata — początkujący", instructor: "Anna Wrona", level: "Początkujący" },
              { id: "c8", day: "we", start: "18:15", end: "19:15", title: "Salsa rueda", instructor: "Michał Wrona", level: "Średni" },
              { id: "c9", day: "th", start: "17:00", end: "17:45", title: "Hip-hop dla dzieci 10–12 lat", instructor: "Julia Sowa", level: "Dzieci" },
              { id: "c10", day: "th", start: "18:00", end: "19:00", title: "Balet dla dorosłych", instructor: "Julia Sowa", level: "Średni" },
              { id: "c11", day: "th", start: "19:15", end: "20:15", title: "Zumba", instructor: "Julia Sowa", level: "Otwarte" },
              { id: "c12", day: "fr", start: "19:00", end: "22:00", title: "Wieczorek taneczny", instructor: "Anna i Michał Wronowie", level: "Otwarte" },
              { id: "c13", day: "sa", start: "10:00", end: "11:00", title: "Salsa — początkujący", instructor: "Michał Wrona", level: "Początkujący" },
              { id: "c14", day: "sa", start: "11:15", end: "12:15", title: "Pierwszy taniec — lekcje indywidualne", instructor: "Michał Wrona", level: "Pary" },
            ],
            note: "W święta i długie weekendy zajęcia się nie odbywają. Zmiany ogłaszamy z tygodniowym wyprzedzeniem.",
          },
        },
        {
          id: "galeria",
          type: "gallery",
          content: {
            eyebrow: "Galeria",
            title: "Z życia szkoły",
            description: "Zajęcia, pokazy na koniec semestru i wieczorki taneczne, na które zapraszamy wszystkich kursantów.",
            items: [
              { id: "g1", image: "asset:g-1", caption: "Salsa — grupa średniozaawansowana" },
              { id: "g2", image: "asset:g-2", caption: "Balet dla dorosłych przy drążku" },
              { id: "g3", image: "asset:g-3", caption: "Pokaz na koniec semestru" },
              { id: "g4", image: "asset:g-4", caption: "Hip-hop dla dzieci" },
              { id: "g5", image: "asset:g-5", caption: "Próba pierwszego tańca" },
              { id: "g6", image: "asset:g-6", caption: "Wieczorek taneczny w sali głównej" },
            ],
          },
        },
      ],
    },
    {
      id: "cennik",
      slug: "/cennik",
      title: "Cennik i karnety",
      description: "Ceny zajęć w Szkole Tańca Pas de Deux: pojedyncze wejścia, karnety miesięczne i pakiety lekcji pierwszego tańca dla par młodych.",
      nav: { label: "Cennik", order: 2 },
      sections: [
        {
          id: "karnety",
          type: "pricing",
          content: {
            eyebrow: "Cennik",
            title: "Karnety i ceny",
            description: "Płacisz za miesiąc lub za pojedyncze zajęcia. Karnet możesz zawiesić na czas urlopu.",
            plans: [
              {
                id: "wejscie",
                name: "Pojedyncze wejście",
                price: "45 zł",
                period: "za lekcję",
                description: "Dla osób, które chcą tańczyć od czasu do czasu.",
                features: ["Dowolny styl z grafiku", "Ważne 30 dni od zakupu"],
                action: { label: "Zapisz się", href: "/kontakt" },
              },
              {
                id: "miesieczny",
                name: "Karnet miesięczny",
                price: "180 zł",
                period: "miesięcznie",
                description: "Najczęściej wybierany — jeden styl, stała grupa.",
                features: ["8 lekcji w miesiącu", "Stała grupa i instruktor", "Wieczorki taneczne gratis", "Możliwość zawieszenia"],
                action: { label: "Wybieram karnet", href: "/kontakt" },
                highlighted: true,
              },
              {
                id: "slub",
                name: "Pierwszy taniec",
                price: "480 zł",
                period: "5 lekcji",
                description: "Indywidualne zajęcia dla par młodych.",
                features: ["Choreografia do Waszej piosenki", "Nagranie wideo do ćwiczeń", "Terminy dopasowane do Was"],
                action: { label: "Zapytaj o termin", href: "/kontakt" },
              },
            ],
            note: "Rodzeństwo, pary i studenci otrzymują 10% rabatu na karnety miesięczne. Ceny zawierają VAT.",
          },
        },
        {
          id: "pytania",
          type: "faq",
          content: {
            eyebrow: "FAQ",
            title: "Najczęstsze pytania",
            items: [
              { id: "partner", question: "Czy muszę przyjść z partnerem?", answer: "Nie. W zajęciach w parach **rotujemy partnerów**, więc większość kursantów przychodzi sama." },
              { id: "stroj", question: "W co się ubrać na pierwsze zajęcia?", answer: "Wystarczą wygodne ubrania i obuwie na płaskiej, gładkiej podeszwie. Na balet — skarpetki lub baletki." },
              { id: "wiek", question: "Czy jest górna granica wieku?", answer: "Nie ma. Najstarsza kursantka grupy baletowej ma 68 lat i jest naszą inspiracją." },
              { id: "nieobecnosc", question: "Co, jeśli opuszczę zajęcia?", answer: "Lekcję możesz odrobić w innej grupie na tym samym poziomie w ciągu miesiąca." },
              { id: "platnosc", question: "Jak mogę zapłacić?", answer: "Gotówką lub kartą w recepcji albo przelewem. Szczegóły podamy po [zapisie](/kontakt)." },
            ],
          },
        },
      ],
    },
    {
      id: "kontakt",
      slug: "/kontakt",
      title: "Kontakt i zapisy",
      description: "Zapisz się na lekcję próbną w Szkole Tańca Pas de Deux. Adres: ul. Długa 42, Kraków. Telefon, e-mail i godziny otwarcia recepcji.",
      nav: { label: "Kontakt", order: 3 },
      sections: [
        {
          id: "formularz",
          type: "contact",
          content: {
            eyebrow: "Kontakt",
            title: "Zapisz się lub zadaj pytanie",
            description: "Napisz, jaki styl Cię interesuje i kiedy możesz przychodzić. Odpowiadamy w ciągu jednego dnia roboczego.",
            showDetails: true,
          },
        },
        {
          id: "dojazd",
          type: "hours-location",
          content: {
            eyebrow: "Dojazd",
            title: "Godziny otwarcia i dojazd",
            description: "Sala znajduje się na pierwszym piętrze, wejście od podwórza. Najbliższy przystanek: Plac Inwalidów.",
            mapUrl: "https://www.openstreetmap.org/search?query=D%C5%82uga%2042%20Krak%C3%B3w",
            showPhone: true,
          },
        },
        {
          id: "mapa",
          type: "embed",
          content: {
            eyebrow: "Mapa",
            title: "Jak do nas trafić",
            description: "Wejście od podwórza kamienicy przy ul. Długiej 42, sala na pierwszym piętrze.",
            url: "https://www.openstreetmap.org/export/embed.html?bbox=19.9330%2C50.0680%2C19.9420%2C50.0720&layer=mapnik&marker=50.0700%2C19.9375",
            frameTitle: "Mapa: Szkoła Tańca Pas de Deux, ul. Długa 42, Kraków",
          },
        },
      ],
    },
  ],
  designs: [
    {
      id: "dance-elegant",
      archetype: "elegant",
      navbar: "centered",
      footer: "columns",
      variants: {
        start: ["split-image"],
        "o-nas": ["image-side", { imagePosition: "left" }],
        "dlaczego-my": ["icon-list"],
        instruktorzy: ["cards"],
        grafik: ["week"],
        mapa: ["split"],
        opinie: ["spotlight"],
        zapisy: ["boxed"],
        style: ["cards", { columns: "3" }],
        galeria: ["mosaic"],
        karnety: ["cards"],
        pytania: ["accordion", { openFirst: true }],
        formularz: ["form-split"],
        dojazd: ["card"],
      },
    },
    {
      id: "dance-energetic",
      archetype: "energetic",
      accent: "#7c3aed",
      navbar: "topbar",
      footer: "centered",
      variants: {
        start: ["minimal"],
        "o-nas": ["centered"],
        "dlaczego-my": ["cards-grid", { columns: "4" }],
        instruktorzy: ["compact"],
        grafik: ["table"],
        mapa: ["full"],
        opinie: ["cards"],
        zapisy: ["banner"],
        style: ["price-list"],
        galeria: ["grid"],
        karnety: ["compact"],
        pytania: ["two-column"],
        formularz: ["form-centered"],
        dojazd: ["compact"],
      },
    },
  ],
};

// ─── Warsztat samochodowy ──────────────────────────────────────────────────

const auto: Business = {
  key: "auto",
  accent: "#e05a1c",
  palette: { from: "#0f1d2b", to: "#27465f", blobs: ["#f28c28", "#3c6e91", "#c9d6df", "#e05a1c"], line: "#dbe4ea" },
  motif: "bands",
  images: {
    hero: { ...HERO, alt: "Abstrakcyjna grafika w barwach warsztatu — stalowy granat i pomarańcz", focal: { x: 55, y: 50 } },
    about: { ...ABOUT, alt: "Abstrakcyjna kompozycja geometryczna w odcieniach granatu" },
  },
  site: {
    lang: "pl",
    meta: {
      name: "AutoSerwis Kowalczyk",
      description: "Niezależny warsztat samochodowy w Poznaniu: diagnostyka, mechanika, hamulce, klimatyzacja i opony. Kosztorys przed naprawą i rok gwarancji.",
      url: "https://autoserwis-kowalczyk.example",
      seo: { imageAlt: "AutoSerwis Kowalczyk — warsztat samochodowy w Poznaniu" },
    },
    business: {
      type: "AutoRepair",
      email: "warsztat@autoserwis-kowalczyk.example",
      phone: "+48 61 222 33 44",
      address: { street: "ul. Głogowska 210", city: "Poznań", postalCode: "60-104", country: "PL" },
      hours: [
        { days: ["mo", "tu", "we", "th", "fr"], opens: "07:30", closes: "17:30" },
        { days: ["sa"], opens: "08:00", closes: "13:00" },
        { days: ["su"], closed: true },
      ],
      priceRange: "$$",
    },
  },
  navbarCta: { label: "Umów wizytę", href: "/#kontakt" },
  footerContent: {
    description: "Rodzinny warsztat samochodowy na poznańskim Łazarzu. Naprawiamy auta osobowe i dostawcze wszystkich marek.",
    groups: [
      { title: "Warsztat", links: [{ label: "Usługi i ceny", href: "/#uslugi" }, { label: "O warsztacie", href: "/#o-warsztacie" }, { label: "Opinie", href: "/#opinie" }] },
      { title: "Kontakt", links: [{ label: "Umów wizytę", href: "/#kontakt" }, { label: "Dojazd", href: "/#dojazd" }, { label: "Polityka prywatności", href: "/privacy" }] },
    ],
  },
  navigation: {
    auto: false,
    items: [
      { label: "Usługi", href: "/#uslugi" },
      { label: "O warsztacie", href: "/#o-warsztacie" },
      { label: "Opinie", href: "/#opinie" },
      { label: "Kontakt", href: "/#kontakt" },
    ],
  },
  pages: [
    {
      id: "home",
      slug: "/",
      title: "AutoSerwis Kowalczyk — warsztat samochodowy Poznań",
      description: "Niezależny warsztat samochodowy w Poznaniu: diagnostyka, mechanika, hamulce, klimatyzacja i opony. Kosztorys przed naprawą i rok gwarancji.",
      sections: [
        {
          id: "start",
          type: "hero",
          content: {
            eyebrow: "Warsztat samochodowy · Poznań Łazarz",
            title: "Naprawiamy auta tak, jakby były nasze",
            description: "Diagnostyka, mechanika, hamulce i klimatyzacja dla aut wszystkich marek. Zawsze najpierw kosztorys, potem naprawa — bez niespodzianek na fakturze.",
            primaryAction: { label: "Umów wizytę", href: "/#kontakt" },
            secondaryAction: { label: "Cennik usług", href: "/#uslugi" },
            image: "asset:hero",
            highlights: [
              { id: "lata", value: "25 lat", label: "na Łazarzu" },
              { id: "gwarancja", value: "12 mies.", label: "gwarancji" },
              { id: "ocena", value: "4,9/5", label: "średnia ocen" },
            ],
          },
        },
        {
          id: "liczby",
          type: "stats",
          content: {
            title: "Warsztat, któremu ufają kierowcy z Poznania",
            items: [
              { id: "auta", value: "12 000+", label: "naprawionych samochodów", description: "Osobowe i dostawcze do 3,5 t, wszystkich marek." },
              { id: "lata", value: "25 lat", label: "doświadczenia", description: "Rodzinny warsztat prowadzony od 1999 roku." },
              { id: "stanowiska", value: "4", label: "stanowiska naprawcze", description: "Termin na większość napraw w 48 godzin." },
              { id: "ocena", value: "4,9/5", label: "średnia ocen klientów", description: "Z opinii zebranych w ostatnich dwóch latach." },
            ],
          },
        },
        {
          id: "zalety",
          type: "features",
          content: {
            eyebrow: "Dlaczego my",
            title: "Uczciwie, szybko i z gwarancją",
            items: [
              { id: "kosztorys", eyebrow: "Przejrzyście", title: "Kosztorys przed naprawą", description: "Dzwonimy z wyceną, zanim zaczniemy. Bez Twojej zgody nie wymienimy żadnej części.", icon: "file-text" },
              { id: "gwarancja", eyebrow: "Spokój", title: "12 miesięcy gwarancji", description: "Na części i robociznę. Jeśli coś będzie nie tak — poprawimy bez dyskusji.", icon: "shield-check" },
              { id: "termin", eyebrow: "Szybko", title: "Termin w 48 godzin", description: "Na większość napraw mechanicznych przyjmujemy auto w ciągu dwóch dni roboczych.", icon: "calendar-check" },
              { id: "zastepcze", eyebrow: "Wygodnie", title: "Auto zastępcze", description: "Przy dłuższych naprawach pożyczymy Ci samochód, żebyś nie stał w miejscu.", icon: "car-front" },
            ],
          },
        },
        {
          id: "uslugi",
          type: "services",
          content: {
            eyebrow: "Usługi",
            title: "Usługi i orientacyjne ceny",
            description: "Ceny robocizny dla aut osobowych. Dokładną wycenę z częściami podamy po oględzinach.",
            items: [
              { id: "diagnostyka", title: "Diagnostyka komputerowa", description: "Odczyt i kasowanie błędów, test czujników i układów elektronicznych.", price: "od 120 zł", icon: "gauge" },
              { id: "olej", title: "Wymiana oleju i filtrów", description: "Olej dobrany do normy producenta, filtry oleju, powietrza i kabinowy.", price: "od 90 zł", icon: "droplets" },
              { id: "hamulce", title: "Układ hamulcowy", description: "Klocki, tarcze, płyn hamulcowy i przewody. Test skuteczności na rolkach.", price: "od 150 zł", icon: "wrench" },
              { id: "klimatyzacja", title: "Serwis klimatyzacji", description: "Odgrzybianie, uzupełnienie czynnika i kontrola szczelności układu.", price: "od 199 zł", icon: "snowflake" },
              { id: "opony", title: "Opony i wyważanie", description: "Wymiana sezonowa, wyważanie, naprawa i przechowalnia opon.", price: "od 100 zł", icon: "car" },
              { id: "przeglad", title: "Przegląd przed zakupem", description: "Sprawdzimy używane auto, zanim je kupisz: lakier, zawieszenie, silnik i elektronika.", price: "250 zł", icon: "clipboard-check" },
            ],
          },
        },
        {
          id: "jak-dzialamy",
          type: "process",
          content: {
            eyebrow: "Jak działamy",
            title: "Od telefonu do odbioru auta",
            steps: [
              { id: "kontakt", title: "Zgłoszenie", description: "Dzwonisz lub piszesz, opisujesz objawy. Proponujemy najbliższy termin.", icon: "phone" },
              { id: "diagnoza", title: "Diagnoza i kosztorys", description: "Sprawdzamy auto i dzwonimy z wyceną. Bez Twojej zgody nic nie wymieniamy.", icon: "clipboard-check" },
              { id: "naprawa", title: "Naprawa", description: "Naprawiamy na częściach OE lub sprawdzonych zamiennikach — Ty wybierasz.", icon: "wrench" },
              { id: "odbior", title: "Odbiór z gwarancją", description: "Pokazujemy wymienione części, wystawiamy fakturę i 12 miesięcy gwarancji.", icon: "shield-check" },
            ],
          },
        },
        {
          id: "o-warsztacie",
          type: "about",
          content: {
            eyebrow: "O warsztacie",
            title: "Rodzinny warsztat z 25-letnim doświadczeniem",
            body:
              "Warsztat prowadzi **Marek Kowalczyk** razem z synem Piotrem. Zaczynaliśmy w jednym boksie na Łazarzu, dziś mamy cztery stanowiska i stałych klientów, którzy przyjeżdżają do nas od lat.\n\n" +
              "Naprawiamy samochody osobowe i dostawcze do 3,5 t. Używamy części OE lub zamienników renomowanych producentów — zawsze do wyboru, z ceną podaną przed naprawą.",
            image: "asset:about",
            highlights: [
              { id: "lata", value: "25 lat", label: "doświadczenia" },
              { id: "stanowiska", value: "4", label: "stanowiska naprawcze" },
              { id: "auta", value: "12 000+", label: "naprawionych samochodów" },
            ],
            action: { label: "Umów wizytę", href: "/#kontakt" },
          },
        },
        {
          id: "opinie",
          type: "testimonials",
          content: {
            eyebrow: "Opinie",
            title: "Klienci o nas",
            description: "Średnia ocena 4,9 na podstawie opinii klientów z ostatnich dwóch lat.",
            items: [
              { id: "andrzej", quote: "Inny warsztat wycenił naprawę na 3000 zł. Tutaj okazało się, że wystarczy wymienić czujnik za 300 zł. Uczciwość, której szukałem.", author: "Andrzej W.", role: "Skoda Octavia", rating: 5 },
              { id: "monika", quote: "Szybki termin, auto zastępcze i telefon z wyceną przed naprawą. Tak powinien działać każdy serwis.", author: "Monika R.", role: "Toyota Yaris", rating: 5 },
              { id: "firma", quote: "Serwisujemy tu całą flotę pięciu dostawczaków. Terminy zawsze dotrzymane, faktury jasne.", author: "Paweł S.", role: "firma kurierska", rating: 5 },
            ],
          },
        },
        {
          id: "faq",
          type: "faq",
          content: {
            eyebrow: "FAQ",
            title: "Pytania przed wizytą",
            items: [
              { id: "rezerwacja", question: "Czy muszę umawiać się wcześniej?", answer: "Na diagnostykę i drobne naprawy często przyjmujemy od ręki, ale **najlepiej zadzwonić** lub zostawić wiadomość w formularzu." },
              { id: "czesci", question: "Czy mogę przywieźć własne części?", answer: "Tak, ale wtedy gwarancja obejmuje tylko robociznę. Chętnie doradzimy, które zamienniki warto wybrać." },
              { id: "czas", question: "Ile trwa wymiana klocków hamulcowych?", answer: "Zwykle około godziny. Możesz poczekać na miejscu — mamy kawę i Wi-Fi." },
              { id: "platnosc", question: "Jakie formy płatności akceptujecie?", answer: "Gotówkę, karty i BLIK. Firmom wystawiamy faktury z odroczonym terminem płatności." },
            ],
          },
        },
        {
          id: "termin",
          type: "cta",
          content: {
            eyebrow: "Wolne terminy w tym tygodniu",
            title: "Coś stuka, piszczy albo świeci się kontrolka?",
            description: "Zadzwoń lub napisz — powiemy, czy możesz jeszcze jeździć, i zaproponujemy najbliższy termin.",
            primaryAction: { label: "Zadzwoń do nas", href: "tel:+48612223344" },
            secondaryAction: { label: "Napisz wiadomość", href: "/#kontakt" },
          },
        },
        {
          id: "dojazd",
          type: "hours-location",
          content: {
            eyebrow: "Dojazd",
            title: "Godziny otwarcia",
            description: "Wjazd od ul. Głogowskiej, parking dla klientów przed warsztatem.",
            mapUrl: "https://www.openstreetmap.org/search?query=G%C5%82ogowska%20210%20Pozna%C5%84",
            showPhone: true,
          },
        },
        {
          id: "kontakt",
          type: "contact",
          content: {
            eyebrow: "Kontakt",
            title: "Umów wizytę",
            description: "Podaj markę, model i rok auta oraz opisz problem. Oddzwonimy z terminem i wstępną wyceną.",
            showDetails: true,
          },
        },
      ],
    },
  ],
  designs: [
    {
      id: "auto-corporate",
      archetype: "corporate",
      contact: { mode: "remote", endpoint: "https://forms.example.com/v1/submit" },
      navbar: "topbar",
      footer: "columns",
      variants: {
        start: ["panel"],
        liczby: ["row"],
        "jak-dzialamy": ["steps"],
        zalety: ["cards-grid", { columns: "4" }],
        uslugi: ["cards", { columns: "3" }],
        "o-warsztacie": ["image-side"],
        opinie: ["cards"],
        faq: ["accordion"],
        termin: ["banner"],
        dojazd: ["card"],
        kontakt: ["form-split"],
      },
    },
    {
      id: "auto-bold",
      archetype: "bold",
      accent: "#ca8a04",
      navbar: "simple",
      footer: "simple",
      variants: {
        start: ["cover-image"],
        liczby: ["cards"],
        "jak-dzialamy": ["timeline"],
        zalety: ["icon-list"],
        uslugi: ["price-list"],
        "o-warsztacie": ["centered"],
        opinie: ["spotlight"],
        faq: ["two-column"],
        termin: ["boxed"],
        dojazd: ["compact"],
        kontakt: ["form-centered"],
      },
    },
  ],
};

// ─── Kawiarnia ─────────────────────────────────────────────────────────────

const cafe: Business = {
  key: "cafe",
  accent: "#a0623a",
  palette: { from: "#2e1c13", to: "#7c4f33", blobs: ["#e8c9a0", "#c08552", "#f4e7d3", "#a0623a"], line: "#f6ebdc" },
  motif: "rings",
  svgAssets: {
    "dostawca-1": { alt: "Finca La Esperanza", svg: `<svg xmlns="http://www.w3.org/2000/svg" width="360" height="120" viewBox="0 0 360 120"><circle cx="52" cy="60" r="34" fill="none" stroke="#3b2418" stroke-width="6"/><path d="M38 60c8-18 20-18 28 0s20 18 28 0" fill="none" stroke="#3b2418" stroke-width="5" transform="translate(-14 0)"/><text x="104" y="62" font-family="Georgia, serif" font-size="21" font-weight="700" fill="#3b2418">FINCA LA ESPERANZA</text><text x="105" y="88" font-family="Arial, sans-serif" font-size="15" fill="#6b4a36">Kolumbia</text></svg>` },
    "dostawca-2": { alt: "Kooperatywa Sidama", svg: `<svg xmlns="http://www.w3.org/2000/svg" width="360" height="120" viewBox="0 0 360 120"><circle cx="52" cy="60" r="34" fill="none" stroke="#3b2418" stroke-width="6"/><path d="M38 60c8-18 20-18 28 0s20 18 28 0" fill="none" stroke="#3b2418" stroke-width="5" transform="translate(-14 0)"/><text x="104" y="62" font-family="Georgia, serif" font-size="26" font-weight="700" fill="#3b2418">SIDAMA</text><text x="105" y="88" font-family="Arial, sans-serif" font-size="15" fill="#6b4a36">Etiopia · kooperatywa</text></svg>` },
    "dostawca-3": { alt: "Hacienda Santa Rosa", svg: `<svg xmlns="http://www.w3.org/2000/svg" width="360" height="120" viewBox="0 0 360 120"><circle cx="52" cy="60" r="34" fill="none" stroke="#3b2418" stroke-width="6"/><path d="M38 60c8-18 20-18 28 0s20 18 28 0" fill="none" stroke="#3b2418" stroke-width="5" transform="translate(-14 0)"/><text x="104" y="62" font-family="Georgia, serif" font-size="26" font-weight="700" fill="#3b2418">SANTA ROSA</text><text x="105" y="88" font-family="Arial, sans-serif" font-size="15" fill="#6b4a36">Gwatemala</text></svg>` },
    "dostawca-4": { alt: "Młyn Ruski — mąka na zakwas", svg: `<svg xmlns="http://www.w3.org/2000/svg" width="360" height="120" viewBox="0 0 360 120"><circle cx="52" cy="60" r="34" fill="none" stroke="#3b2418" stroke-width="6"/><path d="M38 60c8-18 20-18 28 0s20 18 28 0" fill="none" stroke="#3b2418" stroke-width="5" transform="translate(-14 0)"/><text x="104" y="62" font-family="Georgia, serif" font-size="26" font-weight="700" fill="#3b2418">MŁYN RUSKI</text><text x="105" y="88" font-family="Arial, sans-serif" font-size="15" fill="#6b4a36">mąka na zakwas</text></svg>` },
  },
  images: {
    hero: { ...HERO, alt: "Abstrakcyjna kompozycja w kolorach kawy i mleka", focal: { x: 50, y: 40 } },
    about: { ...ABOUT, alt: "Abstrakcyjna grafika w odcieniach palonej kawy" },
    "g-1": { ...PHOTO, alt: "Grafika: espresso z własnej palarni" },
    "g-2": { ...PHOTO, alt: "Grafika: domowe ciasta w witrynie" },
    "g-3": { ...PHOTO, alt: "Grafika: sala z dużymi oknami" },
    "g-4": { ...PHOTO, alt: "Grafika: palenie ziaren kawy" },
  },
  site: {
    lang: "pl",
    meta: {
      name: "Ziarno i Para",
      description: "Kawiarnia specialty przy Rynku we Wrocławiu: kawa z własnej palarni, domowe ciasta i śniadania do 13:00. Wpadnij na espresso albo zostań z laptopem.",
      url: "https://ziarnoipara.example",
      seo: { imageAlt: "Kawiarnia Ziarno i Para we Wrocławiu" },
    },
    business: {
      type: "CafeOrCoffeeShop",
      email: "czesc@ziarnoipara.example",
      phone: "+48 71 555 12 34",
      address: { street: "ul. Ruska 19", city: "Wrocław", postalCode: "50-079", country: "PL" },
      hours: [
        { days: ["mo", "tu", "we", "th", "fr"], opens: "07:30", closes: "19:00" },
        { days: ["sa", "su"], opens: "09:00", closes: "20:00" },
      ],
      priceRange: "$",
    },
  },
  navbarCta: { label: "Zobacz menu", href: "/menu" },
  footerContent: {
    description: "Kawiarnia i mała palarnia kawy przy ul. Ruskiej we Wrocławiu. Codziennie świeże ciasta i śniadania.",
    groups: [
      { title: "Kawiarnia", links: [{ label: "Menu", href: "/menu" }, { label: "O nas", href: "/#o-nas" }, { label: "Godziny otwarcia", href: "/#godziny" }] },
      { title: "Informacje", links: [{ label: "Rezerwacje i wydarzenia", href: "/#kontakt" }, { label: "Polityka prywatności", href: "/privacy" }] },
    ],
  },
  pages: [
    {
      id: "home",
      slug: "/",
      title: "Ziarno i Para — kawiarnia specialty we Wrocławiu",
      description: "Kawiarnia specialty przy Rynku we Wrocławiu: kawa z własnej palarni, domowe ciasta i śniadania do 13:00. Wpadnij na espresso albo zostań z laptopem.",
      nav: { label: "Kawiarnia", order: 0 },
      sections: [
        {
          id: "start",
          type: "hero",
          content: {
            eyebrow: "Kawiarnia i palarnia · Wrocław",
            title: "Kawa palona dwie ulice od Twojej filiżanki",
            description: "Ziarna z małych plantacji, palone co tydzień na miejscu. Do tego domowe ciasta, śniadania do 13:00 i duże stoły, przy których dobrze się pracuje.",
            primaryAction: { label: "Zobacz menu", href: "/menu" },
            secondaryAction: { label: "Godziny otwarcia", href: "/#godziny" },
            image: "asset:hero",
          },
        },
        {
          id: "o-nas",
          type: "about",
          content: {
            eyebrow: "O nas",
            title: "Mała palarnia, duża miłość do kawy",
            body:
              "Ziarno i Para otworzyliśmy w 2018 roku w kamienicy przy ul. Ruskiej. **Kawę palimy sami** — w małych partiach, żeby zawsze była świeża i miała swój charakter.\n\n" +
              "Ciasta pieczemy każdego ranka, a śniadania przygotowujemy z produktów od lokalnych dostawców. Ziarna z naszej palarni kupisz też na wynos — zmielimy je pod Twój ekspres.",
            image: "asset:about",
            highlights: [
              { id: "palarnia", value: "co tydzień", label: "świeżo palone ziarna" },
              { id: "kawy", value: "6 kaw", label: "single origin w ofercie" },
              { id: "miejsca", value: "40 miejsc", label: "w sali i ogródku" },
            ],
          },
        },
        {
          id: "dostawcy",
          type: "logo-cloud",
          content: {
            eyebrow: "Skąd ziarna",
            title: "Kupujemy bezpośrednio od farm i lokalnych wytwórców",
            items: [
              { id: "esperanza", name: "Finca La Esperanza", logo: "asset:dostawca-1" },
              { id: "sidama", name: "Kooperatywa Sidama", logo: "asset:dostawca-2" },
              { id: "santa-rosa", name: "Hacienda Santa Rosa", logo: "asset:dostawca-3" },
              { id: "mlyn", name: "Młyn Ruski", logo: "asset:dostawca-4" },
            ],
          },
        },
        {
          id: "atuty",
          type: "features",
          content: {
            eyebrow: "Dlaczego warto",
            title: "Miejsce na szybkie espresso i na długie popołudnie",
            items: [
              { id: "palarnia", title: "Własna palarnia", description: "Palimy w małych partiach i podajemy kawę najwyżej trzy tygodnie po wypaleniu.", icon: "coffee" },
              { id: "sniadania", title: "Śniadania do 13:00", description: "Jajka po turecku, owsianka, kanapki na chlebie na zakwasie — także w wersji wegańskiej.", icon: "croissant" },
              { id: "praca", title: "Dobre miejsce do pracy", description: "Szybkie Wi-Fi, gniazdka przy stołach i cisza przed południem.", icon: "wifi" },
              { id: "psy", title: "Psy mile widziane", description: "Dla czworonogów zawsze stoi miska z wodą, a czasem znajdzie się też smakołyk.", icon: "dog" },
            ],
          },
        },
        {
          id: "galeria",
          type: "gallery",
          content: {
            eyebrow: "Galeria",
            title: "Zajrzyj do środka",
            items: [
              { id: "g1", image: "asset:g-1", caption: "Espresso z naszej palarni" },
              { id: "g2", image: "asset:g-2", caption: "Ciasta pieczone każdego ranka" },
              { id: "g3", image: "asset:g-3", caption: "Sala z widokiem na Ruską" },
              { id: "g4", image: "asset:g-4", caption: "Palenie ziaren w czwartki" },
            ],
          },
        },
        {
          id: "opinie",
          type: "testimonials",
          content: {
            eyebrow: "Opinie gości",
            title: "Wracają do nas codziennie",
            items: [
              { id: "julia", quote: "Najlepsze flat white we Wrocławiu i sernik, za którym jeżdżę przez pół miasta. Obsługa pamięta, co zamawiam.", author: "Julia P.", role: "stała bywalczyni", rating: 5 },
              { id: "marcin", quote: "Pracuję tu zdalnie dwa razy w tygodniu. Spokojnie, wygodnie, a kawa z drippera to małe dzieło sztuki.", author: "Marcin L.", role: "programista", rating: 5 },
              { id: "agnieszka", quote: "Kupuję ziarna na wynos — baristka zawsze doradzi, co pasuje do mojej kawiarki.", author: "Agnieszka T.", rating: 5 },
            ],
          },
        },
        {
          id: "godziny",
          type: "hours-location",
          content: {
            eyebrow: "Odwiedź nas",
            title: "Godziny otwarcia",
            description: "Trzy minuty pieszo od Rynku. Latem zapraszamy do ogródka na podwórzu kamienicy.",
            mapUrl: "https://www.openstreetmap.org/search?query=Ruska%2019%20Wroc%C5%82aw",
            showPhone: false,
          },
        },
        {
          id: "mapa",
          type: "embed",
          content: {
            title: "Trzy minuty od Rynku",
            description: "Wejście od ul. Ruskiej, ogródek na podwórzu kamienicy.",
            url: "https://www.openstreetmap.org/export/embed.html?bbox=17.0250%2C51.1080%2C17.0330%2C51.1120&layer=mapnik&marker=51.1100%2C17.0290",
            frameTitle: "Mapa: kawiarnia Ziarno i Para, ul. Ruska 19, Wrocław",
          },
        },
        {
          id: "kontakt",
          type: "contact",
          content: {
            eyebrow: "Rezerwacje i wydarzenia",
            title: "Urodziny, spotkanie, degustacja?",
            description: "Na co dzień nie przyjmujemy rezerwacji, ale chętnie przygotujemy salę na Twoje wydarzenie. Napisz, ile osób i kiedy.",
            showDetails: true,
          },
        },
      ],
    },
    {
      id: "menu",
      slug: "/menu",
      title: "Menu",
      description: "Menu kawiarni Ziarno i Para: espresso, kawy przelewowe z własnej palarni, herbaty, domowe ciasta i śniadania. Aktualne ceny.",
      nav: { label: "Menu", order: 1 },
      sections: [
        {
          id: "napoje",
          type: "services",
          content: {
            eyebrow: "Menu",
            title: "Kawa, herbata i coś słodkiego",
            description: "Mleko roślinne bez dopłaty. Kawy przelewowe przygotowujemy z aktualnie palonych ziaren — zapytaj baristę o dzisiejszy wybór.",
            items: [
              { id: "espresso", title: "Espresso", description: "Nasza mieszanka sezonowa, podwójne shot.", price: "9 zł" },
              { id: "flat-white", title: "Flat white", description: "Podwójne espresso z aksamitnym mlekiem.", price: "15 zł" },
              { id: "cappuccino", title: "Cappuccino", description: "Klasyka w filiżance 180 ml.", price: "14 zł" },
              { id: "drip", title: "Kawa z drippera", description: "Single origin z naszej palarni, metoda V60.", price: "18 zł" },
              { id: "herbata", title: "Herbata liściasta", description: "Czarna, zielona lub ziołowa z małych manufaktur.", price: "12 zł" },
              { id: "sernik", title: "Sernik baskijski", description: "Pieczony codziennie rano, podawany z sezonowymi owocami.", price: "16 zł" },
              { id: "sniadanie", title: "Śniadanie dnia", description: "Codziennie inne, do 13:00. Zapytaj przy barze.", price: "29 zł" },
              { id: "ziarna", title: "Ziarna na wynos (250 g)", description: "Zmielimy pod Twój ekspres, kawiarkę lub drip.", price: "od 45 zł" },
            ],
          },
        },
        {
          id: "wpadnij",
          type: "cta",
          content: {
            title: "Czekamy z ekspresem gotowym do pracy",
            description: "Otwieramy o 7:30 w tygodniu i o 9:00 w weekendy. Ul. Ruska 19, trzy minuty od Rynku.",
            primaryAction: { label: "Jak do nas trafić", href: "/#godziny" },
          },
        },
      ],
    },
  ],
  designs: [
    {
      id: "cafe-warm",
      archetype: "warm",
      navbar: "simple",
      footer: "columns",
      variants: {
        start: ["split-image"],
        "o-nas": ["image-side", { imagePosition: "right" }],
        dostawcy: ["grid"],
        mapa: ["split"],
        atuty: ["cards-grid", { columns: "2" }],
        galeria: ["mosaic"],
        opinie: ["cards"],
        godziny: ["card"],
        kontakt: ["form-split"],
        napoje: ["price-list"],
        wpadnij: ["boxed"],
      },
    },
    {
      id: "cafe-premium-dark",
      archetype: "premium-dark",
      accent: "#d4a537",
      navbar: "centered",
      footer: "centered",
      variants: {
        start: ["cover-image"],
        "o-nas": ["centered"],
        dostawcy: ["row"],
        mapa: ["full"],
        atuty: ["icon-list"],
        galeria: ["grid"],
        opinie: ["spotlight"],
        godziny: ["compact"],
        kontakt: ["form-centered"],
        napoje: ["cards", { columns: "2" }],
        wpadnij: ["banner"],
      },
    },
  ],
};

// ─── Abstract images ───────────────────────────────────────────────────────

function random(seed: number) {
  return () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };
}

function artwork(business: Business, seed: number, width: number, height: number): string {
  const rand = random(seed * 7919 + business.key.length);
  const { from, to, blobs, line } = business.palette;
  const size = Math.max(width, height);
  const shapes: string[] = [];

  for (let index = 0; index < 5; index++) {
    const r = size * (0.18 + rand() * 0.22);
    shapes.push(`<circle cx="${rand() * width}" cy="${rand() * height}" r="${r}" fill="${blobs[index % blobs.length]}" opacity="${0.55 + rand() * 0.35}"/>`);
  }

  const lines: string[] = [];

  if (business.motif === "ribbons") {
    for (let index = 0; index < 6; index++) {
      const y = height * (0.2 + rand() * 0.6);
      const amplitude = height * (0.15 + rand() * 0.2);
      lines.push(
        `<path d="M ${-width * 0.1} ${y} C ${width * 0.3} ${y - amplitude}, ${width * 0.6} ${y + amplitude}, ${width * 1.1} ${y - amplitude * 0.4}" stroke="${line}" stroke-width="${2 + rand() * 6}" fill="none" opacity="${0.25 + rand() * 0.35}"/>`,
      );
    }
  } else if (business.motif === "bands") {
    for (let index = 0; index < 5; index++) {
      const x = width * (rand() * 1.2 - 0.2);
      const band = width * (0.04 + rand() * 0.1);
      lines.push(`<rect x="${x}" y="${-height}" width="${band}" height="${height * 3}" fill="${blobs[index % blobs.length]}" opacity="${0.18 + rand() * 0.3}" transform="rotate(-28 ${width / 2} ${height / 2})"/>`);
    }
    for (let index = 0; index < 3; index++) {
      const r = size * (0.08 + rand() * 0.12);
      lines.push(`<circle cx="${rand() * width}" cy="${rand() * height}" r="${r}" stroke="${line}" stroke-width="${r * 0.12}" fill="none" opacity="0.35"/>`);
    }
  } else {
    const cx = width * (0.3 + rand() * 0.4);
    const cy = height * (0.35 + rand() * 0.3);
    for (let index = 1; index <= 7; index++) {
      lines.push(`<circle cx="${cx}" cy="${cy}" r="${size * 0.06 * index}" stroke="${line}" stroke-width="${3 + index}" fill="none" opacity="${0.5 - index * 0.05}"/>`);
    }
    for (let index = 0; index < 3; index++) {
      const x = cx + (index - 1) * size * 0.06;
      lines.push(`<path d="M ${x} ${cy - size * 0.1} c ${size * 0.04} ${-size * 0.06}, ${-size * 0.04} ${-size * 0.1}, 0 ${-size * 0.18}" stroke="${line}" stroke-width="6" fill="none" stroke-linecap="round" opacity="0.4"/>`);
    }
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${from}"/><stop offset="1" stop-color="${to}"/></linearGradient>
    <filter id="soft" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="${size * 0.07}"/></filter>
    <filter id="grain"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="${seed}"/><feColorMatrix values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.07 0"/></filter>
  </defs>
  <rect width="100%" height="100%" fill="url(#bg)"/>
  <g filter="url(#soft)">${shapes.join("")}</g>
  <g>${lines.join("")}</g>
  <rect width="100%" height="100%" filter="url(#grain)"/>
</svg>`;
}

// ─── Writing ───────────────────────────────────────────────────────────────

fs.rmSync(ROOT, { recursive: true, force: true });

for (const business of [dance, auto, cafe]) {
  // Render each image once per business; both designs share them.
  const rendered: Record<string, Buffer> = {};
  let seed = 1;

  for (const [id, image] of Object.entries(business.images)) {
    rendered[id] = await sharp(Buffer.from(artwork(business, seed++, image.width, image.height)))
      .jpeg({ quality: 74, mozjpeg: true })
      .toBuffer();
  }

  for (const design of business.designs) {
    const dir = path.join(ROOT, design.id);
    fs.mkdirSync(path.join(dir, "assets"), { recursive: true });

    const assets: Record<string, Json> = {};
    for (const [id, image] of Object.entries(business.images)) {
      fs.writeFileSync(path.join(dir, "assets", `${id}.jpg`), rendered[id]);
      assets[id] = { file: `${id}.jpg`, alt: image.alt, ...(image.focal ? { focal: image.focal } : {}) };
    }
    for (const [id, asset] of Object.entries(business.svgAssets ?? {})) {
      fs.writeFileSync(path.join(dir, "assets", `${id}.svg`), asset.svg);
      assets[id] = { file: `${id}.svg`, alt: asset.alt };
    }

    const site = {
      $schema: "../../../dist-catalog/site.schema.json",
      schemaVersion: 1,
      engine: "^3.0.0",
      siteId: design.id,
      ...business.site,
      theme: { archetype: design.archetype, accent: design.accent ?? business.accent },
      ...(design.contact ? { contact: design.contact } : {}),
      layout: {
        navbar: { variant: design.navbar, props: { sticky: true }, content: { cta: business.navbarCta } },
        footer: { variant: design.footer, props: {}, content: business.footerContent },
      },
      navigation: business.navigation ?? { auto: true },
      pages: business.pages.map((page) => ({
        ...page,
        sections: page.sections.map((section) => {
          const [variant, props] = design.variants[section.id] ?? [];
          if (!variant) throw new Error(`${design.id}: no variant for section "${section.id}"`);
          return { id: section.id, type: section.type, variant, props: props ?? {}, content: section.content };
        }),
      })),
    };

    fs.writeFileSync(path.join(dir, "assets", "assets.json"), `${JSON.stringify(assets, null, 2)}\n`);
    fs.writeFileSync(path.join(dir, "site.json"), `${JSON.stringify(site, null, 2)}\n`);

    try {
      const { warnings } = loadSite(dir);
      console.log(`✔ ${design.id}${warnings.length ? ` (${warnings.length} warning(s))` : ""}`);
    } catch (error) {
      if (!(error instanceof SiteValidationError)) throw error;
      console.error(`✖ ${design.id}\n${error.message}`);
      process.exitCode = 1;
    }
  }
}
