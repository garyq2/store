# Supply-chain scan — ERPNext image set

Tools: trivy 0.71.0, syft, grype.
Scanners: vuln + secret + misconfig. SBOM: SPDX (syft). Cross-check: grype.
**Gate:** FAIL if any image has a *fixable* CRITICAL/HIGH vuln (a patched version exists).
Unfixable CRITICAL/HIGH are reported but don't fail the gate (nothing to upgrade to yet).

| Image | Digest (sha256) | CRIT | HIGH | fixable C/H | Secrets | Misconfig | Gate |
|---|---|---|---|---|---|---|---|
| `frappe/erpnext:v16.21.1` | e1479ded7bfd78cd | 21 | 138 | **78** | 0 | 7 | FAIL |
| `mariadb:10.6` | daacc2f260f8ec99 | 1 | 14 | **15** | 0 | 0 | FAIL |
| `docker.io/valkey/valkey:7.2` | 58ebdd9f48205e2d | 2 | 7 | **1** | 0 | 0 | FAIL |
| `busybox:latest` | fd8d9aa63ba2f098 | 0 | 0 | **0** | 0 | 0 | PASS |

## Overall gate: **FAIL**

Artifacts: per-image Trivy JSON+table in `reports/`, SPDX SBOMs in `sbom/`, Grype cross-check JSON in `reports/`.
