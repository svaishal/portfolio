#!/bin/bash

BASE_URL="http://localhost:4322"
echo "Starting Security Audit on $BASE_URL..."
echo "========================================"

# Function to check HTTP status
check_status() {
  url=$1
  expected=$2
  name=$3
  
  status=$(curl -o /dev/null -s -w "%{http_code}\n" "$url")
  
  if [ "$status" == "$expected" ]; then
    echo "✅ [PASS] $name: Got $status"
  else
    echo "❌ [FAIL] $name: Expected $expected, Got $status"
    # Dump headers for debugging
    curl -I -s "$url" | head -n 5
  fi
}

# Function to check redirect location
check_redirect() {
  url=$1
  name=$2
  
  # curl -I shows headers. We look for "Location"
  location=$(curl -s -I "$url" | grep -i "location:" | awk '{print $2}' | tr -d '\r')
  
  if [[ "$location" == *"/admin"* && "$location" != *"/admin/dashboard"* ]]; then
     # Use looser check: if it redirects to /admin or login page
     echo "✅ [PASS] $name: Redirects to $location"
  elif [[ "$location" == *"login"* ]]; then
     echo "✅ [PASS] $name: Redirects to $location"
  else
     echo "❌ [FAIL] $name: Redirected to '$location' (Expected login/admin root)"
  fi
}

# 1. ADMIN ROUTE PROTECTION
echo ""
echo "Testing Admin Route Protection..."
# Access /admin - should render login page (200) or redirect (302) if it was a protected sub-route
# Wait, /admin IS the login page. /admin/dashboard is protected.
check_status "$BASE_URL/admin" "200" "/admin (Login Page)"
# /admin/dashboard without cookies -> 302
check_status "$BASE_URL/admin/dashboard" "302" "/admin/dashboard (Unauth)"
check_redirect "$BASE_URL/admin/dashboard" "/admin/dashboard Redirect"

# 2. SECURITY HEADERS
echo ""
echo "Testing Security Headers..."
headers=$(curl -s -I "$BASE_URL")
if echo "$headers" | grep -q "X-Frame-Options: DENY"; then
  echo "✅ [PASS] X-Frame-Options: DENY found"
else
  echo "❌ [FAIL] X-Frame-Options missing or incorrect"
fi

if echo "$headers" | grep -q "X-Content-Type-Options: nosniff"; then
  echo "✅ [PASS] X-Content-Type-Options: nosniff found"
else
  echo "❌ [FAIL] X-Content-Type-Options missing"
fi

# 3. DOTFILE EXPOSURE
echo ""
echo "Testing Dotfile Exposure..."
check_status "$BASE_URL/.env" "404" ".env Access"
check_status "$BASE_URL/.git/config" "404" ".git Access"

# 4. CONTACT FORM RATE LIMITING
echo ""
echo "Testing Contact Form Rate Limiting..."
# Send 6 requests
for i in {1..6}; do
  response=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE_URL/api/contact" \
    -H "Content-Type: application/json" \
    -d '{"name":"Audit","email":"audit@test.com","subject":"Audit","message":"test","turnstileToken":"dummy"}')
  
  echo "Request $i: $response"
done
# We expect the last one (or after 5) to be 429
