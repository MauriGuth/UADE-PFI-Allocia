#!/usr/bin/env python3
"""Codificación temática de la pregunta abierta de la encuesta (pregunta 16).

Uso: python3 scripts/codificar_respuestas_abiertas.py evidence/2026-08-encuesta/pregunta16_respuestas.txt tables

Lee las respuestas (una por línea, en el orden de registro), asigna a cada una
los temas cuyas expresiones aparecen en el texto y escribe las frecuencias.
Una respuesta puede recibir más de un tema. Las expresiones son la definición
operativa de cada tema; la asignación se revisó respuesta por respuesta.
"""
import csv, re, sys, unicodedata, collections

def norm(s):
    s = unicodedata.normalize('NFD', s.lower())
    return ''.join(c for c in s if unicodedata.category(c) != 'Mn')

TEMAS = [
 ('Consolidación e integración entre plataformas', r'consolid|todo junto|un solo lugar|una sola plataforma|todo en un|unirlo|cuadro completo|veo el total|ver el total|total real|tengo en total|ver todo|verlo junto|fragment|separado|app por app|abro \d|abrir t|tres apps|varias apps|varias billeteras|integra|conect|sincroniz|ninguna app que|todo integrado|distintos lados|se conecta'),
 ('Contexto argentino: inflación, tipo de cambio e instrumentos locales', r'argentin|inflaci|tipo de cambio|dolar|pesos|cedear|mercado local|local|riesgo pais|ccl|mep|fci|dolariz|ganancia real|gane de verdad|rendimiento real|nominal'),
 ('Noticias, alertas y efecto del contexto sobre la cartera', r'alerta|noticia|me entero|enterarme|macro|geopolit|tasas|me afecta|impact|avise|contexto|evento|twitter|telegram|mercado cambia'),
 ('Explicación y fundamento de las observaciones', r'explic|razonamiento|fundamento|sustento|fuentes|por que|porque creen|transparen|a quien creerle|confiable|sin saber|me diga si estoy bien'),
 ('Lenguaje accesible y facilidad de uso', r'criollo|tecnic|accesible|simple|sencill|facil|claridad|principiante|confus|no entiendo bien lo que hago|ux|onboarding|se entienda|por donde'),
 ('Exposición real, diversificación y composición de fondos', r'exposicion|diversific|concentrad|adentro|subyacente|componentes|composicion|en que estoy invertido|riesgo del que|rebalance|liquidez|benchmark|simular|escenario'),
 ('Carga y actualización automáticas', r'automatic|automatiz|a mano|manual|se carguen solas|se actualice solo|excel'),
 ('Falta de tiempo para seguir y procesar la información', r'tengo tiempo de|falta tiempo|tiempo y|todo el finde|perdida de tiempo|tardo horas|lleva horas|pierdo tiempo'),
 ('Criptoactivos, DeFi y mercados de predicción', r'cripto|defi|on-chain|chains|tokens|polygon|yield|prediction|billeteras|binance|lemon'),
]
SIN = r'^(-|\.|\\_|n/a|no lo se|no se|nose|ni idea|no aplica|ninguna|nada|sin comentarios|no se me ocurre nada|no uso|no uso herramientas|no conozco ninguna|no uso ese tipo de herramientas|no conozco mucho de inversion|no uso ninguna herramienta pero el proyecto me parece una buena idea\.?|hacerse mas visibles\.?)\.?$'

def main(path):
    resp = [l.rstrip('\n') for l in open(path, encoding='utf-8')]
    cuenta = collections.Counter(); filas = []; sin = 0; otros = []
    for i, r in enumerate(resp, 1):
        n = norm(r.strip())
        if re.match(SIN, n):
            sin += 1; filas.append((i, r, ['Sin respuesta sustantiva'])); continue
        ts = [t for t, pat in TEMAS if re.search(pat, n)]
        if not ts: otros.append((i, r)); ts = ['Otros']
        for t in ts: cuenta[t] += 1
        filas.append((i, r, ts))
    return resp, cuenta, sin, otros, filas

def tex(s):
    s = s.replace('\\_', '_').replace('\\&', '&')
    for a, b in (('\\', r'\textbackslash{}'), ('&', r'\&'), ('%', r'\%'), ('$', r'\$'), ('#', r'\#'), ('_', r'\_'), ('"', "''")):
        s = s.replace(a, b)
    return s

def escribir_tex(resp, cuenta, sin, otros, destino):
    sust = len(resp) - sin
    with open(destino + '/encuesta_abierta_temas.tex', 'w', encoding='utf-8') as f:
        for t, _ in sorted(TEMAS, key=lambda x: -cuenta[x[0]]):
            f.write(f'{t} & {cuenta[t]} & {100*cuenta[t]/sust:.1f}'.replace('.', ',') + ' \\\\\n')
        f.write(f'Otros temas & {len(otros)} & {100*len(otros)/sust:.1f}'.replace('.', ',') + ' \\\\\n')
        f.write('\\hline\n')
    with open(destino + '/encuesta_abierta_respuestas.tex', 'w', encoding='utf-8') as f:
        for i, r in enumerate(resp, 1):
            f.write(f'{i} & {tex(r.strip())} \\\\\n')

if __name__ == '__main__':
    resp, cuenta, sin, otros, filas = main(sys.argv[1])
    sust = len(resp) - sin
    print(f'Respuestas: {len(resp)}; sustantivas: {sust}; sin respuesta sustantiva: {sin}')
    for t, _ in TEMAS: print(f'{cuenta[t]:4d}  {100*cuenta[t]/sust:5.1f} %  {t}')
    print(f'{len(otros):4d}  {100*len(otros)/sust:5.1f} %  Otros')
    if len(sys.argv) > 2 and sys.argv[2] != '-v': escribir_tex(resp, cuenta, sin, otros, sys.argv[2])
    if '-v' in sys.argv:
        for i, r in otros: print('OTROS', i, r)
        for i, r, ts in filas: print(i, '|', '; '.join(t.split(':')[0][:22] for t in ts), '|', r[:110])
