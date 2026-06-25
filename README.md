## SVG icon rules

Każdy plik SVG w `src/assets/icons/raw/` powinien:

- mieć `viewBox`
- mieć prostą nazwę kebab-case, np. `arrow-right.svg`
- nie mieć hardcodowanych kolorów, jeśli ikona ma dziedziczyć kolor tekstu
- najlepiej używać `currentColor`


---


## Font System

Font System odpowiada za lokalne fonty, ich optymalizację, subset znaków oraz wygenerowanie pliku SCSS z `@font-face`.

### Struktura

Surowe pliki fontów trzymamy w:

```txt
src/assets/fonts/raw/
```

Wygenerowane fonty trafiają do:

```txt
public/fonts/
```

Wygenerowany plik SCSS znajduje się tutaj:

```txt
src/styles/abstracts/_fonts.scss
```

Plik `_fonts.scss` jest generowany automatycznie. Nie należy edytować go ręcznie.

### Wymagania na Kubuntu

Skrypt fontów używa narzędzia `pyftsubset` z pakietu FontTools.

Instalacja:

```bash
sudo apt install python3-fonttools
```

Jeśli brakuje obsługi WOFF2/Brotli:

```bash
pip install fonttools brotli
```

### Generowanie fontów

Dla stron PL/EN:

```bash
npm run build:fonts:latin
```

Dla stron z cyrylicą, np. UA/RU:

```bash
npm run build:fonts:cyrillic
```

Dla stron wielojęzycznych Latin + Cyrillic:

```bash
npm run build:fonts:all
```

Trybu `cyrillic` lub `all` używamy tylko wtedy, gdy surowy font w `src/assets/fonts/raw/` zawiera znaki cyrylicy.

### Workflow

1. Wrzuć surowe fonty do `src/assets/fonts/raw/`.
2. Zostaw tylko potrzebne wagi fontu, np. `400`, `600`, `700`.
3. Uruchom odpowiedni skrypt, np. `npm run build:fonts:latin`.
4. Sprawdź wygenerowane pliki w `public/fonts/`.
5. Sprawdź wygenerowany plik `src/styles/abstracts/_fonts.scss`.
6. Ustaw użycie fontu w design tokens, np. `--font-family-base`.
7. Używaj fontu przez tokeny CSS, np. `font-family: var(--font-family-base);`.

### Zasady

* Nie edytujemy ręcznie `public/fonts/` ani `_fonts.scss`.
* Fonty generujemy ze źródeł w `src/assets/fonts/raw/`.
* Dla landing page V1 zwykle wystarczą wagi `400`, `600`, `700`.
* `@font-face` należy do Font Systemu.
* `--font-family-base`, `--font-size-*`, `--line-height-*` należą do Design Tokens.
* Nie generujemy cyrylicy z fontu, który zawiera tylko Latin/Latin Extended.

---

## Form

```
<FormField>
  <Label for="email">Email</Label>
  <Input id="email" name="email" type="email" />
  <FieldHint id="email-hint">We will reply to this address.</FieldHint>
</FormField>
```