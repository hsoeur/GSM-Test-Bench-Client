# Étape 1 : Build de l'application avec Vite
FROM node:18 AS builder

WORKDIR /app

# Copier uniquement les fichiers essentiels pour installer les dépendances
COPY package.json package-lock.json ./

# Installer les dépendances
RUN npm install --frozen-lockfile

# Copier le reste des fichiers du projet
COPY . .

# Construire l'application avec Vite
RUN npm run build

# Étape 2 : Servir l'application avec Nginx
FROM nginx:alpine AS production

# Custom Nginx config to disable caching on /config/ files
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY docker-entrypoint.d/ /docker-entrypoint.d/
RUN chmod +x /docker-entrypoint.d/*.sh

# Copier les fichiers build de l'application React (générés par Vite)
COPY --from=builder /app/dist /usr/share/nginx/html

# Exposer le port 80 à l'intérieur du conteneur
EXPOSE 6001

# Lancer nginx (utilise la config par défaut)
CMD ["nginx", "-g", "daemon off;"]
