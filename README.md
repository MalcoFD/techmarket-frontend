# TechMarket Perú S.A.C. — Caso Práctico 7
## Despliegue Integral de una SPA Angular 18 con Docker y Nginx

> **Empresa:** TechMarket Perú S.A.C. | **Tecnologías:** Angular 18 · Tailwind CSS · Docker · Nginx Alpine

---

## Índice

1. [Arquitectura del Proyecto](#1-arquitectura-del-proyecto)
2. [Manual Técnico de Despliegue Local](#2-manual-técnico-de-despliegue-local)
3. [Plan de Pruebas](#3-plan-de-pruebas)
4. [Matriz Comparativa Cloud](#4-matriz-comparativa-cloud)
5. [Matriz de Gestión de Riesgos](#5-matriz-de-gestión-de-riesgos)
6. [Respuestas de Análisis](#6-respuestas-de-análisis)

---

## 1. Arquitectura del Proyecto

```
techmarket-frontend/
├── src/
│   ├── app/
│   │   ├── components/
│   │   │   ├── catalog/        # Vista principal del catálogo
│   │   │   ├── login/          # Formulario de autenticación
│   │   │   └── navbar/         # Barra de navegación global
│   │   ├── guards/
│   │   │   └── auth.guard.ts   # Protección de rutas autenticadas
│   │   ├── models/
│   │   │   └── product.model.ts # Interfaces TypeScript
│   │   ├── services/
│   │   │   ├── product.service.ts # Lógica de negocio + mock data
│   │   │   └── auth.service.ts    # Autenticación simulada
│   │   ├── app.component.ts    # Componente raíz
│   │   ├── app.config.ts       # Configuración de la aplicación
│   │   └── app.routes.ts       # Enrutamiento lazy-loading
│   ├── environments/           # Configuraciones por ambiente
│   ├── index.html              # Punto de entrada HTML
│   └── styles.css              # Estilos globales + Tailwind
├── Dockerfile                  # Multi-stage build (Node → Nginx)
├── nginx.conf                  # Configuración Nginx de producción
├── angular.json                # Configuración CLI Angular
├── tailwind.config.js          # Configuración Tailwind CSS
├── tsconfig.json               # Configuración TypeScript
└── package.json                # Dependencias y scripts NPM
```

### Flujo de la aplicación

```
Usuario → /         → Redirige a /login
Usuario → /login    → LoginComponent (formulario reactivo)
Usuario → /catalog  → authGuard → CatalogComponent (requiere sesión)
Usuario → /* (404)  → Nginx sirve index.html → Angular Router maneja
```

---

## 2. Manual Técnico de Despliegue Local

### Prerrequisitos

| Herramienta | Versión mínima | Verificación |
|-------------|---------------|--------------|
| Docker Engine | 24.x | `docker --version` |
| Docker CLI | 24.x | `docker info` |
| Git | 2.x | `git --version` |

### Paso 1: Clonar o descomprimir el proyecto

```bash
# Opción A: desde el ZIP generado
unzip techmarket-frontend.zip
cd techmarket-frontend

# Opción B: desde repositorio Git
git clone <repo-url> techmarket-frontend
cd techmarket-frontend
```

### Paso 2: Construir la imagen Docker

```bash
# Construcción estándar (limpieza de caché en primer build)
docker build -t techmarket-frontend:latest .

# Con etiqueta de versión (recomendado para producción)
docker build -t techmarket-frontend:1.0.0 .

# Forzar reconstrucción sin caché (útil después de cambios en dependencias)
docker build --no-cache -t techmarket-frontend:latest .

# Ver el tamaño de la imagen resultante
docker images techmarket-frontend
```

**Duración estimada del build:**
- Primera vez (sin caché): 3-6 minutos (depende de velocidad de red)
- Con caché de node_modules: 45-90 segundos

### Paso 3: Ejecutar el contenedor

```bash
# Ejecución básica (acceso en http://localhost:8080)
docker run -d \
  --name techmarket-app \
  -p 8080:80 \
  techmarket-frontend:latest

# Ejecución con reinicio automático y límite de recursos
docker run -d \
  --name techmarket-app \
  -p 8080:80 \
  --restart unless-stopped \
  --memory="256m" \
  --cpus="0.5" \
  techmarket-frontend:latest

# Acceder a la aplicación
echo "Abre en tu navegador: http://localhost:8080"
```

### Paso 4: Verificar el estado del contenedor

```bash
# Listar contenedores activos
docker ps

# Ver logs del contenedor (últimas 50 líneas)
docker logs techmarket-app --tail 50

# Seguir logs en tiempo real
docker logs -f techmarket-app

# Inspeccionar configuración del contenedor
docker inspect techmarket-app

# Estadísticas de uso de recursos en tiempo real
docker stats techmarket-app
```

### Paso 5: Verificar que Nginx responde correctamente

```bash
# Health check endpoint
curl -s http://localhost:8080/health
# Respuesta esperada: "healthy"

# Verificar que el SPA routing funciona (debe retornar index.html, NO 404)
curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/catalog
# Respuesta esperada: 200

# Verificar cabeceras de seguridad
curl -I http://localhost:8080/
# Debe incluir: X-Frame-Options, X-Content-Type-Options

# Verificar compresión GZIP
curl -H "Accept-Encoding: gzip" -I http://localhost:8080/
# Debe incluir: Content-Encoding: gzip
```

### Paso 6: Gestión del ciclo de vida

```bash
# Detener el contenedor
docker stop techmarket-app

# Iniciar el contenedor detenido
docker start techmarket-app

# Reiniciar el contenedor
docker restart techmarket-app

# Detener y eliminar el contenedor
docker stop techmarket-app && docker rm techmarket-app

# Eliminar la imagen
docker rmi techmarket-frontend:latest

# Limpieza completa (imágenes, contenedores, volúmenes huérfanos)
docker system prune -f
```

### Opcional: Docker Compose

```yaml
# docker-compose.yml
version: '3.8'
services:
  frontend:
    build: .
    image: techmarket-frontend:latest
    container_name: techmarket-app
    ports:
      - "8080:80"
    restart: unless-stopped
    deploy:
      resources:
        limits:
          memory: 256M
          cpus: '0.5'
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost/health"]
      interval: 30s
      timeout: 10s
      retries: 3
```

```bash
# Con Docker Compose
docker compose up -d --build
docker compose logs -f
docker compose down
```

---

## 3. Plan de Pruebas

| ID | Categoría | Caso de Prueba | Procedimiento de Validación | Resultado Esperado |
|----|-----------|---------------|----------------------------|-------------------|
| **PT-001** | Funcional | Login con credenciales válidas | Navegar a `http://localhost:8080/login`. Ingresar `demo@techmarket.pe` / `Demo123!`. Clic en "Ingresar al portal". | Redirección a `/catalog`. Navbar visible con nombre de usuario. |
| **PT-002** | Funcional | Login con credenciales inválidas | Ingresar `test@test.com` / `wrongpass`. Clic en "Ingresar". | Banner de error rojo con mensaje "Credenciales incorrectas...". No hay redirección. |
| **PT-003** | Funcional | Validación de campos vacíos | Clic en "Ingresar" sin completar ningún campo. | Mensajes de validación inline en ambos campos. Formulario no se envía. |
| **PT-004** | Funcional | Validación formato email | Ingresar "texto-invalido" en campo email + cualquier contraseña. | Error "Ingresa un correo válido." visible bajo el campo. |
| **PT-005** | Funcional | Autocompletado demo | Clic en "Autocompletar credenciales demo" en el panel azul. | Los campos se pre-rellenan con `demo@techmarket.pe` y `Demo123!`. |
| **PT-006** | Funcional | Carga del catálogo | Iniciar sesión. Verificar pantalla de catálogo. | 16 tarjetas de productos visibles. Skeleton loader durante 400ms antes de los datos. |
| **PT-007** | Funcional | Búsqueda por nombre | En buscador del catálogo escribir "MacBook". | Solo se muestran productos que contengan "MacBook" en nombre/marca/descripción. |
| **PT-008** | Funcional | Búsqueda por marca | Escribir "Samsung" en el buscador. | Filtrado en tiempo real: solo productos Samsung. |
| **PT-009** | Funcional | Filtro por categoría | Seleccionar "Laptops" en el dropdown de categorías. | Solo se muestran las laptops (ASUS ROG, MacBook Air, ThinkPad). |
| **PT-010** | Funcional | Combinación búsqueda + categoría | Categoría "Audio" + búsqueda "Sony". | Solo aparece Sony WH-1000XM5. |
| **PT-011** | Funcional | Ordenamiento por precio ascendente | Seleccionar "Precio: menor a mayor" en el dropdown sort. | Los productos se reordenan de menor a mayor precio. Verificar que Kingston DDR5 (S/ 349) aparece primero. |
| **PT-012** | Funcional | Añadir producto al carrito | Clic en "Añadir" en cualquier producto disponible. | Botón cambia a "¡Añadido!" (verde) durante 1.5s. Contador en navbar incrementa en 1. |
| **PT-013** | Funcional | Carrito: múltiples productos | Añadir 3 productos distintos al carrito. Abrir el panel del carrito. | Lista de 3 productos con nombres, cantidades y subtotales correctos. Total calculado. |
| **PT-014** | Funcional | Carrito: eliminar producto | Abrir carrito, clic en "✕" junto a un producto. | El producto desaparece del carrito. El total se actualiza. El contador del navbar disminuye. |
| **PT-015** | Funcional | Confirmar pedido | Tener productos en carrito. Clic en "Confirmar pedido". | Alert de confirmación con ID de pedido (ej: "ORD-1717...") y total. Carrito se vacía. |
| **PT-016** | Funcional | Cerrar sesión | Clic en icono de logout (→) en la navbar. | Redirección a `/login`. Sesión eliminada de localStorage. |
| **PT-017** | Funcional | Protección de rutas (guard) | Sin iniciar sesión, navegar directamente a `http://localhost:8080/catalog`. | Redirección automática a `/login`. El catálogo NO es accesible. |
| **PT-018** | Funcional | Vista en lista | En el catálogo, clic en el icono de lista (≡). | Los productos cambian a una vista horizontal compacta con descripción visible. |
| **PT-019** | Funcional | Toggle ver contraseña | En login, clic en el ícono de ojo en el campo contraseña. | La contraseña se muestra como texto. Segundo clic la oculta nuevamente. |
| **PT-020** | Funcional | Limpiar filtros | Con filtros activos, clic en el chip de filtro (badge con "✕"). | Los filtros se eliminan y el catálogo muestra todos los productos nuevamente. |
| **PT-021** | SPA Routing | Recarga de página en /catalog | Iniciar sesión, navegar a catálogo. Presionar F5 (recargar). | La página se recarga correctamente mostrando el catálogo. **NO** aparece error 404. |
| **PT-022** | SPA Routing | URL directa a ruta protegida | Sin sesión, ingresar directamente `/catalog` en la barra de URL. | Nginx sirve `index.html`, Angular guard redirige a `/login`. |
| **PT-023** | SPA Routing | Ruta inexistente (404) | Navegar a `http://localhost:8080/pagina-que-no-existe`. | Nginx sirve `index.html`, Angular Router redirige según wildcard (`**` → `/login`). |
| **PT-024** | Performance | GZIP activo | `curl -H "Accept-Encoding: gzip" -I http://localhost:8080/` | Header `Content-Encoding: gzip` presente en la respuesta. |
| **PT-025** | Performance | Caché de assets | `curl -I http://localhost:8080/<archivo.js>` | Header `Cache-Control: public, max-age=31536000, immutable` presente. |
| **PT-026** | Performance | No-cache de index.html | `curl -I http://localhost:8080/index.html` | `Cache-Control: no-cache, no-store, must-revalidate` presente. |
| **PT-027** | Performance | Tiempo de carga inicial | Abrir DevTools (F12) → Network → recargar página. | First Contentful Paint (FCP) < 2 segundos en red local. Lighthouse score Performance > 90. |
| **PT-028** | Seguridad | Cabecera anti-clickjacking | `curl -I http://localhost:8080/` | `X-Frame-Options: SAMEORIGIN` presente. |
| **PT-029** | Seguridad | Cabecera anti-sniffing | `curl -I http://localhost:8080/` | `X-Content-Type-Options: nosniff` presente. |
| **PT-030** | Seguridad | Versión Nginx oculta | `curl -I http://localhost:8080/` | El header `Server` muestra solo `nginx` (sin número de versión). |
| **PT-031** | Seguridad | Health check endpoint | `curl http://localhost:8080/health` | Respuesta `200 OK` con body `healthy`. |
| **PT-032** | Compatibilidad | Chrome (Chromium) | Abrir la app en Google Chrome última versión. Navegar por todas las vistas. | Funcionalidad completa sin errores en consola. |
| **PT-033** | Compatibilidad | Firefox | Abrir la app en Firefox última versión. Navegar por todas las vistas. | Funcionalidad completa. Fuentes y estilos renderizados correctamente. |
| **PT-034** | Compatibilidad | Microsoft Edge | Abrir la app en Edge última versión. Navegar por todas las vistas. | Funcionalidad completa sin regresiones visuales. |
| **PT-035** | Responsividad | Mobile (375px) | DevTools → modo responsive → 375px de ancho (iPhone SE). Navegar login y catálogo. | Layout adaptado: catálogo en 1 columna, formulario de login legible, navbar compacta. |
| **PT-036** | Responsividad | Tablet (768px) | DevTools → 768px de ancho. Navegar todas las vistas. | Catálogo en 2 columnas. Navegación correcta. No hay overflow horizontal. |
| **PT-037** | Responsividad | Desktop (1440px) | Pantalla completa a 1440px. | Catálogo en 4 columnas. Hero banner completo. Fuentes a tamaño óptimo. |
| **PT-038** | Contenedor | Recursos del contenedor | `docker stats techmarket-app` durante uso normal. | Uso de memoria < 50 MB. CPU en reposo < 1%. |
| **PT-039** | Contenedor | Reinicio automático | `docker stop techmarket-app && docker start techmarket-app`. | El contenedor reinicia correctamente y la app es accesible en <5 segundos. |
| **PT-040** | Contenedor | Tamaño de imagen | `docker images techmarket-frontend`. | Tamaño final de imagen < 50 MB (validar multi-stage build exitoso). |

---

## 4. Matriz Comparativa Cloud

### Comparativa: AWS Amplify vs Azure Static Web Apps vs GCP Cloud Run + Firebase

| Criterio | AWS Amplify | Azure Static Web Apps | GCP (Cloud Run + Firebase Hosting) |
|----------|------------|----------------------|-------------------------------------|
| **Facilidad de despliegue** | ⭐⭐⭐⭐⭐ Excelente. CLI `amplify publish`, integración nativa con GitHub/GitLab/Bitbucket. Wizard visual en consola AWS. Sin configuración de servidor. | ⭐⭐⭐⭐⭐ Muy fácil. GitHub Action autogenerada al vincular repositorio. Despliegue en < 2 min. Gratuito para proyectos pequeños. | ⭐⭐⭐⭐ Bueno. Firebase Hosting tiene CLI sencilla. Cloud Run requiere más configuración para el contenedor Docker. |
| **Costo (Free Tier)** | Free Tier: 15 GB/mes de almacenamiento, 1000 minutos de build/mes. Posterior: ~$0.023/GB transferencia. Puede escalar en costo con tráfico alto. | **El más económico.** Plan gratis perpetuo: 100 GB/mes ancho de banda, 2 entornos (staging/prod), SSL incluido. Plan Estándar: $9/mes/app. | Firebase Hosting Free: 10 GB almacenamiento, 360 MB/día de transferencia. Cloud Run: muy económico con pay-per-use, $0.000024/vCPU-segundo. |
| **Escalabilidad** | ⭐⭐⭐⭐⭐ AWS CloudFront (CDN global) integrado. Auto-scaling transparente. 450+ puntos de presencia en el mundo. | ⭐⭐⭐⭐ CDN global de Azure integrado (Front Door). Escala automáticamente. 54 regiones Azure disponibles. | ⭐⭐⭐⭐⭐ Firebase Hosting con CDN global de Google. Cloud Run escala a cero (sin costo en inactividad). |
| **Seguridad** | ⭐⭐⭐⭐⭐ IAM granular, WAF integrable, Shield básico incluido, ACM para SSL automático, VPC support. | ⭐⭐⭐⭐ Azure AD integrado, SSL automático, auth providers nativos (Google, GitHub, Twitter), RBAC por rol. | ⭐⭐⭐⭐ Google Identity Platform, App Check, reglas de seguridad Firebase, SSL gestionado por Google. |
| **CI/CD nativo** | ⭐⭐⭐⭐⭐ Amplify Console: detección automática de framework (Angular), preview por PR, múltiples ramas, notificaciones Slack. | ⭐⭐⭐⭐⭐ GitHub Actions autogenerada. Preview environments por PR. Integración con Azure DevOps. | ⭐⭐⭐⭐ Cloud Build + Firebase CLI en pipeline. Requiere más configuración manual que Amplify/Azure. |
| **Tiempo de implementación** | ~30 minutos (primer despliegue). ~5 min en builds posteriores. | ~20 minutos (primer despliegue via GitHub Actions). ~2 min en builds posteriores. | ~45 minutos si se usa Cloud Run con Docker. ~15 min con Firebase Hosting solo. |
| **Soporte Angular** | Detección automática de Angular CLI. Build optimizado sin configuración. | Detección automática de Angular. Soporte nativo de SPA routing sin configuración adicional. | Firebase Hosting soporta SPA routing con configuración en `firebase.json`. |
| **Mantenimiento** | Bajo. Infraestructura gestionada. Actualizaciones automáticas de CDN. | **Muy bajo.** Servicio totalmente gestionado. Zero ops. Azure gestiona SSL, CDN y escalado. | Medio. Firebase Hosting es gestionado. Cloud Run requiere gestionar la imagen Docker. |
| **Región Latinoamérica** | ✅ São Paulo (sa-east-1) | ✅ Brasil Sur (Brazil South) | ✅ São Paulo (southamerica-east1) |
| **Soporte Docker** | ✅ Via ECS/Fargate (no nativo en Amplify) | ✅ Via Azure Container Apps o ACI | ✅ **Nativo en Cloud Run** (despliegue directo de imagen Docker) |

### 🏆 Recomendación Técnica Justificada

**Para TechMarket Perú S.A.C., se recomienda Azure Static Web Apps** como plataforma cloud principal por las siguientes razones técnicas y de negocio:

1. **Costo-beneficio superior para SPA estáticas:** El plan gratuito de Azure SWA cubre completamente las necesidades de una SPA de catálogo de productos con hasta 100 GB/mes de transferencia sin costo alguno, lo que lo hace ideal para una empresa peruana en etapas de crecimiento.

2. **CI/CD sin fricción:** La integración automática con GitHub mediante GitHub Actions generadas automáticamente elimina la necesidad de un equipo DevOps dedicado para gestionar pipelines, acelerando el time-to-market de las actualizaciones del catálogo.

3. **SPA routing nativo:** Azure SWA configura automáticamente las reglas de routing para SPAs Angular (equivalente al `try_files` de Nginx), sin que el equipo de desarrollo tenga que gestionar configuraciones de servidor.

4. **Seguridad empresarial sin sobrecosto:** El soporte nativo de Azure Active Directory permite escalar hacia autenticación corporativa con SSO cuando TechMarket Perú crezca y requiera integrar el portal con sus sistemas internos (ERP, CRM).

5. **Fallback recomendado:** Si el volumen de tráfico crece significativamente o se requiere soporte Docker para un backend containerizado, **AWS Amplify + CloudFront** es la alternativa más madura, especialmente si TechMarket Perú ya utiliza otros servicios AWS (RDS, S3 para imágenes de productos).

---

## 5. Matriz de Gestión de Riesgos

| ID | Riesgo | Categoría | Probabilidad | Impacto | Severidad | Mitigación Técnica | Plan de Contingencia |
|----|--------|-----------|:---:|:---:|:---:|---|---|
| **R-001** | Falla en el build de Angular (`npm run build` error) | Build/CI | Media | Alto | 🔴 Alta | Fijar versiones exactas en `package.json` (`"@angular/core": "18.0.0"` sin caret). Utilizar `npm ci` en lugar de `npm install`. Agregar step de validación TypeScript (`tsc --noEmit`) antes del build. | Revisar logs de build con `docker build --progress=plain`. Ejecutar `npm run build` localmente antes de dockerizar para aislar el error. |
| **R-002** | Error 404 al recargar rutas de la SPA en Nginx | Nginx/Config | Alta | Alto | 🔴 Alta | Configurar `try_files $uri $uri/ /index.html;` en el bloque `location /` de `nginx.conf`. Validar config con `nginx -t` dentro del contenedor. | Verificar que el COPY del `nginx.conf` en el Dockerfile apunta a la ruta correcta (`/etc/nginx/conf.d/default.conf`). Entrar al contenedor (`docker exec -it techmarket-app sh`) y verificar el archivo. |
| **R-003** | Imagen Docker de gran tamaño (build sin multi-stage) | Docker/Performance | Media | Medio | 🟡 Media | Usar obligatoriamente construcción multi-stage. Añadir `.dockerignore` para excluir `node_modules/` y `dist/`. Verificar tamaño con `docker images`. | Si la imagen supera 150 MB, revisar que la etapa de producción usa `nginx:alpine` y no copia los `node_modules` al stage final. |
| **R-004** | Fuga de variables de entorno en la imagen de producción | Seguridad | Baja | Muy Alto | 🟡 Media | Nunca incluir archivos `.env` en la imagen. Usar `.dockerignore` para excluirlos. En Angular, solo exponer variables via `environment.prod.ts` (que son compiladas en el bundle). Secrets en producción via Docker Secrets o variables de entorno del orquestador (Kubernetes Secrets, AWS Parameter Store). | Auditar la imagen con `docker history techmarket-frontend` y `docker run --rm techmarket-frontend cat /etc/environment` para detectar datos sensibles. |
| **R-005** | Caída del servicio en producción (contenedor no reinicia) | Infraestructura | Baja | Muy Alto | 🟡 Media | Configurar `--restart unless-stopped` en `docker run` o política `restart: unless-stopped` en Docker Compose. Configurar health check con `HEALTHCHECK` en el Dockerfile. | Implementar monitoreo con `docker events` o integrar con una herramienta de alertas (Grafana + Loki, Datadog). Configurar alertas por caída del endpoint `/health`. |
| **R-006** | Incompatibilidad de versiones Node.js entre entorno local y Docker | Build/Compatibilidad | Media | Medio | 🟡 Media | Fijar la versión de Node en el Dockerfile (`FROM node:20-alpine`) y documentar la misma versión en el `README.md`. Usar `engines` en `package.json`: `"engines": { "node": ">=20.0.0" }`. | Si el build falla localmente pero no en Docker (o viceversa), verificar la versión local con `node -v` y alinearla con la del Dockerfile. |
| **R-007** | Los assets estáticos se cachean indefinidamente sin invalidación tras deploy | Performance/UX | Alta | Alto | 🔴 Alta | Angular CLI genera bundles con hash en el nombre (`main.a3f2d1.js`). El `index.html` debe tener `Cache-Control: no-cache` para que el navegador siempre lo pida fresco y así descubra los nuevos bundles con hash. | Si los usuarios reportan ver versiones antiguas: forzar vaciado de caché CDN. Verificar que `nginx.conf` tiene el bloque `location = /index.html` con `no-cache`. |
| **R-008** | Ataque de Clickjacking o Content Sniffing contra la SPA | Seguridad | Baja | Alto | 🟡 Media | Añadir cabeceras de seguridad en `nginx.conf`: `X-Frame-Options SAMEORIGIN`, `X-Content-Type-Options nosniff`, `X-XSS-Protection 1; mode=block`. Verificar con `curl -I`. | Si se detecta vulnerabilidad, actualizar inmediatamente el `nginx.conf` y redesplegar el contenedor. Implementar Content Security Policy (CSP) como medida adicional. |
| **R-009** | Degradación de rendimiento bajo alta concurrencia | Performance | Media | Medio | 🟡 Media | Configurar `worker_processes auto` en Nginx para aprovechar todos los CPU cores. Activar `sendfile on`, `tcp_nopush on`, GZIP. Para alta carga real: agregar un balanceador de carga upstream. | Escalar horizontalmente con `docker run` en múltiples instancias + Nginx como balanceador, o migrar a Kubernetes con HPA (Horizontal Pod Autoscaler). |
| **R-010** | Dependencia de imágenes de Unsplash en modo offline | Funcional/UX | Media | Bajo | 🟢 Baja | Almacenar imágenes de productos en `/src/assets/images/` y servir desde Nginx local. Implementar placeholder con CSS (`bg-slate-900`) como fallback si la imagen no carga. | Reemplazar las URLs de Unsplash en `product.service.ts` por rutas locales `/assets/images/product-1.jpg`. Ejecutar `docker cp` para actualizar sin rebuild. |

---

## 6. Respuestas de Análisis

### P1: ¿Por qué se utiliza una construcción multi-stage en el Dockerfile para este proyecto?

La construcción multi-stage en Docker permite separar el entorno de **compilación** del entorno de **ejecución** en una sola definición de `Dockerfile`, sin requerir scripts externos ni múltiples archivos. En el contexto de TechMarket Perú:

- **Etapa BUILD (`node:20-alpine`):** Contiene Node.js, NPM, el compilador de Angular (`@angular/cli`), TypeScript, PostCSS, Tailwind y las más de 800 dependencias de `node_modules` que pesan ~350 MB. Esta capa **no existe en la imagen final**.
- **Etapa PRODUCCIÓN (`nginx:alpine`):** Contiene únicamente Nginx (~25 MB) y los bundles estáticos compilados de Angular (~2-5 MB de JavaScript/CSS minificados). La imagen resultante pesa aproximadamente **35-45 MB** versus los ~1.5 GB que pesaría si incluyera el entorno Node.

Los beneficios son técnicamente significativos:

1. **Superficie de ataque reducida:** Una imagen con solo Nginx y HTML/JS/CSS no expone vulnerabilidades de Node.js, NPM o el compilador Angular en producción.
2. **Tiempo de push/pull en registros de imágenes (ECR, ACR, Docker Hub):** una imagen de 40 MB se transfiere en segundos versus minutos.
3. **Reproducibilidad total:** El build ocurre dentro del contenedor, eliminando el problema "funciona en mi máquina" derivado de diferencias en versiones de Node o NPM locales.

### P2: ¿Qué problema resuelve la directiva `try_files` en la configuración de Nginx?

Las SPA (Single Page Applications) como la de TechMarket Perú gestionan la navegación de forma totalmente **client-side**: el router de Angular intercepta los cambios de URL y renderiza el componente correspondiente sin hacer una petición al servidor para cada ruta.

El problema surge cuando el usuario recarga la página en una ruta como `/catalog` o ingresa esa URL directamente: el navegador envía una petición HTTP `GET /catalog` a Nginx, que busca un archivo físico o directorio llamado `catalog` en `/usr/share/nginx/html/`. Como ese archivo no existe (solo existe `index.html`), Nginx devuelve un error **404 Not Found**.

La solución es la directiva:
```nginx
try_files $uri $uri/ /index.html;
```

Esta instrucción le dice a Nginx que siga esta lógica secuencial:
1. Si existe un archivo en la ruta literal (`$uri`) → sírvelo (para assets JS, CSS, imágenes).
2. Si existe un directorio (`$uri/`) → sírvelo.
3. Si ninguna de las anteriores → sirve siempre `/index.html`.

Cuando Angular recibe el `index.html`, su router lee la URL actual (`/catalog`), activa el `authGuard` y renderiza el `CatalogComponent`, resolviendo el problema transparentemente para el usuario.

### P3: ¿Cómo impacta la compresión GZIP en el rendimiento de carga de la SPA?

La compresión GZIP transforma la transferencia de datos entre Nginx y el navegador de forma significativa. En una SPA Angular de tamaño mediano, los bundles de producción típicamente tienen este peso:

| Asset | Sin GZIP | Con GZIP | Reducción |
|-------|---------|----------|-----------|
| `main.[hash].js` | ~320 KB | ~95 KB | **~70%** |
| `styles.[hash].css` | ~45 KB | ~10 KB | **~78%** |
| `polyfills.[hash].js` | ~35 KB | ~12 KB | **~66%** |
| **Total** | **~400 KB** | **~117 KB** | **~71%** |

Esta reducción del ~71% en el volumen de datos transferidos impacta directamente en:
- **Time to First Byte (TTFB):** Menor tiempo de red en descargar el HTML inicial.
- **First Contentful Paint (FCP):** El navegador puede parsear y ejecutar los bundles más pequeños más rápido.
- **LCP (Largest Contentful Paint):** Métrica clave de Core Web Vitals que mejora con menor peso de assets.
- **Consumo de ancho de banda del servidor:** Menor egress cost en cloud (relevante si TechMarket Perú migra a AWS/Azure con facturación por GB).

En la configuración de TechMarket, usamos `gzip_comp_level 6` que representa el punto de equilibrio entre CPU consumido en comprimir y ahorro de ancho de banda, validado empíricamente como óptimo para servidores de aplicación web.

### P4: ¿Por qué se configura una política de caché diferente para `index.html` versus los bundles de JavaScript/CSS?

Esta es una de las decisiones de configuración más críticas en el despliegue de SPAs. La estrategia se basa en el mecanismo de **cache-busting por hash** que implementa Angular CLI en modo producción:

**Bundles JS/CSS (`Cache-Control: max-age=31536000, immutable`):**
Angular CLI genera nombres de archivo con hash del contenido: `main.a3f2d1c2.js`. Si se modifica una sola línea de código, el hash cambia completamente: `main.b9e4f231.js`. Como el nombre del archivo **es diferente para cada versión**, es completamente seguro cachearlos indefinidamente (1 año, `immutable`). El navegador/CDN los almacenará hasta que su espacio de caché se agote, acelerando radicalmente las visitas recurrentes.

**`index.html` (`Cache-Control: no-cache, no-store`):**
El `index.html` NO tiene hash en su nombre. Siempre se llama `index.html`. Su función es referenciar los bundles con hash actuales mediante etiquetas `<script src="main.a3f2d1c2.js">`. Si el `index.html` se cachea y TechMarket despliega una nueva versión, el navegador seguirá usando el `index.html` antiguo que apunta a los bundles viejos. Con `no-cache`, el navegador **siempre pide el index.html fresco** al servidor, pero inmediatamente después puede cargar los bundles JS/CSS desde caché local (porque sus nombres no habrán cambiado si el código no cambió, o tendrán nuevos nombres/hashes si cambió).

Esta estrategia garantiza: **despliegues inmediatos + máxima velocidad de carga**.

### P5: ¿Cuáles son las ventajas de usar Angular Signals sobre el patrón clásico RxJS BehaviorSubject para la gestión de estado del carrito?

En la implementación de TechMarket Perú, se optó por Angular Signals (introducidos estables en Angular 17+) para gestionar el estado del carrito de compras por las siguientes razones técnicas:

**1. Menor boilerplate:**
```typescript
// Con BehaviorSubject (patrón clásico)
private _cartSubject = new BehaviorSubject<CartItem[]>([]);
readonly cart$ = this._cartSubject.asObservable();
// Requiere .subscribe(), async pipe o takeUntilDestroyed en la vista

// Con Signals (implementación actual)
private _cart = signal<CartItem[]>([]);
readonly cart = this._cart.asReadonly();
// Se lee directamente en la plantilla: cart() — sin async pipe
```

**2. Change Detection más granular:** Los Signals integran con la detección de cambios de Angular de forma que solo los componentes que consumen la señal específica son re-renderizados, versus la estrategia `Default` de `BehaviorSubject` que puede triggear ciclos completos.

**3. Computed values reactivos:** `computed(() => this._cart().reduce(...))` para `cartCount` y `cartTotal` son valores derivados que se recalculan automáticamente y con lazy evaluation solo cuando su dependencia (`_cart`) cambia.

**4. Depuración simplificada:** El valor actual de un Signal es sincrónicamente accesible con `signal()` en cualquier punto, versus tener que subscribirse o acceder a `.value` en un BehaviorSubject.

**Cuándo mantener RxJS:** Para operaciones asíncronas complejas (HTTP, combinación de múltiples streams, operadores como `switchMap`, `combineLatest`), RxJS Observables siguen siendo la herramienta correcta. Por eso `getProducts()` retorna `Observable<Product[]>`.

### P6: ¿Qué implica usar Componentes Standalone en Angular 18 versus el modelo clásico basado en NgModules?

Angular 18 consolida el modelo de **Componentes Standalone** (introducido en Angular 14 como API experimental) como el estándar de facto, eliminando la necesidad de `NgModule` para la mayoría de casos de uso.

**Implicaciones en TechMarket Perú:**

| Aspecto | NgModules (Angular <= 13) | Standalone Components (Angular 18) |
|---------|--------------------------|-------------------------------------|
| Declaración | `@NgModule({ declarations: [LoginComponent] })` | `@Component({ standalone: true })` |
| Imports | En el módulo padre | Directamente en cada componente |
| Bootstrapping | `bootstrapModule(AppModule)` | `bootstrapApplication(AppComponent, appConfig)` |
| Tree-shaking | Por módulo | Por componente (más granular) |
| Lazy loading | `loadChildren: () => import('./module')` | `loadComponent: () => import('./component')` |
| Boilerplate | Alto (~4 archivos por feature) | Mínimo (1 archivo por componente) |

**Ventajas concretas en el proyecto:**
- El `CatalogComponent` importa directamente `[CommonModule, FormsModule, NavbarComponent]` en su decorator, haciendo explícita y auto-documentada su superficie de dependencias.
- `loadComponent` en `app.routes.ts` permite **lazy loading a nivel de componente**, cargando `LoginComponent` y `CatalogComponent` solo cuando el usuario navega a esa ruta, reduciendo el bundle inicial.
- Elimina los archivos `*.module.ts` del proyecto, simplificando la estructura de directorios.

### P7: ¿Cómo garantiza este esquema de despliegue la portabilidad entre entornos (dev, staging, prod)?

La portabilidad es una propiedad arquitectural lograda mediante la combinación de principios de la metodología **Twelve-Factor App** y las características de Docker:

**1. Inmutabilidad del artefacto:** El mismo `Dockerfile` produce la misma imagen (`techmarket-frontend:1.0.0`) independientemente de si se ejecuta en el laptop de un desarrollador, en un servidor de CI/CD (GitHub Actions, Jenkins) o en un clúster de Kubernetes. El `sha256` de la imagen es idéntico.

**2. Configuración externalizada:** Las diferencias entre entornos (URL de API, feature flags) se inyectan como variables de entorno al contenedor (`docker run -e API_URL=https://api.prod.techmarket.pe`), no como archivos distintos dentro de la imagen.

**3. Mismo servidor, distintos contextos:** Nginx sirve los mismos artefactos estáticos en todos los entornos. El comportamiento varía solo por la configuración de variables de Angular (`environment.ts` vs `environment.prod.ts`), compiladas en el bundle.

**4. Reproducibilidad del build:** `npm ci` instala exactamente las versiones del `package-lock.json`, garantizando que el build de hoy produce el mismo resultado que el build en 6 meses, sin sorpresas por actualizaciones menores de dependencias.

**5. Independencia de infraestructura:** El mismo contenedor Docker puede desplegarse en:
- `docker run` (local/dev)
- Docker Compose (entorno de integración)
- AWS ECS/Fargate, Azure Container Apps, GCP Cloud Run (producción cloud)
- Kubernetes (orquestación enterprise)

### P8: ¿Qué consideraciones de seguridad adicionales deberían implementarse antes de un despliegue en producción real?

Más allá de las cabeceras HTTP ya configuradas en `nginx.conf`, un despliegue de producción real para TechMarket Perú requiere:

**1. HTTPS/TLS obligatorio:**
- Nunca exponer la SPA en HTTP puro en producción. Usar un certificado SSL/TLS gestionado (AWS ACM, Azure Managed Certificates, Let's Encrypt via Certbot).
- Configurar redirección automática `HTTP → HTTPS` en Nginx o en el balanceador de carga upstream.
- HSTS header: `Strict-Transport-Security: max-age=31536000; includeSubDomains`.

**2. Content Security Policy (CSP):**
```nginx
add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'nonce-RANDOM'; style-src 'self' 'unsafe-inline'; img-src 'self' https: data:; font-src 'self' https://fonts.gstatic.com;";
```
Previene ataques XSS al restricting las fuentes de scripts, estilos e imágenes.

**3. Rate Limiting en Nginx:**
```nginx
limit_req_zone $binary_remote_addr zone=login:10m rate=5r/m;
# Aplica en el endpoint de login para prevenir brute-force:
limit_req zone=login burst=10 nodelay;
```

**4. Escaneo de vulnerabilidades en la imagen:**
```bash
docker scan techmarket-frontend:latest  # via Docker Scout
trivy image techmarket-frontend:latest  # Trivy (open source)
```

**5. Usuario no-root en el contenedor (Principle of Least Privilege):**
Aunque Nginx ya corre sus workers como usuario `nginx`, el proceso master podría ejecutarse como usuario no-root con configuración adicional. En Kubernetes, usar `securityContext: runAsNonRoot: true`.

**6. Secrets Management:** Las credenciales (API keys, tokens) nunca deben estar en el código fuente ni en variables de entorno planas en producción. Usar AWS Secrets Manager, Azure Key Vault o HashiCorp Vault.

**7. Actualizaciones regulares de la imagen base:**
```bash
# Verificar vulnerabilidades en nginx:alpine periódicamente
docker pull nginx:alpine
docker build --no-cache -t techmarket-frontend:latest .
```

**8. Monitoreo y alertas:** Integrar Nginx access logs con un stack ELK (Elasticsearch/Logstash/Kibana) o Grafana Loki para detectar patrones anómalos (picos de tráfico, errores 4xx/5xx, intentos de intrusión).

---

*Documento generado para Caso Práctico 7 — TechMarket Perú S.A.C. | Angular 18 + Docker + Nginx*
