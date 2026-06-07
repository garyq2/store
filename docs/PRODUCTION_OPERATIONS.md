# Store — Production Operations Roadmap

> How to run a **real business** on this infrastructure, not just the storefront demo.
> Companion to DESIGN.md / ERPNEXT_DEPLOYMENT_REQUIREMENTS.md. Last updated 2026-06-07.

## Mental model: two halves
- **Storefront** = the **sales channel**. Only ever: read catalog, create a Sales Order,
  take payment. (This repo.)
- **ERPNext back-office** = the **actual business**: purchasing, inventory, fulfillment,
  invoicing, accounting, returns, reporting. (Operated in ERPNext; source of truth.)

The storefront never "owns" business data — ERPNext does. Maturing operations = maturing
the ERPNext side; it does not change the storefront.

## The inventory lifecycle (procure → sell → account)
```
PROCURE                 STOCK IN            SELL                FULFILL            ACCOUNT
Supplier → Purchase  →  Purchase Receipt    Sales Order         Delivery Note      Sales Invoice
Order                   (+stock, +value)    (storefront)        (−stock)           → Payment Entry
                                                                                   → COGS / P&L
```
- **Stock enters** via Purchase Receipt (against a PO from a Supplier) → sets valuation.
- **Stock leaves** via Delivery Note (fulfillment of a Sales Order).
- The **storefront only creates the Sales Order**; everything else is ERPNext ops.

## Operational-readiness checklist (priority order)
1. **Accounting & tax**
   - Verify Company, fiscal year, Chart of Accounts (setup wizard seeds these).
   - Configure **US sales tax** — Item Tax Templates / Tax Rules, or a tax service
     (Stripe Tax / TaxJar) for nexus. (Open decision from DESIGN.md.)
2. **Warehouses & Stock Settings**
   - Model real locations (main, returns, per-site). Set the default warehouse.
   - Valuation method (FIFO or Moving Average); **Allow Negative Stock = OFF**;
     enable auto-reorder.
3. **Item master maturity**
   - Real SKUs, item groups (categories), UOMs, barcodes, **reorder level + reorder qty**,
     item defaults (default supplier/warehouse), tax category, images, variants.
   - Bulk load via **Data Import**.
4. **Suppliers & purchasing**
   - Create Suppliers; run PO → **Purchase Receipt** → Purchase Invoice (real stock-in +
     cost/valuation).
5. **Selling & fulfillment**
   - Sales Order (storefront) → **Delivery Note** (decrements stock) → Sales Invoice →
     Payment Entry. Decide how Delivery Notes are created (manual vs automated).
   - **Stock Reservation** (v14+) on Sales Orders to prevent overselling between order and
     delivery (production hardening).
6. **Opening balances** — Stock Reconciliation to set real on-hand quantities + valuation.
7. **Returns** — Sales Return (return Delivery Note) + Credit Note.
8. **Users & roles** — stop operating as Administrator; create staff users with least-
   privilege roles.
9. **Reporting** — Stock Ledger, Stock Balance, Sales Analytics, Accounts Receivable, P&L.

## Production-hardening — MANDATORY before real data / real money
These graduate from "later" to "blocker" once real business data is at stake:
- **MariaDB off NFS → iSCSI block storage.** DB-on-NFS is fine for testing, NOT for the
  real ledger. (Migration plan in deploy README — Talos iscsi-tools extension +
  democratic-csi iSCSI StorageClass; `mariadb-dump` → restore on iSCSI.)
- **Backups + tested restore** of the ERPNext DB; a documented DR plan. (ERPNext scheduled
  backups + offsite copy.)
- **Payments** (storefront Step 2 / Stripe) — the "right before selling" item.
- **Tax engine** decision (native ERPNext vs Stripe Tax / TaxJar) for US sales tax.
- **Storefront hosting (4b)** — Vercel vs in-cluster; if Vercel, expose only the ERPNext
  API externally (locked down), not the whole ERP.
- **Supply-chain re-scan cadence** (CI gate already in place) + Frappe security advisories.

## Storefront build status (the sales channel)
- ✅ Catalog (read) live against ERPNext · ✅ Cart · ✅ GitOps-deployed ERPNext + seed
- ▶ **Step 1: checkout → draft Sales Order** (in progress)
- ⏸ **Step 2: Stripe payment** → submit SO + Payment Entry (deferred to pre-launch)
- ⏭ Storefront in-cluster deploy (4b / option C)

## How the two tracks run
- **Build track** (storefront repo): checkout → payment → in-cluster deploy.
- **Ops track** (ERPNext): the checklist above — matured incrementally as you learn the
  modules. Neither blocks the other; the storefront only ever needs ERPNext's catalog +
  Sales Order API.
