# Supply-chain scan — analysis & verdict (2026-06-04)

Companion to `SCAN_SUMMARY.md` (raw counts) and the per-image reports/SBOMs.

## Verdict
**Gate: FAIL (fixable CRITICAL/HIGH present) — but this is the expected, normal result
for upstream application images, and nothing here indicates malicious code or tampering.**

Two integrity wins worth stating plainly:
- **Secrets = 0** across all four images — no credentials/keys baked into any layer.
- **Digest match** — `frappe/erpnext:v16.21.1` resolved to `sha256:e1479ded…`, identical to
  the digest pinned in the HelmRelease. What we scanned == what will deploy.

The scan did its job: full SBOM inventory, known-CVE visibility, secret/misconfig check,
and an integrity anchor (digest). It is **not** a malware detector (see §"What this proves").

## What the 78 "fixable" ERPNext findings actually are
Breakdown of fixable CRITICAL/HIGH by component type:
- **gobinary: 40** — Go *stdlib* CVEs in Go binaries bundled into the image. "Fixed
  version" = recompile with a newer Go. We can't patch these; **upstream (Frappe) must
  rebuild**. Most are reachable only via specific functions/network paths the tool can't
  rule out, so counts overstate real risk.
- **node-pkg: 33** — npm packages compiled into the frontend bundle (e.g. loader-utils).
  Also **upstream-controlled** (build-time deps).
- **debian: 5** — OS packages (e.g. `libgnutls30` → CVE-2026-33845/42010). Fixable by an
  `apt upgrade` / base-image rebuild.

Net: the "fixable" count is real but **mostly not fixable *by us*** without rebuilding the
vendor image — it's upstream's to address in the next patch release.

## Misconfigurations (7 on ERPNext)
- **HIGH `DS-0002` image user is root** → already mitigated: our HelmRelease sets
  `securityContext.runAsUser: 1000 / runAsNonRoot: true`, so it runs **non-root** at runtime.
- HIGH `DS-0021`/`DS-0029` (apt-get hygiene) + LOW `DS-0014`/`DS-0026` (curl/wget, no
  HEALTHCHECK) — Dockerfile-quality nits, not exploitable on their own.

## What this proves toward "no malicious code" (and what it doesn't)
- ✅ Complete inventory (SBOM), known-CVE exposure mapped, **no secrets**, **no integrity
  drift** vs the pinned digest.
- ❌ Does **not** prove the absence of a hidden/bespoke backdoor — scanners match known
  signatures, not novel intent. That assurance comes from the rest of the stack:
  official-image provenance + digest pinning (done), no unvetted third-party Frappe apps,
  and **runtime containment** (NetworkPolicies + non-root + recommended tight egress).

## Recommended posture (this is a vendor image we don't build)
1. **Pin the digest** (done) — deploy exactly what was scanned.
2. **Run non-root + NetworkPolicies** (done) — add tight **egress** policy so a compromised
   pod can't phone home; this is the real mitigation for unfixable CVEs.
3. **Re-scan on every ERPNext upgrade**, and prefer the newest patch tag (upstream rebuilds
   reduce the gobinary/node-pkg counts). Wire this scan into CI as a gate.
4. **Optional (compliance):** rebuild the ERPNext image on a patched base to clear the 5
   Debian OS CVEs, if a policy requires a clean OS layer.
5. Subscribe to Frappe security advisories; track the digest in the repo.

## Decision
The FAIL gate is **informational, not a blocker** for a homelab/SME deploy: there are no
secrets, no tampering, and the high-severity misconfig (root) is already overridden. Proceed
with deploy under containment; treat the CVE list as an upgrade-cadence backlog, not a stop.
For a stricter posture, rebuild the image or wait for an upstream patch release before go-live.
