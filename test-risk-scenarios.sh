#!/bin/bash

# Risk Engine Testing Script
# Run this to test different risk scenarios

API_URL="http://localhost:3000"
TOKEN="your_jwt_token_here"

# Color codes for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo "🔐 Risk Engine Testing Script"
echo "=============================="
echo ""

# Function to make API call with risk headers
test_risk_scenario() {
  local scenario_name=$1
  local device_posture=$2
  local access_context=$3
  
  echo -e "${YELLOW}Testing: $scenario_name${NC}"
  echo "Device Posture: $device_posture"
  echo "Access Context: $access_context"
  echo ""
  
  curl -X GET "$API_URL/api/banking/dashboard" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -H "x-device-posture: $device_posture" \
    -H "x-access-context: $access_context" \
    -w "\nHTTP Status: %{http_code}\n" \
    -s | jq '.'
  
  echo ""
  echo "---"
  echo ""
}

# Test 1: Low Risk (Allow)
test_risk_scenario \
  "Low Risk (Allow - Score ~0)" \
  '{"diskEncrypted":true,"antivirus":true,"isJailbroken":false}' \
  '{"impossibleTravel":false,"country":"NG","ipReputation":95,"isVPN":false,"isTor":false}'

# Test 2: Medium Risk (MFA)
test_risk_scenario \
  "Medium Risk (MFA - Score ~0.45)" \
  '{"diskEncrypted":false,"antivirus":false,"isJailbroken":false}' \
  '{"impossibleTravel":false,"country":"CN","ipReputation":50,"isVPN":true,"isTor":false}'

# Test 3: Outside Work Hours (Evening)
test_risk_scenario \
  "Outside Work Hours - Evening (Score ~0.1)" \
  '{"diskEncrypted":true,"antivirus":true,"isJailbroken":false}' \
  '{"impossibleTravel":false,"country":"NG","ipReputation":90,"isVPN":false,"isTor":false,"accessTime":"2025-11-27T23:45:00Z"}'

# Test 4: High Risk (Block)
test_risk_scenario \
  "High Risk (Block - Score ~0.85)" \
  '{"diskEncrypted":false,"antivirus":false,"isJailbroken":true}' \
  '{"impossibleTravel":true,"country":"KP","ipReputation":20,"isVPN":true,"isTor":true}'

# Test 5: Jailbroken Device Only
test_risk_scenario \
  "Jailbroken Device Only (Score ~0.3)" \
  '{"diskEncrypted":true,"antivirus":true,"isJailbroken":true}' \
  '{"impossibleTravel":false,"country":"NG","ipReputation":95,"isVPN":false,"isTor":false}'

echo -e "${GREEN}✅ Testing complete!${NC}"
