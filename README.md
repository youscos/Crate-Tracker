# CrateTracker 🏗️📦

PWA SaaS professionnelle pour le suivi de caisses de chantier via QR codes.

**Stack :** React 19 · Vite 8 · TypeScript · TailwindCSS 4 · Supabase (Auth + PostgreSQL) · Vercel

---

## 🚀 Démarrage rapide

### 1. Installer les dépendances

```bash
npm install
```

### 2. Configurer Supabase

1. Créez un projet sur [supabase.com](https://supabase.com)
2. Dans **SQL Editor**, exécutez le contenu de `supabase/schema.sql` (tout coller et exécuter)
3. Dans **Settings > API**, copiez l'URL et la clé anon publique

```bash
cp .env.example .env.local
# Éditez .env.local et remplissez les deux variables
```

### 3. Lancer en développement

```bash
npm run dev
# → http://localhost:5173
```

### 4. Créer le premier compte Admin

1. Créez un compte via l'écran de connexion de l'app
2. Dans **Supabase > SQL Editor**, exécutez :
```sql
UPDATE public.profiles SET role = 'admin' WHERE email = 'votre@email.com';
```

---

## 🗄️ Base de données — `supabase/schema.sql`

### Tables

| Table | Description |
|-------|-------------|
| `profiles` | Utilisateurs liés à `auth.users`, avec rôle |
| `crates` | Caisses avec QR, étage (1-44), zone, statut, panneau |
| `movements` | Historique complet de chaque déplacement |

### Rôles
| Rôle | Permissions |
|------|-------------|
| `admin` | Accès complet + gestion utilisateurs |
| `logistics` | Créer, modifier, déplacer les caisses |
| `viewer` | Lecture seule |

---

## 📱 Pages de l'application

| Page | Route | Description |
|------|-------|-------------|
| Dashboard | `/dashboard` | Stats, dernières caisses, derniers mouvements |
| Scanner | `/scan` | Caméra QR, détection, création si inconnue |
| Recherche | `/search` | Recherche instantanée multi-critères + filtres |
| Détail caisse | `/crate/:id` | Toutes les infos + timeline des mouvements |
| Journal | `/activity` | Log global groupé par date |
| Profil | `/profile` | Info compte, déconnexion |

---

## 🌐 Déploiement Vercel

```bash
# Option 1 : CLI Vercel
npm install -g vercel
vercel --prod
# Ajoutez VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY dans les settings Vercel

# Option 2 : GitHub
# 1. Poussez le repo sur GitHub
# 2. Importez-le sur vercel.com
# 3. Ajoutez les deux variables d'environnement
# 4. Deploy !
```

---

## 📲 Génération de QR codes

Format recommandé pour les étiquettes physiques : `CT-{numero}` (ex: `CT-0042`)

- **Bulk gratuit** : [qr.io](https://qr.io) ou [qrcode-monkey.com](https://qrcode-monkey.com)
- **En ligne rapide** : `npx qrcode-terminal "CT-0042"` (pour tester)
- **Production** : Bibliothèque npm `qrcode` pour générer des PDF d'étiquettes

---

## 🔧 Variables d'environnement

| Variable | Description |
|----------|-------------|
| `VITE_SUPABASE_URL` | URL projet Supabase (ex: `https://xxxx.supabase.co`) |
| `VITE_SUPABASE_ANON_KEY` | Clé anon publique (commence par `eyJ…`) |

---

## 📋 Scripts

```bash
npm run dev      # Dev local avec HMR (http://localhost:5173)
npm run build    # Build production dans dist/
npm run preview  # Preview du build local
```

---

## ✅ Checklist mise en production

- [ ] Projet Supabase créé
- [ ] `supabase/schema.sql` exécuté
- [ ] `.env.local` configuré
- [ ] Premier compte créé + promu admin via SQL
- [ ] QR codes générés et imprimés
- [ ] Déployé sur Vercel avec les variables d'env
- [ ] Testé sur mobile (scan QR + mode hors-ligne)
- [ ] Équipes formées (Admin / Logistique / Viewer)

---

© 2025 CrateTracker · Tous droits réservés
