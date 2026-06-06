#!/usr/bin/env bash
# ============================================================
# SISTEMA BRITOS – Ejemplos de uso de la API
# Reemplazar TOKEN con el JWT obtenido en /login
# ============================================================

BASE="http://localhost:3000/api"
TOKEN=""

# ------------------------------------------------------------
# HEALTH CHECK
# ------------------------------------------------------------
curl -s "$BASE/../health" | jq

# ------------------------------------------------------------
# AUTH – Login
# ------------------------------------------------------------
curl -s -X POST "$BASE/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"Admin1234!"}' | jq

# Guardar token (bash):
# TOKEN=$(curl -s -X POST "$BASE/auth/login" \
#   -H "Content-Type: application/json" \
#   -d '{"username":"admin","password":"Admin1234!"}' | jq -r '.data.token')

# ------------------------------------------------------------
# USUARIOS – Crear
# ------------------------------------------------------------
curl -s -X POST "$BASE/usuarios" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "username":  "mbritos",
    "password":  "Segura#2024",
    "full_name": "María Britos",
    "email":     "maria@sistemabitos.com",
    "role_id":   2
  }' | jq

# ------------------------------------------------------------
# USUARIOS – Listar (con paginación)
# ------------------------------------------------------------
curl -s "$BASE/usuarios?page=1&limit=10&activo=true" \
  -H "Authorization: Bearer $TOKEN" | jq

# ------------------------------------------------------------
# USUARIOS – Obtener por ID
# ------------------------------------------------------------
curl -s "$BASE/usuarios/1" \
  -H "Authorization: Bearer $TOKEN" | jq

# ------------------------------------------------------------
# USUARIOS – Editar
# ------------------------------------------------------------
curl -s -X PUT "$BASE/usuarios/2" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"full_name":"María Britos Actualizado","role_id":3}' | jq

# ------------------------------------------------------------
# USUARIOS – Desactivar / Activar
# ------------------------------------------------------------
curl -s -X PATCH "$BASE/usuarios/2/desactivar" \
  -H "Authorization: Bearer $TOKEN" | jq

curl -s -X PATCH "$BASE/usuarios/2/activar" \
  -H "Authorization: Bearer $TOKEN" | jq

# ------------------------------------------------------------
# ROLES – Listar
# ------------------------------------------------------------
curl -s "$BASE/roles" \
  -H "Authorization: Bearer $TOKEN" | jq

# ------------------------------------------------------------
# ROLES – Obtener con permisos
# ------------------------------------------------------------
curl -s "$BASE/roles/1" \
  -H "Authorization: Bearer $TOKEN" | jq

# ------------------------------------------------------------
# PERMISOS – Listar
# ------------------------------------------------------------
curl -s "$BASE/permisos" \
  -H "Authorization: Bearer $TOKEN" | jq
