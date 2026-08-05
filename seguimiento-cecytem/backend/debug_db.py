import sqlite3, json
conn = sqlite3.connect('db.sqlite3')
cur = conn.cursor()
cur.execute('SELECT id, username, rol, is_staff, is_superuser FROM autenticacion_usuario LIMIT 20')
rows = cur.fetchall()
print(json.dumps(rows, indent=2, ensure_ascii=False))
conn.close()
