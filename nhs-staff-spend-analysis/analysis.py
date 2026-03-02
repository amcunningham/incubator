#!/usr/bin/env python3
"""
NHS Trust-Level Staff Cost Analysis
====================================

Downloads and processes Trust Accounts Consolidation (TAC) data from NHS England
to analyse medical & dental staff costs at individual trust level.

The TAC data is published at:
https://www.england.nhs.uk/financial-accounting-and-reporting/nhs-providers-tac-data-publications/

Data structure:
- Each row is uniquely identified by Organisation Code + MainCode + SubCode
- MainCodes/SubCodes correspond to cells in the TAC submission form
- Staff costs are in Note 7 schedules

Usage:
    python analysis.py

    If automatic download fails (e.g. due to network restrictions), manually
    download the TAC XLSX files from the URL above and place them in the data/
    directory, then re-run.
"""

import os
import sys
import glob
import requests
import pandas as pd
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(SCRIPT_DIR, 'data')

# Known TAC data URLs - these may change between years
# Check the publications page for current links:
# https://www.england.nhs.uk/financial-accounting-and-reporting/nhs-providers-tac-data-publications/
TAC_URLS = {
    # These are example patterns - actual URLs change each year
    # The page typically lists:
    #   - TAC data in providers' 2023/24 accounts (NHS trusts)
    #   - TAC data in providers' 2023/24 accounts (NHS foundation trusts)
    #   - Illustrative TAC file
}

# NHS acute trust ODS codes - the major acute trusts in England
# Source: NHS Organisation Data Service
# https://digital.nhs.uk/services/organisation-data-service/
ACUTE_TRUST_CODES = {
    # A selection of major acute trusts for reference
    # Full list should be obtained from ODS data
    'R0A': 'Manchester University NHS Foundation Trust',
    'RRV': 'University College London Hospitals NHS Foundation Trust',
    'RJ1': "Guy's and St Thomas' NHS Foundation Trust",
    'RTH': 'Oxford University Hospitals NHS Foundation Trust',
    'RGT': 'Cambridge University Hospitals NHS Foundation Trust',
    'RA7': 'University Hospitals Bristol and Weston NHS Foundation Trust',
    'RQ8': 'Mid Yorkshire Teaching NHS Trust',
    'RWE': 'University Hospitals of Leicester NHS Trust',
    'RKB': 'University Hospitals Coventry and Warwickshire NHS Trust',
    'RXN': 'Lancashire Teaching Hospitals NHS Foundation Trust',
    'RJ7': "St George's University Hospitals NHS Foundation Trust",
    'RYJ': 'Imperial College Healthcare NHS Trust',
    'RAL': 'Royal Free London NHS Foundation Trust',
    'RQM': 'Chelsea and Westminster Hospital NHS Foundation Trust',
    'RTD': 'The Newcastle upon Tyne Hospitals NHS Foundation Trust',
    'RR8': 'Leeds Teaching Hospitals NHS Trust',
    'RM1': 'Norfolk and Norwich University Hospitals NHS Foundation Trust',
    'RA2': 'Royal Surrey County Hospital NHS Foundation Trust',
    'RHQ': 'Sheffield Teaching Hospitals NHS Foundation Trust',
    'REM': 'Sheffield Children NHS Foundation Trust',
    'RBL': 'Wirral University Teaching Hospital NHS Foundation Trust',
    'RA4': 'Yeovil District Hospital NHS Foundation Trust',
    'RWJ': 'Stockport NHS Foundation Trust',
    'RXK': 'Sandwell and West Birmingham Hospitals NHS Trust',
    'RKE': 'Whittington Health NHS Trust',
    'RVJ': 'North Bristol NHS Trust',
    'RBK': 'Walsall Healthcare NHS Trust',
    'RD1': 'Royal United Hospitals Bath NHS Foundation Trust',
    'RDE': 'Royal Devon University Healthcare NHS Foundation Trust',
    'RH8': 'Royal Devon and Exeter NHS Foundation Trust',
    'RHM': 'University Hospital Southampton NHS Foundation Trust',
    'RHU': 'Portsmouth Hospitals University NHS Trust',
    'RJ2': "King's College Hospital NHS Foundation Trust",
    'RJZ': "King's College Hospital NHS Foundation Trust",
    'RK9': 'Plymouth Hospitals NHS Trust',
    'RN3': 'Great Western Hospitals NHS Foundation Trust',
    'RN5': 'Basingstoke and North Hampshire NHS Foundation Trust',
    'RN7': 'Dartford and Gravesham NHS Trust',
    'RNL': 'North Cumbria Integrated Care NHS Foundation Trust',
    'RNZ': 'Salisbury NHS Foundation Trust',
    'RP5': 'Doncaster and Bassetlaw Teaching Hospitals NHS Foundation Trust',
    'RPY': 'The Royal Marsden NHS Foundation Trust',
    'RQ6': 'Royal Liverpool and Broadgreen University Hospitals NHS Trust',
    'RTE': 'Gloucestershire Hospitals NHS Foundation Trust',
    'RTF': 'Northumbria Healthcare NHS Foundation Trust',
    'RTG': 'Derby Teaching Hospitals NHS Foundation Trust',
    'RTK': 'Ashford and St Peter\'s Hospitals NHS Foundation Trust',
    'RTR': 'South Tees Hospitals NHS Foundation Trust',
    'RTX': 'University Hospitals of Morecambe Bay NHS Foundation Trust',
    'RV8': 'North West Anglia NHS Foundation Trust',
    'RVV': 'East Kent Hospitals University NHS Foundation Trust',
    'RVW': 'North Tees and Hartlepool NHS Foundation Trust',
    'RVY': 'Southport and Ormskirk Hospital NHS Trust',
    'RW3': 'Central Manchester University Hospitals NHS Foundation Trust',
    'RWA': 'Hull University Teaching Hospitals NHS Trust',
    'RWD': 'United Lincolnshire Hospitals NHS Trust',
    'RWF': 'Maidstone and Tunbridge Wells NHS Trust',
    'RWG': 'West Hertfordshire Teaching Hospitals NHS Trust',
    'RWH': 'East and North Hertfordshire NHS Trust',
    'RWP': 'Worcestershire Acute Hospitals NHS Trust',
    'RWY': 'Calderdale and Huddersfield NHS Foundation Trust',
    'RX1': 'Nottingham University Hospitals NHS Trust',
    'RXC': 'East Sussex Healthcare NHS Trust',
    'RXF': 'Mid Cheshire Hospitals NHS Foundation Trust',
    'RXH': "Brighton and Sussex University Hospitals NHS Trust",
    'RXL': 'Blackpool Teaching Hospitals NHS Foundation Trust',
    'RXP': 'County Durham and Darlington NHS Foundation Trust',
    'RXQ': 'Buckinghamshire Healthcare NHS Trust',
    'RXR': 'East Lancashire Hospitals NHS Trust',
    'RXW': 'Shrewsbury and Telford Hospital NHS Trust',
}

# Staff cost MainCodes/SubCodes for TAC data (these vary by year)
# Common codes for Note 7 staff costs:
STAFF_COST_CODES = {
    # Note 7.1 Employee benefits
    'salaries_wages': {'maincode': 'TC_STAFF_COSTS', 'subcode': 'SALARIES_AND_WAGES'},
    'ssc': {'maincode': 'TC_STAFF_COSTS', 'subcode': 'SOCIAL_SECURITY'},
    'pension': {'maincode': 'TC_STAFF_COSTS', 'subcode': 'PENSION_NHS'},
    'agency': {'maincode': 'TC_STAFF_COSTS', 'subcode': 'AGENCY_CONTRACT'},
    'bank': {'maincode': 'TC_STAFF_COSTS', 'subcode': 'BANK_STAFF'},
    # Note 7.2 Average number by staff group
    'fte_medical': {'maincode': 'TC_AVG_STAFF', 'subcode': 'MEDICAL_AND_DENTAL'},
    'fte_nursing': {'maincode': 'TC_AVG_STAFF', 'subcode': 'NURSING'},
}


def download_tac_data():
    """Attempt to download TAC data files from NHS England."""
    os.makedirs(DATA_DIR, exist_ok=True)

    print("Checking for existing TAC data files...")
    existing = glob.glob(os.path.join(DATA_DIR, '*.xlsx'))
    if existing:
        print(f"  Found {len(existing)} existing file(s):")
        for f in existing:
            print(f"    - {os.path.basename(f)}")
        return existing

    print("\nNo TAC data files found in data/ directory.")
    print("\nTo analyse trust-level data, please download the TAC files manually:")
    print()
    print("  1. Visit: https://www.england.nhs.uk/financial-accounting-and-reporting/")
    print("            nhs-providers-tac-data-publications/")
    print()
    print("  2. Download the latest TAC data files:")
    print("     - 'TAC data in providers' 2023/24 accounts (NHS trusts)'")
    print("     - 'TAC data in providers' 2023/24 accounts (NHS foundation trusts)'")
    print("     - 'Illustrative TAC' (to understand the data structure)")
    print()
    print("  3. Place the downloaded .xlsx files in:")
    print(f"     {DATA_DIR}")
    print()
    print("  4. Re-run this script")
    print()

    # Attempt download (may fail due to network restrictions)
    print("Attempting automatic download (this may fail due to access restrictions)...")
    for name, url in TAC_URLS.items():
        try:
            print(f"  Downloading {name}...")
            resp = requests.get(url, timeout=30, headers={
                'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36'
            })
            if resp.status_code == 200:
                filepath = os.path.join(DATA_DIR, f'{name}.xlsx')
                with open(filepath, 'wb') as f:
                    f.write(resp.content)
                print(f"    Saved to {filepath}")
            else:
                print(f"    Failed: HTTP {resp.status_code}")
        except Exception as e:
            print(f"    Failed: {e}")

    return glob.glob(os.path.join(DATA_DIR, '*.xlsx'))


def load_tac_data(filepaths):
    """Load and combine TAC data from XLSX files."""
    all_data = []
    for fp in filepaths:
        print(f"\nLoading {os.path.basename(fp)}...")
        try:
            # TAC files typically have multiple sheets or a single data sheet
            # The structure varies by year but generally has columns like:
            # Organisation Code, Organisation Name, MainCode, SubCode, Value
            xl = pd.ExcelFile(fp)
            print(f"  Sheets: {xl.sheet_names}")

            for sheet in xl.sheet_names:
                df = pd.read_excel(fp, sheet_name=sheet)
                print(f"  Sheet '{sheet}': {len(df)} rows, {len(df.columns)} columns")
                print(f"  Columns: {list(df.columns[:10])}")
                all_data.append(df)
        except Exception as e:
            print(f"  Error loading {fp}: {e}")

    if not all_data:
        return None

    # Attempt to combine
    combined = pd.concat(all_data, ignore_index=True)
    print(f"\nCombined dataset: {len(combined)} rows")
    return combined


def analyse_staff_costs(df):
    """Analyse staff costs from TAC data."""
    if df is None:
        print("\nNo data to analyse. Please download TAC files first.")
        return

    print("\n" + "="*80)
    print("  TRUST-LEVEL STAFF COST ANALYSIS")
    print("="*80)

    # The exact column names will depend on the TAC file format
    # Common patterns:
    # - Organisation columns: 'Org Code', 'Organisation Name', 'ODS Code'
    # - Data columns: 'MainCode', 'SubCode', 'Value', 'Period'
    # - Or the data may be in a wide format with codes as columns

    print("\nDataset columns:")
    for col in df.columns:
        print(f"  - {col}")

    print("\nDataset shape:", df.shape)
    print("\nFirst few rows:")
    print(df.head().to_string())

    # Identify organisation and value columns
    org_cols = [c for c in df.columns if any(x in c.lower() for x in ['org', 'code', 'trust', 'name'])]
    print(f"\nPotential organisation columns: {org_cols}")

    # Look for staff cost related data
    value_cols = [c for c in df.columns if any(x in c.lower() for x in ['value', 'amount', '£', 'total'])]
    print(f"Potential value columns: {value_cols}")

    code_cols = [c for c in df.columns if any(x in c.lower() for x in ['maincode', 'subcode', 'code', 'type'])]
    print(f"Potential code columns: {code_cols}")

    # Filter to acute trusts if we can identify them
    if org_cols:
        org_col = org_cols[0]
        unique_orgs = df[org_col].nunique()
        print(f"\nUnique organisations: {unique_orgs}")

    # Try to extract staff cost data
    # This will need to be adapted based on the actual file format
    for code_col in code_cols:
        unique_codes = df[code_col].unique()[:20]
        print(f"\nSample codes in '{code_col}': {list(unique_codes)}")

    print("\n" + "-"*60)
    print("NOTE: The analysis above shows the raw data structure.")
    print("The specific extraction logic will depend on the TAC file format")
    print("for the year you downloaded. Use the illustrative TAC file to")
    print("understand the MainCode/SubCode mapping.")
    print()
    print("Key codes to look for:")
    print("  - Staff costs (Note 7.1): agency line, bank line")
    print("  - Average staff numbers (Note 7.2): medical & dental row")
    print("  - Filter by organisation type to isolate acute trusts")


def create_analysis_template():
    """Create a template for analysing downloaded TAC data."""
    template = """
# ============================================================================
# TEMPLATE: Analysing TAC Data for Medical & Dental Staff Costs
# ============================================================================
#
# Once you have downloaded the TAC XLSX files, use this template to extract
# the medical & dental staff cost data.
#
# The TAC data structure:
# - Each trust submits a TAC form with standardised codes
# - MainCode identifies the note/schedule (e.g., staff costs = Note 7)
# - SubCode identifies the specific line item
# - Values are split by Permanent/Other columns
#
# Step 1: Load data
# -----------------
# import pandas as pd
# df_trusts = pd.read_excel('data/TAC-NHS-Trusts-2023-24.xlsx')
# df_fts = pd.read_excel('data/TAC-NHS-FTs-2023-24.xlsx')
# df = pd.concat([df_trusts, df_fts])
#
# Step 2: Identify staff cost codes
# ----------------------------------
# Look at the illustrative TAC file to find the MainCode/SubCode for:
# - Agency costs (typically in Note 7.1, SubCode containing 'AGENCY')
# - Bank costs (typically in Note 7.1, SubCode containing 'BANK')
# - Total staff costs (SubCode containing 'TOTAL')
# - Medical & dental average FTE (Note 7.2)
#
# Step 3: Extract and pivot
# -------------------------
# agency = df[df['SubCode'].str.contains('AGENCY', case=False)]
# bank = df[df['SubCode'].str.contains('BANK', case=False)]
# medical_fte = df[df['SubCode'].str.contains('MEDICAL', case=False)]
#
# Step 4: Filter to acute trusts
# -------------------------------
# Use ODS codes or trust names to filter to acute trusts only
# acute_codes = [list of acute trust ODS codes]
# df_acute = df[df['OrgCode'].isin(acute_codes)]
#
# Step 5: Analyse
# ----------------
# Compare agency vs bank costs across acute trusts
# Rank trusts by agency spend, bank spend, ratio of temporary to permanent
"""
    print(template)


def main():
    print("\n" + "="*80)
    print("  NHS TRUST-LEVEL MEDICAL & DENTAL STAFF COST ANALYSIS")
    print("="*80)
    print()
    print("This script downloads and analyses Trust Accounts Consolidation (TAC)")
    print("data to examine medical & dental staff costs at individual trust level.")
    print()

    # Step 1: Check for / download data
    filepaths = download_tac_data()

    if not filepaths:
        print("\n" + "="*80)
        print("  NO DATA FILES AVAILABLE - SHOWING ANALYSIS TEMPLATE")
        print("="*80)
        create_analysis_template()
        print("\n\nMeanwhile, run aggregate_analysis.py for national-level analysis")
        print("using published aggregate data.")
        return

    # Step 2: Load data
    df = load_tac_data(filepaths)

    # Step 3: Analyse
    analyse_staff_costs(df)


if __name__ == '__main__':
    main()
