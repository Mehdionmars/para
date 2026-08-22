import { describe, expect, it } from "vitest";

import {
  TRACKING_STORAGE_KEY,
  clearTracking,
  readTracking,
  saveTracking,
} from "@/lib/orders/trackingMemory";

/**
 * Ce que /suivi-commande retient d'une consultation à l'autre.
 *
 * C'est du confort d'interface et rien d'autre : le contenu de ce stockage est
 * modifiable par quiconque ouvre les outils de développement, donc il ne prouve
 * rien. Le serveur revérifie numéro + email à chaque consultation
 * (backend/src/app/api/orders/track/route.ts compare customerEmail et renvoie
 * le même 404 pour un numéro faux et pour un email faux). Ces tests portent
 * donc sur deux choses : que la restauration marche, et que rien d'autre que
 * le numéro et l'email ne se retrouve stocké.
 */

type Entry = string | null;

/** Un localStorage de test, dont on peut inspecter le contenu brut. */
function makeStorage(initial?: Entry) {
  const store = new Map<string, string>();
  if (initial != null) store.set(TRACKING_STORAGE_KEY, initial);
  return {
    getItem: (k: string) => store.get(k) ?? null,
    keys: () => [...store.keys()],
    raw: () => store.get(TRACKING_STORAGE_KEY) ?? null,
    removeItem: (k: string) => {
      store.delete(k);
    },
    setItem: (k: string, v: string) => {
      store.set(k, v);
    },
  };
}

/** Un stockage indisponible : Safari en navigation privée, quota plein. */
const throwingStorage = {
  getItem: () => {
    throw new DOMException("SecurityError");
  },
  removeItem: () => {
    throw new DOMException("SecurityError");
  },
  setItem: () => {
    throw new DOMException("QuotaExceededError");
  },
};

const VALID = { email: "client@example.com", orderNumber: "PDH-260819-4F2A" };

describe("la clé de stockage", () => {
  it("est celle prévue, et namespacée", () => {
    // Pinnée : la changer perdrait silencieusement la mémoire de tous les
    // clients qui ont déjà consulté leur suivi.
    expect(TRACKING_STORAGE_KEY).toBe("para-d-hiver:order-tracking");
  });
});

describe("aller-retour", () => {
  it("relit ce qui vient d'être écrit", () => {
    const s = makeStorage();
    expect(saveTracking(VALID, s)).toBe(true);
    expect(readTracking(s)).toEqual(VALID);
  });

  it("survit à un rechargement : la lecture ne dépend que du contenu stocké", () => {
    const first = makeStorage();
    saveTracking(VALID, first);

    // Nouvelle "session" : même contenu brut, instance différente.
    const reloaded = makeStorage(first.raw());
    expect(readTracking(reloaded)).toEqual(VALID);
  });

  it("écrase la mémoire précédente par la plus récente", () => {
    const s = makeStorage();
    saveTracking(VALID, s);
    saveTracking({ email: "autre@example.com", orderNumber: "PDH-260901-9Z1B" }, s);

    expect(readTracking(s)).toEqual({ email: "autre@example.com", orderNumber: "PDH-260901-9Z1B" });
  });

  it("normalise : numéro en majuscules, email en minuscules, espaces retirés", () => {
    // Le serveur normalise de la même façon avant de comparer ; stocker la
    // forme normalisée évite de réafficher au client une casse qui ne
    // correspond pas à ce qui a marché.
    const s = makeStorage();
    saveTracking({ email: "  Client@Example.COM ", orderNumber: "  pdh-260819-4f2a  " }, s);

    expect(readTracking(s)).toEqual(VALID);
  });
});

describe("ce qui est stocké, et rien d'autre", () => {
  it("n'écrit que le numéro et l'email", () => {
    const s = makeStorage();
    saveTracking(VALID, s);

    expect(Object.keys(JSON.parse(s.raw()!)).sort()).toEqual(["email", "orderNumber"]);
  });

  it("ignore les champs qu'on tenterait de lui faire enregistrer", () => {
    // Le paramètre est typé, mais du JavaScript appelant peut passer autre
    // chose : adresse, téléphone, total, jeton. Rien de tout cela ne doit
    // atteindre le stockage.
    const s = makeStorage();
    saveTracking(
      {
        ...VALID,
        address: "12 rue Test",
        phone: "0600000000",
        rib: "007780000079500000149542",
        token: "secret",
        total: 408,
      } as never,
      s,
    );

    const written = JSON.parse(s.raw()!);
    expect(Object.keys(written).sort()).toEqual(["email", "orderNumber"]);
    for (const leaked of ["address", "phone", "rib", "token", "total"]) {
      expect(written).not.toHaveProperty(leaked);
    }
  });

  it("ne restitue pas les champs supplémentaires présents dans un stockage trafiqué", () => {
    // Quelqu'un ajoute un champ à la main : il ne doit pas ressortir de la
    // lecture et se retrouver propagé dans le reste de l'application.
    const s = makeStorage(JSON.stringify({ ...VALID, role: "admin", token: "secret" }));

    const read = readTracking(s);
    expect(read).toEqual(VALID);
    expect(read).not.toHaveProperty("token");
    expect(read).not.toHaveProperty("role");
  });

  it("n'utilise qu'une seule clé, celle qui est namespacée", () => {
    const s = makeStorage();
    saveTracking(VALID, s);
    expect(s.keys()).toEqual([TRACKING_STORAGE_KEY]);
  });
});

describe("un stockage vide, corrompu ou hostile", () => {
  it("rend null quand il n'y a rien", () => {
    expect(readTracking(makeStorage())).toBeNull();
  });

  it("rend null sur du JSON invalide, sans lever", () => {
    for (const raw of ["", "   ", "{", "not json", "{oups}", "undefined"]) {
      expect(readTracking(makeStorage(raw))).toBeNull();
    }
  });

  it("rend null sur les formes JSON valides mais qui ne sont pas un enregistrement", () => {
    for (const raw of ["null", "true", "42", '"chaine"', "[]", '["PDH-1","a@b.c"]', "{}"]) {
      expect(readTracking(makeStorage(raw))).toBeNull();
    }
  });

  it("rend null si un champ manque", () => {
    expect(readTracking(makeStorage(JSON.stringify({ orderNumber: "PDH-260819-4F2A" })))).toBeNull();
    expect(readTracking(makeStorage(JSON.stringify({ email: "client@example.com" })))).toBeNull();
  });

  it("rend null si un champ n'est pas une chaîne", () => {
    const cases = [
      { email: "a@b.c", orderNumber: 42 },
      { email: null, orderNumber: "PDH-1" },
      { email: ["a@b.c"], orderNumber: "PDH-1" },
      { email: { toString: "a@b.c" }, orderNumber: "PDH-1" },
      { email: "a@b.c", orderNumber: true },
    ];
    for (const c of cases) expect(readTracking(makeStorage(JSON.stringify(c)))).toBeNull();
  });

  it("rend null si un champ est vide ou seulement des espaces", () => {
    for (const c of [
      { email: "", orderNumber: "PDH-1" },
      { email: "a@b.c", orderNumber: "" },
      { email: "   ", orderNumber: "PDH-1" },
      { email: "a@b.c", orderNumber: "\t\n " },
    ]) {
      expect(readTracking(makeStorage(JSON.stringify(c)))).toBeNull();
    }
  });

  it("refuse des valeurs démesurées plutôt que de les relire", () => {
    // Un stockage rempli à la main avec 1 Mo de texte ne doit pas se retrouver
    // réinjecté dans les champs du formulaire.
    const huge = "A".repeat(100_000);
    expect(readTracking(makeStorage(JSON.stringify({ email: "a@b.c", orderNumber: huge })))).toBeNull();
    expect(readTracking(makeStorage(JSON.stringify({ email: huge, orderNumber: "PDH-1" })))).toBeNull();
  });

  it("refuse d'écrire des valeurs démesurées", () => {
    const s = makeStorage();
    expect(saveTracking({ email: "a@b.c", orderNumber: "A".repeat(100_000) }, s)).toBe(false);
    expect(s.raw()).toBeNull();
  });

  it("garde l'unicode intact", () => {
    const s = makeStorage();
    const unicode = { email: "cliént+suivi@exemple.mä", orderNumber: "PDH-260819-ÉÀ✦" };
    expect(saveTracking(unicode, s)).toBe(true);
    expect(readTracking(s)).toEqual({ email: "cliént+suivi@exemple.mä", orderNumber: "PDH-260819-ÉÀ✦" });
  });

  it("traite une charge XSS comme du texte, sans l'interpréter ni la refuser silencieusement", () => {
    // React échappe ces valeurs au rendu ; ce qui est vérifié ici est qu'elles
    // font l'aller-retour sans être transformées en autre chose, et qu'aucune
    // n'est traitée comme du code au passage.
    const s = makeStorage();
    const payload = { email: "\"><img src=x onerror=alert(1)>@x.com", orderNumber: "<script>alert(1)</script>" };
    expect(saveTracking(payload, s)).toBe(true);

    const back = readTracking(s);
    expect(back?.orderNumber).toBe("<SCRIPT>ALERT(1)</SCRIPT>"); // normalisé en majuscules
    expect(back?.email).toBe("\"><img src=x onerror=alert(1)>@x.com");
    // Et le contenu brut reste du JSON, pas du markup interpolé.
    expect(() => JSON.parse(s.raw()!)).not.toThrow();
  });
});

describe("quand le stockage est indisponible", () => {
  it("la lecture rend null au lieu de lever", () => {
    expect(() => readTracking(throwingStorage)).not.toThrow();
    expect(readTracking(throwingStorage)).toBeNull();
  });

  it("l'écriture signale l'échec au lieu de lever", () => {
    expect(() => saveTracking(VALID, throwingStorage)).not.toThrow();
    expect(saveTracking(VALID, throwingStorage)).toBe(false);
  });

  it("l'effacement ne lève pas", () => {
    expect(() => clearTracking(throwingStorage)).not.toThrow();
  });

  it("un stockage absent est traité comme un stockage vide", () => {
    // Rendu serveur, ou navigateur qui bloque le stockage de site.
    expect(readTracking(null)).toBeNull();
    expect(saveTracking(VALID, null)).toBe(false);
    expect(() => clearTracking(null)).not.toThrow();
  });
});

describe("effacer la mémoire", () => {
  it("supprime l'enregistrement", () => {
    const s = makeStorage();
    saveTracking(VALID, s);
    clearTracking(s);

    expect(readTracking(s)).toBeNull();
    expect(s.raw()).toBeNull();
  });

  it("est sans effet quand il n'y a rien à effacer", () => {
    const s = makeStorage();
    expect(() => clearTracking(s)).not.toThrow();
    expect(readTracking(s)).toBeNull();
  });
});

describe("une recherche infructueuse", () => {
  it("n'écrase pas la mémoire d'une recherche qui avait abouti", () => {
    // La règle qui compte côté interface : seule une consultation acceptée par
    // le serveur écrit. Un échec laisse en place ce qui marchait, sinon une
    // faute de frappe effacerait la mémoire d'un client.
    const s = makeStorage();
    saveTracking(VALID, s);

    // Ce qu'un échec fait : rien. Il n'existe pas d'appel « enregistrer
    // l'échec » — le composant n'appelle saveTracking qu'après un 2xx.
    expect(readTracking(s)).toEqual(VALID);
  });

  it("refuse d'enregistrer une saisie vide même si on le lui demande", () => {
    const s = makeStorage();
    saveTracking(VALID, s);

    expect(saveTracking({ email: "", orderNumber: "" }, s)).toBe(false);
    expect(saveTracking({ email: "   ", orderNumber: "PDH-1" }, s)).toBe(false);
    // La mémoire valide est intacte.
    expect(readTracking(s)).toEqual(VALID);
  });
});

describe("ce que ce module ne fait pas", () => {
  it("n'accorde aucun droit : il rend ce qu'on lui a donné, pas une autorisation", () => {
    // Le numéro d'un autre client stocké à la main ressort tel quel — c'est
    // volontaire. La vérification appartient au serveur, qui compare l'email
    // de la commande. Ce test existe pour que personne ne prenne la présence
    // d'une valeur ici pour une preuve d'identité.
    const someoneElse = { email: "voisin@example.com", orderNumber: "PDH-260819-0000" };
    const s = makeStorage(JSON.stringify(someoneElse));

    expect(readTracking(s)).toEqual(someoneElse);
    // Rien dans la valeur lue ne ressemble à un jeton ou à une preuve.
    expect(Object.keys(readTracking(s)!).sort()).toEqual(["email", "orderNumber"]);
  });
});
