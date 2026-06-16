# =============================================================================
# DOCKERFILE — TechMarket Perú S.A.C.
# Estrategia: Multi-Stage Build (Construcción en dos etapas)
# Propósito: Generar una imagen de producción mínima y segura para la SPA
#            Angular 18, servida con Nginx Alpine.
# Resultado esperado: imagen final ~25-35 MB (vs ~1.5 GB si usara node en prod)
# =============================================================================

# ─────────────────────────────────────────────────────────────────────────────
# ETAPA 1 — BUILD: Compilación de la aplicación Angular
# Usamos node:20-alpine (imagen LTS ligera basada en Alpine Linux ~180 MB)
# para instalar dependencias y compilar el proyecto en modo producción.
# ─────────────────────────────────────────────────────────────────────────────
FROM node:20-alpine AS build

# Definimos el directorio de trabajo dentro del contenedor.
# Todas las instrucciones COPY, RUN siguientes operarán sobre /app.
WORKDIR /app

# Copiamos SOLO los archivos de definición de dependencias primero.
# Técnica de cache-layer: Docker cachea esta capa y no reinstala node_modules
# si package.json y package-lock.json no cambiaron entre builds consecutivos.
COPY package.json package-lock.json ./

# npm ci (clean install): instala dependencias de forma determinista y exacta
# según el package-lock.json. Más rápido y seguro que npm install en CI/CD.
# --ignore-scripts: mitiga riesgos de scripts de instalación maliciosos.
RUN npm ci --ignore-scripts

# Ahora copiamos el resto del código fuente al contenedor.
# Se realiza DESPUÉS de npm ci para aprovechar el cache de la capa anterior.
COPY . .

# Ejecutamos la compilación de producción de Angular.
# --configuration=production activa: tree-shaking, minificación, AOT compilation,
# output hashing para cache-busting y eliminación de código de desarrollo.
# Los artefactos compilados se generan en /app/dist/techmarket-frontend/browser/
RUN npm run build -- --configuration=production

# ─────────────────────────────────────────────────────────────────────────────
# ETAPA 2 — PRODUCCIÓN: Servidor Nginx con artefactos estáticos
# Partimos de nginx:alpine (~25 MB). El contexto de Node.js NO se incluye
# en esta imagen final: eliminamos cientos de MB de node_modules y fuentes.
# ─────────────────────────────────────────────────────────────────────────────
FROM nginx:alpine AS production

# Metadatos de la imagen según especificación OCI (buena práctica DevOps)
LABEL maintainer="DevOps TechMarket Perú <devops@techmarket.pe>"
LABEL version="1.0.0"
LABEL description="SPA Angular 18 — TechMarket Perú S.A.C."

# Eliminamos la configuración por defecto de Nginx para reemplazarla
# con nuestra configuración optimizada para SPA Angular.
RUN rm /etc/nginx/conf.d/default.conf

# Copiamos nuestra configuración personalizada de Nginx.
# Esta configuración incluye: soporte SPA (try_files), GZIP, caché y seguridad.
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copiamos los artefactos estáticos compilados desde la Etapa 1 (alias 'build')
# al directorio raíz de Nginx. Angular CLI 18 genera los bundles en
# dist/<project-name>/browser/ al usar el nuevo @angular-devkit/build-angular.
COPY --from=build /app/dist/techmarket-frontend/browser/ /usr/share/nginx/html/

# Ajustamos permisos: nginx worker corre como usuario 'nginx' (no root).
# Esto es una práctica de seguridad para contenedores en producción.
RUN chown -R nginx:nginx /usr/share/nginx/html && \
    chmod -R 755 /usr/share/nginx/html

# Exponemos el puerto 80 (HTTP estándar de Nginx).
# En producción real, el TLS lo termina el balanceador de carga upstream.
EXPOSE 80

# Comando por defecto: arranca Nginx en modo foreground (daemon off)
# para que Docker pueda gestionar el proceso principal (PID 1) correctamente.
CMD ["nginx", "-g", "daemon off;"]
