/**
 * stories.ts — MOCK data příběhů (žádné API). Countries a časová osa se
 * odvozují z tohoto pole. Roky jsou ve formátu: záporné = př. n. l.
 */

/**
 * Beat velkého (kinematického) příběhu — sekvence, kterou uživatel projde.
 * - scene: médium (obrázek/video, příp. greenscreen k vyklíčování) + text
 * - flip:  otočná kartička „věděli jste?" (přední → zadní strana)
 * - quiz:  otázka s výběrem; na konci příběhu z nich vznikne dobrovolný kvíz
 */
/** Nálada beatu — řídí barevný nádech, částice a vinětaci scény. */
export type BeatMood = "dawn" | "mystic" | "day" | "night";

/**
 * Vrstva 1 — HUDBA. Bezešvě loopující stopy klíčované NÁLADOU beatu (`mood`).
 * Loop se sdílí napříč beaty stejné nálady; při změně nálady se crossfadne.
 * Formát pro čisté loopy: .ogg (Opus) / .m4a (AAC) — NE mp3 (gapless problém).
 */
export interface MusicLayer {
  /** Úvodní/hero loop (hraje, než začne první beat). */
  intro?: string;
  /** Loop pro každou náladu (relativní k BASE_URL); sdílí se mezi beaty té nálady. */
  loops: Partial<Record<BeatMood, string>>;
  /** Délka crossfade mezi loopy při změně nálady, ms (default ~800). */
  crossfadeMs?: number;
}

/**
 * Vrstva 2 — VOICEOVER (vypravěč). Klip na beat; přehraje se JEDNOU při vstupu na beat
 * (neloopuje). Stejný princip jako hudba — zní jen to, co je na aktuálním beatu.
 * Formát: mp3/m4a (jednorázové, gapless neřeší).
 */
export interface VoiceoverLayer {
  /** Úvodní slovo pod hero (volitelné). */
  intro?: string;
  /** i-tý klip ↔ i-tý beat; `null` = beat bez namluvení. */
  perBeat: (string | null)[];
}

/** Trigger zvukového efektu. */
export type SfxTrigger =
  | { on: "beatEnter"; beat: number }
  | { on: "flip" }
  | { on: "quizCorrect" }
  | { on: "quizWrong" }
  | { on: "click" };

/** Vrstva 3 — ZVUKOVÝ EFEKT spouštěný triggerem (vstup na beat, flip, klik, kvíz). */
export interface Sfx {
  src: string;
  trigger: SfxTrigger;
  /** Hlasitost 0–1 (default 1). */
  gain?: number;
}

/**
 * Zvuk příběhu — tři vrstvy řízené aktivním beatem: hudba (loop per nálada),
 * voiceover (klip per beat) a SFX (spouštěné triggerem). Přehrávač zatím není
 * postavený (backlog) — data slouží jako scaffold pro creator. Zvuk se odemkne
 * přes Play v hero (autoplay policy).
 */
export interface StoryAudio {
  music?: MusicLayer;
  voiceover?: VoiceoverLayer;
  sfx?: Sfx[];
}

/** Úvodní „hero" konkrétního příběhu — poster + video na pozadí, spustí se přes Play. */
export interface StoryHero {
  media: string;
  mediaType?: "image" | "video";
  /** Statický poster před kliknutím na Play (jinak se vezme médium). */
  poster?: string;
  /** Krátký eyebrow nad nadpisem (např. „Pražská legenda"). */
  eyebrow?: string;
}

export type StoryBeat =
  | {
      kind: "scene";
      media: string;
      mediaType?: "image" | "video";
      /** Postava na greenscreenu k vyklíčování (chroma key) — jako „kdo jsme". */
      chroma?: boolean;
      title?: string;
      text?: string;
      credit?: string;
      mood?: BeatMood;
    }
  | { kind: "flip"; front: string; back: string; mood?: BeatMood }
  | { kind: "quiz"; question: string; options: string[]; answer: number; explain?: string }
  | {
      /** Přišpendlené video scrubované scrollem; přes něj postupně naskakují titulky. */
      kind: "scrub";
      media: string;
      credit?: string;
      captions: { at: number; title?: string; text: string }[];
      mood?: BeatMood;
    };

export interface Story {
  id: string;
  title: string;
  slug: string;
  /** ISO 3166-1 alpha-3 */
  countryCode: string;
  /** ISO 3166-2 kód kraje (jen státy s 3. úrovní, např. „CZ-10"). */
  region?: string;
  /** Rok počátku (záporné = př. n. l.) */
  yearFrom: number;
  /** Rok konce */
  yearTo: number;
  excerpt: string;
  coverImage: string;
  body: string;
  tags: string[];
  /** Cesta (relativní k BASE_URL) k obrázku/videu na pozadí kinematické osy. */
  media?: string;
  /** Typ média — obrázek (default) nebo video (mp4). */
  mediaType?: "image" | "video";
  /** Atribuce zdroje média (public domain / autor). */
  mediaCredit?: string;
  /** Beaty velkého (kinematického) příběhu v detailu — scény, flip kartičky, kvíz. */
  beats?: StoryBeat[];
  /** Úvodní hero konkrétního příběhu (poster + Play + video na pozadí). */
  hero?: StoryHero;
  /** Hudba — jeden mp3 rozdělený na segmenty mapované na beaty. */
  audio?: StoryAudio;
  /**
   * Doložený fakt / pověst / autorská fikce / firemní brand story.
   * Web podle toho vizuálně odliší, co uživatel čte. Fikce VŽDY vychází z reálného
   * faktu (drží se `sources` té události jako kotvy).
   */
  factuality?: "fact" | "legend" | "fiction" | "brand";
  /** Publikační stav — web ve výchozím stavu ukazuje jen published; draft = rozpracováno. */
  status?: "draft" | "published";
  /** Ověřovací zdroje (URL). Povinné u factuality === "fact". */
  sources?: string[];
  /** Autor příběhu (u fikce / brand story). */
  author?: { name: string; url?: string };
  /** Příběhový hák / úhel pro stavbu příběhu (u draftů-nápadů z rešerše). */
  angle?: string;
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

/**
 * České DRAFTY — nápady z rešerše veřejných zdrojů (Wikipedia), ověřené roky.
 * Slouží k naplnění časové osy pro design a jako zásobník, z něhož se staví
 * plné příběhy (doložené i fikce založená na faktu). `status: "draft"`.
 */
interface CzDraftSeed {
  slug: string;
  title: string;
  region: "cechy" | "morava" | "slezsko";
  yearFrom: number;
  yearTo: number;
  excerpt: string;
  tags: string[];
  factuality: "fact" | "legend";
  sources: string[];
  angle: string;
  /** Iniciála do generovaného pergamenového coveru. */
  label: string;
}

const CZ_DRAFT_SEEDS: CzDraftSeed[] = [
  {
    slug: "bitva-u-wogastisburgu-samova-rise",
    title: "Bitva u Wogastisburgu a Sámova říše",
    region: "cechy",
    yearFrom: 631,
    yearTo: 631,
    excerpt:
      "Franský kupec Sámo spojil slovanské kmeny a u záhadného hradiště Wogastisburg rozdrtil vojsko krále Dagoberta I. Vůbec první doložená bitva na našem území.",
    tags: ["raný středověk", "politika", "válka"],
    factuality: "fact",
    sources: [
      "https://cs.wikipedia.org/wiki/Bitva_u_Wogastisburgu",
      "https://cs.wikipedia.org/wiki/Sámova_říše",
    ],
    angle:
      "Cizí obchodník se stane vládcem slovanského svazu a porazí franského krále. Fikce: očima Sámova bojovníka nebo poraženého franského vyslance Sicharia. Místo bitvy dodnes nikdo nezná — prostor pro tajemství.",
    label: "S",
  },
  {
    slug: "vznik-velke-moravy-mojmir",
    title: "Vznik Velké Moravy za Mojmíra I.",
    region: "morava",
    yearFrom: 833,
    yearTo: 833,
    excerpt:
      "Kníže Mojmír I. vyhnal nitranského Pribinu a spojil obě knížectví v první velký stát našich předků — Velkou Moravu.",
    tags: ["raný středověk", "politika", "stát"],
    factuality: "fact",
    sources: [
      "https://cs.wikipedia.org/wiki/Velká_Morava",
      "https://cs.wikipedia.org/wiki/Mojmír_I.",
    ],
    angle:
      "Zrod prvního domácího státu z mocenského převratu. Fikce: příběh vyhnaného Pribiny, poraženého soupeře, který musí opustit svou zem — dějiny očima toho, kdo prohrál.",
    label: "V",
  },
  {
    slug: "zavrazdeni-svateho-vaclava",
    title: "Zavraždění svatého Václava",
    region: "cechy",
    yearFrom: 935,
    yearTo: 935,
    excerpt:
      "U kostela ve Staré Boleslavi padl kníže Václav rukou svého bratra Boleslava. Z oběti bratrovraždy se stal věčný patron české země.",
    tags: ["přemyslovci", "náboženství", "tragédie"],
    factuality: "fact",
    sources: [
      "https://cs.wikipedia.org/wiki/Svatý_Václav",
      "https://cs.wikipedia.org/wiki/Boleslav_I.",
    ],
    angle:
      "Bratrovražda, z níž vyroste kult zakladatele národní identity. Fikce: napětí mezi bratry očima družiníka nebo kněze; kolik je politika a kolik legenda dotvořená po smrti.",
    label: "V",
  },
  {
    slug: "bitva-na-moravskem-poli",
    title: "Bitva na Moravském poli a pád Přemysla Otakara II.",
    region: "morava",
    yearFrom: 1278,
    yearTo: 1278,
    excerpt:
      "Král železný a zlatý, nejmocnější Přemyslovec, padl v bitvě proti Rudolfu Habsburskému. Konec snu o středoevropské říši.",
    tags: ["přemyslovci", "válka", "politika"],
    factuality: "fact",
    sources: [
      "https://cs.wikipedia.org/wiki/Bitva_na_Moravském_poli",
      "https://cs.wikipedia.org/wiki/Přemysl_Otakar_II.",
    ],
    angle:
      "Největší vzestup i nejtvrdší pád jedním dnem — a začátek habsburského tématu. Fikce: očima českého rytíře v poraženém vojsku, nebo osiřelého mladého Václava II.",
    label: "P",
  },
  {
    slug: "vznik-opavskeho-knizectvi",
    title: "Vznik Opavského knížectví",
    region: "slezsko",
    yearFrom: 1318,
    yearTo: 1318,
    excerpt:
      "Jan Lucemburský povýšil Opavsko na samostatné vévodství pro potomky nemanželského syna Přemysla Otakara II. Zrodí se opavská větev Přemyslovců na pomezí Slezska.",
    tags: ["středověk", "politika", "slezsko"],
    factuality: "fact",
    sources: [
      "https://cs.wikipedia.org/wiki/Opavské_knížectví",
      "https://cs.wikipedia.org/wiki/Mikuláš_I._Opavský",
    ],
    angle:
      "Levoboček krále zakládá vlastní dynastii ve Slezsku. Fikce: příběh Mikuláše, jehož původ ho vylučuje z trůnu, a přesto si vydobude vlastní zem — legitimita na slezské hranici Koruny.",
    label: "O",
  },
  {
    slug: "korunovace-karla-iv-cisarem",
    title: "Korunovace Karla IV. císařem Svaté říše římské",
    region: "cechy",
    yearFrom: 1355,
    yearTo: 1355,
    excerpt:
      "Český král Karel IV. byl v Římě korunován římským císařem. Praha se stala centrem celé Evropy a začala zlatá éra.",
    tags: ["lucemburkové", "politika", "vrcholný středověk"],
    factuality: "fact",
    sources: [
      "https://cs.wikipedia.org/wiki/Karel_IV.",
      "https://cs.wikipedia.org/wiki/Římská_jízda_Karla_IV.",
    ],
    angle:
      "Vládce z Prahy usedá na nejvyšší trůn křesťanské Evropy. Fikce: očima člena doprovodu na nebezpečné cestě přes rozdělenou Itálii, kde na krále číhají jedy i vzbouřená města.",
    label: "K",
  },
  {
    slug: "upaleni-jana-husa",
    title: "Upálení mistra Jana Husa v Kostnici",
    region: "cechy",
    yearFrom: 1415,
    yearTo: 1415,
    excerpt:
      "Kazatel Jan Hus byl přes příslib bezpečí odsouzen koncilem a upálen. Jeho smrt zapálila celé české království.",
    tags: ["husitství", "náboženství", "tragédie"],
    factuality: "fact",
    sources: [
      "https://cs.wikipedia.org/wiki/Jan_Hus",
      "https://cs.wikipedia.org/wiki/Kostnický_koncil",
    ],
    angle:
      "Člověk, který raději zemře, než by odvolal, a jeho smrt rozpoutá revoluci. Fikce: očima věrného průvodce Jana z Chlumu, který marně bojuje o jeho život a musí domů přivézt zprávu o popravě.",
    label: "H",
  },
  {
    slug: "bitva-na-vitkove",
    title: "Bitva na Vítkově — zrození husitské legendy",
    region: "cechy",
    yearFrom: 1420,
    yearTo: 1420,
    excerpt:
      "Hrstka husitů pod velením Jana Žižky odrazila obrovskou křížovou výpravu u Prahy. Sedláci s cepy porazili evropské rytířstvo.",
    tags: ["husitství", "válka", "vojevůdci"],
    factuality: "fact",
    sources: [
      "https://cs.wikipedia.org/wiki/Bitva_na_Vítkově",
      "https://cs.wikipedia.org/wiki/Jan_Žižka",
    ],
    angle:
      "David proti Goliášovi — neurození ubrání kopec proti přesile a zrodí mýtus neporazitelného Žižky. Fikce: očima mladého cepníka na hradbě, nebo křižáka, který nechápe porážku od sedláků.",
    label: "V",
  },
  {
    slug: "bitva-u-mohace-ludvik-jagellonsky",
    title: "Bitva u Moháče a smrt Ludvíka Jagellonského",
    region: "cechy",
    yearFrom: 1526,
    yearTo: 1526,
    excerpt:
      "Mladý český a uherský král Ludvík Jagellonský zahynul na útěku z prohrané bitvy s Turky. Uvolněný trůn otevřel dveře Habsburkům na dlouhá staletí.",
    tags: ["jagellonci", "válka", "politika"],
    factuality: "fact",
    sources: [
      "https://cs.wikipedia.org/wiki/Bitva_u_Moháče_(1526)",
      "https://cs.wikipedia.org/wiki/Ludvík_Jagellonský",
    ],
    angle:
      "Dvacetiletý král se utopí na útěku a jeho smrt promění dějiny střední Evropy na 400 let. Fikce: očima ovdovělé královny Marie nebo panoše, který ho viděl naposledy živého u řeky.",
    label: "M",
  },
  {
    slug: "rudolfuv-majestat",
    title: "Rudolfův Majestát — zákon o náboženské svobodě",
    region: "cechy",
    yearFrom: 1609,
    yearTo: 1609,
    excerpt:
      "Císař Rudolf II. podepsal listinu zaručující svobodu vyznání — na svou dobu ojedinělý zákon. O deset let později kvůli jeho porušení začne válka.",
    tags: ["baroko", "náboženství", "politika"],
    factuality: "fact",
    sources: [
      "https://cs.wikipedia.org/wiki/Rudolfův_Majestát",
      "https://cs.wikipedia.org/wiki/Rudolf_II.",
    ],
    angle:
      "Nemocný, váhavý císař podepíše pod nátlakem stavů nejsvobodomyslnější zákon Evropy. Fikce: očima úředníka na Hradě mezi alchymisty a astronomy, ve dvoře, kde se míchá věda, magie a rozklad.",
    label: "R",
  },
  {
    slug: "prazska-defenestrace-1618",
    title: "Druhá pražská defenestrace",
    region: "cechy",
    yearFrom: 1618,
    yearTo: 1618,
    excerpt:
      "Rozezlení stavové vyhodili z oken Pražského hradu císařské místodržící. Pád do hradního příkopu odstartoval třicetiletou válku, jež zpustoší Evropu.",
    tags: ["stavovské povstání", "politika", "třicetiletá válka"],
    factuality: "fact",
    sources: [
      "https://cs.wikipedia.org/wiki/Třetí_pražská_defenestrace",
      "https://cs.wikipedia.org/wiki/Stavovské_povstání",
    ],
    angle:
      "Jeden akt vzdoru u okna spustí nejkrvavější válku dějin — a místodržící přežijí pád. Fikce: očima písaře Fabricia, který letěl z okna s nimi, nebo šlechtice, jenž váhá, na kterou stranu se přidat.",
    label: "D",
  },
  {
    slug: "bitva-na-bile-hore",
    title: "Bitva na Bílé hoře",
    region: "cechy",
    yearFrom: 1620,
    yearTo: 1620,
    excerpt:
      "Za necelé dvě hodiny bylo rozhodnuto o osudu země na tři sta let. Stavovské vojsko podlehlo císařským a začala doba temna.",
    tags: ["stavovské povstání", "válka", "tragédie"],
    factuality: "fact",
    sources: [
      "https://cs.wikipedia.org/wiki/Bitva_na_Bílé_hoře",
      "https://cs.wikipedia.org/wiki/Stavovské_povstání",
    ],
    angle:
      "Dvě hodiny, které zlomily zem na staletí. Fikce: očima obyčejného vojáka stavovské armády, který uteče z bojiště, nebo mladého 'zimního krále' Fridricha Falckého prchajícího z Prahy.",
    label: "B",
  },
  {
    slug: "staromestska-exekuce",
    title: "Staroměstská exekuce — poprava 27 českých pánů",
    region: "cechy",
    yearFrom: 1621,
    yearTo: 1621,
    excerpt:
      "Na Staroměstském náměstí bylo popraveno 27 vůdců stavovského povstání. Krvavá pomsta, jejíž hlavy pak visely na Mostecké věži deset let.",
    tags: ["baroko", "tragédie", "politika"],
    factuality: "fact",
    sources: [
      "https://cs.wikipedia.org/wiki/Staroměstská_exekuce",
      "https://cs.wikipedia.org/wiki/Jan_Mydlář",
    ],
    angle:
      "Veřejná poprava celé politické elity národa jako výstraha. Fikce: nezvyklý úhel kata Jana Mydláře, který musel sťat lidi, jež mnohdy osobně znal — řemeslník smrti se svědomím.",
    label: "S",
  },
  {
    slug: "carodejnicke-procesy-velke-losiny",
    title: "Čarodějnické procesy na Velkých Losinách",
    region: "morava",
    yearFrom: 1678,
    yearTo: 1696,
    excerpt:
      "Inkvizitor Boblig z Edelstadtu rozjel na severní Moravě sérii procesů, které poslaly na hranici desítky nevinných lidí — včetně váženého děkana Lautnera.",
    tags: ["baroko", "tragédie", "spravedlnost"],
    factuality: "fact",
    sources: [
      "https://cs.wikipedia.org/wiki/Čarodějnické_procesy_na_šumpersku",
      "https://cs.wikipedia.org/wiki/Kryštof_Alois_Lautner",
    ],
    angle:
      "Chamtivý fanatik promění strach ze zla ve výnosný stroj na majetek a smrt. Fikce: očima děkana Lautnera, který se snaží procesy zastavit a nakonec sám skončí na hranici.",
    label: "C",
  },
  {
    slug: "ztrata-slezska-marie-terezie",
    title: "Ztráta Slezska Marií Terezií",
    region: "slezsko",
    yearFrom: 1740,
    yearTo: 1742,
    excerpt:
      "Pruský král Fridrich II. vpadl bez vyhlášení války do bohatého Slezska a v první slezské válce ho většinu urval Habsburkům navždy. Koruně české zůstal jen zlomek.",
    tags: ["marie terezie", "válka", "slezsko"],
    factuality: "fact",
    sources: [
      "https://cs.wikipedia.org/wiki/První_slezská_válka",
      "https://cs.wikipedia.org/wiki/Války_o_rakouské_dědictví",
    ],
    angle:
      "Mladá panovnice sotva na trůnu ztrácí nejbohatší zem koruny kvůli přepadení souseda. Fikce: očima slezského měšťana v Opavě či Těšíně, jehož rodinu přes noc rozdělí nová hranice Prusko/Rakousko.",
    label: "Z",
  },
  {
    slug: "tolerancni-patent-josef-ii",
    title: "Toleranční patent a zrušení nevolnictví Josefa II.",
    region: "cechy",
    yearFrom: 1781,
    yearTo: 1781,
    excerpt:
      "Císař Josef II. jedním rokem povolil nekatolická vyznání a zrušil nevolnictví. Poddaní poprvé směli svobodně odejít, studovat i vzít se bez svolení pána.",
    tags: ["osvícenství", "reformy", "svoboda"],
    factuality: "fact",
    sources: [
      "https://cs.wikipedia.org/wiki/Toleranční_patent",
      "https://cs.wikipedia.org/wiki/Zrušení_nevolnictví",
    ],
    angle:
      "Jeden podpis dá milionům lidí svobodu pohybu poprvé po staletích. Fikce: očima mladého poddaného, který jako první ve vsi smí odejít do města — a naráží na to, co svoboda opravdu obnáší.",
    label: "J",
  },
  {
    slug: "bitva-u-slavkova-austerlitz",
    title: "Bitva u Slavkova — bitva tří císařů",
    region: "morava",
    yearFrom: 1805,
    yearTo: 1805,
    excerpt:
      "Na moravských pláních u Slavkova se střetli tři císařové a Napoleon zde dosáhl svého nejskvělejšího vítězství. Jedna z nejslavnějších bitev světových dějin.",
    tags: ["napoleonské války", "válka", "morava"],
    factuality: "fact",
    sources: [
      "https://cs.wikipedia.org/wiki/Bitva_u_Slavkova",
      "https://cs.wikipedia.org/wiki/Napoleon_Bonaparte",
    ],
    angle:
      "Světové dějiny se lámou na moravském poli mezi rybníky a mlhou. Fikce: očima moravského sedláka ze Slavkova, jehož ves válka převálcuje, nebo českého vojáka v rakouské armádě.",
    label: "A",
  },
  {
    slug: "slovansky-sjezd-1848",
    title: "Slovanský sjezd a revoluce roku 1848 v Praze",
    region: "cechy",
    yearFrom: 1848,
    yearTo: 1848,
    excerpt:
      "V bouřlivém roce národů se v Praze sešel Slovanský sjezd a vzápětí vypuklo povstání na barikádách. Národní obrození poprvé vyšlo do ulic.",
    tags: ["národní obrození", "revoluce", "politika"],
    factuality: "fact",
    sources: [
      "https://cs.wikipedia.org/wiki/Slovanský_sjezd",
      "https://cs.wikipedia.org/wiki/Revoluce_1848_v_Čechách",
    ],
    angle:
      "Probuzený národ poprvé žádá vlastní hlas — a naráží na dělové koule na barikádách. Fikce: očima studenta, který jde od nadšených proslovů rovnou na barikádu a zažije, jak sen rozdrtí Windischgrätzova děla.",
    label: "S",
  },
  {
    slug: "zakladni-kamen-narodniho-divadla",
    title: "Položení základního kamene Národního divadla",
    region: "cechy",
    yearFrom: 1868,
    yearTo: 1868,
    excerpt:
      "Národ si sám na svou vlastní kulturu vybral peníze a položil základní kámen Národního divadla. „Národ sobě“ — chrám české kultury z darů obyčejných lidí.",
    tags: ["národní obrození", "kultura", "architektura"],
    factuality: "fact",
    sources: [
      "https://cs.wikipedia.org/wiki/Národní_divadlo",
      "https://cs.wikipedia.org/wiki/Generace_Národního_divadla",
    ],
    angle:
      "Divadlo z drobných darů celého národa — a po dostavbě 1881 shoří, načež ho lidé znovu zaplatí. Fikce: očima chudé venkovanky, která přispěje pár krejcary a přijede se podívat na kámen se svým jménem.",
    label: "N",
  },
  {
    slug: "vznik-ceskoslovenska-1918",
    title: "Vznik Československa",
    region: "cechy",
    yearFrom: 1918,
    yearTo: 1918,
    excerpt:
      "Po pádu Rakouska-Uherska vyhlásili 28. října 1918 v Praze samostatnou republiku. Poprvé po 300 letech vlastní stát Čechů a Slováků.",
    tags: ["1. republika", "politika", "stát"],
    factuality: "fact",
    sources: [
      "https://cs.wikipedia.org/wiki/Vznik_Československa",
      "https://cs.wikipedia.org/wiki/Muži_28._října",
    ],
    angle:
      "Národ získá vlastní stát bez jediného výstřelu, uprostřed euforie v ulicích. Fikce: očima jednoho z 'mužů 28. října', kteří museli přes noc zorganizovat převzetí státu, nebo Pražana strhávajícího rakouské orly.",
    label: "R",
  },
  {
    slug: "rozdeleni-tesinska",
    title: "Rozdělení Těšínska mezi Československo a Polsko",
    region: "slezsko",
    yearFrom: 1919,
    yearTo: 1920,
    excerpt:
      "Sedmidenní válka roku 1919 a rozhodnutí velmocí roku 1920 rozdělily Těšínsko podle řeky Olše — a přeťaly i samotné město Těšín napůl.",
    tags: ["1. republika", "politika", "slezsko"],
    factuality: "fact",
    sources: [
      "https://cs.wikipedia.org/wiki/Československo-polský_spor_o_Těšínsko",
      "https://cs.wikipedia.org/wiki/Sedmidenní_válka",
    ],
    angle:
      "Dva spojenci proti sobě vytáhnou do války rok po vzniku a hranice rozřízne město i rodiny. Fikce: očima obyvatele Těšína, jehož dům zůstane na jednom břehu Olše a příbuzní na druhém, v cizí zemi.",
    label: "T",
  },
  {
    slug: "mnichovska-dohoda",
    title: "Mnichovská dohoda",
    region: "cechy",
    yearFrom: 1938,
    yearTo: 1938,
    excerpt:
      "Velmoci se v Mnichově bez účasti Československa dohodly odstoupit pohraničí Německu. „O nás bez nás“ — zrada, která zlomila první republiku.",
    tags: ["mnichov", "politika", "tragédie"],
    factuality: "fact",
    sources: [
      "https://cs.wikipedia.org/wiki/Mnichovská_dohoda",
      "https://cs.wikipedia.org/wiki/Zábor_českého_pohraničí",
    ],
    angle:
      "Spojenci obětují demokratický stát, aby uklidnili Hitlera — a stejně přijde válka. Fikce: očima vojáka na dokonale opevněné hranici, který dostane rozkaz ustoupit bez boje.",
    label: "M",
  },
  {
    slug: "atentat-na-heydricha-lidice",
    title: "Atentát na Heydricha a vyhlazení Lidic",
    region: "cechy",
    yearFrom: 1942,
    yearTo: 1942,
    excerpt:
      "Českoslovenští parašutisté zabili v Praze zastupujícího říšského protektora Heydricha. Nacistická pomsta srovnala se zemí Lidice a zavraždila jejich muže.",
    tags: ["protektorát", "odboj", "tragédie"],
    factuality: "fact",
    sources: [
      "https://cs.wikipedia.org/wiki/Operace_Anthropoid",
      "https://cs.wikipedia.org/wiki/Vyhlazení_Lidic",
    ],
    angle:
      "Jediný odvážný čin odboje a nepředstavitelně krutá kolektivní odplata. Fikce: očima parašutistů obklíčených v kryptě v Resslově ulici, kteří vědí, že nepřežijí, nebo lidické ženy vracející se do vsi, která už neexistuje.",
    label: "A",
  },
  {
    slug: "unorovy-prevrat-1948",
    title: "Únorový převrat — komunisté přebírají moc",
    region: "cechy",
    yearFrom: 1948,
    yearTo: 1948,
    excerpt:
      "Během únorové krize převzali komunisté veškerou moc ve státě. Začíná více než 40 let totality za železnou oponou.",
    tags: ["komunismus", "politika", "totalita"],
    factuality: "fact",
    sources: [
      "https://cs.wikipedia.org/wiki/Únorový_převrat",
      "https://cs.wikipedia.org/wiki/Klement_Gottwald",
    ],
    angle:
      "Demokracie padá bez výstřelu během pár únorových dní, davem na Václavském náměstí. Fikce: očima nekomunistického ministra, který podal demisi a čeká, nebo studenta z pochodu na Hrad, který ještě věří v záchranu.",
    label: "U",
  },
  {
    slug: "prazske-jaro-invaze-1968",
    title: "Pražské jaro a invaze vojsk Varšavské smlouvy",
    region: "cechy",
    yearFrom: 1968,
    yearTo: 1968,
    excerpt:
      "Pokus o „socialismus s lidskou tváří“ ukončily v srpnu tanky pěti armád. Národ se bránil jen holýma rukama a otočenými cedulemi.",
    tags: ["komunismus", "okupace", "politika"],
    factuality: "fact",
    sources: [
      "https://cs.wikipedia.org/wiki/Pražské_jaro",
      "https://cs.wikipedia.org/wiki/Invaze_vojsk_Varšavské_smlouvy_do_Československa",
    ],
    angle:
      "Krátká naděje na svobodu rozdrcená pásy tanků přes noc. Fikce: očima mladého člověka stojícího v srpnu 1968 před tankem, nebo hlasatele rozhlasu vysílajícího do poslední chvíle.",
    label: "P",
  },
  {
    slug: "sebeupaleni-jana-palacha",
    title: "Sebeupálení Jana Palacha",
    region: "cechy",
    yearFrom: 1969,
    yearTo: 1969,
    excerpt:
      "Student Jan Palach se na Václavském náměstí zapálil na protest proti rezignaci národa po okupaci. Živá pochodeň, která otřásla svědomím země.",
    tags: ["komunismus", "odpor", "tragédie"],
    factuality: "fact",
    sources: [
      "https://cs.wikipedia.org/wiki/Jan_Palach",
      "https://cs.wikipedia.org/wiki/Pochodeň_číslo_1",
    ],
    angle:
      "Jeden mladý muž obětuje život, aby probudil rezignující národ. Fikce: očima spolužáka nebo sestry u jeho lůžka během tří dnů, kdy umírá — tíha rozhodnutí, které nešlo vzít zpět.",
    label: "P",
  },
  {
    slug: "sametova-revoluce-1989",
    title: "Sametová revoluce",
    region: "cechy",
    yearFrom: 1989,
    yearTo: 1989,
    excerpt:
      "Po brutálně rozehnané studentské demonstraci 17. listopadu se země zvedla a během několika týdnů svrhla komunistický režim. Bez násilí, se zvonícími klíči.",
    tags: ["revoluce", "svoboda", "politika"],
    factuality: "fact",
    sources: [
      "https://cs.wikipedia.org/wiki/Sametová_revoluce",
      "https://cs.wikipedia.org/wiki/17._listopad_1989",
    ],
    angle:
      "Národ svrhne totalitu za pár týdnů jen cinkáním klíčů a generální stávkou. Fikce: očima studentky z průvodu na Národní třídě, kterou zbijí, a která pak sleduje, jak se z toho večera zrodí svoboda.",
    label: "S",
  },
  {
    slug: "rozdeleni-ceskoslovenska-1993",
    title: "Rozdělení Československa",
    region: "cechy",
    yearFrom: 1993,
    yearTo: 1993,
    excerpt:
      "K 1. lednu 1993 se Československo pokojně rozdělilo na Českou a Slovenskou republiku. Klidný rozchod dvou národů bez jediného výstřelu.",
    tags: ["politika", "stát", "novodobé dějiny"],
    factuality: "fact",
    sources: [
      "https://cs.wikipedia.org/wiki/Rozdělení_Československa",
      "https://cs.wikipedia.org/wiki/Česko-slovenská_federativní_republika",
    ],
    angle:
      "Společný stát dvou národů se rozejde v míru, přesto proti vůli většiny občanů. Fikce: očima rodiny s českým i slovenským kořenem, pro niž se hranice stane skutečnou.",
    label: "R",
  },
];

/** Drafty převedené na plné Story (body = excerpt, generovaný cover). */
const CZ_DRAFTS: Story[] = CZ_DRAFT_SEEDS.map((d, i) => ({
  id: `cz${i + 1}`,
  title: d.title,
  slug: d.slug,
  countryCode: "CZE",
  region: d.region,
  yearFrom: d.yearFrom,
  yearTo: d.yearTo,
  excerpt: d.excerpt,
  body: d.excerpt,
  coverImage: cover(d.slug, d.label),
  tags: d.tags,
  factuality: d.factuality,
  // Krátká úroveň splňuje bar → published (vidí čtenář); autor = Křehy.
  status: "published",
  author: { name: "Křehy" },
  sources: d.sources,
  angle: d.angle,
}));

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
    media: "stories/egy-pyramid.jpg",
    mediaCredit: "David Roberts, „Pyramidy v Gíze“ (1839) · public domain",
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
    region: "cechy",
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
    media: "stories/egy-cleopatra.jpg",
    mediaCredit: "Reginald Arthur, „Smrt Kleopatry“ (1892) · public domain",
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
    media: "stories/egy-tutankhamun.jpg",
    mediaCredit: "Harry Burton, hrobka Tutanchamona (1922) · public domain",
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
    id: "18",
    title: "Vylodění První flotily v Sydney",
    slug: "prvni-flotila-sydney",
    countryCode: "AUS",
    yearFrom: 1788,
    yearTo: 1788,
    excerpt:
      "Jedenáct lodí s odsouzenci zakotvilo v zálivu Port Jackson a založilo první evropskou osadu na australském kontinentu.",
    coverImage: cover("AUS", "⚓"),
    body: "26. ledna 1788 přistála v zálivu Port Jackson takzvaná První flotila — jedenáct britských lodí pod velením kapitána Arthura Phillipa, které z Anglie připluly s více než tisícem lidí, převážně trestanců. Založená trestanecká kolonie se stala základem dnešního Sydney a počátkem evropského osídlení Austrálie. Pro původní obyvatele, Aboridžince žijící na kontinentu desítky tisíc let, však znamenal příchod Evropanů začátek vytlačování, nemocí a ztráty půdy. Datum 26. ledna se dodnes slaví jako Australia Day — a zároveň je předmětem sporů jako „Den invaze“.",
    tags: ["novověk", "kolonizace", "objevné plavby"],
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
  {
    id: "19",
    title: "Stavba Karlova mostu",
    slug: "stavba-karlova-mostu",
    countryCode: "CZE",
    region: "cechy",
    yearFrom: 1357,
    yearTo: 1402,
    excerpt:
      "Karel IV. položil základní kámen v magický palindromický okamžik — a legenda praví, že se do malty přidávala vejce z celé země.",
    coverImage: cover("CZE2", "🜋"),
    body: "Základní kámen Karlova mostu položil císař Karel IV. — podle pověsti — 9. července 1357 přesně v 5 hodin a 31 minut ráno. Tento okamžik tvoří vzestupnou a sestupnou řadu lichých čísel 1‑3‑5‑7‑9‑7‑5‑3‑1 (1357, 9. den, 7. měsíc, 5:31). Vzdělaný a pověrčivý panovník prý dbal na astrologii a nechal si termín vypočítat, aby most stál na věky. A stojí — na rozdíl od svého předchůdce, Juditina mostu, který vzala voda. K trvanlivosti měla podle nejslavnější české stavební legendy pomoci i malta: do vápna se prý přidávala vejce, tvaroh a víno, aby zdivo lépe drželo. Města po celé zemi posílala do Prahy vozy vajec; z Velvar prý dorazila vejce natvrdo uvařená, aby se cestou nerozbila. Most nese jméno Karla IV. až od 19. století — po staletí se mu říkalo prostě Kamenný nebo Pražský most.",
    tags: ["středověk", "architektura", "Karel IV.", "legendy"],
    factuality: "fact",
    status: "published",
    author: { name: "Křehy" },
    media: "stories/cze-bridge-founding.mp4",
    mediaType: "video",
    mediaCredit: "AI ilustrace (storybook) · Příběhy historie",
    hero: {
      media: "stories/cze-bridge-hero.mp4",
      mediaType: "video",
      eyebrow: "Pražská legenda",
    },
    beats: [
      {
        kind: "scene",
        media: "stories/cze-charles-iv-green.jpg",
        chroma: true,
        title: "Karel IV.",
        text: "Učený a pověrčivý císař a král, který si termín stavby nechal vypočítat podle hvězd. Za jeho vlády se z Prahy stalo srdce říše.",
        mood: "mystic",
      },
      {
        kind: "scene",
        media: "stories/cze-astrolabe.mp4",
        mediaType: "video",
        title: "Podle hvězd",
        text: "Nad pergameny s hvězdnými mapami a astrolábem hledal Karel dokonalý okamžik — chvíli, kdy se čísla i souhvězdí seřadí do řady.",
        credit: "AI ilustrace (storybook)",
        mood: "mystic",
      },
      {
        kind: "scene",
        media: "stories/cze-bridge-founding.mp4",
        mediaType: "video",
        title: "Magický okamžik",
        text: "9. července 1357 v 5 hodin a 31 minut ráno položil Karel IV. základní kámen nového kamenného mostu přes Vltavu.",
        credit: "AI ilustrace (storybook)",
        mood: "dawn",
      },
      {
        kind: "flip",
        front: "Proč zrovna 9. 7. 1357 v 5:31?",
        back: "Čísla tvoří palindrom 1‑3‑5‑7‑9‑7‑5‑3‑1 — vzestupná a sestupná řada lichých čísel. Karel věřil, že takový magický okamžik zajistí mostu věčnost.",
        mood: "mystic",
      },
      {
        kind: "scrub",
        media: "stories/cze-bridge-eggs.mp4",
        credit: "AI ilustrace (storybook)",
        mood: "day",
        captions: [
          {
            at: 0,
            title: "Vejce v maltě",
            text: "Aby zdivo lépe drželo, přidávala se prý do malty vejce, tvaroh a víno.",
          },
          {
            at: 0.4,
            title: "Vozy z celé země",
            text: "Města po celé zemi posílala do Prahy celé vozy vajec — kámen po kameni rostl most nad Vltavou.",
          },
          {
            at: 0.75,
            title: "Velvarská léčka",
            text: "Z Velvar prý dorazila vejce natvrdo uvařená — aby se cestou do Prahy nerozbila. 🥚",
          },
        ],
      },
      {
        kind: "scene",
        media: "stories/cze-bridge-workers.jpg",
        title: "Kamenný most roste",
        text: "Dřevěné jeřáby zvedají pískovcové kvádry nad Vltavu pod Pražským hradem. Stavba trvala desítky let a most stojí dodnes.",
        credit: "AI ilustrace (storybook)",
        mood: "day",
      },
      {
        kind: "scene",
        media: "stories/cze_mason-green.png",
        chroma: true,
        title: "Kameníci",
        text: "Kvádr po kvádru tesali a kladli kameníci pískovec. Poctivá práce, kterou drží — prý — i pár tisíc vajec v maltě.",
        mood: "day",
      },
      {
        kind: "scene",
        media: "stories/cze-bridge-night.jpg",
        title: "Most, který přetrval věky",
        text: "Za nocí střeží most sochy světců a mlha nad Vltavou. Kámen položený v magickou chvíli stojí už bezmála sedm století.",
        credit: "AI ilustrace (storybook)",
        mood: "night",
      },
      {
        kind: "quiz",
        question: "V kolik hodin byl podle pověsti položen základní kámen?",
        options: ["V 5:31 ráno", "V poledne", "O půlnoci", "Za soumraku"],
        answer: 0,
        explain: "9. 7. 1357 v 5:31 — čísla tvoří palindrom 1‑3‑5‑7‑9‑7‑5‑3‑1.",
      },
      {
        kind: "quiz",
        question: "Co se prý přidávalo do malty, aby most déle vydržel?",
        options: ["Vejce", "Ryzí zlato", "Med", "Mořská sůl"],
        answer: 0,
        explain: "Vejce (a podle pověsti i tvaroh a víno) měla maltu zpevnit.",
      },
      {
        kind: "quiz",
        question: "Jak se mostu říkalo před 19. stoletím?",
        options: ["Kamenný / Pražský most", "Karlův most", "Juditin most", "Zlatý most"],
        answer: 0,
        explain: "Jméno „Karlův most“ se ujalo až v 19. století; předtím to byl Kamenný most.",
      },
    ],
  },

  // ═══ MOCKUP „KRATŠÍ" (3 beaty) — Golem (pověst) ═══
  // Placeholder média = existující soubory; reálné cíle viz docs/shotlist-golem.md.
  {
    id: "20",
    title: "Golem rabbiho Löwa",
    slug: "golem-rabbi-low",
    countryCode: "CZE",
    region: "cechy",
    yearFrom: 1580,
    yearTo: 1580,
    excerpt:
      "Podle pověsti stvořil rabbi Jehuda Löw z vltavské hlíny obřího ochránce ghetta — a musel ho zase umlčet, než se jeho síla vymkla.",
    coverImage: cover("golem-rabbi-low", "G"),
    body:
      "Podle nejslavnější pražské pověsti stvořil rabbi Jehuda Löw ben Becalel z hlíny vltavského břehu obřího Golema, jehož oživil pergamenem s Božím jménem (šémem) vloženým do úst. Golem měl chránit židovské ghetto. Když se však jeho síla začala vymykat, musel ho rabín zbavit šému a proměnit zpět v hroudu hlíny — a tělo prý ukryl na půdě Staronové synagogy, kde podle pověsti leží dodnes. Příběh předjímá téma umělého života staletí předtím, než vzniklo slovo robot.",
    tags: ["pověst", "Praha", "renesance"],
    factuality: "legend",
    status: "published",
    author: { name: "Křehy" },
    sources: [
      "https://cs.wikipedia.org/wiki/Golem",
      "https://cs.wikipedia.org/wiki/Jehuda_Liva_ben_Becalel",
    ],
    angle:
      "Stvoření umělého člověka staletí před roboty a strach, co se stane, když se vymkne kontrole. Fikce: očima rabbiho učedníka, který zná tajemství oživení i děsivou cenu.",
    media: "stories/cze-bridge-night.jpg", // PLACEHOLDER → cze-golem/03-hrozba.jpg
    mediaCredit: "AI ilustrace (storybook) · Příběhy historie",
    hero: {
      media: "stories/cze-bridge-hero.mp4", // PLACEHOLDER → cze-golem/hero.mp4
      mediaType: "video",
      eyebrow: "Pražská pověst",
    },
    audio: {
      // scaffold — soubory zatím neexistují (viz docs/shotlist-golem.md)
      music: {
        crossfadeMs: 800,
        intro: "stories/cze-golem/loop-intro.ogg",
        loops: {
          mystic: "stories/cze-golem/loop-mystic.ogg",
          night: "stories/cze-golem/loop-night.ogg",
        },
      },
      voiceover: {
        perBeat: [
          "stories/cze-golem/vo-01.mp3", // rabín
          "stories/cze-golem/vo-02.mp3", // šém / oživení
          null, // flip — bez vypravěče
        ],
      },
      sfx: [
        { src: "stories/cze-golem/sfx-clay-rise.ogg", trigger: { on: "beatEnter", beat: 1 } },
        { src: "stories/sfx/page-flip.ogg", trigger: { on: "flip" }, gain: 0.6 },
      ],
    },
    beats: [
      {
        kind: "scene",
        media: "stories/cze-charles-iv-green.jpg", // PLACEHOLDER → cze-golem/01-rabi-green.png
        chroma: true,
        title: "Rabi Jehuda Löw",
        text: "Učený rabín a znalec kabaly, který nad Prahou hledal způsob, jak ochránit své lidi. Vltavská hlína a tajemství Božího jména mu měly dát strážce.",
        mood: "mystic",
      },
      {
        kind: "scene",
        media: "stories/cze-astrolabe.mp4", // PLACEHOLDER → cze-golem/02-oziveni.mp4
        mediaType: "video",
        title: "Šém v ústech",
        text: "Rabín vložil obrovi do úst pergamen s posvátným slovem — a hliněná socha se pohnula. Golem procitl, aby střežil ghetto.",
        credit: "AI ilustrace (storybook)",
        mood: "mystic",
      },
      {
        kind: "flip",
        front: "Věděli jste, jak se Golem zastavil?",
        back: "Prý stačilo vyjmout mu z úst šém — a obr se změnil zpět v hroudu hlíny. Podle pověsti dodnes leží na půdě Staronové synagogy.",
        mood: "night",
      },
    ],
  },

  // ═══ MOCKUP „STŘEDNÍ" (6 beatů) — Cyril a Metoděj (fakt, Morava) ═══
  // Placeholder média = existující soubory; reálné cíle viz docs/shotlist-cyril.md.
  {
    id: "21",
    title: "Cyril a Metoděj na Velké Moravě",
    slug: "cyril-a-metodej-velka-morava",
    countryCode: "CZE",
    region: "morava",
    yearFrom: 863,
    yearTo: 863,
    excerpt:
      "Kníže Rastislav si z daleké Byzance vyžádal učitele. Dva bratři ze Soluně přinesli písmo, srozumitelnou bohoslužbu a základ slovanské vzdělanosti.",
    coverImage: cover("cyril-a-metodej-velka-morava", "C"),
    body:
      "Roku 863 dorazili na pozvání knížete Rastislava na Velkou Moravu byzantští věrozvěstové Konstantin (později mnich Cyril) a jeho bratr Metoděj. Přinesli nové písmo — hlaholici — a bohoslužbu ve staroslověnštině, jazyce, jemuž slovanští obyvatelé rozuměli. Postavili se přitom sporu s franským duchovenstvem a slovanskou liturgii obhájili až v Římě. Jejich dílo položilo základ slovanské vzdělanosti; z hlaholice později vznikla cyrilice a z ní azbuka. Oba bratři jsou dodnes uctíváni jako spolupatroni Evropy.",
    tags: ["raný středověk", "Velká Morava", "písmo"],
    factuality: "fact",
    status: "published",
    author: { name: "Křehy" },
    sources: [
      "https://cs.wikipedia.org/wiki/Cyril_a_Metoděj",
      "https://cs.wikipedia.org/wiki/Velká_Morava",
    ],
    angle:
      "Dva vzdělanci mění kulturu národa jazykem a abecedou. Fikce: očima mladého žáka, který se první učí hlaholici, nebo skrze zápas o to, čí liturgie zvítězí — Řím, nebo Byzanc.",
    media: "stories/cze-bridge-founding.mp4", // PLACEHOLDER → cze-cyril/01-rastislav.mp4
    mediaType: "video",
    mediaCredit: "AI ilustrace (storybook) · Příběhy historie",
    hero: {
      media: "stories/cze-bridge-hero.mp4", // PLACEHOLDER → cze-cyril/hero.mp4
      mediaType: "video",
      eyebrow: "Zrození písma",
    },
    audio: {
      // scaffold — soubory zatím neexistují (viz docs/shotlist-cyril.md)
      music: {
        crossfadeMs: 800,
        intro: "stories/cze-cyril/loop-intro.ogg",
        loops: {
          dawn: "stories/cze-cyril/loop-dawn.ogg",
          mystic: "stories/cze-cyril/loop-mystic.ogg",
          day: "stories/cze-cyril/loop-day.ogg",
        },
      },
      voiceover: {
        perBeat: [
          "stories/cze-cyril/vo-01.mp3", // Rastislavova prosba
          "stories/cze-cyril/vo-02.mp3", // bratři ze Soluně
          "stories/cze-cyril/vo-03.mp3", // hlaholice
          null, // flip — bez vypravěče
          "stories/cze-cyril/vo-05.mp3", // liturgie / spor / Řím (scrub)
          "stories/cze-cyril/vo-06.mp3", // odkaz
        ],
      },
      sfx: [
        { src: "stories/cze-cyril/sfx-quill.ogg", trigger: { on: "beatEnter", beat: 2 }, gain: 0.7 },
        { src: "stories/cze-cyril/sfx-bell.ogg", trigger: { on: "beatEnter", beat: 5 } },
        { src: "stories/sfx/page-flip.ogg", trigger: { on: "flip" }, gain: 0.6 },
      ],
    },
    beats: [
      {
        kind: "scene",
        media: "stories/cze-bridge-founding.mp4", // PLACEHOLDER → cze-cyril/01-rastislav.mp4
        mediaType: "video",
        title: "Prosba knížete Rastislava",
        text: "Moravský kníže Rastislav toužil po učitelích, kteří by jeho lidu hlásali víru v jazyce, jemuž rozumí. Vyslal poselství až do Cařihradu.",
        credit: "AI ilustrace (storybook)",
        mood: "dawn",
      },
      {
        kind: "scene",
        media: "stories/cze-charles-iv-green.jpg", // PLACEHOLDER → cze-cyril/02-bratri-green.png
        chroma: true,
        title: "Bratři ze Soluně",
        text: "Konstantin — učenec zvaný Filosof — a jeho bratr Metoděj. Slovanské nářečí znali od dětství a byli připraveni na dalekou cestu na sever.",
        mood: "mystic",
      },
      {
        kind: "scene",
        media: "stories/cze-astrolabe.mp4", // PLACEHOLDER → cze-cyril/03-hlaholice.mp4
        mediaType: "video",
        title: "Nové písmo — hlaholice",
        text: "Aby zapsali slovanská slova, sestavil Konstantin úplně novou abecedu. Poprvé měla řeč našich předků svá vlastní písmena.",
        credit: "AI ilustrace (storybook)",
        mood: "mystic",
      },
      {
        kind: "flip",
        front: "Odkud se vzala azbuka?",
        back: "Z hlaholice později žáci obou bratří vytvořili jednodušší cyrilici — pojmenovanou po Cyrilovi. Z ní vzešla azbuka, kterou dnes píše půl světa.",
        mood: "mystic",
      },
      {
        kind: "scrub",
        media: "stories/cze-bridge-eggs.mp4", // PLACEHOLDER → cze-cyril/05-liturgie.mp4
        credit: "AI ilustrace (storybook)",
        mood: "day",
        captions: [
          {
            at: 0,
            title: "Bohoslužba, které je rozumět",
            text: "Bratři sloužili mši ve staroslověnštině — lidé poprvé rozuměli každému slovu.",
          },
          {
            at: 0.45,
            title: "Spor s franskými kněžími",
            text: "Latinští duchovní je obvinili z kacířství. Čí liturgie na Moravě zvítězí?",
          },
          {
            at: 0.8,
            title: "Obhajoba v Římě",
            text: "Bratři se vydali obhájit slovanskou bohoslužbu až před papeže — a uspěli.",
          },
        ],
      },
      {
        kind: "scene",
        media: "stories/cze-bridge-workers.jpg", // PLACEHOLDER → cze-cyril/06-odkaz.jpg
        title: "Odkaz, který přetrval",
        text: "I když byli žáci po Metodějově smrti z Moravy vyhnáni, písmo a víra se rozšířily k jižním i východním Slovanům. Dílo bratří přežilo staletí.",
        credit: "AI ilustrace (storybook)",
        mood: "dawn",
      },
    ],
  },

  // ═══ UKÁZKOVÉ DRAFTY (rozpracované, jen ve Studiu — čtenář je nevidí) ═══
  {
    id: "d1",
    title: "Zlatá bula sicilská",
    slug: "zlata-bula-sicilska",
    countryCode: "CZE",
    region: "cechy",
    yearFrom: 1212,
    yearTo: 1212,
    excerpt:
      "Přemysl Otakar I. získal listinu, která dědičně povýšila český kníže­cí stolec na království. (rozpracováno)",
    coverImage: cover("zlata-bula-sicilska", "Z"),
    body: "Rozpracovaný draft — čeká na doladění a média.",
    tags: ["přemyslovci", "politika"],
    factuality: "fact",
    status: "draft",
    author: { name: "Křehy" },
    sources: ["https://cs.wikipedia.org/wiki/Zlatá_bula_sicilská"],
  },
  {
    id: "d2",
    title: "Bitva u Lipan",
    slug: "bitva-u-lipan",
    countryCode: "CZE",
    region: "cechy",
    yearFrom: 1434,
    yearTo: 1434,
    excerpt:
      "Střet, který ukončil husitské války — umírnění porazili radikální polní vojska. (rozpracováno)",
    coverImage: cover("bitva-u-lipan", "L"),
    body: "Rozpracovaný draft — čeká na doladění a média.",
    tags: ["husitství", "válka"],
    factuality: "fact",
    status: "draft",
    author: { name: "Křehy" },
    sources: ["https://cs.wikipedia.org/wiki/Bitva_u_Lipan"],
  },

  // ─── České DRAFTY (nápady z rešerše) — naplňují časovou osu pro design ───
  ...CZ_DRAFTS,
];

export default STORIES;
