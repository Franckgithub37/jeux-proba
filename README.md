# Le Perroquet de garde

Mini-jeu pédagogique Elliacare pour comprendre comment une IA générative produit ses réponses : elle a lu une immense partie d'Internet, le vrai comme le faux, et elle prédit le mot suivant au lieu de consulter une base de données.

Le jeu dure environ cinq minutes et se joue dans un navigateur, sans installation.

- Chapitre 1 : l'IA a tout lu, le vrai comme le faux.
- Chapitre 2 : elle ne sait pas, elle prédit (température froide puis chaude).
- Chapitre 3 : une phrase dans la demande suffit à cadrer les sources.
- Chapitre 4 : retour à la source, parce que c'est au professionnel de vérifier.

L'IA assiste, le clinicien décide. Le médicament « Calmidol », les réponses et les probabilités affichées sont fictifs.

## Contenu du dépôt

| Élément | Rôle |
|---|---|
| `index.html` | Le jeu, prêt à être servi tel quel (Three.js chargé depuis un CDN) |
| `audio/` | Les 22 voix off (`vo_*.wav`) et le cri du perroquet |
| `images/` | Page d'accueil, logo et illustrations |
| `src/` | Sources du jeu : `head.html`, `middle.js`, `tail.js`, assemblées par `build.ps1` |
| `scripts/` | Génération et contrôle des voix off et des images |
| `VOIX_OFF_SCRIPT.md` | Texte de référence des voix off |

## Modifier le jeu

Les modifications se font dans `src/`, puis :

```
powershell -ExecutionPolicy Bypass -File src\build.ps1
```

## Régénérer les voix off

Les clés d'API ne sont jamais écrites dans le dépôt : elles sont lues dans les variables d'environnement `GEMINI_API_KEY` et `OPENAI_API_KEY` (voir `scripts/LISEZMOI.md`).

```
powershell -ExecutionPolicy Bypass -File scripts\generer_voix_off.ps1 -Refaire
```

Chaque piste est générée avec la même voix et les mêmes consignes, contrôlée sur la hauteur de voix, mise au même niveau sonore, puis accélérée de 10 % sans changer la hauteur.
