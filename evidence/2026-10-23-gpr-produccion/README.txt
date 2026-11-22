Consulta a GET /signals del servicio publicado (uadepfi-production.up.railway.app) el 23 de octubre de 2026 a las 23:35 (hora de Buenos Aires), con la cuenta de demostración, tras el despliegue de la revisión 3e55128 de Allocia.
geo.gprIndex = 176 · gprLevel = elevado · tendencia = estable
provenance.geo.source = «Caldara e Iacoviello, índice GPR diario (media móvil de 30 días); Finnhub (noticias)»
provenance.geo.dataDate = 2026-10-19 (última fila publicada en la planilla diaria data_gpr_daily_recent.xls)
Valores de la planilla para ese día: GPRD = 248,66; GPRD_MA7 = 177,92; GPRD_MA30 = 176,01.

Actualización del 24 de octubre de 2026 (revisión 7c1f989 de Allocia): las reglas apoyadas en señales externas quedan activas en producción. GET /observations de la cuenta de demostración devuelve conc-top, exp-cripto y ctx-gpr («Riesgo geopolítico global por encima de su media», GPR 176, tendencia estable, umbral > 120), cada una con su evidencia de regla. Las observaciones con evidencia de demostración o no disponible se descartan en producción.
