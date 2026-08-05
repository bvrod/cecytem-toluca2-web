#!/usr/bin/env python3
"""
Simple tool to diagnose/create AsignacionDocente in production API.
Usage (PowerShell):
  $env:TOKEN='<TOKEN>'
  python tools\assign_check.py list
  python tools\assign_check.py list-materias
  python tools\assign_check.py list-grupos
  python tools\assign_check.py assign --docente 5acd15c-... --materia 123 --grupo 45
  python tools\assign_check.py patch --docente 5acd15c-...

It reads TOKEN from the environment variable `TOKEN` and BASE_URL from `BASE_URL` (default https://cecytem-toluca2-web.onrender.com/api)
"""
import os
import sys
import requests
import argparse
import json

BASE = os.environ.get('BASE_URL', 'https://cecytem-toluca2-web.onrender.com/api')
TOKEN = os.environ.get('TOKEN')

if not TOKEN:
    print('ERROR: Set TOKEN env var first. Example: $env:TOKEN = "<TOKEN>"', file=sys.stderr)
    sys.exit(2)

HEADERS = {
    'Authorization': f'Bearer {TOKEN}',
    'Content-Type': 'application/json'
}

session = requests.Session()
session.headers.update(HEADERS)

def pretty(resp):
    try:
        return json.dumps(resp.json(), indent=2, ensure_ascii=False)
    except Exception:
        return resp.text


def list_docentes():
    r = session.get(f"{BASE}/auth/usuarios/?rol=DOCENTE")
    print('STATUS', r.status_code)
    print(pretty(r))


def list_materias():
    r = session.get(f"{BASE}/academico/materias/")
    print('STATUS', r.status_code)
    print(pretty(r))


def list_grupos():
    r = session.get(f"{BASE}/academico/grupos/")
    print('STATUS', r.status_code)
    print(pretty(r))


def patch_docente(docente_uuid):
    payload = {"rol":"DOCENTE","is_staff":True}
    r = session.patch(f"{BASE}/auth/usuarios/{docente_uuid}/", json=payload)
    print('PATCH STATUS', r.status_code)
    print(pretty(r))


def try_assign(docente_uuid, materia_id, grupo_id):
    payload = {"docente": docente_uuid, "materia": materia_id, "grupo": grupo_id}
    r = session.post(f"{BASE}/seguimiento/asignaciones/", json=payload)
    print('POST STATUS', r.status_code)
    print(pretty(r))


if __name__ == '__main__':
    ap = argparse.ArgumentParser()
    sub = ap.add_subparsers(dest='cmd')
    sub.add_parser('list')
    sub.add_parser('list-materias')
    sub.add_parser('list-grupos')
    p_assign = sub.add_parser('assign')
    p_assign.add_argument('--docente', required=True)
    p_assign.add_argument('--materia', required=True, type=int)
    p_assign.add_argument('--grupo', required=True, type=int)
    p_patch = sub.add_parser('patch')
    p_patch.add_argument('--docente', required=True)

    args = ap.parse_args()
    if args.cmd == 'list':
        list_docentes()
    elif args.cmd == 'list-materias':
        list_materias()
    elif args.cmd == 'list-grupos':
        list_grupos()
    elif args.cmd == 'assign':
        try_assign(args.docente, args.materia, args.grupo)
    elif args.cmd == 'patch':
        patch_docente(args.docente)
    else:
        ap.print_help()
