# NHS Acute Trust Medical & Dental Staff Spend Analysis

## Overview

Analysis of medical and dental staff expenditure across NHS acute trusts in England, examining the breakdown between permanent (substantive), bank, and agency staff spending.

## Key Data Sources

1. **Trust Accounts Consolidation (TAC) Data** - Trust-level financial data published by NHS England
   - [TAC Data Publications](https://www.england.nhs.uk/financial-accounting-and-reporting/nhs-providers-tac-data-publications/)
   - Contains Note 7 staff costs by trust, split by permanent/other, with agency and bank lines

2. **Consolidated NHS Provider Accounts** - Aggregate accounts for all NHS providers
   - [2024/25](https://www.gov.uk/government/publications/consolidated-nhs-provider-accounts-2024-to-2025)
   - [2023/24](https://www.gov.uk/government/publications/consolidated-nhs-provider-accounts-annual-report-and-accounts-2023-to-2024)

3. **DHSC Evidence to DDRB** - Detailed medical & dental paybill analysis
   - [2026/27 pay round](https://www.gov.uk/government/publications/dhsc-evidence-for-the-ddrb-pay-round-2026-to-2027)
   - [2025/26 pay round](https://www.gov.uk/government/publications/dhsc-evidence-for-the-ddrb-pay-round-2025-to-2026)

4. **Supplementary Evidence to Pay Review Bodies** - HCHS staff cost estimates
   - [2025/26](https://www.gov.uk/government/publications/supplementary-evidence-to-pay-review-bodies-hospital-and-community-health-sector-2025-to-2026)

## Files

- `analysis.py` - Main analysis script: downloads TAC data, processes and analyses staff costs
- `aggregate_analysis.py` - Analysis using known aggregate data from published accounts
- `data/` - Directory for downloaded data files

## How to Run

```bash
# Install dependencies
pip install pandas openpyxl requests matplotlib tabulate

# Run the aggregate analysis (uses known published data)
python aggregate_analysis.py

# Run the TAC data analysis (requires network access to NHS England)
python analysis.py
```

## Key Findings

See `aggregate_analysis.py` output for detailed findings, including:
- Medical & dental agency spend fell from £1.15bn (2022/23) to £1.13bn (2023/24)
- Medical & dental bank spend surged from £902m (2019/20) to £1.9bn (2023/24) - up 114%
- Agency price caps have shifted temporary staffing from agency to bank, not into permanent roles
- Total agency spend across all staff groups fell from £3.5bn (2022/23) to ~£2.1bn (2024/25)
