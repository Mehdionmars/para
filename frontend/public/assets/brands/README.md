# Marques — logos réels

Le storefront signe chaque marque dans cet ordre :

1. **`logo` sur la fiche Marque du CMS** — la source normale. Back-office →
   Marques → une marque → champ « Logo ». SVG ou PNG à fond transparent.
   Dès qu'un fichier est déposé, il remplace tout le reste, partout.
2. **Un fichier de ce dossier** — pour un logo qu'on veut versionner avec le
   code plutôt que dans la médiathèque.
3. **Le logotype composé** (`lib/brandWordmarks.ts`) — le nom de la marque
   typographié dans son propre registre. C'est ce qui s'affiche aujourd'hui,
   aucune des 27 marques n'ayant de logo en base.

## Ajouter un logo ici

1. Déposer le fichier : `public/assets/brands/<slug>.svg`
   (le slug est celui de la marque : `la-roche-posay`, `cerave`, `avene`…)
2. Enregistrer une ligne dans `BRAND_LOGO_FILES`, `lib/brandWordmarks.ts` :

   ```ts
   export const BRAND_LOGO_FILES: Record<string, string> = {
     "la-roche-posay": "/assets/brands/la-roche-posay.svg",
   };
   ```

## Format attendu

- **SVG** de préférence (net à toute taille, quelques ko).
- Fond **transparent** — jamais de rectangle blanc, la tuile est déjà claire.
- Le mark est cadré au plus juste : pas de marge intégrée au fichier, le
  storefront gère l'air autour (`BrandLogo` centre et contient, sans recadrer).
- Ratio libre. Un logo horizontal, carré ou vertical est affiché à sa propre
  proportion dans une plage de hauteur fixe.
- Monochrome ou couleur, les deux fonctionnent sur fond clair.
