# Demo de capacitación con Evolution API

## Motivo y alcance

El cliente quiere responder las preguntas dentro de WhatsApp y abrir el navegador solo para ver los videos. Para esta demostración se reutiliza la instancia Evolution API de Therapy, cuyo agente de turnos está apagado. No se configura Meta ni se reactiva Therapy. Evolution/Baileys no equivale a WhatsApp Flows: las respuestas se seleccionan por letras en el chat.

Se migra el recorrido demostrativo existente: bienvenida, dos casos del diagnóstico inicial, puntuación y consulta/reinicio. No se implementa el calendario de ocho semanas ni se presenta el diagnóstico como certificación. No se usan datos reales de pacientes o participantes.

## Diseño

Servicio Python FastAPI pequeño y por capas: transporte Evolution, recorrido determinista y persistencia SQLAlchemy/SQLite en volumen independiente. Despliegue Docker junto al sitio actual; video y salud por HTTPS de EasyPanel/Traefik, callback autenticado por la red Docker compartida. Sin LLM ni conexión a la agenda de Therapy.

Los videos permanecen en el sitio estático con formulario de opciones en el navegador y contexto desplegable. Las respuestas web se guardan solo en ese navegador y no se sincronizan con WhatsApp; el panel permite reiniciar ese almacenamiento previa confirmación. El chat se reinicia por separado con REINICIAR. La identidad del participante no viaja en el enlace; el número público del remitente, informado por Evolution, permite mostrar al finalizar un botón para volver a ese chat con CONTINUAR preparado. Si falta el número, se indica volver manualmente. No se afirma que el servidor haya observado la reproducción.

El webhook exige un secreto y la instancia configurada. Ignora eventos ajenos, mensajes propios, grupos, estados y contactos que no iniciaron la demo. MIBANCO inicia o retoma sin borrar respuestas; HOLA solo retoma una sesión existente para no interceptar saludos a Therapy. REINICIAR es el único reinicio explícito. Los mensajes repetidos no vuelven a puntuar. Las sesiones persisten después de reiniciar el servidor. Un fallo de envío no descarta la respuesta pendiente.

## Aceptación

- [x] Localizar la instancia asociada al número indicado y registrar su configuración previa sin divulgar credenciales ni tocar la agenda.
- [ ] MIBANCO desde otro teléfono inicia la bienvenida; CONTINUAR entrega el primer video y luego la pregunta con cuatro opciones completas.
- [x] El enlace del video abre una vista móvil con opciones locales al terminar; el sitio original continúa funcionando.
- [x] Cada respuesta A–D se registra una sola vez con el puntaje 2/1/0/0 y su categoría; el segundo caso conduce al resultado sobre cuatro puntos.
- [x] ESTADO retoma la fase actual; HOLA no borra avances; REINICIAR permite una nueva demostración.
- [x] El webhook rechaza secretos incorrectos e ignora mensajes propios, grupos, estados, eventos de otra instancia y contactos sin sesión que no enviaron MIBANCO.
- [x] Mensajes duplicados no avanzan dos veces, sesiones sobreviven al reinicio y una respuesta pendiente puede recuperarse tras fallo del proveedor.
- [x] Se ejecutan pruebas de comportamiento y una prueba HTTP contra el servicio levantado; se verifica visualmente la vista del video.
- [x] Se despliega el servicio aislado, se verifica el webhook de Evolution y se documenta cómo restaurar su configuración anterior. Si un acceso externo es inaccesible, se identifica exactamente y se completa todo lo verificable.

## Verificación y límite externo

- Suite Python: 15 pruebas aprobadas, sin advertencias. Prueba HTTP contra Uvicorn real con proveedor local controlado: seis respuestas, dos casos, resultado 2/4; repetir el mensaje final no envía otra respuesta.
- Vista publicada: reproducción real del MP4, metadatos del segundo video, móvil vertical/horizontal y enlace inválido. Sin desbordamiento horizontal; video vertical completo dentro del viewport al abrirlo.
- VPS: contenedor construido y ejecutándose; `/health`, sitio original, `/admin/` y vista de video responden 200. Desde el contenedor real de Evolution, callback interno sin secreto devuelve 403 y con secreto acepta e ignora mensajes propios.
- Revisión independiente realizada; activación exclusiva MIBANCO y callback interno incorporados. Estado de WhatsApp después de solicitar QR: `connecting`. Falta que el usuario vincule el teléfono y complete el recorrido desde su otra SIM; no se afirma entrega real de mensajes de WhatsApp.
