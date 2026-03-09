# Mode Séquentiel - IHM de Test GSM

## Vue d'ensemble

L'IHM de test a été refactorisée en **mode séquentiel (tunnel)** pour guider les opérateurs étape par étape à travers le processus de test.

## Architecture

### 1. Configuration JSON (`src/config/testSequence.json`)

Définit la séquence complète des tests avec pour chaque étape :
- **id** : Identifiant unique de l'étape
- **instruction** : Consigne textuelle claire pour l'opérateur
- **pictogram** : Nom de l'icône à afficher
- **actionType** : Type d'action (scan, select, choice, button)
- **actionConfig** : Configuration spécifique de l'action

### 2. Composant TestStep (`src/components/TestStep.jsx`)

Composant générique qui affiche une étape individuelle avec :
- Un **pictogramme** visuel en haut
- Une **instruction** textuelle bien visible
- Une **action** appropriée (scanner, sélecteur, boutons de choix)

### 3. Composant Pictogram (`src/components/Pictogram.jsx`)

Affiche les icônes SVG pour chaque type d'étape :
- `barcode-scan` : Scanner de code-barres
- `sim-card` : Carte SIM
- `power-check` : Vérification d'initialisation
- `phone-call` : Appel téléphonique
- `battery-switch` : Bascule batterie
- `check-circle` : Test terminé

### 4. Composant Product Refactorisé (`src/components/Product.jsx`)

Gère la logique séquentielle :
- Navigation entre les étapes
- Validation des données à chaque étape
- Appels API (GSM, traçabilité)
- Gestion des erreurs
- États visuels (bon/mauvais produit)

## Séquence de Test

1. **Scan Étiquette** : Scanner l'étiquette du lot de production
2. **Sélection SIM** : Choisir la carte SIM à utiliser
3. **Vérification Init** : Confirmer que le produit est bien initialisé
4. **Test Phonie** : Tester la qualité de la phonie après l'appel
5. **Test Batterie** : Vérifier la bascule batterie (OFF)
6. **Test Terminé** : Possibilité de tester une autre carte

## Personnalisation

### Modifier la séquence

Éditez `src/config/testSequence.json` pour :
- Ajouter de nouvelles étapes
- Modifier les instructions
- Changer l'ordre des étapes
- Ajouter de nouveaux types d'actions

### Ajouter un nouveau pictogramme

Dans `src/components/Pictogram.jsx`, ajoutez un nouveau `case` dans le `switch` avec votre SVG.

### Ajouter un nouveau type d'action

Dans `src/components/TestStep.jsx`, ajoutez un nouveau `case` dans `renderAction()`.

## Avantages du Mode Séquentiel

✅ **Clarté** : Une seule action visible à la fois
✅ **Guidage** : Instructions explicites à chaque étape  
✅ **Flexibilité** : Configuration par JSON, facile à modifier
✅ **Visuel** : Pictogrammes clairs pour chaque étape
✅ **Traçabilité** : Enregistrement automatique des résultats
✅ **Maintenabilité** : Code modulaire et réutilisable

## Styles CSS

Les styles pour le mode séquentiel sont dans `src/App.css` :
- `.test-step` : Container principal
- `.test-step-pictogram` : Zone du pictogramme
- `.test-step-instruction` : Texte d'instruction
- `.test-step-action` : Zone d'action
- Animations d'entrée fluides pour chaque élément
