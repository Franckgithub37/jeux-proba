# Génération des images du jeu par API

Les illustrations du jeu (perroquet, icônes des sources, icônes de statut, avatars des postes, dé, boîte de Calmidol) sont des PNG détourés générés avec l'API Images d'OpenAI, en joignant les images de référence de `images/` pour rester dans le style validé. Ils sont enregistrés dans `images/generated/`. Tant qu'un fichier manque, le jeu affiche un élément de secours simple à sa place.

## 1. Enregistrer la clé (une seule fois)

La clé n'est jamais écrite dans le code. Elle est lue dans la variable d'environnement `OPENAI_API_KEY`. Dans un terminal Windows, en remplaçant le texte entre guillemets par votre clé :

```
setx OPENAI_API_KEY "votre-cle-ici"
```

## 2. Générer

Toutes les images de la liste `scripts/assets.json` qui n'existent pas encore :

```
powershell -ExecutionPolicy Bypass -File scripts\generate_asset.ps1 -Tous
```

Refaire une image qui ne convient pas :

```
powershell -ExecutionPolicy Bypass -File scripts\generate_asset.ps1 -Tous -Seulement perroquet -Refaire
```

Ajouter une image hors liste :

```
powershell -ExecutionPolicy Bypass -File scripts\generate_asset.ps1 -Sujet "a glossy orange 20-sided die" -Sortie de20
```

## 3. Alléger les images pour le web

L'API renvoie des images de 1024 px (environ 1 Mo chacune). Après chaque génération, lancer :

```
powershell -ExecutionPolicy Bypass -File scripts\optimiser_images.ps1
```

Les originaux sont rangés dans `images/generated/hd/` et le jeu utilise les versions réduites (environ 2 Mo pour les 20 images).

Si vous n'avez pas de terminal, `scripts\saisir_cle.ps1` ouvre une petite fenêtre pour coller la clé : clic droit sur le fichier, puis « Exécuter avec PowerShell ».

## Ce qu'il faut savoir

- Le style est fixé une fois pour toutes dans le script (variable `$STYLE`). Seul le sujet change d'une image à l'autre.
- Modèle par défaut : `gpt-image-2.5-sunburst`, qui accepte le fond transparent. Le modèle `gpt-image-2` ne le garantit pas. Pour en changer : `-Modele nom-du-modele`.
- Qualité par défaut : `medium`. Pour une image plus fine : `-Qualite high`.
- 17 images sont prévues dans `assets.json`. Chaque appel est facturé sur votre compte OpenAI.
