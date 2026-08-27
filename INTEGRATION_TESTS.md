# Tests d’intégration avec l’API Data réelle

Cette suite appelle l’API Data en HTTP avec le même client et les mêmes services que
TestGsm. Aucun `fetch` et aucun service ne sont mockés. Les OF, utilisateurs, machines
et opérations de référence sont lus dans la vraie base au début de l’exécution.

## Exécution

La configuration locale est enregistrée dans `.env.integration` :

```dotenv
DATA_API_BASE_URL=http://localhost:10000
TEST_MACHINE_UID=MO03A
```

Il suffit donc de lancer :

```powershell
npm run test:integration
```

La console affiche pour chaque échange la méthode, l’URL, les en-têtes, le corps
envoyé, le statut HTTP et un aperçu du corps reçu. Elle affiche également l’URL de
l’API, l’OF, le produit, le numéro de série, l’utilisateur, la machine et l’opération
sélectionnés pour le scénario.

Pour une configuration propre à un poste et non versionnée, créer un fichier
`.env.integration.local`. Les variables définies dans le terminal ou le pipeline ont
priorité sur les fichiers `.env`.

`TEST_MANUFACTURING_ORDER_UID` permet de sélectionner un OF précis. Sans cette
variable, le premier OF exploitable retourné par l’API est utilisé.

La suite crée systématiquement une traçabilité produit et un kit dans la base, puis
relit ces enregistrements par les endpoints GET pour valider le parcours de bout en
bout. Les données créées portent un
marqueur `TESTGSM-IT-<timestamp>` dans `failureComment`, `scanFrame` ou
`horizonComponentCode`, afin de pouvoir les identifier et les purger.

## Périmètre

La suite couvre tous les endpoints **API Data consommés par TestGsm** : santé API et
BDD, recherche et validation d’OF, opérations, utilisateurs, cartes SIM, création et
relecture de traçabilité produit, création de kit. Les endpoints Data non utilisés par
ce client ne font pas partie de ce périmètre.
