# Demo de capacitación por WhatsApp

FastAPI + SQLAlchemy/SQLite + Evolution API. Recorrido determinista de dos casos del diagnóstico inicial; sin LLM, agenda ni calendario semanal. La selección A–D se realiza por mensajes de texto: no son formularios WhatsApp Flows.

## Uso

Desde otro teléfono, enviar `MIBANCO` al número conectado a la instancia de Evolution. `CONTINUAR` abre cada etapa: bienvenida → enlace de video → pregunta. Responder `A`, `B`, `C` o `D`. Después del segundo caso se muestra el resultado sobre cuatro puntos. `ESTADO`, `MIBANCO` o `HOLA` retoman la etapa sin borrar respuestas; `REINICIAR` comienza de nuevo.

El navegador muestra el video, el contexto desplegable y, al terminar, las cuatro opciones de respuesta en `/video.html?case=MB-CN-C01` o `MB-CN-C02`. Esas respuestas solo se guardan en el navegador y aparecen en su panel `/admin/`: no se envían a WhatsApp ni al servidor. Desde el panel puede reiniciarse únicamente el progreso de ese navegador, previa confirmación; para reiniciar WhatsApp se envía `REINICIAR` en el chat. Los enlaces nuevos incluyen `whatsapp`, el número de la cuenta remitente informado por Evolution, no el del participante. Al finalizar aparece el botón para abrir ese chat con `CONTINUAR` preparado; el participante debe enviarlo. Si el número no está disponible o el enlace es anterior, se indica volver al chat y escribirlo manualmente. No se afirma que el servidor haya verificado la reproducción. El segundo video es material de stock de referencia, no el contenido final.
El botón intenta abrir la app con `whatsapp://send`; si el navegador no lo admite, el enlace alternativo usa `https://wa.me/`. La apertura depende del dispositivo y requiere una prueba en el teléfono.

Solo los contactos que envían MIBANCO inician una sesión; un saludo HOLA sin sesión no activa la demo para no interferir con consultas a Therapy. No utilizar datos reales. La base contiene teléfonos y respuestas de demostración; el endpoint HTTP no permite descargarlos públicamente. Ignora mensajes propios, grupos, estados, otras instancias y eventos distintos de `messages.upsert`. No cambia el formato del número argentino recibido por Evolution.

## Desarrollo y validación

Desde `backend/`:

```sh
uv sync --frozen
uv run pytest -q
```

Variables necesarias: `EVOLUTION_BASE_URL`, `EVOLUTION_API_KEY`, `EVOLUTION_INSTANCE`, `DEMO_WEBHOOK_TOKEN`, `VIDEO_BASE_URL`. `DATABASE_URL` usa SQLite persistente; el contenedor utiliza `sqlite:////data/training.db`. No subir credenciales a Git. Los secretos no van en la URL del webhook.

Para ejecutar localmente, definir esas variables y una ruta SQLite escribible, luego:

```sh
uv run uvicorn training_demo.app:create_app --factory --host 127.0.0.1 --port 8000 --workers 1 --no-access-log
```

Mantener un solo proceso/replica: el bloqueo de procesamiento pertenece al proceso. Estado y respuesta pendiente se guardan juntos antes de llamar al proveedor. Si Evolution falla, responde HTTP 503 y conserva la salida; una repetición del evento o un nuevo mensaje del mismo participante vuelve a intentar las salidas pendientes. No hay un proceso de reintentos automático. La puntuación no se duplica; si el proveedor acepta un envío pero se pierde su respuesta HTTP, el texto podría reenviarse al recuperarlo. No se promete entrega exactamente una vez.

## VPS y EasyPanel

Directorio: `/opt/capacitacion-mibanco`. Se utiliza una aplicación Docker Compose independiente, conectada a la red externa `easypanel` y al Traefik existente. No aparece como servicio creado desde la UI de EasyPanel. No se altera el despliegue de Therapy ni se enciende su agente.

Crear `.env.demo` en ese directorio con `EVOLUTION_BASE_URL`, `EVOLUTION_API_KEY`, `EVOLUTION_INSTANCE` y `DEMO_WEBHOOK_TOKEN`. `VIDEO_BASE_URL` y `DATABASE_URL` están definidos en `compose.demo.yaml`; no hace falta repetirlos en `.env.demo`. El archivo de entorno debe tener permisos 600. Mantener una copia de la configuración previa de Evolution en `demo-private/webhook-before.json`, con directorio 700 y archivo 600.

```sh
docker compose -f compose.demo.yaml up -d --build
docker compose -f compose.demo.yaml ps
curl --fail https://capacitacion-mibanco.72-60-247-32.sslip.io/health
```

El webhook de la instancia `therapy-agent` se configura con URL interna `http://mibanco-training-demo:8000/webhook/evolution`, evento `MESSAGES_UPSERT`, `byEvents: false`, `base64: false` y cabecera `x-demo-webhook-token` igual al secreto. Evolution y la demo comparten la red Docker; el callback no se publica en Internet. Solo `/health` se publica por HTTPS. La API usa la red interna `http://pdlsoft_evolution-api:8080`. El número debe estar conectado: si su estado es `close`, vincularlo nuevamente en `https://pdlsoft-evolution-api.l6pr0s.easypanel.host/manager`, instancia `therapy-agent`, escaneando el QR con WhatsApp Business → Dispositivos vinculados.

El volumen `mibanco-whatsapp-demo_demo_data` conserva las sesiones. No ejecutar `down -v` si se quieren mantener. Los despliegues de GitHub Actions existentes solo actualizan `site/`; los cambios de Python requieren volver a construir este Compose.

## Restaurar el webhook anterior

Ejecutar desde `/opt/capacitacion-mibanco` como usuario autorizado de Docker. El siguiente comando usa el respaldo privado y las credenciales del contenedor, sin imprimirlas:

```sh
docker exec -i mibanco-whatsapp-demo-demo-1 .venv/bin/python -c '
import json, sys, httpx
from training_demo.settings import Settings
s = Settings.from_env()
w = json.load(sys.stdin)
w = w.get("webhook", w)
body = {"webhook": {"enabled": w["enabled"], "url": w["url"], "headers": w.get("headers") or {}, "events": w.get("events", []), "byEvents": w.get("webhookByEvents", False), "base64": w.get("webhookBase64", False)}}
r = httpx.post(s.evolution_base_url + "/webhook/set/" + s.evolution_instance, headers={"apikey": s.evolution_api_key}, json=body, timeout=15)
r.raise_for_status()
print("Webhook anterior restaurado")
' < demo-private/webhook-before.json
```

Restaurar el callback no inicia el agente de Therapy. Después se puede detener únicamente la demo con `docker compose -f compose.demo.yaml stop`.
