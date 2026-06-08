# East-West: Storefront ↔ ERPNext (in-cluster)

> Shared decision record for both the storefront and home-ops/cluster sessions.
> Status: **decided + implemented** (2026-06-08). Approach **A** (internal Service).

## Decision
The in-cluster storefront reaches ERPNext over the **internal Kubernetes Service**, plain HTTP:
```
ERPNEXT_URL = http://erpnext.erpnext.svc.cluster.local:8080
```
**No** public hostname for east-west, **no** TLS internally, and **no CoreDNS edits.** This is
the onedr0p cluster-template–endorsed pattern (Discussions **#1085** "intra-cluster DNS for
ingress hosts" and **#719** "internal DNS"): east-west uses cluster Service DNS; CoreDNS is
left stock; split-DNS → k8s-gateway is OPNsense's job, for the **browser / kubectl / vip**
cases only — the storefront does not depend on it.

## The two paths
```
Customers (browser) ─HTTPS─► envoy-internal gateway (shop/erp.actionable.site, .101) ─► pods
Storefront SSR (east-west) ─HTTP─► erpnext.erpnext.svc.cluster.local:8080  (no gateway)
```

## Components
| Piece | Value | Owner |
|---|---|---|
| Storefront SSR target | `http://erpnext.erpnext.svc.cluster.local:8080` (env `ERPNEXT_URL`) | storefront |
| ERPNext nginx **Service** | name **`erpnext`**, ns `erpnext`, port `8080`, plain HTTP | erpnext |
| Frappe site routing | `default_site = erp.actionable.site` (so Host `erpnext.erpnext.svc` falls back to the site) | erpnext |
| Store egress NetworkPolicy | allow DNS (kube-system:53) + **erpnext ns:8080** | storefront |
| ERPNext ingress NetworkPolicy | `allow-gateway-to-web` permits **`network` + `store`** ns → erpnext-nginx:8080 | erpnext |
| CoreDNS | **unchanged** (no-op) | — |

## ⚠️ The one non-declarative piece: `default_site`
`default_site` is set imperatively and lives on the **sites PVC**, not in git:
```bash
kubectl -n erpnext exec deploy/erpnext-gunicorn -- bench set-config -g default_site erp.actionable.site
kubectl -n erpnext rollout restart deploy/erpnext-gunicorn deploy/erpnext-nginx
```
**It will NOT survive a PVC rebuild / fresh `bench new-site`.** If the sites volume is recreated
(e.g., the MariaDB→iSCSI migration, or a disaster restore), **re-run the command above**, or the
east-west path breaks ("site not found") while the public-hostname path keeps working.
- **Hardening (recommended, erpnext owner):** make it declarative — check whether the frappe
  Helm chart can inject `default_site` into `common_site_config` via values (so Flux re-applies
  it). Until then, this command is part of the deploy runbook.

## Key facts that caused confusion (don't relitigate)
- The Service is **`erpnext`**, not `erpnext-nginx` (that's the Deployment/pods). A probe to
  `erpnext-nginx.*.svc` ENOTFOUNDs because the **name is wrong**, not because DNS is blocked.
- DNS egress was never the problem — the store policy already allows `:53` to kube-system
  (verified: `kubernetes.default` and `erpnext.erpnext.svc` → 10.43.x resolve from the pod).
- `erp.actionable.site` failing to resolve **inside** the cluster is expected and irrelevant —
  east-west doesn't use it.

## Local dev (orangepi) — different value on purpose
The `erpnext.erpnext.svc` name only resolves **inside** the cluster. For `npm run dev` on the
orangepi, keep `.env.local` at **`ERPNEXT_URL=https://erp.actionable.site`** (the public name).
Only the in-cluster Deployment uses the Service URL.

## Future-image track (not active yet)
`Item.image` is unset today (gradient fallbacks), so all ERPNext access is server-side. If/when
images are added, the storefront's `imageUrl()` builds **browser-facing** absolute URLs from
`ERPNEXT_URL` — which is now the *internal* name a browser can't reach. Before enabling images,
add a separate **`ERPNEXT_PUBLIC_URL=https://erp.actionable.site`** and have `imageUrl()` use it
for asset URLs, keeping `ERPNEXT_URL` (server fetches) on the internal Service.

## Rollback
Revert the three manifests (Deployment env + the two NetworkPolicies). The public-hostname path
is unaffected by any of this. CoreDNS was never touched, so nothing to roll back there.
