"""
Download NI GP prescribing data and practice list sizes from OpenDataNI.

Data sources (Open Government Licence):
  - GP Prescribing Data: https://www.opendatani.gov.uk/dataset/gp-prescribing-data
  - GP Practice List Sizes: https://www.opendatani.gov.uk/dataset/gp-practice-list-sizes

Uses the CKAN API that powers OpenDataNI to discover and download CSV files.
"""

import os
import time
import argparse
import requests

BASE_URL = "https://admin.opendatani.gov.uk"
CKAN_API = f"{BASE_URL}/api/3/action"
DATA_DIR = os.path.join(os.path.dirname(__file__), "data")

PRESCRIBING_DATASET_ID = "gp-prescribing-data"
PRACTICE_LIST_DATASET_ID = "gp-practice-list-sizes"


def ckan_get(action, params=None, retries=4):
    """Call the CKAN API with exponential-backoff retries."""
    url = f"{CKAN_API}/{action}"
    for attempt in range(retries):
        try:
            resp = requests.get(url, params=params, timeout=30)
            resp.raise_for_status()
            body = resp.json()
            if body.get("success"):
                return body["result"]
            raise RuntimeError(f"CKAN API error: {body}")
        except (requests.RequestException, RuntimeError) as exc:
            if attempt == retries - 1:
                raise
            wait = 2 ** (attempt + 1)
            print(f"  Retry {attempt+1}/{retries} after {wait}s – {exc}")
            time.sleep(wait)


def list_resources(dataset_id):
    """Return the list of resources (files) in a dataset."""
    result = ckan_get("package_show", {"id": dataset_id})
    return result["resources"]


def download_file(url, dest_path, retries=4):
    """Download a file with exponential-backoff retries."""
    if os.path.exists(dest_path):
        print(f"  Already exists: {os.path.basename(dest_path)}")
        return
    for attempt in range(retries):
        try:
            resp = requests.get(url, timeout=120, stream=True)
            resp.raise_for_status()
            with open(dest_path, "wb") as f:
                for chunk in resp.iter_content(chunk_size=8192):
                    f.write(chunk)
            print(f"  Downloaded: {os.path.basename(dest_path)}")
            return
        except requests.RequestException as exc:
            if attempt == retries - 1:
                print(f"  FAILED: {os.path.basename(dest_path)} – {exc}")
                return
            wait = 2 ** (attempt + 1)
            print(f"  Retry {attempt+1}/{retries} after {wait}s – {exc}")
            time.sleep(wait)


def download_practice_list_sizes():
    """Download all GP Practice List Size CSV files."""
    dest_dir = os.path.join(DATA_DIR, "practice_list_sizes")
    os.makedirs(dest_dir, exist_ok=True)

    print("Fetching practice list size resources...")
    resources = list_resources(PRACTICE_LIST_DATASET_ID)
    csv_resources = [r for r in resources if r["format"].upper() == "CSV"]
    print(f"Found {len(csv_resources)} CSV files")

    for r in csv_resources:
        name = r.get("name", "") or r["url"].split("/")[-1]
        filename = name.replace(" ", "-").lower()
        if not filename.endswith(".csv"):
            filename += ".csv"
        download_file(r["url"], os.path.join(dest_dir, filename))

    return dest_dir


def download_prescribing_data(year=None, month=None, latest_n=None):
    """
    Download GP Prescribing CSV files.

    Args:
        year: Filter to a specific year (e.g. 2024)
        month: Filter to a specific month name (e.g. 'jan', 'sep')
        latest_n: Download only the N most recent files
    """
    dest_dir = os.path.join(DATA_DIR, "prescribing")
    os.makedirs(dest_dir, exist_ok=True)

    print("Fetching prescribing data resources...")
    resources = list_resources(PRESCRIBING_DATASET_ID)
    csv_resources = [r for r in resources if r["format"].upper() == "CSV"]

    # Sort by created date descending (most recent first)
    csv_resources.sort(key=lambda r: r.get("created", ""), reverse=True)
    print(f"Found {len(csv_resources)} CSV files total")

    # Filter by year/month if specified
    if year or month:
        filtered = []
        for r in csv_resources:
            name_lower = (r.get("name", "") or r["url"]).lower()
            if year and str(year) not in name_lower:
                continue
            if month and month.lower()[:3] not in name_lower:
                continue
            filtered.append(r)
        csv_resources = filtered
        print(f"After filtering: {len(csv_resources)} files")

    if latest_n:
        csv_resources = csv_resources[:latest_n]
        print(f"Taking latest {latest_n} files")

    for r in csv_resources:
        name = r.get("name", "") or r["url"].split("/")[-1]
        filename = name.replace(" ", "-").lower()
        if not filename.endswith(".csv"):
            filename += ".csv"
        download_file(r["url"], os.path.join(dest_dir, filename))

    return dest_dir


def main():
    parser = argparse.ArgumentParser(
        description="Download NI GP prescribing and practice list size data"
    )
    parser.add_argument(
        "--prescribing", action="store_true",
        help="Download prescribing data"
    )
    parser.add_argument(
        "--practices", action="store_true",
        help="Download practice list sizes"
    )
    parser.add_argument(
        "--all", action="store_true",
        help="Download both datasets"
    )
    parser.add_argument(
        "--year", type=int,
        help="Filter prescribing data to a specific year"
    )
    parser.add_argument(
        "--month",
        help="Filter prescribing data to a specific month (e.g. jan, sep)"
    )
    parser.add_argument(
        "--latest", type=int,
        help="Download only the N most recent prescribing files"
    )
    args = parser.parse_args()

    if not (args.prescribing or args.practices or args.all):
        parser.print_help()
        print("\nExample usage:")
        print("  python download_data.py --all")
        print("  python download_data.py --prescribing --year 2024")
        print("  python download_data.py --prescribing --latest 3")
        print("  python download_data.py --practices")
        return

    if args.all or args.practices:
        print("\n=== GP Practice List Sizes ===")
        download_practice_list_sizes()

    if args.all or args.prescribing:
        print("\n=== GP Prescribing Data ===")
        download_prescribing_data(
            year=args.year,
            month=args.month,
            latest_n=args.latest,
        )

    print("\nDone. Data saved to:", DATA_DIR)


if __name__ == "__main__":
    main()
