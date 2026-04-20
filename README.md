# Bikube Dashboard

Application Next.js pour superviser les conversations de l'agent IA SMS/WhatsApp de Bikube.

## Installation

1. Installez les dépendances :
   ```bash
   npm install
   ```

2. Copiez le fichier d'exemple des variables d'environnement :
   ```bash
   cp .env.local.example .env.local
   ```

3. Remplissez `.env.local` avec vos clés Supabase :
   ```
   NEXT_PUBLIC_SUPABASE_URL=votre_url_supabase
   NEXT_PUBLIC_SUPABASE_ANON_KEY=votre_anon_key
   ```

4. Lancez le serveur de développement :
   ```bash
   npm run dev
   ```

Ouvrez [http://localhost:3000](http://localhost:3000) pour voir le dashboard.

## Fonctionnalités

- Liste des conversations triées par activité récente
- Filtrage par numéro de téléphone, date et escalades
- Affichage en temps réel des nouveaux messages
- Indicateur de connexion Realtime
- Interface sombre élégante

## Technologies

- Next.js 14 (App Router)
- Supabase (client-side + Realtime)
- Tailwind CSS
- TypeScript
