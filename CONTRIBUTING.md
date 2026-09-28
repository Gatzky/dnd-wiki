# Jak redagować zasady

Ten plik opisuje, jak dodawać i zmieniać zasady w serwisie **Uczta dla Wron**. Jest przeznaczony dla mistrzów gry.

Nie musisz mieć Obsidiana ani niczego instalować. Wszystko poniżej da się zrobić w przeglądarce, w interfejsie GitHuba. Obsidian jest wygodniejszy przy większych zmianach, ale nic go nie wymaga.

---

## Spis treści

- [Zasady ogólne](#zasady-ogolne)
- [Nagłówek strony (frontmatter)](#naglowek-strony-frontmatter)
- [Jak dodać nową zasadę](#jak-dodac-nowa-zasade)
- [Adresy stron](#adresy-stron)
- [Odnośniki (wikilinki)](#odnosniki-wikilinki)
- [Tematy](#tematy)
- [Ikonki](#ikonki)
  - [Kopiowanie na Discorda](#kopiowanie-na-discorda)
- [Bloki wyróżnione](#bloki-wyroznione)
- [Zapis i typografia](#zapis-i-typografia)
- [Zmiana istniejącej zasady](#zmiana-istniejacej-zasady)
- [Proces pull requesta](#proces-pull-requesta)

---

## Zasady ogólne

1. **Serwis zawiera wyłącznie zasady.** Nie ma tu fabuły, stanu rozgrywki, opisów sesji ani materiałów tylko dla prowadzących.
2. **Wszystkie daty są rzeczywiste.** Data publikacji albo zmiany zapisu. Nigdy daty ze świata gry.
3. **Cała treść widoczna dla gracza jest po polsku.** Po angielsku są tylko nazwy pól w nagłówku strony.
4. **Zasada, której tu nie ma, nie obowiązuje.** Ustalenia z Discorda trzeba przenieść tutaj, żeby zaczęły obowiązywać.

---

## Nagłówek strony (frontmatter)

Każda strona zaczyna się blokiem między liniami `---`. Nazwy pól są angielskie (wymaga tego silnik serwisu i łatwiej je rozpoznać na GitHubie), wartości polskie.

```yaml
---
title: Pobór wojska
description: Zasady powoływania chorągwi i utrzymania wojska w polu.
tags:
  - hierarchia
  - zasoby
created: 2026-07-27
modified: 2026-07-27
draft: false
aliases:
  - Chorągwie
---
```

| Pole          | Wymagane | Znaczenie                                                                                  |
| ------------- | -------- | ------------------------------------------------------------------------------------------ |
| `title`       | tak      | Pełna nazwa zasady po polsku, z polskimi znakami. To ona pojawia się jako nagłówek strony. |
| `description` | tak      | Jedno zdanie. Widoczne w wyszukiwarce i w podglądzie odnośnika wklejonego na Discorda.     |
| `tags`        | nie      | Lista tematów. Patrz [Tematy](#tematy).                                                    |
| `created`     | tak      | Data pierwszej publikacji, `RRRR-MM-DD`.                                                   |
| `modified`    | tak      | Data ostatniej zmiany, `RRRR-MM-DD`. Aktualizuj przy każdej zmianie treści.                |
| `draft`       | tak      | `true` = strona nie trafia na serwis. `false` = opublikowana.                              |
| `aliases`     | nie      | Dawne nazwy strony. Patrz [Adresy stron](#adresy-stron).                                   |

Daty w nagłówku zapisujemy technicznie (`2026-07-27`), ale na stronie wyświetlają się jako **27 lipca 2026 r.** Nie zapisuj ich słownie w nagłówku — serwis zrobi to sam.

> [!uwaga]
> Jeśli `title` albo `description` zawiera **dwukropek**, ujmij całą wartość w cudzysłów prosty:
>
> ```yaml
> description: "Zasady oblężenia: mury, głód i szturm."
> ```
>
> Bez cudzysłowu budowanie strony zakończy się błędem — dwukropek ze spacją ma
> w tym miejscu znaczenie techniczne. To samo dotyczy wartości zaczynających
> się od `#`, `[`, `{`, `>` albo `-`.

### `draft: true`

Strona z `draft: true` nie trafia nigdzie: ani na serwis, ani do wyszukiwarki, ani do kanału RSS. Możesz więc spokojnie wrzucić niedokończoną zasadę do repozytorium i dokończyć ją później.

Publikacja to zmiana jednego pola na `draft: false`.

---

## Jak dodać nową zasadę

Zasady są podzielone na siedem działów, a **dział to po prostu katalog**:

| Katalog                   | Dział          | Adres              |
| ------------------------- | -------------- | ------------------ |
| `content/Podstawy/`       | Podstawy       | `/podstawy/`       |
| `content/Dwór/`           | Dwór           | `/dwor/`           |
| `content/Gospodarka/`     | Gospodarka     | `/gospodarka/`     |
| `content/Dyplomacja/`     | Dyplomacja     | `/dyplomacja/`     |
| `content/Intrygi/`        | Intrygi        | `/intrygi/`        |
| `content/Militaria/`      | Militaria      | `/militaria/`      |
| `content/Niesamowitości/` | Niesamowitości | `/niesamowitosci/` |

To katalog decyduje, w którym dziale zasada się pojawi i jaki będzie miała adres — nie temat. Przeniesienie pliku do innego katalogu przenosi zasadę do innego działu.

1. Wybierz dział i utwórz plik w jego katalogu, np. `content/Gospodarka/Pobór wojska.md`.
2. Nazwij plik tak, jak brzmi tytuł zasady, po polsku. Adres strony powstanie automatycznie.
3. Skopiuj nagłówek z `_szablony/zasada.md` i uzupełnij pola.
4. Napisz treść.
5. Ustaw `draft: false`, gdy zasada jest gotowa.

Układ strony, który sprawdza się najlepiej:

```markdown
Pierwszy akapit streszcza zasadę w jednym–dwóch zdaniach.

## Zasada

Właściwa treść.

## Wyjątki

Jeśli są.

## Uwagi

Przykłady, orzeczenia, historia zmian.
```

Pierwszy akapit dostaje ozdobny inicjał, więc powinien być pełnym zdaniem, a nie listą czy tabelą. Na stronie głównej, w dzienniku zmian i na stronach krótszych niż 200 znaków inicjał się nie pojawia.

---

## Adresy stron

Adres powstaje z nazwy pliku, z polskimi znakami zamienionymi na podstawowe łacińskie:

| Plik                          | Adres                       |
| ----------------------------- | --------------------------- |
| `Gospodarka/Pobór wojska.md`  | `/gospodarka/pobor-wojska`  |
| `Gospodarka/Żołd i zapasy.md` | `/gospodarka/zold-i-zapasy` |
| `Dwór/Ława przysięgłych.md`   | `/dwor/lawa-przysieglych`   |

Dotyczy to także nazw katalogów: `content/Dwór/` daje adres `/dwor/`, ale nagłówek działu na stronie to nadal **Dwór**.

Jest to celowe. Adresy trafiają na Discorda dziesiątki razy dziennie, a adres z polskimi znakami wyświetla się tam jako nieczytelny ciąg `%C5%BC%C3%B3%C5%82%C4%87` i w części klientów po prostu nie działa. **Tytuł strony zostaje w pełni polski** — zmienia się tylko adres.

### Zmiana nazwy strony a `aliases`

Zmiana nazwy pliku zmienia adres, więc **wszystkie odnośniki wklejone wcześniej na Discorda przestałyby działać**. Discord nie zaktualizuje starych wiadomości, a gracz, który wrócił do rozmowy sprzed miesiąca, trafiłby na stronę błędu.

Dlatego przy każdej zmianie nazwy **dopisz starą nazwę do `aliases`**:

```yaml
title: Pobór chorągwi
aliases:
  - Gospodarka/Pobór wojska
```

**Podaj starą nazwę razem z katalogiem.** Przekierowanie powstaje dokładnie pod tym adresem, który wpiszesz: samo `Pobór wojska` wystawi je pod `/pobor-wojska`, a stary odnośnik prowadził przecież do `/gospodarka/pobor-wojska` i nadal będzie wracał błędem. Jeżeli strona zmienia też dział, wpisz **stary** katalog — liczy się adres, który krąży po Discordzie, a nie ten, gdzie plik leży dzisiaj.

Wpisów z `aliases` **nigdy nie usuwamy** — każdy z nich podtrzymuje przy życiu jakiś odnośnik krążący po Discordzie.

---

## Odnośniki (wikilinki)

Odnośniki między zasadami zapisujemy w podwójnych nawiasach kwadratowych, używając **pełnego, polskiego tytułu** strony:

```markdown
Zasady poboru opisano w [[Pobór wojska]].
```

Zamiana na właściwy adres dzieje się automatycznie — nie wpisuj `pobor-wojska` ręcznie.

Inny tekst odnośnika podajemy po pionowej kresce:

```markdown
Zobacz [[Pobór wojska|zasady zwoływania chorągwi]].
```

Odnośnik do konkretnej sekcji:

```markdown
[[Pobór wojska#Wyjątki]]
```

Odnośniki zewnętrzne zapisujemy zwyczajnie: `[tekst](https://przyklad.pl)`.

Każda strona pokazuje panel **Cytowane przez** — listę zasad, które się na nią powołują. Powstaje on automatycznie z wikilinków, więc im staranniej linkujesz, tym łatwiej znaleźć powiązane zasady.

Nie dopisujemy na końcu sekcji „Zobacz też". Powiązania mają wynikać z odnośników w samym tekście — tam, gdzie czytelnik faktycznie ich potrzebuje — a panel **Cytowane przez** i tak zbierze je z drugiej strony.

---

## Tematy

Temat nie powtarza działu. O tym, czego zasada dotyczy, mówi już katalog — temat ma sens tylko wtedy, gdy zbiera strony **z różnych działów**. Dlatego zestaw jest zamknięty:

| Temat         | Wyświetla się jako | Zbiera strony, które…                                                     |
| ------------- | ------------------ | ------------------------------------------------------------------------- |
| `bohaterowie` | Bohaterowie        | dotyczą pojedynczych postaci, ich lojalności i losu                       |
| `talenty`     | Talenty            | opisują, co robi wojskowość, dyplomacja, spiski albo zarządzanie postaci  |
| `przymioty`   | Przymioty          | zbierają listy cech — postaci, oddziałów i lenn                           |
| `hierarchia`  | Hierarchia         | dotyczą porządku senior–wasal: powinności, tytułów, lojalności, reputacji |
| `wlosci`      | Włości             | dotyczą lenna: jego poziomu, dochodu, terenu i tego, co się z nim dzieje  |
| `zasoby`      | Zasoby             | mówią, skąd bierzemy i na co wydajemy zasoby                              |
| `cennik`      | Cennik             | istnieją po to, żeby sprawdzić w nich koszt                               |
| `bitwa`       | Bitwa              | rozstrzygają starcie — bitwę, szturm, oblężenie, pojedynek                |
| `kalendarz`   | Kalendarz          | opisują rytm rozgrywki i to, co powtarza się co turę                      |
| `fluff`       | Fluff              | są wprowadzeniami odgrywanymi w pierwszej osobie                          |

Zasada bez pasującego tematu **zostaje bez tematu**. To lepsze niż doklejanie takiego, który tylko powtarza nazwę katalogu.

> [!IMPORTANT]
> **Temat nie może nazywać się tak samo jak plik zasady.** Stronę tematu opisuje plik `content/tematy/<temat>.md` — stąd bierze się jej opis i podgląd na Discordzie. Dwa pliki o tej samej nazwie sprawiają, że `[[Wikilinki]]` przestają być jednoznaczne: Quartz rozwiązuje je wtedy do adresu w korzeniu i link prowadzi donikąd.
>
> Dlatego tematy nazywają się `bohaterowie`, `przymioty`, `wlosci`, `hierarchia` i `kalendarz`, a nie tak jak zasady `Postacie`, `Cechy`, `Lenna`, `Feudalizm` i `Tury`.

Tematy zapisujemy **małymi literami i bez polskich znaków** — tak wymaga tego pole `tags:`, które jest wewnętrzną nazwą pola w Quartzie i nie pokazuje się czytelnikowi:

```yaml
tags:
  - cennik
  - zasoby
```

Sam adres strony tematu też jest bez ogonków (`/tematy/wlosci`) — tak samo jak adresy zasad i z tego samego powodu: żeby dało się je wklejać na Discorda.

Na stronie temat wyświetla się już z polskimi znakami. Nazwy do wyświetlenia są zebrane w pliku `quartz/polish/tematy.mjs` i każdy temat z tabeli powyżej ma tam swój wpis. Zakładając **nowy temat**, dopisz go tam — koniecznie, jeśli ma polskie znaki albo nazwę z dwóch słów:

```js
export const TEMAT_LABELS = {
  // …
  zywnosc: "Żywność",
}
```

Temat bez wpisu wyświetli się po prostu z wielkiej litery (`cennik` → `Cennik`), co dla większości nazw wystarcza.

Nie mnóż tematów. Lepiej mieć dziewięć używanych niż sześćdziesiąt, z których każdy występuje raz.

---

## Ikonki

Ikonki wstawiamy **skrótem w stylu Discorda**, a nie pełnym osadzeniem obrazka. Zapis `:zloto:` zamienia się podczas budowania strony na osadzenie odpowiedniego pliku z `content/ikonki`:

```markdown
Lenno przynosi 3 :zloto: dochodu.
```

Dlaczego tak, a nie `![[ikonki/zloto.png|złoto]]`:

- Zasada z czterema ikonkami w jednym zdaniu pozostaje czytelna w źródle.
- W komórce tabeli pełne osadzenie wymaga ucieczki każdej pionowej kreski (`\|`), przez co wiersz rozjeżdża się na kilkaset znaków. Skrót nie ma tego problemu — o ucieczkę dba wtyczka.
- Piszemy tak, jak gra się w grę: na Discordzie te same ikonki są emoji.

Zasady zapisu:

- Nazwa skrótu to **nazwa pliku bez rozszerzenia**, bez polskich znaków: `:zloto:`, `:rozmiararmii:`, `:laska7:`.
- Rozmiaru nie podajemy. Wysokość ikonki ustala arkusz stylów (`height: 1.15em`), więc dopisek `|18` i tak nic nie zmienia.
- Skrót działa wszędzie w treści strony — w akapicie, w liście, w tabeli i w bloku `[!wzor]`. **Nie działa** w nagłówku strony (frontmatter), w kodzie w linii ani w bloku kodu — i o to chodzi, bo tam ikonka byłaby błędem.
- Nieznany skrót zostaje w tekście taki, jaki jest. Jeśli w gotowej stronie widzisz `:zloto:` zamiast obrazka, sprawdź nazwę pliku w `content/ikonki`.

### Kopiowanie na Discorda

Zaznaczony fragment zasady można skopiować ze strony i wkleić prosto na Discorda — ikonki wracają wtedy do postaci skrótów (`:zloto:`), czyli tych samych, których Discord używa dla swoich emoji. Dlatego tekstem alternatywnym obrazka jest **skrót**, a nie polska nazwa: to on trafia do schowka.

Polska nazwa nie ginie — wtyczka wpisuje ją w `title`, więc widać ją po najechaniu na ikonkę.

Nową ikonkę dodajemy, wrzucając plik `.png` do `content/ikonki` — skrót o tej nazwie zaczyna działać od razu. Żeby ikonka miała jeszcze polską nazwę w dymku, dopisz ją do mapy `DEFAULT_LABELS` w `plugins/ikonki/index.js`.

---

## Bloki wyróżnione

Dziewięć rodzajów bloków, każdy z własnym znaczeniem. Zapis:

```markdown
> [!orzeczenie]
> Treść bloku.
```

| Zapis           | Nagłówek          | Kiedy używać                                                                                                                            |
| --------------- | ----------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `[!orzeczenie]` | Orzeczenie        | Rozstrzygnięcie mistrza gry w sprawie, której zapis nie rozstrzyga wprost. Podaj datę i, jeśli się da, odnośnik do wątku na Discordzie. |
| `[!errata]`     | Errata            | Poprawka błędu w zapisie — literówki, złej liczby, sprzecznego sformułowania. Treść zasady się nie zmienia.                             |
| `[!zmiana]`     | Zmiana            | Zasada została zmieniona merytorycznie. Napisz kiedy i jak. Ten sam wpis powtórz w dzienniku zmian.                                     |
| `[!przyklad]`   | Przykład          | Konkretna sytuacja przy stole i jej rozstrzygnięcie.                                                                                    |
| `[!uwaga]`      | Uwaga             | Częsty błąd albo coś, co łatwo przeoczyć.                                                                                               |
| `[!opcjonalna]` | Zasada opcjonalna | Wariant do uzgodnienia przed rozgrywką, nieobowiązujący domyślnie.                                                                      |
| `[!wzor]`       | Wzór              | Sposób wyliczenia konkretnej wartości. Jeden wzór na blok.                                                                              |
| `[!procedura]`  | Procedura         | Kolejność kroków do wykonania. Zapisz ją listą numerowaną — numery dostają własny, tłoczony znacznik.                                   |
| `[!wyjatek]`    | Wyjątek           | Odstępstwo od zasady opisanej powyżej. Krawędź bloku jest przerywana, bo wyjątek przerywa regułę.                                       |

Cztery z tych bloków — `[!wzor]`, `[!procedura]`, `[!wyjatek]` i `[!przyklad]` — mają osobne, rozpoznawalne formy: wzór ma brązową krawędź z lewej, procedura linie u góry i u dołu, wyjątek krawędź przerywaną, a przykład cienką ramkę dookoła. Nagłówek każdego z nich jest tłoczony w papierze, bez farby. Dzięki temu widać, z jakim rodzajem treści mamy do czynienia, zanim się ją przeczyta.

Nazwy bloków są **bez polskich znaków** (`przyklad`, nie `przykład`; `wzor`, nie `wzór`) — silnik nie przyjmuje ogonków w tym miejscu. Nagłówek wyświetli się poprawnie po polsku.

### Wzory

Każde wyliczenie zapisujemy w bloku `[!wzor]`, a nie zwykłym pogrubieniem w akapicie. Dzięki temu wszystkie wzory na serwisie wyglądają tak samo i łatwo je znaleźć wzrokiem, przewijając zasadę.

```markdown
> [!wzor]
> **Lojalność** = reputacja + :dyplomacja: władcy + wpływy
```

Zasady zapisu:

- **Nazwa liczonej wartości pogrubiona**, po niej znak `=`. To ona jest tematem wzoru.
- Mnożenie zapisujemy znakiem `×` (nie literą `x`).
- Jeden wzór na blok. Dwa wyliczenia to dwa bloki.
- Treść wzoru składa się czcionką o stałej szerokości cyfr, więc kolumny liczb i operatory same się wyrównują — nie dodawaj spacji „na oko”.
- Jeśli wzór wymaga komentarza, dopisz go zwykłym zdaniem **pod** blokiem, a nie w środku.

Własny nagłówek podajemy po nazwie:

```markdown
> [!uwaga] Dotyczy tylko oblężeń
> Treść.
```

Różnica między `errata` a `zmiana` jest istotna: **errata poprawia zapis, zmiana zmienia zasadę.** Errata nie wymaga wpisu w dzienniku zmian, zmiana — tak.

---

## Zapis i typografia

- **Cudzysłowy polskie:** `„tak”` — otwierający **na dole**, zamykający **u góry**. Wpisz je bezpośrednio; serwis ich nie zamienia na angielskie `“ ”`. Jeśli nie masz ich na klawiaturze, skopiuj stąd: otwierający `„` , zamykający `”` . Nie używaj prostego `"` — wygląda inaczej i psuje spójność zapisu.
- **Myślnik:** półpauza `–` w zakresach (`3–5 tur`), pauza `—` w zdaniu wtrąconym.
- **Spójniki na końcu wiersza:** nie musisz się nimi przejmować. Serwis sam dokleja jednoliterowe wyrazy (`a i o u w z`) do następnego słowa, żeby nie zostawały na końcu wiersza.
- **Liczby w tabelach:** wyrównuj do prawej, zapisem `---:` w wierszu rozdzielającym. Wtedy kolumna dostanie czcionkę o stałej szerokości cyfr i będzie się dała porównywać wzrokiem.

```markdown
| Chorągiew | Ludzie | Żołd |
| --------- | -----: | ---: |
| Łowcy     |    120 |   45 |
```

- **Szerokie tabele** zwijają się do przewijania w poziomie na telefonie — nie rozjeżdżają strony. Mimo to unikaj tabel szerszych niż pięć kolumn; większość graczy czyta zasady na telefonie w przeglądarce Discorda.

---

## Zmiana istniejącej zasady

1. Zmień treść.
2. Zaktualizuj `modified` na dzisiejszą datę.
3. Jeśli zmiana jest merytoryczna (a nie poprawką literówki):
   - dodaj blok `> [!zmiana]` w sekcji **Uwagi** na stronie zasady,
   - dopisz wpis w `content/dziennik-zmian.md`, według formatu opisanego na tej stronie,
   - jeśli zmieniasz nazwę strony, dopisz starą nazwę do `aliases`.

W opisie zmiany zawsze podaj **powód**. Za pół roku nikt nie będzie pamiętał, o co był spór — a to właśnie ta informacja rozstrzyga przyszłe dyskusje.

---

## Proces pull requesta

Zasady zmieniamy przez pull requesty, nie bezpośrednimi zapisami do gałęzi głównej.

1. **Załóż gałąź.** Nazwa opisowa, np. `zasada-pobor-wojska` albo `errata-zold`.
2. **Wprowadź zmiany.** Jedna zasada na pull request. Łatwiej to omówić i łatwiej wycofać.
3. **Otwórz pull requesta.** W opisie napisz:
   - co się zmienia,
   - dlaczego,
   - odnośnik do wątku na Discordzie, jeśli zmiana wynika z dyskusji.
4. **Obejrzyj podgląd.** Cloudflare Pages buduje osobną wersję serwisu dla każdego pull requesta i wstawia odnośnik w komentarzu. Zajrzyj tam — zobaczysz stronę dokładnie tak, jak zobaczą ją gracze.
5. **Poczekaj na akceptację** drugiego mistrza gry. Zmiany merytoryczne wymagają zgody dwóch osób; poprawki literówek — jednej.
6. **Scal.** Serwis zaktualizuje się sam w ciągu minuty.

Zanim poprosisz o akceptację, sprawdź:

- [ ] `modified` ustawione na dzisiejszą datę
- [ ] `draft: false`, jeśli zasada ma być widoczna
- [ ] wpis w dzienniku zmian, jeśli zmiana jest merytoryczna
- [ ] stara nazwa w `aliases`, jeśli zmieniono nazwę strony
- [ ] podgląd z Cloudflare wygląda poprawnie
