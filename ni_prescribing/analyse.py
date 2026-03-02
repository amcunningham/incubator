"""
Analyse NI GP prescribing data combined with practice list sizes.

Provides per-capita prescribing rates by practice and by HSC Trust area.

Data schemas
------------
Prescribing CSV columns:
    Practice, Year, Month, VTM_NM, VMP_NM, AMP_NM, Presentation, Strength,
    Total Items, Total Quantity, Gross Cost, Actual Cost,
    BNF Code, BNF Chapter, BNF Section, BNF Paragraph, BNF Sub-Paragraph

Practice list CSV columns:
    PracNo, PracticeName, Address1, Address2, Address3, Postcode, LCG,
    Registered Patients

LCG (Local Commissioning Group) maps directly to HSC Trust:
    Belfast, South Eastern, Northern, Southern, Western
"""

import os
import glob
import pandas as pd

DATA_DIR = os.path.join(os.path.dirname(__file__), "data")

# LCG names as they appear in the practice list data → Trust names
LCG_TO_TRUST = {
    "Belfast": "Belfast HSC Trust",
    "South Eastern": "South Eastern HSC Trust",
    "Northern": "Northern HSC Trust",
    "Southern": "Southern HSC Trust",
    "Western": "Western HSC Trust",
}


def load_practice_list(quarter=None):
    """
    Load GP practice list sizes.

    Args:
        quarter: Optional filename substring to pick a specific quarter,
                 e.g. 'january-2024' or 'october-2023'.
                 If None, loads the most recent file (alphabetically last).

    Returns:
        DataFrame with columns: PracNo, PracticeName, Postcode, LCG, Trust,
        RegisteredPatients
    """
    pattern = os.path.join(DATA_DIR, "practice_list_sizes", "*.csv")
    files = sorted(glob.glob(pattern))
    if not files:
        raise FileNotFoundError(
            f"No practice list CSV files found in {DATA_DIR}/practice_list_sizes/. "
            "Run: python download_data.py --practices"
        )

    if quarter:
        matches = [f for f in files if quarter.lower() in os.path.basename(f).lower()]
        if not matches:
            available = [os.path.basename(f) for f in files]
            raise FileNotFoundError(
                f"No file matching '{quarter}'. Available: {available}"
            )
        chosen = matches[-1]
    else:
        chosen = files[-1]

    print(f"Loading practice list: {os.path.basename(chosen)}")
    df = pd.read_csv(chosen, dtype={"PracNo": str})

    # Normalise column names (some files vary slightly)
    col_map = {}
    for c in df.columns:
        cl = c.strip().lower()
        if "pracno" in cl or "prac_no" in cl or cl == "practice":
            col_map[c] = "PracNo"
        elif "practicename" in cl or "practice_name" in cl or "practice name" in cl:
            col_map[c] = "PracticeName"
        elif cl == "postcode":
            col_map[c] = "Postcode"
        elif cl == "lcg":
            col_map[c] = "LCG"
        elif "registered" in cl and "patient" in cl:
            col_map[c] = "RegisteredPatients"
    df = df.rename(columns=col_map)

    # Ensure PracNo is zero-padded to match prescribing data
    if "PracNo" in df.columns:
        df["PracNo"] = df["PracNo"].astype(str).str.strip()

    if "LCG" in df.columns:
        df["LCG"] = df["LCG"].str.strip()
        df["Trust"] = df["LCG"].map(LCG_TO_TRUST).fillna("Unknown")

    if "RegisteredPatients" in df.columns:
        df["RegisteredPatients"] = pd.to_numeric(
            df["RegisteredPatients"], errors="coerce"
        )

    keep = [c for c in ["PracNo", "PracticeName", "Postcode", "LCG", "Trust",
                         "RegisteredPatients"] if c in df.columns]
    return df[keep].copy()


def load_prescribing(year=None, month=None, bnf_chapter=None):
    """
    Load and concatenate GP prescribing CSV files.

    Args:
        year: Filter to specific year (int)
        month: Filter to specific month name substring, e.g. 'jan'
        bnf_chapter: Filter to a BNF chapter number (string or int)

    Returns:
        DataFrame with normalised columns
    """
    pattern = os.path.join(DATA_DIR, "prescribing", "*.csv")
    files = sorted(glob.glob(pattern))
    if not files:
        raise FileNotFoundError(
            f"No prescribing CSV files found in {DATA_DIR}/prescribing/. "
            "Run: python download_data.py --prescribing --latest 3"
        )

    if year or month:
        filtered = []
        for f in files:
            basename = os.path.basename(f).lower()
            if year and str(year) not in basename:
                continue
            if month and month.lower()[:3] not in basename:
                continue
            filtered.append(f)
        files = filtered

    if not files:
        raise FileNotFoundError("No prescribing files match the given filters")

    print(f"Loading {len(files)} prescribing file(s)...")
    frames = []
    for f in files:
        print(f"  {os.path.basename(f)}")
        df = pd.read_csv(f, dtype={"Practice": str}, low_memory=False)
        frames.append(df)

    df = pd.concat(frames, ignore_index=True)

    # Normalise column names
    col_map = {}
    for c in df.columns:
        cl = c.strip().lower().replace("()", "").replace("£", "").strip()
        if cl == "practice":
            col_map[c] = "Practice"
        elif cl == "year":
            col_map[c] = "Year"
        elif cl == "month":
            col_map[c] = "Month"
        elif cl == "vtm_nm":
            col_map[c] = "VTM_NM"
        elif cl == "vmp_nm":
            col_map[c] = "VMP_NM"
        elif cl == "amp_nm":
            col_map[c] = "AMP_NM"
        elif cl == "presentation":
            col_map[c] = "Presentation"
        elif cl == "strength":
            col_map[c] = "Strength"
        elif "total items" in cl:
            col_map[c] = "TotalItems"
        elif "total quantity" in cl:
            col_map[c] = "TotalQuantity"
        elif "gross" in cl and "cost" in cl:
            col_map[c] = "GrossCost"
        elif "actual" in cl and "cost" in cl:
            col_map[c] = "ActualCost"
        elif cl == "bnf code":
            col_map[c] = "BNFCode"
        elif cl == "bnf chapter":
            col_map[c] = "BNFChapter"
        elif cl == "bnf section":
            col_map[c] = "BNFSection"
        elif cl == "bnf paragraph":
            col_map[c] = "BNFParagraph"
        elif cl == "bnf sub-paragraph" or cl == "bnf sub paragraph":
            col_map[c] = "BNFSubParagraph"
    df = df.rename(columns=col_map)

    df["Practice"] = df["Practice"].astype(str).str.strip()

    for col in ["TotalItems", "TotalQuantity", "GrossCost", "ActualCost"]:
        if col in df.columns:
            df[col] = pd.to_numeric(df[col], errors="coerce")

    if bnf_chapter and "BNFChapter" in df.columns:
        df = df[df["BNFChapter"].astype(str).str.strip() == str(bnf_chapter)]

    return df


def merge_with_practice_list(prescribing_df, practice_df):
    """
    Merge prescribing data with practice list sizes.

    Joins on Practice code (PracNo).
    """
    merged = prescribing_df.merge(
        practice_df,
        left_on="Practice",
        right_on="PracNo",
        how="left",
    )
    unmatched = merged["PracNo"].isna().sum()
    total = len(merged)
    if unmatched > 0:
        print(f"Warning: {unmatched}/{total} rows did not match a practice "
              f"({unmatched/total*100:.1f}%)")
    return merged


def prescribing_per_capita_by_practice(merged_df, medicine_filter=None):
    """
    Calculate per-capita prescribing rates by practice.

    Args:
        merged_df: Output of merge_with_practice_list()
        medicine_filter: Optional substring to filter VTM_NM (drug name)

    Returns:
        DataFrame with one row per practice, showing items and cost per
        registered patient.
    """
    df = merged_df.copy()
    if medicine_filter:
        mask = df["VTM_NM"].str.contains(medicine_filter, case=False, na=False)
        df = df[mask]

    agg = df.groupby(["Practice", "PracticeName", "LCG", "Trust",
                       "RegisteredPatients"]).agg(
        TotalItems=("TotalItems", "sum"),
        TotalCost=("ActualCost", "sum"),
    ).reset_index()

    agg["ItemsPerCapita"] = agg["TotalItems"] / agg["RegisteredPatients"]
    agg["CostPerCapita"] = agg["TotalCost"] / agg["RegisteredPatients"]

    return agg.sort_values("ItemsPerCapita", ascending=False)


def prescribing_per_capita_by_trust(merged_df, medicine_filter=None):
    """
    Calculate per-capita prescribing rates by HSC Trust area.

    Args:
        merged_df: Output of merge_with_practice_list()
        medicine_filter: Optional substring to filter VTM_NM (drug name)

    Returns:
        DataFrame with one row per Trust, showing items and cost per capita.
    """
    df = merged_df.copy()
    if medicine_filter:
        mask = df["VTM_NM"].str.contains(medicine_filter, case=False, na=False)
        df = df[mask]

    # Get total registered patients per trust (deduplicated by practice)
    practice_pops = df.drop_duplicates(subset=["Practice"])[
        ["Practice", "Trust", "RegisteredPatients"]
    ]
    trust_pop = practice_pops.groupby("Trust")["RegisteredPatients"].sum()

    # Sum prescribing by trust
    trust_rx = df.groupby("Trust").agg(
        TotalItems=("TotalItems", "sum"),
        TotalCost=("ActualCost", "sum"),
        PracticeCount=("Practice", "nunique"),
    ).reset_index()

    trust_rx["RegisteredPatients"] = trust_rx["Trust"].map(trust_pop)
    trust_rx["ItemsPerCapita"] = (
        trust_rx["TotalItems"] / trust_rx["RegisteredPatients"]
    )
    trust_rx["CostPerCapita"] = (
        trust_rx["TotalCost"] / trust_rx["RegisteredPatients"]
    )

    return trust_rx.sort_values("ItemsPerCapita", ascending=False)


def top_medicines_by_items(prescribing_df, n=20):
    """Return the top N medicines by total items prescribed."""
    return (
        prescribing_df.groupby("VTM_NM")["TotalItems"]
        .sum()
        .sort_values(ascending=False)
        .head(n)
        .reset_index()
        .rename(columns={"TotalItems": "TotalItems"})
    )


def top_medicines_by_cost(prescribing_df, n=20):
    """Return the top N medicines by total actual cost."""
    return (
        prescribing_df.groupby("VTM_NM")["ActualCost"]
        .sum()
        .sort_values(ascending=False)
        .head(n)
        .reset_index()
    )
