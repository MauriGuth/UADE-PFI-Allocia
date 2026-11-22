Allocia.pdf: informe completo compilado el 20 de octubre de 2026 (111 páginas físicas).
respuesta_devolucion.pdf: respuesta a la devolución del avance del 50 % (cátedra y tutor), con cada observación, el cambio realizado, su ubicación y su estado; incluye la lista de pendientes que requieren a los autores y la preparación de la reunión con el tutor.
Compilación del informe: latexmk -pdf -interaction=nonstopmode -halt-on-error main.tex (sin advertencias, referencias indefinidas ni desbordes).
Compilación de la respuesta: pdflatex respuesta_devolucion.tex (dos pasadas).

Cambios del 20 de octubre de 2026 (devolución del tutor):
- Alcance web + móvil: ambos clientes sobre la misma cuenta y API (Secciones 1.1, 1.2, 3.4, RF7, 4.2, 4.8, 6.4; Tabla 6.I implementado/parcial/previsto).
- Fuentes del tutor incorporadas con entradas bibliográficas completas: CFA Institute (gestión de portafolios y asignación de activos), WEF Global Risks Report 2026, IOSCO CR/01/2025 sobre IA en mercados de capitales, NIST AI RMF 1.0 y perfil de IA generativa (NIST AI 600-1); además OWASP Top 10 for LLM 2025, Greshake et al. (2023) y Normas CNV (RG 731/2018).
- Infografías: Figura 2.2 (tendencias del entorno con fuentes), Figura 3.6 (el problema del inversor en cifras de la encuesta), Figura 3.7 (de los activos dispersos a la observación explicable), Figura 6.1 (de lo implementado a la siguiente etapa), Figura 4.12 (recorrido de la información con estado de cada componente).
- Pruebas: Sección 5.3.1 y Tabla 5.I con la reconstrucción manual del cálculo de CP03 y la lectura de la observación por el usuario.
- Seguridad y legal: Sección 4.12 reescrita con artículos de la Ley 25.326, Ley 26.831 y Normas CNV, prompt injection (OWASP/NIST), marco Govern/Map/Measure/Manage; Tabla 4.II con cada control y su estado.
- RNF10 (etiquetado de contenido por reglas frente a modelo de lenguaje) y correspondencia de los RNF con las características de IA confiable del NIST.

Historial anterior:
Revisiones de la aplicación contrastadas: API 8768e53 y clientes 015e7b6; reverificación del 13 de octubre sobre 79233ed (defecto X11 corregido en 3bd9d56). Manifiestos: evidence/2026-10-09-actualizacion.json y evidence/2026-10-13-reverificacion.json.
El documento distingue resultados verificados de pendientes: validación humana y transcripciones, entrevista independiente, pruebas físicas/push, paridad restante, señales en producción, ejecución programada observada y cobertura de fuentes.

Cambios del 22 de octubre de 2026 (rúbrica del informe final):
- Sección 3.5 Modelo de negocio (lienzo) y 3.6 Viabilidad económico-financiera (tres escenarios, VAN, TIR, recupero, punto de equilibrio; scripts/viabilidad.py).
- Sección 4.1 con Scrum y Kanban: eventos, artefactos, GitHub Projects, historias de usuario y sprints de dos semanas.
- Conclusiones reescritas y ligadas al objetivo general (Tabla 7.I).
- Señales en producción verificadas el 22/10 (TVL y Polymarket en vivo; solo GPR pendiente): evidence/2026-10-22-senales-produccion.
- DOI de toda la bibliografía verificados. Revisión de estilo de todo el informe.
- Entrevistas del 22/10 (Tadeo Pinque, Fabricio Sabattoli, Octavio Antunes) transcriptas en el Anexo D, con análisis individual y conjunto en 3.1.2.
- Sesiones de comprensión con cinco usuarios (21 a 23/10) en la Sección 5.9 y el Anexo G; registro en evidence/2026-10-sesiones-usuarios.
