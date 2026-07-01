/**
 * stories.ts — MOCK data příběhů (žádné API). Countries a časová osa se
 * odvozují z tohoto pole. Roky jsou ve formátu: záporné = př. n. l.
 */

export interface Story {
  id: string;
  title: string;
  slug: string;
  /** ISO 3166-1 alpha-3 */
  countryCode: string;
  /** Rok počátku (záporné = př. n. l.) */
  yearFrom: number;
  /** Rok konce */
  yearTo: number;
  excerpt: string;
  coverImage: string;
  body: string;
  tags: string[];
}

/** Placeholder obrázek — pergamenový gradient s iniciálou (data URI, žádné API) */
function cover(seed: string, label: string): string {
  const hues = ["#e8d6ac", "#e3cf9f", "#ecdcb6", "#dfcf9a", "#e6d3a0"];
  const hue = hues[seed.charCodeAt(0) % hues.length];
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='800' height='500'>
    <defs>
      <radialGradient id='g' cx='50%' cy='40%' r='75%'>
        <stop offset='0%' stop-color='#fdfaf0'/>
        <stop offset='100%' stop-color='${hue}'/>
      </radialGradient>
    </defs>
    <rect width='800' height='500' fill='url(#g)'/>
    <rect x='16' y='16' width='768' height='468' fill='none' stroke='#b89b6a' stroke-width='2'/>
    <text x='400' y='265' font-family='Cinzel, serif' font-size='120' fill='#b89b6a'
      text-anchor='middle' opacity='0.55'>${label}</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export const STORIES: Story[] = [
  {
    id: "1",
    title: "Stavba Velké pyramidy v Gíze",
    slug: "velka-pyramida-v-gize",
    countryCode: "EGY",
    yearFrom: -2560,
    yearTo: -2540,
    excerpt:
      "Za faraona Chufua vyrostla na náhorní plošině stavba, která zůstala nejvyšší lidskou konstrukcí na téměř čtyři tisíce let.",
    coverImage: cover("EGY", "𓉐"),
    body: "Velká pyramida v Gíze byla dokončena kolem roku 2540 př. n. l. jako hrobka faraona Chufua (Cheopse). Původně měřila 146,6 metru a byla obložena hlazeným vápencem, který se na slunci třpytil. Na její stavbě se podílely desítky tisíc dělníků — nikoli otroků, jak se dlouho tradovalo, ale sezónních pracovníků a řemeslníků. Přesnost, s jakou byly kamenné bloky uloženy, dodnes udivuje inženýry.",
    tags: ["starověk", "architektura", "faraoni"],
  },
  {
    id: "2",
    title: "Zlatý věk Athén a zrození demokracie",
    slug: "zlaty-vek-athen",
    countryCode: "GRC",
    yearFrom: -461,
    yearTo: -429,
    excerpt:
      "Pod vedením Perikla se Athény staly centrem umění, filosofie a prvního experimentu s vládou lidu.",
    coverImage: cover("GRC", "Δ"),
    body: "V období mezi lety 461 a 429 př. n. l. zažily Athény pod Periklovým vedením rozkvět, jaký antický svět nepamatoval. Vznikl Parthenón, rozvíjelo se divadlo Sofokla a Euripida, filosofie i řečnictví. Athénská demokracie dávala rozhodovací moc shromáždění svobodných občanů — byť ženy, otroci a cizinci zůstávali vyloučeni. Přesto šlo o revoluční myšlenku, která ovlivnila politické uspořádání na tisíce let dopředu.",
    tags: ["antika", "demokracie", "filosofie"],
  },
  {
    id: "3",
    title: "Cesta Julia Caesara přes Rubikon",
    slug: "caesar-prekrocil-rubikon",
    countryCode: "ITA",
    yearFrom: -49,
    yearTo: -44,
    excerpt:
      "„Kostky jsou vrženy.“ Jediné překročení řeky spustilo občanskou válku, která ukončila římskou republiku.",
    coverImage: cover("ITA", "SPQR"),
    body: "V lednu roku 49 př. n. l. překročil Gaius Julius Caesar se svou legií řeku Rubikon, čímž porušil římský zákon zakazující veliteli vstoupit s armádou do Itálie. Tento krok znamenal vyhlášení války senátu a Pompeiovi. Následná občanská válka skončila Caesarovým vítězstvím a jeho jmenováním doživotním diktátorem — než byl roku 44 př. n. l. zavražděn v senátu. Republika se už nikdy neobnovila.",
    tags: ["Řím", "republika", "vojevůdci"],
  },
  {
    id: "4",
    title: "Založení Karlovy univerzity",
    slug: "zalozeni-karlovy-univerzity",
    countryCode: "CZE",
    yearFrom: 1348,
    yearTo: 1348,
    excerpt:
      "Karel IV. zakládá nejstarší univerzitu ve střední Evropě a činí z Prahy intelektuální srdce říše.",
    coverImage: cover("CZE", "🜋"),
    body: "Zakládací listinu vydal český král a římský císař Karel IV. dne 7. dubna 1348. Pražská univerzita se stala první svého druhu severně od Alp a východně od Paříže. Přitahovala studenty z celé Evropy a stala se centrem vzdělanosti. O několik desetiletí později se právě zde rozhořel spor kolem učení Jana Husa, který předznamenal reformaci.",
    tags: ["středověk", "vzdělání", "Karel IV."],
  },
  {
    id: "5",
    title: "Dobytí Bastily",
    slug: "dobyti-bastily",
    countryCode: "FRA",
    yearFrom: 1789,
    yearTo: 1789,
    excerpt:
      "14. července se pařížský dav vydal na pevnost-vězení a odstartoval Velkou francouzskou revoluci.",
    coverImage: cover("FRA", "☰"),
    body: "Dne 14. července 1789 zaútočil rozhořčený pařížský lid na pevnost Bastilu, symbol královské absolutistické moci. Ačkoli uvnitř bylo vězněno jen sedm lidí, pád Bastily se stal ikonickým počátkem Velké francouzské revoluce. Revoluce svrhla monarchii, přinesla Deklaraci práv člověka a občana a zásadně proměnila evropské uspořádání.",
    tags: ["revoluce", "novověk", "svoboda"],
  },
  {
    id: "6",
    title: "Průmyslová revoluce v Manchesteru",
    slug: "prumyslova-revoluce-manchester",
    countryCode: "GBR",
    yearFrom: 1780,
    yearTo: 1840,
    excerpt:
      "Z bavlněných přádelen severní Anglie se šíří parní stroje, které navždy mění způsob, jak lidé pracují.",
    coverImage: cover("GBR", "⚙"),
    body: "Manchester, přezdívaný „Cottonopolis“, se na přelomu 18. a 19. století stal symbolem průmyslové revoluce. Mechanizace textilní výroby, parní pohon a nová továrenská organizace práce vytvořily bezprecedentní hospodářský růst — ale i tvrdé pracovní podmínky, dětskou práci a přelidněná města. Průmyslová revoluce položila základy moderní ekonomiky.",
    tags: ["novověk", "technologie", "průmysl"],
  },
  {
    id: "7",
    title: "Pád Berlínské zdi",
    slug: "pad-berlinske-zdi",
    countryCode: "DEU",
    yearFrom: 1989,
    yearTo: 1989,
    excerpt:
      "Po 28 letech rozdělení padla zeď a s ní i železná opona rozdělující Evropu.",
    coverImage: cover("DEU", "✚"),
    body: "9. listopadu 1989 večer oznámily východoněmecké úřady uvolnění cestování na Západ. Tisíce lidí se vydaly ke zdi, hraniční přechody se otevřely a dav začal zeď bourat. Pád Berlínské zdi se stal symbolem konce studené války a rozdělení Evropy. O necelý rok později došlo ke znovusjednocení Německa.",
    tags: ["20. století", "studená válka", "svoboda"],
  },
  {
    id: "8",
    title: "Stavba Velké čínské zdi za dynastie Ming",
    slug: "velka-cinska-zed-ming",
    countryCode: "CHN",
    yearFrom: 1368,
    yearTo: 1644,
    excerpt:
      "Dynastie Ming přebudovala a rozšířila obranný val do dnešní podoby táhnoucí se tisíce kilometrů.",
    coverImage: cover("CHN", "長"),
    body: "Ačkoli první opevnění vznikala už ve 3. století př. n. l., většina dnes viditelné Velké čínské zdi pochází z období dynastie Ming (1368–1644). Ming budovali zeď z cihel a kamene jako obranu proti mongolským nájezdům ze severu. Celková délka všech větví přesahuje 21 000 kilometrů. Zeď je jedním z nejambicióznějších stavebních projektů v dějinách lidstva.",
    tags: ["středověk", "architektura", "obrana"],
  },
  {
    id: "9",
    title: "Konec šógunátu a restaurace Meidži",
    slug: "restaurace-meidzi",
    countryCode: "JPN",
    yearFrom: 1868,
    yearTo: 1889,
    excerpt:
      "Japonsko se během jediné generace proměnilo z feudální izolace v modernizovanou velmoc.",
    coverImage: cover("JPN", "明"),
    body: "Roku 1868 skončila vláda šógunů rodu Tokugawa a moc se vrátila do rukou císaře Meidži. Následovala překotná modernizace: Japonsko přejalo západní technologie, průmysl, armádu i ústavu (1889), aniž ztratilo vlastní identitu. Během jediné generace se z izolované feudální země stala průmyslová a vojenská velmoc — proměna, která nemá v dějinách obdoby.",
    tags: ["19. století", "modernizace", "reformy"],
  },
  {
    id: "10",
    title: "Vláda císaře Ašóky a šíření buddhismu",
    slug: "cisar-asoka",
    countryCode: "IND",
    yearFrom: -268,
    yearTo: -232,
    excerpt:
      "Po krvavé válce se mocný panovník obrátil k nenásilí a učinil z buddhismu světové náboženství.",
    coverImage: cover("IND", "☸"),
    body: "Císař Ašóka z dynastie Maurjů ovládl většinu indického subkontinentu. Po zničující válce o Kalingu, kterou sám později litoval, přijal buddhismus a zásady nenásilí (ahimsá). Nechal po celé říši vztyčit kamenné sloupy a edikty hlásající toleranci, soucit a etické zásady. Vyslal buddhistické misie do Asie i Středomoří, čímž z buddhismu učinil jedno z hlavních světových náboženství.",
    tags: ["starověk", "náboženství", "panovníci"],
  },
  {
    id: "11",
    title: "Vzestup Machu Picchu",
    slug: "machu-picchu",
    countryCode: "PER",
    yearFrom: 1450,
    yearTo: 1572,
    excerpt:
      "Vysoko v Andách vyrostlo královské sídlo Inků, opuštěné a zapomenuté téměř na čtyři století.",
    coverImage: cover("PER", "☀"),
    body: "Machu Picchu bylo postaveno kolem roku 1450 za vlády inckého panovníka Pachacutiho jako královské sídlo a náboženské centrum. Leží ve výšce téměř 2 500 metrů nad mořem a vyniká dokonalou kamenickou prací bez malty. Po španělském dobytí bylo město opuštěno a upadlo v zapomnění, dokud jej roku 1911 znovu neobjevil Hiram Bingham. Dnes je symbolem incké civilizace.",
    tags: ["Inkové", "architektura", "objevy"],
  },
  {
    id: "12",
    title: "Pád Tenočtitlánu a konec Aztécké říše",
    slug: "pad-tenochtitlanu",
    countryCode: "MEX",
    yearFrom: 1519,
    yearTo: 1521,
    excerpt:
      "Hlavní město Aztéků, jedno z největších měst světa své doby, padlo po obléhání do rukou Španělů.",
    coverImage: cover("MEX", "🦅"),
    body: "Když roku 1519 dorazil Hernán Cortés k Tenočtitlánu, spatřil město na jezeře s více než 200 000 obyvateli — větší než tehdejší evropské metropole. Po dvou letech napětí, spojenectví s odpůrci Aztéků a zničující epidemii neštovic dobyli Španělé město v srpnu 1521. Pád Tenočtitlánu znamenal konec Aztécké říše a počátek španělské koloniální nadvlády nad Mexikem.",
    tags: ["Aztékové", "objevné plavby", "kolonizace"],
  },
  {
    id: "13",
    title: "Kleopatra VII. — poslední faraonka",
    slug: "kleopatra-vii",
    countryCode: "EGY",
    yearFrom: -51,
    yearTo: -30,
    excerpt:
      "Chytrá a vzdělaná panovnice spojila osud Egypta s Římem — a s ní skončila éra faraonů.",
    coverImage: cover("EGZ", "𓁟"),
    body: "Kleopatra VII. usedla na egyptský trůn roku 51 př. n. l. jako poslední panovnice ptolemaiovské dynastie. Ovládala několik jazyků, byla vzdělaná v matematice i filosofii a obratně manévrovala v římské politice — spojenectví (a milostné vztahy) s Juliem Caesarem a Marcem Antoniem měly udržet nezávislost Egypta. Po porážce u Actia a Antoniově smrti si roku 30 př. n. l. vzala život. Egypt se stal římskou provincií a tři tisíce let vlády faraonů skončily.",
    tags: ["starověk", "panovnice", "Řím"],
  },
  {
    id: "14",
    title: "Objev Tutanchamonovy hrobky",
    slug: "objev-tutanchamonovy-hrobky",
    countryCode: "EGY",
    yearFrom: 1922,
    yearTo: 1922,
    excerpt:
      "Howard Carter otevřel téměř nedotčenou hrobku mladého faraona a probudil celosvětovou egyptomanii.",
    coverImage: cover("EGY2", "𓋹"),
    body: "V listopadu 1922 objevil britský archeolog Howard Carter v Údolí králů vstup do hrobky faraona Tutanchamona. Na rozdíl od většiny ostatních hrobek nebyla vykradena a obsahovala tisíce předmětů včetně proslulé zlaté pohřební masky. Objev se stal světovou senzací, odstartoval vlnu zájmu o starověký Egypt a dodnes patří k nejvýznamnějším archeologickým nálezům v dějinách.",
    tags: ["archeologie", "20. století", "objevy"],
  },
  {
    id: "15",
    title: "Výboje Alexandra Velikého",
    slug: "vyboje-alexandra-velikeho",
    countryCode: "GRC",
    yearFrom: -336,
    yearTo: -323,
    excerpt:
      "Za necelých třináct let vytvořil mladý makedonský král říši sahající od Řecka až k Indii.",
    coverImage: cover("GRC2", "Α"),
    body: "Alexandr III. Makedonský nastoupil na trůn roku 336 př. n. l. a během jediné dekády porazil perskou říši a dobyl území od Egypta po hranice Indie. Jeho tažení rozšířila řeckou kulturu, jazyk a umění po celém známém světě a zahájila tzv. helénistické období. Zemřel roku 323 př. n. l. v Babylonu ve věku pouhých 32 let; jeho říše se poté rozpadla mezi jeho vojevůdce.",
    tags: ["antika", "vojevůdci", "říše"],
  },
  {
    id: "16",
    title: "Zkáza Pompejí",
    slug: "zkaza-pompeji",
    countryCode: "ITA",
    yearFrom: 79,
    yearTo: 79,
    excerpt:
      "Výbuch Vesuvu pohřbil kvetoucí římské město pod vrstvou popela — a zakonzervoval ho na staletí.",
    coverImage: cover("ITA2", "▲"),
    body: "24. srpna roku 79 n. l. (podle novějších bádání spíše na podzim) vybuchla sopka Vesuv a během několika hodin pohřbila města Pompeje a Herculaneum pod metry sopečného popela a pemzy. Tisíce obyvatel zahynuly. Popel však města dokonale zakonzervoval — freskami počínaje a odlitky těl konče. Vykopávky zahájené v 18. století odhalily jedinečně zachovalý obraz každodenního života v antickém Římě.",
    tags: ["Řím", "katastrofy", "archeologie"],
  },
  {
    id: "17",
    title: "Pád Západořímské říše",
    slug: "pad-zapadorimske-rise",
    countryCode: "ITA",
    yearFrom: 476,
    yearTo: 476,
    excerpt:
      "Sesazením posledního císaře skončil starověk a Evropa vstoupila do raného středověku.",
    coverImage: cover("ITA3", "Ω"),
    body: "Roku 476 n. l. sesadil germánský vojevůdce Odoaker posledního západořímského císaře Romula Augustula. Tato událost je tradičně považována za symbolický konec Západořímské říše i celého starověku. Řím oslabovaly už desítky let vnitřní krize, ekonomický úpadek a nájezdy. Na troskách impéria vznikaly germánské říše a Evropa vstoupila do období raného středověku.",
    tags: ["Řím", "středověk", "zánik"],
  },
];

export default STORIES;
