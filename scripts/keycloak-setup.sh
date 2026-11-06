#!/usr/bin/env bash
# Creates the hlu realm, hlu-server client, and a test user against a local Keycloak.
set -euo pipefail

KEYCLOAK_URL="${KEYCLOAK_URL:-http://localhost:3100}"
ADMIN_USER="${KEYCLOAK_ADMIN_USER:-admin}"
ADMIN_PASSWORD="${KEYCLOAK_ADMIN_PASSWORD:-admin}"
REALM="${KEYCLOAK_REALM:-hlu}"
CLIENT_ID="${KEYCLOAK_CLIENT_ID:-hlu-server}"
CLIENT_SECRET="${KEYCLOAK_CLIENT_SECRET:-hlu-server-dev-secret}"
TEST_USER="${KEYCLOAK_TEST_USER:-test}"
TEST_PASSWORD="${KEYCLOAK_TEST_PASSWORD:-test}"

echo "Keycloak: $KEYCLOAK_URL"

TOKEN="$(curl -sf -X POST "$KEYCLOAK_URL/realms/master/protocol/openid-connect/token" \
  -d "client_id=admin-cli&username=$ADMIN_USER&password=$ADMIN_PASSWORD&grant_type=password" \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['access_token'])")"

auth=(-H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json")

if curl -sf "${auth[@]}" "$KEYCLOAK_URL/admin/realms/$REALM" >/dev/null 2>&1; then
  echo "Realm '$REALM' already exists"
else
  curl -sf "${auth[@]}" -X POST "$KEYCLOAK_URL/admin/realms" \
    -d "{\"realm\":\"$REALM\",\"enabled\":true,\"loginWithEmailAllowed\":true,\"bruteForceProtected\":true}"
  echo "Created realm '$REALM'"
fi

CLIENT_EXISTS="$(curl -sf "${auth[@]}" "$KEYCLOAK_URL/admin/realms/$REALM/clients?clientId=$CLIENT_ID" \
  | python3 -c "import sys,json; print(len(json.load(sys.stdin)) > 0)")"

REDIRECT_URIS_JSON='["http://localhost:3300/*","http://localhost:5191/*","http://localhost:5192/*","http://localhost:5191/ui/hlu/auth/callback","http://localhost:5192/ui/hluwork/auth/callback"]'
WEB_ORIGINS_JSON='["http://localhost:3300","http://localhost:5191","http://localhost:5192","+"]'

if [[ "$CLIENT_EXISTS" == "True" ]]; then
  echo "Client '$CLIENT_ID' already exists — enabling Standard Flow + redirect URIs"
  CLIENT_UUID="$(curl -sf "${auth[@]}" "$KEYCLOAK_URL/admin/realms/$REALM/clients?clientId=$CLIENT_ID" \
    | python3 -c "import sys,json; print(json.load(sys.stdin)[0]['id'])")"
  UPDATED="$(curl -sf "${auth[@]}" "$KEYCLOAK_URL/admin/realms/$REALM/clients/$CLIENT_UUID" \
    | python3 -c "
import sys, json
c = json.load(sys.stdin)
c['publicClient'] = False
c['secret'] = '''$CLIENT_SECRET'''
c['directAccessGrantsEnabled'] = False
c['standardFlowEnabled'] = True
c['redirectUris'] = json.loads('''$REDIRECT_URIS_JSON''')
c['webOrigins'] = json.loads('''$WEB_ORIGINS_JSON''')
print(json.dumps(c))
")"
  curl -sf "${auth[@]}" -X PUT "$KEYCLOAK_URL/admin/realms/$REALM/clients/$CLIENT_UUID" -d "$UPDATED"
else
  curl -sf "${auth[@]}" -X POST "$KEYCLOAK_URL/admin/realms/$REALM/clients" \
    -d "{
      \"clientId\": \"$CLIENT_ID\",
      \"name\": \"HLU Server\",
      \"enabled\": true,
      \"publicClient\": false,
      \"secret\": \"$CLIENT_SECRET\",
      \"directAccessGrantsEnabled\": false,
      \"standardFlowEnabled\": true,
      \"redirectUris\": $REDIRECT_URIS_JSON,
      \"webOrigins\": $WEB_ORIGINS_JSON
    }"
  echo "Created client '$CLIENT_ID'"
fi

USER_COUNT="$(curl -sf "${auth[@]}" "$KEYCLOAK_URL/admin/realms/$REALM/users?username=$TEST_USER&exact=true" \
  | python3 -c "import sys,json; print(len(json.load(sys.stdin)))")"

if [[ "$USER_COUNT" != "0" ]]; then
  echo "User '$TEST_USER' already exists"
else
  curl -sf "${auth[@]}" -X POST "$KEYCLOAK_URL/admin/realms/$REALM/users" \
    -d "{
      \"username\": \"$TEST_USER\",
      \"enabled\": true,
      \"email\": \"$TEST_USER@hlu.local\",
      \"emailVerified\": true,
      \"firstName\": \"Test\",
      \"lastName\": \"User\"
    }"
  USER_ID="$(curl -sf "${auth[@]}" "$KEYCLOAK_URL/admin/realms/$REALM/users?username=$TEST_USER&exact=true" \
    | python3 -c "import sys,json; print(json.load(sys.stdin)[0]['id'])")"
  curl -sf "${auth[@]}" -X PUT "$KEYCLOAK_URL/admin/realms/$REALM/users/$USER_ID/reset-password" \
    -d "{\"type\":\"password\",\"value\":\"$TEST_PASSWORD\",\"temporary\":false}"
  echo "Created user '$TEST_USER' / '$TEST_PASSWORD'"
fi

# Smoke-check that the authorize endpoint is reachable (browser login + MFA live there).
HTTP_CODE="$(curl -s -o /dev/null -w '%{http_code}' \
  "$KEYCLOAK_URL/realms/$REALM/protocol/openid-connect/auth?client_id=$CLIENT_ID&response_type=code&scope=openid&redirect_uri=http://localhost:5192/ui/hluwork/auth/callback")"
if [[ "$HTTP_CODE" != "200" && "$HTTP_CODE" != "302" ]]; then
  echo "Authorize endpoint check failed (HTTP $HTTP_CODE)" >&2
  exit 1
fi
echo "Standard Flow authorize endpoint OK (HTTP $HTTP_CODE)"

echo "Done."
