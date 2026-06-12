import urllib.request

sheet_id = "1qxIFdazctBZGFSeUAShxy9jNYEFXDKbvLDfgNcWpA_c"

url = f"https://docs.google.com/spreadsheets/d/{sheet_id}/export?format=csv"

contenido = urllib.request.urlopen(url).read().decode("utf-8")

print(contenido[:1000])