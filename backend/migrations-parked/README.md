# Migrations mises de côté

Ces fichiers ne sont **pas** dans `src/migrations/` et ne s'exécuteront pas.

`npx payload migrate` lit le *dossier* `src/migrations`, pas le registre
`src/migrations/index.ts` — retirer une migration du registre ne suffit donc
pas à l'empêcher de tourner. Il faut sortir le fichier du dossier.

## `20260822_140000_split_deliveries.ts`

Scinde `notifications` en `notifications` + `notification_deliveries` (une
ligne par canal). Écrite, appliquée et vérifiée sans perte : 148 lignes → 100
parents + 148 livraisons, chaque couple (canal, statut) conservé. Son `down()`
recrée `notifications_idempotency_idx`, sans lequel toute insertion de
notification échoue.

Elle n'est pas active parce que le code applicatif écrit encore dans les
colonnes qu'elle supprime (`service.ts`, `stock.ts`, `retry.ts`, les requêtes
du dashboard). Pour l'activer : migrer ces fichiers d'abord, puis remettre
celui-ci dans `src/migrations/` et l'inscrire dans `index.ts`.
