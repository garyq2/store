#!/usr/bin/env bash
# ---------------------------------------------------------------------------
# Supply-chain scan + gate for the ERPNext image set. Run locally or in CI.
# Images are pinned BY DIGEST = exactly what was verified on 2026-06-04.
#
# Produces:
#   sbom/    SPDX SBOM per image (syft)
#   reports/ SARIF (for GitHub Security tab) + a CRITICAL/HIGH table per image
#
# GATE (env var):
#   full     (default) FAIL on a secret OR any *fixable* CRITICAL/HIGH
#                      vuln not accepted in .trivyignore. Use for code you control.
#   secrets            FAIL only on secrets. Use for vendor images you can't patch —
#                      CVEs are still recorded (SARIF/SBOM) but don't block the pipeline.
#
# Requires: trivy, syft on PATH.
# ---------------------------------------------------------------------------
set -uo pipefail
cd "$(dirname "$0")"
GATE="${GATE:-full}"

IMAGES=(
  "frappe/erpnext@sha256:e1479ded7bfd78cd76015e62da703311a50c16ecca0ef381e851cfa52f0aab16"
  "mariadb@sha256:daacc2f260f8ec999daa5e03a017a23a7e6fa3fb982aaf26e8b72f24daf03bc9"
  "valkey/valkey@sha256:58ebdd9f48205e2d8ecceb83e4da6d639c1d5b2c8469882e94e56a4487e7089f"
  "busybox@sha256:fd8d9aa63ba2f0982b5304e1ee8d3b90a210bc1ffb5314d980eb6962f1a9715d"
)

mkdir -p reports sbom
rc=0
echo "supply-chain gate: mode=$GATE, ${#IMAGES[@]} images"

for IMG in "${IMAGES[@]}"; do
  name=$(echo "$IMG" | sed -E 's#[/@:]+#_#g')
  echo "::group::scan $IMG"

  # inventory + machine-readable report
  syft -q "$IMG" -o "spdx-json=sbom/${name}.spdx.json" || true
  trivy image --quiet --scanners vuln,secret,misconfig --format sarif \
    -o "reports/${name}.sarif" "$IMG" || true
  # human-readable record (actionable only)
  trivy image --quiet --scanners vuln,secret,misconfig --ignore-unfixed \
    --severity CRITICAL,HIGH --format table "$IMG" | tee "reports/${name}.txt" || true

  # GATE: secrets always block
  if ! trivy image --quiet --scanners secret --exit-code 1 "$IMG" >/dev/null 2>&1; then
    echo "‼️  secret detected in $IMG"; rc=1
  fi
  # GATE: fixable CRITICAL/HIGH block in full mode (triage/accept via .trivyignore)
  if [ "$GATE" = "full" ]; then
    if ! trivy image --quiet --scanners vuln --ignore-unfixed --severity CRITICAL,HIGH \
        --ignorefile .trivyignore --exit-code 1 "$IMG" >/dev/null 2>&1; then
      echo "‼️  fixable CRITICAL/HIGH in $IMG (fix: upgrade tag, or accept in .trivyignore)"; rc=1
    fi
  fi
  echo "::endgroup::"
done

if [ $rc -eq 0 ]; then echo "✅ supply-chain gate PASSED (mode=$GATE)"
else echo "❌ supply-chain gate FAILED (mode=$GATE)"; fi
exit $rc
