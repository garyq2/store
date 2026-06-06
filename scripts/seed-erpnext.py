#!/usr/bin/env python3
"""
Seed ERPNext with the Store demo catalog — idempotent (safe to re-run).

Run from a machine that can REACH erp.actionable.site (e.g. on the LAN):

    export ERPNEXT_URL=https://erp.actionable.site
    export ERPNEXT_API_KEY=xxxx
    export ERPNEXT_API_SECRET=xxxx
    python3 seed-erpnext.py

Creates: Price Lists (Retail, Wholesale), Item Groups, Items (with opening stock),
Item Prices (retail + wholesale), and Website Items — mirroring the storefront mock.

NOTE: ERPNext's initial Setup Wizard must be complete first (a Company must exist),
otherwise Items/stock can't be created. The script checks and tells you if not.
Field names follow ERPNext v15/16; if your version rejects a field, paste the error.
"""
import json, os, sys, urllib.parse, urllib.request, urllib.error

URL = os.environ.get("ERPNEXT_URL", "").rstrip("/")
KEY = os.environ.get("ERPNEXT_API_KEY", "")
SEC = os.environ.get("ERPNEXT_API_SECRET", "")
if not (URL and KEY and SEC):
    sys.exit("Set ERPNEXT_URL, ERPNEXT_API_KEY, ERPNEXT_API_SECRET env vars first.")

HEAD = {"Authorization": f"token {KEY}:{SEC}",
        "Content-Type": "application/json", "Accept": "application/json"}
CURRENCY = "USD"

# (code, name, slug, group, retail_price, stock_qty, short_description)
PRODUCTS = [
    ("LIN-BLNK", "Linen Throw Blanket",  "linen-throw-blanket", "Home",    68, 22, "Stonewashed European linen throw, 130x170cm."),
    ("MUG-SET4", "Stoneware Mug Set",     "stoneware-mug-set",   "Kitchen", 42,  3, "Set of 4 hand-glazed stoneware mugs, 350ml."),
    ("TEE-LNG",  "Cotton Lounge Tee",     "cotton-lounge-tee",   "Apparel", 34, 48, "Relaxed organic-cotton tee, garment dyed."),
    ("BSK-WVN",  "Woven Storage Basket",  "woven-storage-basket","Home",    56, 15, "Handwoven seagrass basket with handles."),
    ("CNDL-SOY", "Soy Candle - Cedar",    "soy-candle-cedar",    "Home",    28, 60, "Hand-poured soy candle, cedar & amber, 50hr burn."),
    ("APRN-CHF", "Chef's Linen Apron",    "chefs-linen-apron",   "Kitchen", 48,  0, "Cross-back linen apron with pockets."),
    ("SOCK-WL",  "Merino Wool Socks",     "merino-wool-socks",   "Apparel", 22, 80, "Cushioned merino crew socks, 2-pack."),
    ("PLNT-POT", "Ceramic Plant Pot",     "ceramic-plant-pot",   "Home",    26,  9, "Matte ceramic pot with drainage tray, 16cm."),
]


def api(method, path, body=None):
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(URL + path, data=data, headers=HEAD, method=method)
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            return json.loads(r.read() or "{}")
    except urllib.error.HTTPError as e:
        raise RuntimeError(f"HTTP {e.code} on {method} {path}\n{e.read().decode()[:800]}")


def first(doctype, filters=None):
    params = {"limit_page_length": 1}
    if filters:
        params["filters"] = json.dumps(filters)
    r = api("GET", f"/api/resource/{urllib.parse.quote(doctype)}?{urllib.parse.urlencode(params)}")
    d = r.get("data") or []
    return d[0]["name"] if d else None


def exists(doctype, name):
    try:
        api("GET", f"/api/resource/{urllib.parse.quote(doctype)}/{urllib.parse.quote(str(name))}")
        return True
    except RuntimeError:
        return False


def ensure(doctype, name, doc):
    if exists(doctype, name):
        print(f"  = {doctype}: {name}")
        return
    api("POST", f"/api/resource/{urllib.parse.quote(doctype)}", doc)
    print(f"  + {doctype}: {name}")


def main():
    # --- preconditions ---
    who = api("GET", "/api/method/frappe.auth.get_logged_user").get("message")
    print(f"Authenticated as: {who}")
    company = first("Company")
    if not company:
        sys.exit("No Company found — complete the ERPNext Setup Wizard first (Company + USD).")
    warehouse = first("Warehouse", {"is_group": 0, "company": company}) or first("Warehouse", {"is_group": 0})
    print(f"Company: {company} | Warehouse: {warehouse}")

    # --- price lists ---
    print("Price Lists:")
    for pl in ("Retail", "Wholesale"):
        ensure("Price List", pl, {"price_list_name": pl, "selling": 1, "currency": CURRENCY})

    # --- item groups ---
    print("Item Groups:")
    for g in sorted({p[3] for p in PRODUCTS}):
        ensure("Item Group", g, {"item_group_name": g, "parent_item_group": "All Item Groups", "is_group": 0})

    # --- items (with opening stock) ---
    print("Items:")
    for code, name, slug, group, retail, qty, short in PRODUCTS:
        doc = {
            "item_code": code, "item_name": name, "item_group": group,
            "stock_uom": "Nos", "is_stock_item": 1, "is_sales_item": 1,
            "description": short,
            "item_defaults": [{"company": company, "default_warehouse": warehouse}],
        }
        if qty > 0 and warehouse:
            doc["opening_stock"] = qty
            doc["valuation_rate"] = round(retail * 0.5, 2)  # nominal cost
        ensure("Item", code, doc)

    # --- item prices (retail + wholesale) ---
    print("Item Prices:")
    for code, name, slug, group, retail, qty, short in PRODUCTS:
        for pl, rate in (("Retail", retail), ("Wholesale", round(retail * 0.75, 2))):
            found = first("Item Price", {"item_code": code, "price_list": pl})
            if found:
                print(f"  = Item Price: {code}@{pl}")
                continue
            api("POST", f"/api/resource/{urllib.parse.quote('Item Price')}",
                {"item_code": code, "price_list": pl, "price_list_rate": rate,
                 "currency": CURRENCY, "selling": 1})
            print(f"  + Item Price: {code}@{pl} = {rate}")

    # NOTE: "Website Item" lives in ERPNext's separate `webshop` app (removed from core in
    # v14) and is intentionally NOT used. This storefront is headless and reads ERPNext
    # `Item` directly. Products + prices above are the catalog.
    print("\nDone. Products + prices created. (Set stock in ERPNext: Stock > Stock Entry.)")


if __name__ == "__main__":
    try:
        main()
    except RuntimeError as e:
        sys.exit(str(e))
