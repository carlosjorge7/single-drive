# HomeDrive Frontend — Deploy

## Entorno de producción

- Servidor: **ironman** (`ssh c3jota@ironman` / `100.87.9.80`)
- Deploy mediante Docker Compose (imagen `homedrive-frontend`)
- nginx sirve el build de Angular y hace proxy a la API del backend

## URL pública

`https://ironman.tail9ae84b.ts.net` (Tailscale Funnel — siempre activo)

## Actualizar tras cambios en el frontend

```bash
# Desde el Mac — rsync del código fuente
rsync -av --exclude='.git' --exclude='node_modules' --exclude='dist' \
  ./single-drive/ c3jota@ironman:~/homedrive/single-drive/

# En el servidor — rebuild solo del frontend
ssh c3jota@ironman
cd ~/homedrive
docker compose build frontend
docker compose up -d frontend
```

## Build de producción

El Dockerfile hace el build automáticamente:

```dockerfile
FROM node:20-alpine AS builder
RUN npm ci && npx ng build --configuration production

FROM nginx:alpine
COPY --from=builder /app/dist/single-drive/browser /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
```

## Entorno de producción Angular

Fichero: `src/environments/environment.prod.ts`

```typescript
export const environment = {
  production: true,
  apiUrl: '/api/v1'   // URL relativa — nginx hace proxy al backend
};
```

## nginx (`nginx.conf`)

| Path        | Destino                               |
|-------------|---------------------------------------|
| `/uploads/` | Volumen media (uploads del usuario)   |
| `/api/`     | Proxy → backend:8000                  |
| `/admin/`   | Proxy → backend:8000                  |
| `/static/`  | Proxy → backend:8000                  |
| `/`         | Angular SPA (try_files → index.html)  |

> ⚠️ Las rutas `/media/` de nginx sirven los assets de Angular (fonts, iconos).
> Los uploads del usuario van en `/uploads/`, que mapea al volumen Docker `/media/`.

## Notas importantes

- Los fonts de PrimeIcons se sirven desde `/media/` (carpeta generada por Angular en el dist).
  Por esto, los uploads del usuario usan `/uploads/` en lugar de `/media/` para evitar conflicto.
- Los assets con hash (`.js`, `.css`) se cachean 1 año (`Cache-Control: immutable`).
- El HTML principal nunca se cachea (`no-cache, no-store`).
