#!/usr/bin/env python3
"""Control remoto de la presentación de Allocia por red local, sin internet.

Uso: python3 control_remoto.py
La compu abre la presentación en http://localhost:PUERTO y los teléfonos,
conectados a la misma red wifi (o al hotspot de un teléfono), entran a la
dirección que se imprime en la terminal y eligen «Control remoto».
Solo usa la biblioteca estándar de Python.
"""
import json
import os
import queue
import re
import socket
import subprocess
import sys
import threading
import time
import webbrowser
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

HERE = os.path.dirname(os.path.abspath(__file__))
DECK = os.path.join(HERE, "Allocia_Exposicion_final.html")
PEER_RE = re.compile(r"^[a-z0-9]{1,40}$")

peers = {}  # id -> {"presence": dict, "updatedAt": ms, "q": Queue}
lock = threading.Lock()
urls = []


def now_ms():
    return int(time.time() * 1000)


def broadcast(msg):
    data = json.dumps(msg)
    with lock:
        targets = [p["q"] for p in peers.values()]
    for q in targets:
        q.put(data)


def broadcast_peers():
    with lock:
        msg = {"type": "peers", "peers": [
            {"peer": k, "presence": v["presence"], "updatedAt": v["updatedAt"]} for k, v in peers.items()
        ]}
    broadcast(msg)


def lan_ips():
    ips = []
    for iface in ("en0", "en1", "en2", "bridge100"):
        try:
            out = subprocess.run(["ipconfig", "getifaddr", iface], capture_output=True, text=True, timeout=2).stdout.strip()
            if out and out not in ips:
                ips.append(out)
        except Exception:
            pass
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("10.255.255.255", 1))
        ip = s.getsockname()[0]
        s.close()
        if ip and not ip.startswith("127.") and ip not in ips:
            ips.append(ip)
    except Exception:
        pass
    return ips


class Handler(BaseHTTPRequestHandler):
    server_version = "AlloRemote/1"

    def log_message(self, *args):
        pass

    def send_json(self, obj, code=200):
        body = json.dumps(obj).encode()
        self.send_response(code)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        path, _, query = self.path.partition("?")
        if path in ("/", "/index.html"):
            try:
                with open(DECK, "rb") as f:
                    body = f.read()
            except OSError:
                self.send_error(404, "No encuentro Allocia_Exposicion_final.html al lado de este script")
                return
            self.send_response(200)
            self.send_header("Content-Type", "text/html; charset=utf-8")
            self.send_header("Content-Length", str(len(body)))
            self.send_header("Cache-Control", "no-store")
            self.end_headers()
            self.wfile.write(body)
        elif path == "/remote/ping":
            self.send_json({"allocia": 1, "urls": urls})
        elif path == "/remote/events":
            peer = dict(p.split("=", 1) for p in query.split("&") if "=" in p).get("peer", "")
            if not PEER_RE.match(peer):
                self.send_error(400)
                return
            self.events(peer)
        else:
            self.send_error(404)

    def events(self, peer):
        q = queue.Queue()
        with lock:
            old = peers.get(peer)
            peers[peer] = {"presence": old["presence"] if old else {}, "updatedAt": now_ms(), "q": q}
        self.send_response(200)
        self.send_header("Content-Type", "text/event-stream")
        self.send_header("Cache-Control", "no-store")
        self.send_header("Connection", "keep-alive")
        self.end_headers()
        broadcast_peers()
        try:
            self.wfile.write(b"retry: 1000\n\n")
            self.wfile.flush()
            while True:
                try:
                    data = q.get(timeout=10)
                    self.wfile.write(b"data: " + data.encode() + b"\n\n")
                except queue.Empty:
                    self.wfile.write(b": ping\n\n")
                self.wfile.flush()
        except (BrokenPipeError, ConnectionResetError, OSError):
            pass
        finally:
            with lock:
                if peers.get(peer, {}).get("q") is q:
                    del peers[peer]
            broadcast_peers()

    def do_POST(self):
        try:
            n = int(self.headers.get("Content-Length", "0"))
            if n <= 0 or n > 8192:
                raise ValueError
            body = json.loads(self.rfile.read(n))
            peer = body.get("peer", "")
            if not isinstance(peer, str) or not PEER_RE.match(peer):
                raise ValueError
        except Exception:
            self.send_error(400)
            return
        if self.path == "/remote/presence":
            presence = body.get("presence")
            if isinstance(presence, dict):
                with lock:
                    if peer in peers:
                        peers[peer]["presence"] = presence
                        peers[peer]["updatedAt"] = now_ms()
                broadcast_peers()
            self.send_json({"ok": True})
        elif self.path == "/remote/emit":
            topic = body.get("topic")
            if topic == "nav":
                broadcast({"type": "emit", "topic": topic, "data": body.get("data"), "peer": peer})
            self.send_json({"ok": True})
        else:
            self.send_error(404)


def main():
    if not os.path.exists(DECK):
        sys.exit("No encuentro Allocia_Exposicion_final.html en " + HERE)
    server = None
    for port in range(8000, 8011):
        try:
            server = ThreadingHTTPServer(("0.0.0.0", port), Handler)
            break
        except OSError:
            continue
    if server is None:
        sys.exit("No hay ningún puerto libre entre 8000 y 8010.")
    server.daemon_threads = True
    port = server.server_address[1]
    urls.extend(f"http://{ip}:{port}" for ip in lan_ips())

    print()
    print("  Presentación de Allocia con control remoto")
    print("  ------------------------------------------")
    print(f"  En esta compu:     http://localhost:{port}")
    if urls:
        for u in urls:
            print(f"  En los teléfonos:  {u}")
    else:
        print("  No encontré la red wifi. Conectá la compu al wifi o al hotspot y volvé a abrirlo.")
    print()
    print("  Compu y teléfonos tienen que estar en la misma red (wifi o hotspot).")
    print("  Si macOS pregunta si python3 puede aceptar conexiones entrantes, tocá «Permitir».")
    print("  Para cerrar: Ctrl+C o cerrá esta ventana.")
    print()
    threading.Timer(0.8, lambda: webbrowser.open(f"http://localhost:{port}")).start()
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass


if __name__ == "__main__":
    main()
