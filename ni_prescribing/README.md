# NI GP Prescribing Explorer

Explore prescribing of different medicines by GP practice or HSC Trust area in
Northern Ireland, per capita.

## Data sources (Open Government Licence)

| Dataset | Source | Frequency |
|---------|--------|-----------|
| [GP Prescribing Data](https://www.opendatani.gov.uk/dataset/gp-prescribing-data) | BSO via OpenDataNI | Monthly (from Apr 2013) |
| [GP Practice List Sizes](https://www.opendatani.gov.uk/dataset/gp-practice-list-sizes) | BSO via OpenDataNI | Quarterly |

The prescribing data contains ~450,000 rows per month: every medicine dispensed
at every GP practice, with item counts, quantities, and costs.

The practice list sizes map each of the ~305 GP practices to one of 5 HSC Trust
areas (via the Local Commissioning Group field) and provide the number of
registered patients.

## Quick start

```bash
pip install -r requirements.txt

# Download practice sizes + latest 3 months of prescribing data
python download_data.py --practices
python download_data.py --prescribing --latest 3

# Open the notebook
jupyter notebook explore_prescribing.ipynb
```

## Download options

```bash
# Full year of prescribing data
python download_data.py --prescribing --year 2024

# Specific month
python download_data.py --prescribing --year 2024 --month sep

# Everything (all months since 2013 — large download)
python download_data.py --all
```

## What you can explore

The notebook lets you:

- See the **top medicines** by items prescribed and by cost
- Compare **per-capita prescribing rates** across the 5 HSC Trust areas
- Drill into any **specific medicine** (e.g. Amoxicillin, Omeprazole, Atorvastatin)
- See **practice-level variation** — which practices prescribe more/less
- Filter by **BNF chapter** (cardiovascular, respiratory, CNS, etc.)
- **Search** for any medicine by name

## Using the Python module directly

```python
from analyse import (
    load_practice_list,
    load_prescribing,
    merge_with_practice_list,
    prescribing_per_capita_by_practice,
    prescribing_per_capita_by_trust,
)

practices = load_practice_list()
rx = load_prescribing(year=2024)
merged = merge_with_practice_list(rx, practices)

# Per-capita prescribing of Amoxicillin by Trust
prescribing_per_capita_by_trust(merged, medicine_filter="Amoxicillin")

# Per-capita prescribing by practice
prescribing_per_capita_by_practice(merged, medicine_filter="Omeprazole")
```

## Trust areas

Northern Ireland has 5 Health & Social Care Trusts, which map directly from the
Local Commissioning Group (LCG) field in the practice data:

| LCG | Trust |
|-----|-------|
| Belfast | Belfast HSC Trust |
| South Eastern | South Eastern HSC Trust |
| Northern | Northern HSC Trust |
| Southern | Southern HSC Trust |
| Western | Western HSC Trust |
