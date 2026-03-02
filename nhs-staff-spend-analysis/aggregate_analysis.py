#!/usr/bin/env python3
"""
NHS Acute Trust Medical & Dental Staff Spend Analysis
=====================================================

Analysis of medical and dental staff expenditure across NHS providers in England,
examining permanent vs bank vs agency spend using published aggregate data from:

- Consolidated NHS Provider Accounts (2022/23 - 2024/25)
- DHSC Evidence to DDRB (Doctors' and Dentists' Remuneration Body)
- NHS England Financial Performance Updates
- REC (Recruitment & Employment Confederation) analysis of NHS data

Sources:
- https://www.gov.uk/government/publications/consolidated-nhs-provider-accounts-2024-to-2025
- https://www.gov.uk/government/publications/consolidated-nhs-provider-accounts-annual-report-and-accounts-2023-to-2024
- https://www.gov.uk/government/publications/dhsc-evidence-for-the-ddrb-pay-round-2026-to-2027
- https://www.rec.uk.com/our-view/policy-and-campaigns/health-social-care/nhs-stats-highlight-costly-impact
- https://www.england.nhs.uk/long-read/consolidated-nhs-provider-accounts-2024-25/
- https://www.england.nhs.uk/long-read/submission-to-the-review-body-on-doctors-and-dentists-remuneration-evidence-for-the-2025-26-pay-round/
- https://www.gov.uk/government/publications/supplementary-evidence-to-pay-review-bodies-hospital-and-community-health-sector-2025-to-2026
"""

import pandas as pd
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import os

OUTPUT_DIR = os.path.dirname(os.path.abspath(__file__))


def print_section(title):
    print(f"\n{'='*80}")
    print(f"  {title}")
    print(f"{'='*80}\n")


def medical_dental_temporary_staffing():
    """Medical & dental temporary staffing spend (agency + bank) over time."""
    print_section("MEDICAL & DENTAL TEMPORARY STAFFING SPEND")

    data = {
        'Year': ['2019/20', '2020/21', '2021/22', '2022/23', '2023/24'],
        'Agency (£bn)': [1.20, 1.10, 1.15, 1.15, 1.13],
        'Bank (£bn)':   [0.90, 1.00, 1.15, 1.40, 1.90],
    }
    df = pd.DataFrame(data)
    df['Total Temporary (£bn)'] = df['Agency (£bn)'] + df['Bank (£bn)']
    df['Agency Share (%)'] = (df['Agency (£bn)'] / df['Total Temporary (£bn)'] * 100).round(1)
    df['Bank Share (%)'] = (df['Bank (£bn)'] / df['Total Temporary (£bn)'] * 100).round(1)

    print("Medical & Dental Temporary Staffing Spend by Year")
    print("-" * 75)
    print(df.to_string(index=False))
    print()

    print("Key findings:")
    print("  - Medical agency spend has been broadly STABLE at ~£1.1-1.2bn since 2019/20")
    print("  - Medical BANK spend has MORE THAN DOUBLED from £0.9bn to £1.9bn (+114%)")
    print("  - Total medical temporary spend rose 18% (£470m) in 2023/24 alone")
    print("  - The agency-to-bank shift is the dominant trend: agency share fell")
    print("    from 57% to 37% of medical temporary spend")
    print()
    print("Source: REC analysis of NHS England data; DHSC Evidence to DDRB")
    print("  https://www.rec.uk.com/our-view/policy-and-campaigns/health-social-care/")
    print("  nhs-stats-highlight-costly-impact")

    # Plot
    fig, ax = plt.subplots(figsize=(10, 6))
    x = range(len(df))
    width = 0.35
    ax.bar([i - width/2 for i in x], df['Agency (£bn)'], width, label='Agency', color='#e74c3c')
    ax.bar([i + width/2 for i in x], df['Bank (£bn)'], width, label='Bank', color='#3498db')
    ax.plot(x, df['Total Temporary (£bn)'], 'ko-', label='Total Temporary', linewidth=2)
    ax.set_xlabel('Financial Year')
    ax.set_ylabel('Spend (£ billions)')
    ax.set_title('Medical & Dental Temporary Staffing Spend\nNHS Providers in England')
    ax.set_xticks(x)
    ax.set_xticklabels(df['Year'])
    ax.legend()
    ax.grid(axis='y', alpha=0.3)
    plt.tight_layout()
    plt.savefig(os.path.join(OUTPUT_DIR, 'medical_dental_temp_spend.png'), dpi=150)
    plt.close()
    print("\n  [Chart saved: medical_dental_temp_spend.png]")

    return df


def all_staff_agency_spend():
    """Total agency spend across all staff groups."""
    print_section("TOTAL AGENCY SPEND - ALL STAFF GROUPS")

    data = {
        'Year': ['2018/19', '2019/20', '2020/21', '2021/22', '2022/23', '2023/24', '2024/25'],
        'Total Agency (£bn)': [2.40, 2.40, 2.20, 2.96, 3.46, 3.00, 2.10],
        'Note': [
            'Pre-COVID baseline',
            'Pre-COVID',
            'COVID year (reduced elective)',
            'Post-COVID surge',
            'Peak agency spend',
            'Caps taking effect',
            'Forecast/outturn - 38% reduction from peak'
        ]
    }
    df = pd.DataFrame(data)

    print("Total Agency Spend Across All Staff Groups (NHS Providers, England)")
    print("-" * 85)
    for _, row in df.iterrows():
        print(f"  {row['Year']}:  £{row['Total Agency (£bn)']:.2f}bn  - {row['Note']}")
    print()

    # Break down by staff group for 2023/24
    print("Agency Spend by Staff Group (2023/24 estimated breakdown):")
    print("-" * 60)
    breakdown = {
        'Staff Group': ['Medical & Dental', 'Nursing & Midwifery', 'Other Clinical', 'Non-Clinical'],
        'Agency (£bn)': [1.13, 1.10, 0.45, 0.32],
    }
    bdf = pd.DataFrame(breakdown)
    bdf['Share (%)'] = (bdf['Agency (£bn)'] / bdf['Agency (£bn)'].sum() * 100).round(1)
    print(bdf.to_string(index=False))
    print(f"\n  Total: £{bdf['Agency (£bn)'].sum():.2f}bn")
    print()
    print("  NOTE: Medical & dental accounts for ~38% of total agency spend")
    print("  despite being ~12% of the workforce by headcount.")
    print("  This reflects the very high cost of medical locums.")
    print()
    print("Source: Consolidated NHS Provider Accounts; NHS England Financial")
    print("  Performance Updates")
    print("  https://www.england.nhs.uk/long-read/consolidated-nhs-provider-accounts-2024-25/")

    # Plot
    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(14, 6))

    # Trend line
    ax1.plot(df['Year'], df['Total Agency (£bn)'], 'ro-', linewidth=2, markersize=8)
    ax1.fill_between(range(len(df)), df['Total Agency (£bn)'], alpha=0.2, color='red')
    ax1.set_xlabel('Financial Year')
    ax1.set_ylabel('Agency Spend (£ billions)')
    ax1.set_title('Total NHS Agency Spend Trend')
    ax1.tick_params(axis='x', rotation=45)
    ax1.grid(alpha=0.3)

    # Pie chart of staff group breakdown
    colors = ['#e74c3c', '#3498db', '#2ecc71', '#f39c12']
    ax2.pie(bdf['Agency (£bn)'], labels=bdf['Staff Group'], autopct='%1.1f%%',
            colors=colors, startangle=90)
    ax2.set_title('Agency Spend by Staff Group (2023/24)')

    plt.tight_layout()
    plt.savefig(os.path.join(OUTPUT_DIR, 'total_agency_spend.png'), dpi=150)
    plt.close()
    print("\n  [Chart saved: total_agency_spend.png]")

    return df


def permanent_vs_temporary():
    """Overall permanent vs temporary staffing cost analysis."""
    print_section("PERMANENT vs TEMPORARY STAFFING COSTS")

    # From consolidated provider accounts & NHSPRB evidence
    data = {
        'Year': ['2020/21', '2021/22', '2022/23', '2023/24'],
        'Total Staff Costs (£bn)': [68.0, 72.5, 80.1, 84.7],
        'Permanent (£bn)':         [62.0, 65.3, 72.2, 77.0],
        'Bank (£bn)':              [3.80, 4.20, 4.40, 4.70],
        'Agency (£bn)':            [2.20, 2.96, 3.46, 3.00],
    }
    df = pd.DataFrame(data)
    df['Agency % of Total'] = (df['Agency (£bn)'] / df['Total Staff Costs (£bn)'] * 100).round(1)
    df['Bank % of Total'] = (df['Bank (£bn)'] / df['Total Staff Costs (£bn)'] * 100).round(1)
    df['Temp % of Total'] = ((df['Agency (£bn)'] + df['Bank (£bn)']) / df['Total Staff Costs (£bn)'] * 100).round(1)

    print("NHS Provider Staff Costs - ALL Staff Groups")
    print("-" * 85)
    print(df.to_string(index=False))
    print()
    print("Key findings:")
    print("  - Total staff costs grew 24.6% from £68.0bn to £84.7bn (2020/21 to 2023/24)")
    print("  - Agency as a % of total peaked at 4.3% in 2022/23, fell to 3.5% in 2023/24")
    print("  - Bank spend has been RISING steadily: £3.8bn to £4.7bn (+24%)")
    print("  - Total temporary (bank+agency) as % of total: ~9% consistently")
    print("  - The mix has shifted: agency is being replaced by bank, not by permanent")
    print("  - Pay awards (5.5% in 2024/25) and pension contribution increases (from 20.6%")
    print("    to 23.7% from April 2024) are the main drivers of total cost growth")
    print()
    print("  In 2024/25, agency fell further to ~£2.1bn (lowest as % of pay bill since 2017)")
    print("  Non-medical agency costs fell to just 1.7% of the pay bill")
    print()

    # Medical & dental specific breakdown
    print_section("MEDICAL & DENTAL: PERMANENT vs BANK vs AGENCY")

    # Derived from DHSC DDRB evidence percentages:
    # Medical bank = 7.8% of medical pay bill in 2022/23 (£1.4bn => total ~£17.9bn)
    # Medical bank = 9.3% of medical pay bill in 2023/24 (£1.9bn => total ~£20.4bn)
    # Medical agency = 6.2% of medical pay bill in 2022/23 (£1.15bn => total ~£18.5bn)
    # Medical agency = 5.5% of medical pay bill in 2023/24 (£1.13bn => total ~£20.5bn)
    # Best estimate: ~£18bn (2022/23), ~£20.4bn (2023/24)
    total_2223 = 18.0  # derived from bank % and agency % cross-check
    total_2324 = 20.4

    md_data = {
        'Category': [
            'Substantive (permanent)',
            'Bank',
            'Agency/Locum',
            'TOTAL MEDICAL & DENTAL',
        ],
        '2022/23 (£bn)': [
            total_2223 - 1.40 - 1.15,  # ~15.45
            1.40,
            1.15,
            total_2223
        ],
        '2023/24 (£bn)': [
            total_2324 - 1.90 - 1.13,  # ~17.37
            1.90,
            1.13,
            total_2324
        ],
    }
    md_df = pd.DataFrame(md_data)
    md_df['Change (£bn)'] = md_df['2023/24 (£bn)'] - md_df['2022/23 (£bn)']
    md_df['Change (%)'] = (md_df['Change (£bn)'] / md_df['2022/23 (£bn)'] * 100).round(1)
    md_df['Share of Total 23/24 (%)'] = (md_df['2023/24 (£bn)'] / total_2324 * 100).round(1)

    print("Medical & Dental Staff Costs by Employment Type")
    print("-" * 90)
    print(md_df.to_string(index=False, float_format=lambda x: f'{x:.2f}'))
    print()
    print("DERIVATION:")
    print("  Bank and agency figures are CONFIRMED from DHSC DDRB evidence submissions.")
    print("  Total medical paybill derived from DDRB percentages:")
    print("    - Medical bank = 7.8% of medical pay bill in 2022/23 (£1.4bn => ~£18bn)")
    print("    - Medical bank = 9.3% of medical pay bill in 2023/24 (£1.9bn => ~£20.4bn)")
    print("    - Medical agency = 6.2% in 2022/23, 5.5% in 2023/24 (cross-checks)")
    print("  Substantive = Total - Bank - Agency (residual)")
    print()
    print("Source: DHSC Evidence to DDRB; NHS England DDRB Submission")
    print("  https://www.gov.uk/government/publications/dhsc-evidence-for-the-ddrb-pay-round-2025-to-2026")
    print("  https://www.england.nhs.uk/long-read/submission-to-the-review-body-on-doctors-")
    print("  and-dentists-remuneration-evidence-for-the-2025-26-pay-round/")

    # Plot
    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(14, 6))

    # Stacked bar for 2022/23 vs 2023/24
    categories = ['2022/23', '2023/24']
    substantive = [total_2223 - 1.40 - 1.15, total_2324 - 1.90 - 1.13]
    bank = [1.40, 1.90]
    agency = [1.15, 1.13]

    ax1.bar(categories, substantive, label='Substantive (permanent)', color='#27ae60')
    ax1.bar(categories, bank, bottom=substantive, label='Bank', color='#3498db')
    ax1.bar(categories, agency,
            bottom=[s+b for s, b in zip(substantive, bank)],
            label='Agency/Locum', color='#e74c3c')
    ax1.set_ylabel('Spend (£ billions)')
    ax1.set_title('Medical & Dental Staff Costs\nby Employment Type')
    ax1.legend()
    ax1.grid(axis='y', alpha=0.3)

    # Percentage breakdown
    for year_idx, year in enumerate(categories):
        total = substantive[year_idx] + bank[year_idx] + agency[year_idx]
        pcts = [substantive[year_idx]/total*100,
                bank[year_idx]/total*100,
                agency[year_idx]/total*100]
        ax1.text(year_idx, total + 0.2, f'£{total:.1f}bn', ha='center', fontweight='bold')

    # Temporary staffing mix shift
    years = ['2019/20', '2020/21', '2021/22', '2022/23', '2023/24']
    agency_pcts = [57.1, 52.4, 50.0, 45.1, 37.3]
    bank_pcts =   [42.9, 47.6, 50.0, 54.9, 62.7]

    ax2.stackplot(years, [agency_pcts, bank_pcts],
                  labels=['Agency share', 'Bank share'],
                  colors=['#e74c3c', '#3498db'], alpha=0.8)
    ax2.set_ylabel('Share of Medical Temporary Spend (%)')
    ax2.set_title('Shift from Agency to Bank\nin Medical Temporary Staffing')
    ax2.legend(loc='center right')
    ax2.set_ylim(0, 100)
    ax2.tick_params(axis='x', rotation=45)
    ax2.grid(alpha=0.3)

    plt.tight_layout()
    plt.savefig(os.path.join(OUTPUT_DIR, 'permanent_vs_temporary.png'), dpi=150)
    plt.close()
    print("\n  [Chart saved: permanent_vs_temporary.png]")

    return df, md_df


def bank_vs_agency_deep_dive():
    """Deep dive into the bank vs agency shift."""
    print_section("BANK vs AGENCY DEEP DIVE: THE KEY STORY")

    print("""
The most striking finding in the data is the dramatic shift from agency to bank
staffing in the medical & dental workforce, and what this means for costs.

HEADLINE: Agency caps have NOT moved doctors into permanent roles.
They have moved spending from agency into bank.

EVIDENCE:

  Medical & Dental Agency spend:
    2019/20: £1.20bn
    2023/24: £1.13bn  (-5.8%)

  Medical & Dental Bank spend:
    2019/20: £0.90bn
    2023/24: £1.90bn  (+111%)

  Total temporary medical spend:
    2019/20: £2.10bn
    2023/24: £3.03bn  (+44%)

  So total temporary medical spend INCREASED by ~£930m despite
  agency caps, because bank spending absorbed (and exceeded) any
  agency savings.

WHY THIS MATTERS:

  1. BANK IS NOT FREE: While bank rates are typically lower than agency rates
     per shift, the volume increase means total temporary spend is RISING.

  2. BANK PREMIUM IS GROWING: Medical bank shifts often attract enhanced
     rates (weekend/unsocial hours). Some trusts pay bank rates that approach
     or exceed the agency cap rate paid directly to workers.

  3. NO WORKFORCE PLANNING BENEFIT: Unlike permanent staff, bank workers
     provide no continuity, training capacity, or team stability. The NHS
     has swapped one form of temporary labour for another.

  4. PENSION & EMPLOYER COSTS: Substantive staff costs include employer
     pension contributions (now 23.7% of pensionable pay from April 2024),
     apprenticeship levy, and other on-costs. Bank staff may receive some
     of these benefits but agency workers typically do not - so the per-FTE
     comparison is more nuanced than headline rates suggest.

WHAT'S DIFFERENT ABOUT ACUTE TRUSTS:

  Acute trusts are the HEAVIEST users of temporary medical staff because:
  - They run 24/7 rotas requiring constant cover
  - Specialty gaps (emergency medicine, radiology, psychiatry liaison)
    are hardest to fill permanently
  - Junior doctor rota gaps from training requirements/annual leave
  - Industrial action in 2023/24 increased locum/bank usage

  Acute trusts account for the majority (~70-75%) of total NHS provider
  medical agency and bank spend.

Sources:
  - REC: https://www.rec.uk.com/our-view/policy-and-campaigns/health-social-care/
    nhs-stats-highlight-costly-impact
  - DHSC DDRB evidence: https://www.gov.uk/government/publications/
    dhsc-evidence-for-the-ddrb-pay-round-2025-to-2026
  - NHS England consolidated accounts: https://www.england.nhs.uk/long-read/
    consolidated-nhs-provider-accounts-2024-25/
""")


def trust_level_guidance():
    """Guidance on accessing trust-level data."""
    print_section("HOW TO ACCESS TRUST-LEVEL DATA")

    print("""
For INDIVIDUAL TRUST breakdowns, two main routes:

1. TRUST ACCOUNTS CONSOLIDATION (TAC) DATA
   =========================================
   URL: https://www.england.nhs.uk/financial-accounting-and-reporting/
        nhs-providers-tac-data-publications/

   This is the BEST source for trust-level staff cost data. It contains:
   - Note 7.1: Employee benefits by cost type (salaries, SSC, pension,
     agency, bank) split by Permanent/Other
   - Note 7.2: Average number of employees by staff group (medical &
     dental, nursing, etc.) split by Permanent/Other
   - Trust-level data for all ~210 NHS providers

   The data is published as two XLSX files:
   - TAC data for NHS trusts
   - TAC data for NHS foundation trusts

   The MainCode/SubCode system identifies each data item. Use the
   illustrative TAC file to understand the layout.

   The TAC data for individual trust Note 7 gives agency and bank
   costs as separate line items within "Other" staff category.

2. INDIVIDUAL TRUST ANNUAL REPORTS
   ================================
   Each trust publishes annual accounts containing Note 7 (Employee
   benefits). The format shows:

   Note 7.1 Employee benefits
   +-----------------------------------------+------------+--------+--------+
   |                                         | Permanently|        |        |
   |                                         | Employed   | Other  | Total  |
   |                                         | £000       | £000   | £000   |
   +-----------------------------------------+------------+--------+--------+
   | Salaries and wages                      | xxx        | xxx    | xxx    |
   | Social security costs                   | xxx        | xxx    | xxx    |
   | Apprenticeship levy                     | xxx        | xxx    | xxx    |
   | Employer contributions to NHS pension   | xxx        | xxx    | xxx    |
   | Pension cost - other                    | xxx        | xxx    | xxx    |
   | Temporary staff - agency/contract staff | -          | xxx    | xxx    |
   | Temporary staff - bank staff            | -          | xxx    | xxx    |
   +-----------------------------------------+------------+--------+--------+
   | Total gross staff costs                 | xxx        | xxx    | xxx    |
   +-----------------------------------------+------------+--------+--------+

   Note 7.2 Average number of employees (WTE basis)
   +-----------------------------------------+------------+--------+--------+
   |                                         | Permanently|        |        |
   |                                         | Employed   | Other  | Total  |
   +-----------------------------------------+------------+--------+--------+
   | Medical and dental                      | xxx        | xxx    | xxx    |
   | Nursing, midwifery and health visiting  | xxx        | xxx    | xxx    |
   | ...other staff groups...                | xxx        | xxx    | xxx    |
   +-----------------------------------------+------------+--------+--------+

   IMPORTANT: Note 7.1 gives COSTS by type (agency vs bank vs permanent)
   but NOT split by staff group. Note 7.2 gives NUMBERS by staff group
   but NOT split by cost type.

   The CROSS-TABULATION (medical costs by agency/bank/permanent) is only
   available in the TAC data, not in the published annual accounts format.

3. ACUTE TRUST IDENTIFICATION
   ============================
   To filter to acute trusts specifically, cross-reference with the
   NHS Organisation Data Service (ODS):
   https://digital.nhs.uk/services/organisation-data-service/

   Acute trusts have organisation type code "RHA" (Acute Trust) or
   are NHS Foundation Trusts that are classified as acute providers.
   The NHS England etr.csv file lists all trust types.

Run analysis.py to download and process the TAC data automatically.
""")


def summary():
    """Print executive summary."""
    print_section("EXECUTIVE SUMMARY")
    print("""
NHS ACUTE TRUST MEDICAL & DENTAL STAFF SPEND ANALYSIS
=====================================================

TOTAL MEDICAL & DENTAL PAY BILL (all NHS providers, 2023/24): ~£20.4bn
  Derived from DDRB evidence: bank = 9.3% of medical pay bill (£1.9bn => £20.4bn)

  - Substantive (permanent): ~£17.4bn  (85.2%)
  - Bank:                     £1.90bn  ( 9.3%) <- CONFIRMED from DDRB evidence
  - Agency/Locum:             £1.13bn  ( 5.5%) <- CONFIRMED from DDRB evidence

TREND (2019/20 to 2023/24):
  - Permanent staff costs: Growing steadily (~8-9% p.a.), driven by pay
    awards and pension contribution increases
  - Agency spend: STABLE at ~£1.1-1.2bn - caps working to contain costs
  - Bank spend: SURGING from £0.9bn to £1.9bn (+114%) - the big story

THE CRITICAL INSIGHT - BANK vs AGENCY:
  Agency price caps introduced by NHS England have successfully constrained
  agency spend on medical staff. BUT this has NOT led to doctors taking
  permanent roles. Instead, the spend has shifted to bank work:

  - Agency share of temporary medical spend: 57% (2019/20) -> 37% (2023/24)
  - Bank share of temporary medical spend:   43% (2019/20) -> 63% (2023/24)
  - Total temporary spend has INCREASED despite agency controls

  This means the policy has changed WHERE the money goes, but has not
  reduced the NHS's dependence on temporary medical staffing.

FOR 2024/25:
  - Total agency spend across all groups fell to ~£2.1bn (from £3.0bn)
  - Further 30% agency reduction target for 2025/26
  - New 10% bank reduction target also introduced
  - Medical bank spending growth is the key metric to watch

NOTE ON DATA GRANULARITY:
  The aggregate data above covers all NHS providers. For acute-trust-specific
  breakdowns, the TAC (Trust Accounts Consolidation) data provides trust-level
  detail. Run analysis.py to download and process this data.

  A key limitation is that published annual accounts do NOT provide the
  cross-tabulation of costs by BOTH staff group AND employment type.
  This is available only in the TAC submission data.
""")


if __name__ == '__main__':
    print("\n" + "="*80)
    print("  NHS MEDICAL & DENTAL STAFF SPEND ANALYSIS")
    print("  Based on published aggregate data from consolidated provider accounts")
    print("="*80)

    summary()
    md_temp_df = medical_dental_temporary_staffing()
    all_agency_df = all_staff_agency_spend()
    perm_df, md_df = permanent_vs_temporary()
    bank_vs_agency_deep_dive()
    trust_level_guidance()

    print_section("ANALYSIS COMPLETE")
    print("Charts saved to current directory.")
    print("For trust-level analysis, run: python analysis.py")
