# ERPNext on home-ops (Talos) — Exact Requirements

> What the cluster must provide for me to deploy ERPNext, and why. Tailored to
> `garyq2/home-ops` (verified 2026-06-04). Companion to the Store project.

## Already satisfied — no action (accounted for)
| Need | Why | Provided by |
|---|---|---|
| **RWX** volume for ERPNext `sites/` | Shared by web + workers + scheduler pods | `truenas-nfs` (default, RWX) ✓ |
| NetworkPolicy enforcement | Isolate DB/Redis; only BFF reaches API | Cilium CNI ✓ |
| TLS certs | HTTPS for API/admin | cert-manager `letsencrypt-production` + wildcard cert on gateways ✓ |
| Ingress | Expose the ERPNext endpoint | Envoy Gateway (class `envoy`): internal `10.10.0.101`, external `10.10.0.103` ✓ |
| DNS | Resolve the hostname | external-dns + k8s-gateway on `${SECRET_DOMAIN}` ✓ |
| LB IP | Service IP if needed | Cilium LB IPAM ✓ |
| Secret encryption | GitOps-safe creds | SOPS + age (`age1hq0…`) ✓ |

## I NEED from you (with why)

### 1. Block (RWO) storage for MariaDB — THE gate
**Why:** ERPNext's DB is write-heavy; InnoDB over NFS risks locking/perf problems and,
worst case, corruption. NFS is fine for `sites/`, **not** for the database.
Pick one:
- **(Preferred) Add iSCSI** — gives proper block storage, reusable for future stateful apps:
  1. Talos schematic + `siderolabs/iscsi-tools` and `siderolabs/util-linux-tools`; update
     `talosImageURL`; rolling `talosctl upgrade` cp1→cp2→cp3→w1.
  2. Second democratic-csi HelmRelease: driver `freenas-api-iscsi` + StorageClass
     `truenas-iscsi` (RWO), pointing at a TrueNAS iSCSI dataset/portal.
  3. OPNsense pass rule: k8slan → 192.168.3.3 on **:3260** (iSCSI), above the RFC1918 block.
- **OR external MariaDB** on a VM → give me host + credentials (ERPNext points at `dbHost`).
- **OR NFS-trial** → accept `truenas-nfs` for MariaDB now, migrate to block later (validation only).

→ *I can draft the Talos schematic change + the democratic-csi iSCSI HelmRelease/StorageClass
for you; you apply + do the rolling upgrade.*

### 2. A hostname + which Gateway
**Why:** the storefront BFF (and the ERPNext admin UI) need a stable HTTPS endpoint.
- Hostname: suggest `erp.${SECRET_DOMAIN}`.
- **Internal** gateway if the storefront runs in-cluster; **external** gateway (cloudflare-tunnel)
  if the storefront lives on Vercel / off-cluster.
- Confirm the literal value of `${SECRET_DOMAIN}` (it's a cluster-secret; I only see the var).

### 3. Secrets (you SOPS-encrypt with your age key)
**Why:** Frappe needs these at site creation; GitOps requires them encrypted.
- `mariadb-root-password`, `erpnext-db-password`, `erpnext-admin-password`.
- I provide a plaintext template; you run `sops -e` (you hold the age private key).

### 4. Two design confirmations
**Why:** they change the manifests (chart values, NetworkPolicies, gateway choice).
- **MariaDB + Redis in-cluster** (via the chart, needs the block class from #1) **or external**?
- **Storefront placement**: same Talos cluster, or stays on Vercel? (drives internal-vs-external
  gateway + the NetworkPolicy allowing the BFF → ERPNext API).

### 5. (Post-deploy, not a prereq) ERPNext API key/secret
**Why:** the BFF authenticates to ERPNext. Created in the ERPNext UI (User → API Access)
*after* it's running, then set as `ERPNEXT_API_KEY` / `ERPNEXT_API_SECRET` in the storefront
`.env.local` (and `STOREFRONT_USE_MOCK=false`).

## I will handle (no action from you)
- Frappe/ERPNext HelmRelease + Flux `ks.yaml` in your `kubernetes/apps/erpnext/` structure,
  **pinned image digests**.
- PVCs: `sites` → `truenas-nfs` (RWX); MariaDB → block class from #1.
- NetworkPolicies (DB/Redis reachable only by Frappe pods; only gateway/BFF reaches the API),
  PodSecurity, resource limits, site-creation Job, HTTPRoute on the chosen gateway.
- Supply-chain scan: **Trivy + SBOM (Syft)** on the pinned `frappe/erpnext` image — runs in the
  dev box, no cluster needed; fulfills the "no malicious code" requirement.

## Footprint
ERPNext (web + socketio + scheduler + 3 workers + MariaDB + 3 Redis) ≈ 4–6 GB RAM. Your
nodes have 31 GB — comfortable.
```
