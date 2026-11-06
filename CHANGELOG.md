# Changelog

## [Unreleased]

### Added
- Mockup estático de diagnóstico inicial con dos casos, opciones responsivas y registro de respuestas en el navegador.
- Página `/admin/` de demostración, sin autenticación ni datos compartidos entre participantes.
- Publicación HTTPS en el VPS mediante Nginx y Traefik, sin compilación ni backend.
- GitHub Actions despliega los archivos de `site/` al actualizar `main`; también permite ejecución manual. La clave SSH solo permite escribir en el directorio de este sitio.

### Fixed
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
