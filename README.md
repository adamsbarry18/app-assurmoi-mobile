# AssurMoi : application mobile

Client **React Native** ([Expo SDK 54](https://docs.expo.dev/)) pour l’espace assuré et les équipes sinistres : connexion sécurisée (JWT), tableau de bord, sinistres, dossiers, documents, notifications, administration des utilisateurs selon les rôles.

| | |
|---|---|
| **Routage** | [Expo Router](https://docs.expo.dev/router/introduction/) (fichiers sous `src/app/`) |
| **UI** | [React Native Paper](https://reactnativepaper.com/) (Material 3) |
| **Langage** | TypeScript · alias `@/*` → `./src/*` |

---

## Prérequis

- **Node.js** v20+ et **npm** v10+
- Compte développeur Apple / environnement Android si vous ciblez des émulateurs ou un appareil physique
- **API AssurMoi** démarrée (voir le dépôt [app-assurmoi-API](https://github.com/adamsbarry18/app-assurmoi-API.node))

---

## Installation

```bash
git clone https://github.com/adamsbarry18/app-assurmoi-mobile.git
cd app-assurmoi-mobile
npm install
npm run start
npm run android
npm run ios
npm run web
```

Copier la configuration d’exemple :

```bash
cp .env.example .env
```

Puis renseigner **`EXPO_PUBLIC_API_URL`** selon votre contexte (voir ci-dessous). Redémarrer le serveur Metro après toute modification du `.env`.

---

## Configuration de l’API

L’URL de base est résolue dans `src/config/env.ts` (`getApiBaseUrl()`).

| Contexte | Exemple `EXPO_PUBLIC_API_URL` |
|------------|-------------------------------|
| **Expo Web** (navigateur) + API sur la **même** machine | `http://localhost:3000` |
| **Téléphone** (Expo Go) sur le Wi‑Fi, API sur le PC | `http://192.168.x.x:3000` (IP LAN du poste qui héberge l’API) |
| **Émulateur Android** | Souvent inutile de variable : défaut dev `http://10.0.2.2:3000` |
| **Simulateur iOS / Web** sans variable | Défaut dev `http://localhost:3000` |

En **production** (`!__DEV__`), sans variable, l’URL retombe sur `http://localhost:3000` : adaptez `getApiBaseUrl()` ou fournissez une variable de build selon votre déploiement.

> **Astuce** : sur le web, utiliser `localhost` pour joindre l’API Docker sur le même poste ; une IP LAN dans le navigateur peut provoquer des erreurs CORS ou « Failed to fetch » selon la config du serveur.

---

## Scripts npm

| Commande | Description |
|----------|-------------|
| `npm start` | Démarre Metro (`expo start`) — QR code, choix iOS / Android / web |
| `npm run android` | Lance sur émulateur / appareil Android |
| `npm run ios` | Lance sur simulateur iOS (macOS) |
| `npm run web` | Interface dans le navigateur |
| `npm run start:tunnel` | Tunnel Expo (utile si le téléphone n’est pas sur le même réseau) |
| `npm run start:docker` | Écoute LAN sur le port 8081 (stack Docker du monorepo) |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint |
| `npm run format` | Prettier (écriture) |
| `npm run format:check` | Prettier (contrôle seul) |
| `npm run code:check` | Format + types + lint |

---

## Structure du dépôt

```
app-assurmoi-mobile/
├── app.json                 # Métadonnées Expo (schéma deep link : assurmoiapp)
├── package.json
├── tsconfig.json            # paths "@/*" → "./src/*"
└── src/
    ├── app/                 # Expo Router : une route = un fichier
    │   ├── _layout.tsx      # Layout racine (thème, auth…)
    │   ├── (main)/          # Onglets : accueil, sinistres, dossiers, plus
    │   ├── claim/           # Détail / création sinistre
    │   ├── folder/          # Dossier sinistre
    │   ├── document/        # Détail document
    │   └── …
    ├── api/                 # Client HTTP, modules par domaine (*.api.ts), entrée @/api
    ├── auth/                # Contexte session, stockage des jetons (Secure Store)
    ├── components/          # UI réutilisable (dashboard, notifications, annuaire…)
    ├── config/              # env (URL API)
    ├── constants/           # Thème, marque
    ├── notifications/       # Panneau / contexte notifications
    ├── theme/               # Thème Paper
    ├── types/               # Types partagés
    └── utils/               # Rôles, formatage, feedback écran, etc.
```

- **Authentification** : jetons d’accès / rafraîchissement stockés côté client ; requêtes via `apiFetchWithAuth` (rafraîchissement automatique en cas de 401).
- **Deep links** (reset mot de passe, etc.) : schéma **`assurmoiapp`** défini dans `app.json` — doit rester aligné avec les liens générés par l’API (e-mail).

---

## Lier le dépôt à l’API

1. Démarrer l’**API** (port **3000** par défaut).
2. Renseigner **`EXPO_PUBLIC_API_URL`** dans `.env` si les défauts ne conviennent pas. exemple : http://localhost:3000
3. Se connecter avec un compte connu (ex. comptes de seed sur l’environnement de dev du backend, si disponibles).

Le backend **doit** accepter l’origine de votre app en **CORS** en développement (l’API AssurMoi le permet en principe) ; en production, configurer `CORS_ALLOWED_ORIGINS` côté serveur.

---

## Ressources

- [Expo](https://docs.expo.dev/)
- [Expo Router](https://docs.expo.dev/router/introduction/)
- [React Native Paper](https://callstack.github.io/react-native-paper/)
- [App AssurMoi API](https://github.com/adamsbarry18/app-assurmoi-API.node)
- [App AssurMoi Mobile](https://github.com/adamsbarry18/app-assurmoi-mobile)

---
