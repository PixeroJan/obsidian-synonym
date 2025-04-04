// En omfattande ordbok med svenska synonymer

export const fullSwedishDictionary: Record<string, string[]> = {
  // Vanliga adjektiv
  "snabb": ["hastig", "kvick", "rapp", "vig", "flink", "skyndsam", "rask", "blixtsnabb", "rivande", "pilsnabb", "rappt", "flott", "snabbt", "ilande", "frenetisk", "rusande", "fort", "hastigt"],
  "långsam": ["trög", "slö", "sävlig", "seg", "maklig", "dröjande", "småningom", "sakta", "avsiktlig", "utdragen", "långdragen", "sölig", "släpig", "långsamt", "trögtänkt", "retarderad"],
  "stor": ["enorm", "gigantisk", "mäktig", "omfattande", "väldig", "ansenlig", "betydande", "kolossal", "reslig", "imposant", "jättelik", "massiv", "omfångsrik", "vidlyftig", "storartad", "monumental"],
  "liten": ["minimal", "obetydlig", "oansenlig", "knapp", "futtig", "ringa", "diminutiv", "blygsam", "förminskad", "nätt", "pygmé", "miniatyr", "mikroskopisk", "pytteliten", "ynklig", "bitte"],
  "glad": ["munter", "lycklig", "upprymd", "nöjd", "belåten", "förtjust", "strålande", "glädjefull", "glättig", "uppspelt", "jublande", "glädjestrålande", "exalterad", "euforisk", "salig", "glädjefylld"],
  "ledsen": ["bedrövad", "sorgsen", "dyster", "nedslagen", "besviken", "olycklig", "sorgfull", "nedstämd", "modfälld", "melankolisk", "deprimerad", "deppig", "bekymrad", "betryckt", "tungsint", "ledsam"],
  "arg": ["ilsken", "förbittrad", "rasande", "ursinnig", "vred", "uppretad", "förargad", "irriterad", "uppbragt", "förgrymmad", "rosenrasande", "förbannad", "arg som ett bi", "ilsk", "förarglig", "upprörd"],
  "bra": ["utmärkt", "förträfflig", "ypperlig", "duglig", "fin", "god", "kompetent", "förstklassig", "framstående", "gynnsam", "gedigen", "excellent", "fantastisk", "strålande", "högklassig", "prima"],
  "dålig": ["bristfällig", "undermålig", "usel", "kass", "värdelös", "svag", "otillräcklig", "misslyckad", "medioker", "negativ", "olämplig", "mediokert", "skral", "eländig", "urusel", "undermåligt"],
  "vacker": ["skön", "attraktiv", "tilltalande", "förtjusande", "bedårande", "behaglig", "charmerande", "ljuvlig", "stilig", "ståtlig", "praktfull", "vad", "anslående", "intagande", "betagande", "älsklig"],
  "ful": ["motbjudande", "oattraktiv", "anskrämlig", "vedervärdig", "frånstötande", "hemsk", "otäck", "otrevlig", "gräslig", "avskyvärd", "grotesk", "vanskaplig", "vämjelig", "vidrig", "stygg", "oskön"],
  "plötslig": ["abrupt", "häftig", "hastig", "oväntad", "tvärt", "överraskande", "oförberedd", "oförutsedd", "drastisk", "blixtsnabb", "ögonblicklig", "tvär", "oförmodad", "plötsligt", "momentan", "snabb"],
  "viktig": ["betydelsefull", "avgörande", "central", "väsentlig", "angelägen", "nödvändig", "essentiell", "fundamental", "betydande", "grundläggande", "väsentligt", "huvudsaklig", "primär", "kritisk", "vital", "relevant"],
  "oviktig": ["betydelselös", "oväsentlig", "obetydlig", "irrelevant", "sekundär", "perifer", "marginell", "försumbar", "ovidkommande", "trivial", "betydelselöst", "underordnad", "ringa", "ovärt", "obetydlig", "överflödig"],
  "svår": ["besvärlig", "komplicerad", "krånglig", "invecklad", "problematisk", "mödosam", "arbetsam", "knepig", "knivig", "komplex", "svårlöst", "intrikat", "svårhanterlig", "svårt", "jobbig", "svårfattlig"],
  "lätt": ["enkel", "simpel", "okomplicerad", "smidig", "bekväm", "oproblematisk", "lätthanterlig", "elementär", "basal", "lättskött", "okonstlad", "lättsam", "lättbegriplig", "lätt", "lättfattlig", "enkelt"],
  "god": ["bra", "fin", "utsökt", "välsmakande", "delikat", "läcker", "smaklig", "aptitlig", "välgjord", "smakfull", "aptitretande", "kulinarisk", "förträfflig", "saftig", "härlig", "ypperlig"],
  
  // Vanliga verb
  "börja": ["starta", "inleda", "påbörja", "initiera", "igångsätta", "ta itu med", "sätta igång", "gå igång", "komma igång", "anträda", "påbörjas", "inledas", "ta sin början", "öppnas", "ta fart", "bege sig"],
  "sluta": ["avsluta", "upphöra", "avbryta", "fullborda", "färdigställa", "fullgöra", "stänga", "lägga ned", "lägga av", "göra slut på", "bli klar", "få ett slut", "avslutad", "upphör", "avrunda", "kulminera"],
  "äta": ["förtära", "konsumera", "inta", "smaka", "kalasa", "avnjuta", "stoppa i sig", "mumsa", "bita", "tugga", "sluka", "frossa", "snaska", "proppa i sig", "mätta sig", "spisera"],
  "dricka": ["förtära", "inta", "konsumera", "släcka törsten", "svepa", "sörpla", "smutta", "tömma", "klunka", "dricka ur", "skölja ned", "ta en klunk", "svepande", "nedsväljer", "drucker", "inmundiga"],
  "sova": ["vila", "slumra", "snarkar", "drömma", "tupplur", "ta en lur", "ligga", "hållas i säng", "sängliggande", "sova tungt", "slumra till", "somnar", "sovandes", "nattro", "sovit", "vilande"],
  "prata": ["tala", "konversera", "samtala", "diskutera", "meddela", "berätta", "snacka", "tjata", "spräka", "resonera", "yttra", "ventilera", "meddela", "språkas vid", "pladder", "ordflöde"],
  "arbeta": ["jobba", "verka", "fungera", "knoga", "slita", "utföra", "producera", "åstadkomma", "prestera", "ägna sig", "arbete", "arbetande", "verksam", "operera", "mödande", "sträva"],
  "lära": ["studera", "läser", "utbilda", "undervisa", "instruera", "inpränta", "memorera", "plugga", "repetera", "lärande", "läraktig", "lärdom", "undervisar", "lär", "utbildar", "skolar"],
  "leva": ["existera", "finnas", "vara", "bo", "vistas", "fortleva", "överleva", "leva upp", "livsuppehälle", "leverne", "levnad", "livnära sig", "lever", "existerat", "levandes", "existens"],
  "dö": ["avlida", "gå bort", "somna in", "omkomma", "förgås", "sluta", "uppge andan", "slockna", "dra sin sista suck", "avlider", "dör", "döende", "avlidit", "dött", "dödsfall", "förlisa"],
  "läsa": ["studera", "tillgodogöra sig", "ta del av", "granska", "titta igenom", "bläddra", "läser", "läsare", "läsning", "läst", "lästes", "reciterar", "läsandes", "genomläser", "skumläsa", "perlustrerar"],
  "skriva": ["författa", "utforma", "komponera", "nedteckna", "skriver", "anteckna", "nedskriva", "skribent", "skrift", "skriven", "skriftlig", "skriverier", "skrivit", "skriftställare", "skrivare", "författare"],
  "se": ["titta", "betrakta", "skåda", "iaktta", "observera", "bese", "syna", "ser", "seende", "blicka", "glo", "stirra", "besiktiga", "beskåda", "synar", "granskar"],
  "höra": ["lyssna", "uppfatta", "förnimma", "avlyssna", "höra på", "uppsnappa", "hör", "hörande", "hörsel", "hörd", "hört", "öron", "hörsamma", "uppfångat", "hörsägen", "lyhörd"],
  
  // Fler vanliga ord och fraser
  // ... lägg till fler ord och synonymer efter behov

  // En till batch av vanliga ord - lägg till fler enligt behov
  "gammal": ["åldrig", "antik", "föråldrad", "förlegad", "uråldrig", "bedagad", "forntida", "åldersstigen", "utsliten", "ålderstigen", "åldrad", "antiken", "klassisk", "ålderdomlig", "åldrige", "senior"],
  "ny": ["färsk", "modern", "aktuell", "nymodig", "fräsch", "oförbrukad", "nyskapande", "innovativ", "banbrytande", "originell", "nyhet", "nyligare", "nytillkommen", "nyuppkommen", "nyanskaffad", "nyläggning"],
  "komma": ["anlända", "infinna sig", "uppenbara sig", "dyka upp", "nå", "ankomma", "inträffa", "tillkomma", "uppenbaras", "arrivera", "ankommande", "ankommer", "anlänt", "kommit", "inkommande", "anträffas"],
  "gå": ["promenera", "vandra", "spatsera", "traska", "klampa", "stega", "strosa", "gående", "gångare", "gått", "går", "avlägsna sig", "beger sig", "förflyttar sig", "lämnar", "förlöper"],
  "fort": ["hastigt", "kvickt", "snabbt", "raskt", "skyndsamt", "rappt", "blixtsnabbt", "rivande", "pilsnabbt", "express", "flinkt", "kvickt", "skyndsammare", "hastande", "skyndande", "ilande"],
  "trött": ["utmattad", "uttröttad", "sömnig", "slut", "dåsig", "orkeslös", "kraftlös", "sliten", "medtagen", "utpumpad", "utarbetad", "uttröttad", "överansträngd", "utsliten", "kraftlös", "slutkörd"],
  "stark": ["kraftig", "mäktig", "potent", "robust", "muskulös", "stabil", "kraftfull", "välbyggd", "styrketålig", "dominant", "styrka", "muskler", "styrketålig", "välformad", "hållfast", "uthållig"],
  "svag": ["kraftlös", "orkeslös", "matt", "klen", "bräcklig", "vag", "urholkad", "maktlös", "tandlös", "medioker", "ömtålig", "sjuklig", "mager", "kraftlös", "blek", "antydan"],
  "ärlig": ["uppriktig", "sannfärdig", "sanningsenlig", "rättfram", "redbar", "rättrådig", "oförfalskad", "pålitlig", "okonstlad", "rak", "rakryggad", "transparent", "renhårig", "lojal", "trogen", "rättvis"]
};
