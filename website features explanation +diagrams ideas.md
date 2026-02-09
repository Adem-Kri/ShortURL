# PDS ShortURL — Notes de rapport (fonctionnalités + acteurs + UML)

## Présentation (niveau rapport)

- Le projet est une application web de **raccourcissement d’URL** : l’utilisateur colle une URL longue, l’application génère un **code court** et fournit un lien du type `https://…/<code>` qui **redirige** vers l’URL d’origine.
- L’application inclut une partie “gestion” permettant de **consulter les liens créés**, voir des **statistiques de clics**, et effectuer des actions (copie, modification, suppression, QR code).
- Le stockage est fait dans une **base de données** (SQLite) via un ORM (Prisma). L’application suit une logique “web app + API + DB”.

---

## Fonctionnalités du site (à mettre dans le rapport)

### 1) Raccourcir une URL (page d’accueil)

- Saisie d’une URL longue.
- Génération d’un **lien court** (code aléatoire) et affichage du résultat.
- **Alias personnalisé (optionnel)** : l’utilisateur peut choisir son propre code (ex: `my-project`) au lieu d’un code aléatoire.
- **Expiration (TTL) optionnelle** : l’utilisateur peut définir une durée de validité (ex: 1h, 24h, 7j, 30j).
- **Lien “one-time use” (optionnel)** : le lien ne fonctionne **qu’une seule fois** (le premier clic “consomme” le lien).
- **Copie** du lien court en un clic.

### 2) Redirection et suivi (quand on ouvre `/<code>`)

- Lorsqu’un visiteur ouvre un lien court :
  - si le lien est valide → **redirection HTTP** vers l’URL d’origine,
  - le système **incrémente** un compteur de clics et met à jour la date du dernier clic.
- Si le lien est invalide :
  - **inexistant** → page de statut “lien introuvable”,
  - **expiré** → page de statut “lien expiré”,
  - **déjà utilisé** (one-time) → page “lien déjà consommé”.
- La page de statut affiche un message clair et fait un **retour automatique** vers l’accueil après quelques secondes.

### 3) Page “Liste des liens” (stats et gestion)

- Affichage des liens récents avec :
  - code court,
  - URL d’origine,
  - date de création,
  - nombre de clics,
  - dernier clic.
- **Recherche** (par code ou par URL).
- **Tri** (par date de création / clics / dernier clic) + sens (asc/desc).
- **Filtre** “liens cliqués uniquement”.
- **Suppression multiple** : sélection de plusieurs liens et suppression en lot (avec confirmation).
- Interface **responsive** (adaptée mobile/desktop).

### 4) Page “Détail d’un lien”

- Visualisation complète des informations d’un lien (clics, dates, expiration, one-time, état consommé).
- **QR code** du lien court + téléchargement en **PNG** et **SVG**.
- Actions :
  - **modifier** l’URL de destination,
  - **supprimer** le lien,
  - **copier** le lien court.

### 5) Multilingue (i18n) + RTL

- L’application supporte **3 langues** : anglais, français, arabe.
- Le choix de langue est :
  - **détecté automatiquement** au premier accès (via la langue du navigateur),
  - puis **persisté** via un cookie,
  - et modifiable via un **sélecteur de langue** dans la barre de navigation.
- L’arabe utilise la direction d’écriture **RTL**, donc toute l’UI s’adapte (important à mentionner comme contrainte UX).

### 6) Thème clair/sombre

- Possibilité de basculer en **dark mode** (et s’aligner sur le thème système).

### 7) Robustesse et sécurité “raisonnable” (niveau projet scolaire)

- **Validation d’URL** : uniquement `http/https`, pas d’identifiants intégrés dans l’URL, longueur limitée.
- En production, blocage des URL “sensibles” (ex: localhost / réseaux privés) pour réduire les abus.
- **Limitation de débit (rate limit)** par adresse IP sur les opérations sensibles (création, suppression, modification), stockée en base (donc stable même si le serveur redémarre).

---

## Acteurs + autorités (droits) pour vos diagrammes

Comme il n’y a pas d’authentification, les “droits” sont surtout **fonctionnels** (ce qu’on peut faire) et **contraints** par validation/rate limit.

### Acteurs humains

1) **Gestionnaire de liens (Utilisateur)**

- Créer un lien court (avec ou sans alias, avec options TTL et one-time).
- Consulter la liste + rechercher/filtrer/trier.
- Consulter le détail + générer QR + copier.
- Modifier la destination.
- Supprimer un lien (ou plusieurs).

2) **Visiteur (Utilisateur final)**

- Accéder à un lien court et être redirigé.
- En cas d’erreur (introuvable/expiré/utilisé), consulter la page de statut.

### Acteurs systèmes (utiles en séquence)

- **Base de données** : persistance des liens et des compteurs de rate limit.
- **Site cible (destination)** : système externe vers lequel on redirige (hors périmètre).

---

## Architecture (à décrire simplement)

- **Front-end** (UI) : formulaires et pages (création, liste, détail), interactions utilisateur, affichage des traductions.
- **Back-end** (API/serveur) : endpoints pour créer/modifier/supprimer/résoudre un lien + appliquer validation + rate limit + logique one-time/expiration.
- **Base de données** : stockage des liens, statistiques (clics), et buckets de limitation de débit.
- **Internationalisation** : dictionnaires de messages par langue, sélection de locale via cookie, et adaptation du sens d’écriture.

---

## Diagramme de cas d’utilisation (Use Case) — comment le faire “bien”

**Système** : “Plateforme de raccourcissement d’URL”

**Acteurs** : Gestionnaire de liens, Visiteur

**Cas d’utilisation principaux**

- “Créer un lien court”
  - inclut : “Valider URL”, “Appliquer rate limit”
  - étend : “Définir alias”, “Définir expiration”, “Activer one-time”
- “Ouvrir un lien court (rediriger)”
  - inclut : “Résoudre code”, “Mettre à jour statistiques”
  - étend : “Afficher statut d’erreur”
- “Consulter la liste des liens”
  - étend : “Rechercher”, “Filtrer”, “Trier”
- “Consulter le détail d’un lien”
  - étend : “Télécharger QR”, “Copier lien”
- “Modifier la destination”
  - inclut : “Valider URL”, “Appliquer rate limit”
- “Supprimer un lien / suppression multiple”
  - inclut : “Appliquer rate limit”
- “Changer de langue”
  - objectif : personnalisation + persistance

Conseil rapport : expliquez `include` (sous-fonction obligatoire) vs `extend` (option/variante).

---

## Diagrammes de séquence (Sequence) — 3 scénarios solides

### Séquence A — Créer un lien court

**Participants** : Gestionnaire → UI → API → Service validation → Service rate limit → Base de données

1. L’utilisateur soumet l’URL + options.
2. L’API vérifie la limitation de débit (OK/KO).
3. L’API valide/normalise l’URL.
4. Cas 1 : alias fourni → vérification + insertion en base.
5. Cas 2 : alias absent → génération de code + insertion (avec retry si collision).
6. Retour succès → UI affiche lien court + bouton copier.

**Blocs “alt” à montrer**

- alt 429 : rate limit dépassée (afficher temps d’attente)
- alt 400 : URL/alias invalide
- alt 409 : alias déjà utilisé

### Séquence B — Accès à `/<code>` (redirection + tracking)

**Participants** : Visiteur → Route redirection → Service lien → Base de données → Site destination

1. Le visiteur demande `/<code>`.
2. Le serveur lit le lien en base.
3. Vérifications : existence, expiration, one-time déjà consommé.
4. Si OK : mise à jour stats (clic + timestamp) puis redirection.
5. Si KO : redirection vers page de statut avec raison.

**Blocs alt**

- not found / expired / used (one-time) → statut

### Séquence C — Modifier la destination

**Participants** : Gestionnaire → UI détail → API → validation → rate limit → DB

1. L’utilisateur saisit une nouvelle URL.
2. L’API vérifie rate limit.
3. L’API valide la nouvelle URL.
4. Mise à jour en base.
5. UI rafraîchit et affiche la nouvelle destination.

---

## Diagramme de classes (Class) — à faire “conceptuel”

Sans rentrer dans les noms de fonctions, modélisez :

### Entités (domaine)

- **ShortLink**
  - codeCourt, urlOriginale, dates (création/màj), clickCount, lastClickedAt
  - expiresAt (optionnel)
  - oneTime (booléen)
  - consumedAt (optionnel)
- **RateLimitBucket**
  - clé (par action + IP), resetAt, count

### Services (logique métier)

- Service de gestion de lien (créer, lire, lister, modifier, supprimer, “résoudre + tracker”)
- Service de validation d’URL
- Service de rate limiting
- Service i18n (choix locale + traduction)

### Contrôleurs / Interfaces

- Contrôleur API “liens” (CRUD)
- Contrôleur “redirection”
- UI (pages : accueil, liste, détail, statut)

**Relations à dessiner**

- Contrôleurs → utilisent → Services
- Services → lisent/écrivent → Entités (via DB/ORM)
- `ShortLink` agrège les attributs “stats” (clics, dates) + “règles” (expiration, one-time)

---

## Points à mettre dans la conclusion / limites

- Pas d’authentification : toute personne ayant accès à l’interface peut gérer les liens (acceptable pour un projet scolaire/démo).
- SQLite : très bien pour démonstration/local ; pour production on migrerait vers une DB serveur (PostgreSQL) et un rate limit plus robuste (Redis).
- Bon point qualité : séparation claire UI / API / DB + i18n + validations + rate limit.

---

### Option (si vous voulez améliorer le rapport)

Je peux aussi rédiger directement (en français) :
- une section “Analyse des besoins”,
- une section “Conception UML” (use case + 3 séquences + classes),
- une section “Choix techniques et justification”,
au format prêt à coller dans votre rapport (2–4 pages).
