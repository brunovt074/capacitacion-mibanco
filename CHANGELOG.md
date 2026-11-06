# Changelog

## [Unreleased]

### Added
- Acceso directo al panel desde las páginas del diagnóstico y reinicio confirmado de los datos guardados en el navegador.
- Opciones de respuesta y sección desplegable de contexto restauradas al finalizar el video abierto desde WhatsApp.
- Imagen de perfil cuadrada para WhatsApp con la marca MiBanco.
- Al finalizar el video, botón de regreso al chat con CONTINUAR preparado y número del remitente obtenido de Evolution.
- Demo de capacitación por WhatsApp con Python/FastAPI y Evolution API: bienvenida, dos casos, respuestas A–D, resultado, consulta y reinicio desde el chat.
- Sesiones y respuestas pendientes en SQLite persistente; webhook autenticado, filtro de mensajes propios y registro idempotente.
- Vista móvil `/video.html?case=...` con video, opciones locales y regreso a WhatsApp; el prototipo web original permanece disponible.
- Despliegue aislado `compose.demo.yaml` detrás de Traefik/EasyPanel; operación y restauración del webhook de Therapy en `backend/README.md`.
- Mockup estático de diagnóstico inicial con dos casos, opciones responsivas y registro de respuestas en el navegador.
- Página `/admin/` de demostración, sin autenticación ni datos compartidos entre participantes.
- Publicación HTTPS en el VPS mediante Nginx y Traefik, sin compilación ni backend.
- GitHub Actions despliega los archivos de `site/` al actualizar `main`; también permite ejecución manual. La clave SSH solo permite escribir en el directorio de este sitio.

### Fixed
- El botón de regreso intenta abrir WhatsApp directamente y ofrece un enlace web alternativo.
- El video se centra al abrir el caso y comenzar la reproducción, con altura limitada al viewport.
- La navegación superior se desplaza con la página; títulos y espaciados más contenidos mantienen el foco en el video.
- El registro del equipo usa tarjetas responsivas en lugar de tablas, con respuesta y puntaje visibles y trazabilidad desplegable.

## Operación del mockup

- URL: https://capacitacion-mibanco.72-60-247-32.sslip.io/
- VPS: `/opt/capacitacion-mibanco`; iniciar con `docker compose up -d`.
- El MP4 de referencia se carga por separado en `media/Formato 9 16 Esp Perú Banca.mp4`, fuera de Git. El segundo video se reproduce desde Pexels.
- El workflow publica únicamente `site/`. Cambios en `compose.yaml` o `nginx.conf` requieren actualizar esos archivos en el VPS y ejecutar `docker compose up -d --force-recreate`.
- Secretos de Actions: `VPS_HOST`, `VPS_USER`, `VPS_SSH_KEY` y `VPS_KNOWN_HOSTS`.
- Desarrollo local: servir `site/` con cualquier servidor estático; para buscar posiciones en el video, usar uno que soporte solicitudes HTTP Range.
- No introducir datos reales: respuestas en `localStorage`, puntajes disponibles en JavaScript y `/admin/` sin control de acceso.
- El prototipo estático y `/admin/` no muestran los datos de la demo WhatsApp. Esa demo usa su propia base SQLite; no son WhatsApp Flows nativos.
