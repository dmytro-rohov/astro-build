/**
 * Icon set of the engine: one consistent family (Lucide, ISC license, package
 * lucide-static) curated for small-business sites. site.json picks icons by
 * name from this list (services, features, footer social links); the build puts
 * only the icons a site uses into its sprite (scripts/build-icons.js).
 *
 * `keywords` (Polish + English) help the orchestrator / AI pick a fitting icon.
 * Adding an icon: add an entry (Lucide name in `lucide` when it differs), run
 * `npm run build:system`. Icons outside Lucide are not supported (one consistent family).
 */

export type IconCategory =
  | "general"
  | "contact"
  | "time"
  | "business"
  | "food"
  | "beauty-health"
  | "sport"
  | "auto-transport"
  | "home-construction"
  | "education"
  | "media-events"
  | "nature-pets";

type IconEntry = { category: IconCategory; keywords: string; lucide?: string };

export const icons = {
  // general
  check: { category: "general", keywords: "zaleta, tak, gotowe, check" },
  star: { category: "general", keywords: "ocena, wyróżnienie, ulubione, rating" },
  heart: { category: "general", keywords: "pasja, troska, lubię, care" },
  award: { category: "general", keywords: "nagroda, jakość, certyfikat, award" },
  "shield-check": { category: "general", keywords: "gwarancja, bezpieczeństwo, ubezpieczenie, warranty" },
  "thumbs-up": { category: "general", keywords: "polecam, zadowolenie, recommend" },
  sparkles: { category: "general", keywords: "nowość, efekt, czystość, premium, new" },
  "badge-check": { category: "general", keywords: "certyfikat, sprawdzone, autoryzacja, verified" },
  gem: { category: "general", keywords: "premium, luksus, jubiler, luxury" },
  crown: { category: "general", keywords: "vip, najlepszy, lider, vip" },
  target: { category: "general", keywords: "cel, precyzja, skuteczność, goal" },
  zap: { category: "general", keywords: "szybko, energia, ekspres, fast" },
  leaf: { category: "general", keywords: "eko, natura, wegańskie, eco" },
  recycle: { category: "general", keywords: "recykling, ekologia, odnowa, recycle" },
  globe: { category: "general", keywords: "online, świat, internet, języki, worldwide" },
  lightbulb: { category: "general", keywords: "pomysł, doradztwo, oświetlenie, idea" },
  smile: { category: "general", keywords: "uśmiech, przyjazna atmosfera, friendly" },
  info: { category: "general", keywords: "informacja, wskazówka, info" },
  "circle-help": { category: "general", keywords: "pytanie, pomoc, faq, help" },
  gift: { category: "general", keywords: "prezent, voucher, bon, gift" },
  tag: { category: "general", keywords: "cena, promocja, oferta, price" },
  percent: { category: "general", keywords: "rabat, zniżka, promocja, discount" },
  // interface (also used by the engine)
  "arrow-right": { category: "general", keywords: "dalej, więcej, next" },
  "chevron-down": { category: "general", keywords: "rozwiń, expand" },
  "external-link": { category: "general", keywords: "link zewnętrzny, profil, social, external" },
  menu: { category: "general", keywords: "menu, lista, list" },
  close: { category: "general", keywords: "zamknij, nie, close", lucide: "x" },
  grid: { category: "general", keywords: "oferta, katalog, kategorie, grid", lucide: "layout-grid" },
  blocks: { category: "general", keywords: "moduły, elementy, rozwiązania, modules" },
  image: { category: "general", keywords: "zdjęcie, galeria, photo" },
  code: { category: "general", keywords: "programowanie, strona www, it, code" },
  // contact
  mail: { category: "contact", keywords: "e-mail, wiadomość, newsletter, email" },
  phone: { category: "contact", keywords: "telefon, zadzwoń, infolinia, call" },
  "map-pin": { category: "contact", keywords: "adres, lokalizacja, dojazd, location" },
  "message-circle": { category: "contact", keywords: "czat, rozmowa, konsultacja, chat" },
  send: { category: "contact", keywords: "wyślij, zapytanie, send" },
  navigation: { category: "contact", keywords: "dojazd, trasa, nawigacja, directions" },
  "square-parking": { category: "contact", keywords: "parking, miejsca parkingowe, parking" },
  accessibility: { category: "contact", keywords: "dostępność, wózek, bez barier, accessible" },
  wifi: { category: "contact", keywords: "wi-fi, internet, praca zdalna, wifi" },
  // time & booking
  clock: { category: "time", keywords: "godziny, czas, punktualność, hours" },
  calendar: { category: "time", keywords: "kalendarz, grafik, termin, schedule" },
  "calendar-check": { category: "time", keywords: "rezerwacja, umów wizytę, booking" },
  timer: { category: "time", keywords: "czas trwania, szybka usługa, minuty, duration" },
  // business & money
  briefcase: { category: "business", keywords: "biznes, firma, b2b, usługi dla firm, business" },
  "building-2": { category: "business", keywords: "biuro, siedziba, firma, office" },
  handshake: { category: "business", keywords: "współpraca, partnerstwo, umowa, partnership" },
  users: { category: "business", keywords: "zespół, grupa, klienci, team" },
  user: { category: "business", keywords: "klient, osoba, indywidualnie, personal" },
  "file-text": { category: "business", keywords: "dokumenty, umowa, oferta, document" },
  "clipboard-check": { category: "business", keywords: "przegląd, kontrola, audyt, checklist" },
  "chart-line": { category: "business", keywords: "wzrost, wyniki, marketing, analityka, growth" },
  "piggy-bank": { category: "business", keywords: "oszczędność, tanio, finanse, savings" },
  wallet: { category: "business", keywords: "płatności, portfel, budżet, wallet" },
  "credit-card": { category: "business", keywords: "płatność kartą, raty, card" },
  banknote: { category: "business", keywords: "gotówka, cena, pieniądze, cash" },
  receipt: { category: "business", keywords: "faktura, paragon, rozliczenie, invoice" },
  scale: { category: "business", keywords: "prawo, prawnik, sprawiedliwość, law" },
  calculator: { category: "business", keywords: "księgowość, wycena, kalkulacja, accounting" },
  landmark: { category: "business", keywords: "bank, urząd, instytucja, bank" },
  "shopping-bag": { category: "business", keywords: "zakupy, sklep, butik, shopping" },
  "shopping-cart": { category: "business", keywords: "sklep internetowy, koszyk, e-commerce, cart" },
  store: { category: "business", keywords: "sklep, punkt, lokal, store" },
  package: { category: "business", keywords: "paczka, wysyłka, produkt, package" },
  truck: { category: "business", keywords: "dostawa, transport, przeprowadzki, delivery" },
  // food & drink
  coffee: { category: "food", keywords: "kawa, kawiarnia, śniadanie, coffee" },
  utensils: { category: "food", keywords: "restauracja, obiad, catering, restaurant" },
  "chef-hat": { category: "food", keywords: "kuchnia, szef kuchni, gotowanie, chef" },
  "cake-slice": { category: "food", keywords: "ciasto, cukiernia, desery, cake" },
  croissant: { category: "food", keywords: "piekarnia, śniadanie, pieczywo, bakery" },
  pizza: { category: "food", keywords: "pizzeria, fast food, pizza" },
  wine: { category: "food", keywords: "wino, bar, degustacja, wine" },
  beer: { category: "food", keywords: "piwo, pub, browar, beer" },
  salad: { category: "food", keywords: "zdrowe jedzenie, dieta, sałatka, healthy" },
  "ice-cream-cone": { category: "food", keywords: "lody, lodziarnia, deser, ice cream" },
  vegan: { category: "food", keywords: "wegańskie, roślinne, wegetariańskie, vegan" },
  // beauty & health
  scissors: { category: "beauty-health", keywords: "fryzjer, strzyżenie, krawiec, barber" },
  flower: { category: "beauty-health", keywords: "kwiaciarnia, spa, relaks, uroda, flowers" },
  bath: { category: "beauty-health", keywords: "spa, łazienka, relaks, wellness" },
  "heart-pulse": { category: "beauty-health", keywords: "zdrowie, kardiologia, puls, health" },
  stethoscope: { category: "beauty-health", keywords: "lekarz, przychodnia, badanie, doctor" },
  pill: { category: "beauty-health", keywords: "apteka, leki, suplementy, pharmacy" },
  syringe: { category: "beauty-health", keywords: "szczepienie, zabieg, medycyna estetyczna, injection" },
  eye: { category: "beauty-health", keywords: "optyk, wzrok, okulista, eye" },
  glasses: { category: "beauty-health", keywords: "okulary, optyk, wzrok, glasses" },
  baby: { category: "beauty-health", keywords: "dzieci, niemowlę, pediatra, baby" },
  brain: { category: "beauty-health", keywords: "psycholog, terapia, myślenie, psychology" },
  "hand-heart": { category: "beauty-health", keywords: "opieka, wolontariat, masaż, care" },
  "spray-can": { category: "beauty-health", keywords: "kosmetyki, perfumy, sprzątanie, spray" },
  // sport & dance
  dumbbell: { category: "sport", keywords: "siłownia, trening, fitness, gym" },
  bike: { category: "sport", keywords: "rower, serwis rowerowy, kolarstwo, bike" },
  footprints: { category: "sport", keywords: "kroki, taniec, spacer, bieganie, steps" },
  music: { category: "sport", keywords: "muzyka, taniec, lekcje gry, music" },
  mic: { category: "sport", keywords: "śpiew, wokal, eventy, karaoke, microphone" },
  trophy: { category: "sport", keywords: "zawody, puchar, mistrzostwo, trophy" },
  medal: { category: "sport", keywords: "medal, osiągnięcia, turniej, medal" },
  flame: { category: "sport", keywords: "spalanie, intensywnie, ogień, grill, burn" },
  "person-standing": { category: "sport", keywords: "postawa, joga, osoba, posture" },
  // auto & transport
  car: { category: "auto-transport", keywords: "samochód, auto, warsztat, car" },
  "car-front": { category: "auto-transport", keywords: "samochód, przegląd, wypożyczalnia, car" },
  wrench: { category: "auto-transport", keywords: "naprawa, mechanik, serwis, repair" },
  settings: { category: "auto-transport", keywords: "serwis, ustawienia, regulacja, service" },
  fuel: { category: "auto-transport", keywords: "paliwo, stacja, lpg, fuel" },
  gauge: { category: "auto-transport", keywords: "diagnostyka, wydajność, pomiar, gauge" },
  "battery-charging": { category: "auto-transport", keywords: "akumulator, ładowanie, elektryczny, battery" },
  key: { category: "auto-transport", keywords: "klucze, wynajem, nieruchomości, ślusarz, key" },
  snowflake: { category: "auto-transport", keywords: "klimatyzacja, chłodzenie, zima, ac" },
  thermometer: { category: "auto-transport", keywords: "temperatura, ogrzewanie, gorączka, temperature" },
  droplets: { category: "auto-transport", keywords: "mycie, woda, hydraulika, płyny, wash" },
  bus: { category: "auto-transport", keywords: "autobus, przewozy, wycieczki, bus" },
  plane: { category: "auto-transport", keywords: "lot, podróże, lotnisko, travel" },
  // home & construction
  house: { category: "home-construction", keywords: "dom, nieruchomości, remont, home" },
  hammer: { category: "home-construction", keywords: "remont, budowa, stolarz, renovation" },
  paintbrush: { category: "home-construction", keywords: "malowanie, malarz, dekoracje, painting" },
  "paint-roller": { category: "home-construction", keywords: "malowanie ścian, wykończenia, painting" },
  ruler: { category: "home-construction", keywords: "pomiar, projekt, architekt, measure" },
  drill: { category: "home-construction", keywords: "montaż, wiercenie, złota rączka, drill" },
  plug: { category: "home-construction", keywords: "elektryk, prąd, instalacje, electrician" },
  lock: { category: "home-construction", keywords: "zamki, bezpieczeństwo, ślusarz, lock" },
  sun: { category: "home-construction", keywords: "fotowoltaika, słońce, lato, solar" },
  "shower-head": { category: "home-construction", keywords: "hydraulik, łazienka, prysznic, plumber" },
  sofa: { category: "home-construction", keywords: "meble, wnętrza, tapicer, furniture" },
  bed: { category: "home-construction", keywords: "nocleg, hotel, sypialnia, accommodation" },
  "door-open": { category: "home-construction", keywords: "drzwi, wejście, zapraszamy, door" },
  trees: { category: "home-construction", keywords: "ogród, zieleń, park, garden" },
  // education
  "graduation-cap": { category: "education", keywords: "szkoła, kurs, edukacja, dyplom, education" },
  "book-open": { category: "education", keywords: "nauka, lekcje, korepetycje, książki, learning" },
  pencil: { category: "education", keywords: "pisanie, edycja, zajęcia plastyczne, writing" },
  school: { category: "education", keywords: "szkoła, przedszkole, placówka, school" },
  languages: { category: "education", keywords: "języki obce, tłumaczenia, angielski, languages" },
  presentation: { category: "education", keywords: "szkolenia, warsztaty, prezentacja, training" },
  // media & events
  camera: { category: "media-events", keywords: "fotograf, sesja zdjęciowa, foto, photography" },
  video: { category: "media-events", keywords: "film, wideo, nagrania, transmisja, video" },
  "party-popper": { category: "media-events", keywords: "imprezy, urodziny, wesela, eventy, party" },
  ticket: { category: "media-events", keywords: "bilety, wejściówki, wydarzenia, ticket" },
  palette: { category: "media-events", keywords: "design, sztuka, kolory, projekt graficzny, design" },
  "pen-tool": { category: "media-events", keywords: "grafika, logo, branding, design" },
  monitor: { category: "media-events", keywords: "komputer, strona www, serwis it, computer" },
  smartphone: { category: "media-events", keywords: "telefon, aplikacja, serwis gsm, mobile" },
  laptop: { category: "media-events", keywords: "laptop, praca zdalna, it, laptop" },
  printer: { category: "media-events", keywords: "druk, drukarnia, ksero, printing" },
  // nature & pets
  "paw-print": { category: "nature-pets", keywords: "zwierzęta, weterynarz, groomer, pets" },
  dog: { category: "nature-pets", keywords: "pies, psy mile widziane, hotel dla psów, dog" },
  cat: { category: "nature-pets", keywords: "kot, weterynarz, zwierzęta, cat" },
  sprout: { category: "nature-pets", keywords: "rozwój, rośliny, ogrodnictwo, growth" },
  "tree-pine": { category: "nature-pets", keywords: "las, natura, wypoczynek, forest" },
  mountain: { category: "nature-pets", keywords: "góry, turystyka, wycieczki, mountains" },
  waves: { category: "nature-pets", keywords: "woda, basen, jezioro, morze, water" },
  tent: { category: "nature-pets", keywords: "camping, biwak, outdoor, camping" },
} as const satisfies Record<string, IconEntry>;

export type IconName = keyof typeof icons;

/** All icon names site.json may use (Zod enum source). */
export const ICON_NAMES = Object.keys(icons) as [IconName, ...IconName[]];

/** Icons the engine itself renders (always in the sprite). */
export const ENGINE_ICONS: readonly IconName[] = ["check", "mail", "map-pin", "phone"];

/** File name in lucide-static/icons/ for an icon. */
export const lucideName = (name: IconName): string => ("lucide" in icons[name] ? (icons[name] as IconEntry).lucide! : name);
