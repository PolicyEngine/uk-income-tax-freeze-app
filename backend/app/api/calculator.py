from policyengine_uk import Simulation, CountryTaxBenefitSystem
from policyengine_core.reforms import Reform
from typing import Dict, List, Union
import pandas as pd
import numpy as np

# Reform that extends the freeze to 2028/29 and 2029/30
FREEZE_REFORM = {
    "gov.hmrc.income_tax.allowances.personal_allowance.amount": {
        "2028-01-01.2029-12-31": 12_570,
        "2029-01-01.2030-12-31": 12_570,
    },
    "gov.hmrc.income_tax.rates.uk[1].threshold": {
        "2028-01-01.2029-12-31": 37_700,
        "2029-01-01.2030-12-31": 37_700,
    },
}

baseline_system = CountryTaxBenefitSystem()
reform_system = Reform.from_dict(FREEZE_REFORM)(CountryTaxBenefitSystem())

VARIABLES = [
    "person_id",
    "employment_income",
    "self_employment_income",
    "state_pension",
    "pension_income",
    "dividend_income",
    "savings_interest_income",
    "property_income",
    "income_tax",
    "household_market_income",
    "household_tax",
    "household_benefits",
    "household_net_income",
]


def calculate_household_df(household: dict, year: int, freeze_thresholds: bool = False) -> pd.DataFrame:
    """
    From an OpenFisca-style household dictionary, year, and reform policy, return a dataframe with a row for each person
    and a column for relevant variables.
    """
    import time
    start = time.time()
    simulation = Simulation(situation=household, tax_benefit_system=reform_system if freeze_thresholds else baseline_system)
    print(f"Simulation setup took {time.time() - start:.2f} seconds")
    start = time.time()
    result = simulation.calculate_dataframe(VARIABLES, year)
    print(f"Simulation calculation took {time.time() - start:.2f} seconds")
    return result



def build_household(
    income: float, 
    year: int, 
    income_types: Dict[str, float],
    wage_growth: Dict[str, float]
) -> dict:
    """
    Create a household dictionary for PolicyEngine simulation.
    
    Args:
        income: Base income amount (2025)
        year: The simulation year
        income_types: Dictionary mapping income types to proportions
        wage_growth: Dictionary mapping years to growth rates
        
    Returns:
        Household dictionary for PolicyEngine
    """
    # Apply wage growth to income for years after the base year (2025)
    base_year = 2025
    adjusted_income = income
    
    # Apply compounding growth for each year after 2025
    for growth_year in range(base_year + 1, year + 1):
        growth_rate = wage_growth.get(str(growth_year), 0.02)  # Default to 2% growth
        adjusted_income *= (1 + growth_rate)
    
    # Create person with distributed income sources
    person = {"age": 40}
    
    for income_type, proportion in income_types.items():
        if proportion > 0:
            person[income_type] = adjusted_income * proportion
    
    return {"people": {"person": person}}


def calculate_impact_over_years(
    income: float,
    wage_growth: Dict[str, float],
    income_types: Dict[str, float]
) -> Dict[str, Dict[int, float]]:
    """
    Calculate the impact of extending the income tax threshold freeze to 2028/29 and 2029/30.
    
    Args:
        income: Base income (2025)
        wage_growth: Dictionary of wage growth rates by year
        income_types: Dictionary of income type proportions
        
    Returns:
        Dictionary with results for both policy scenarios
    """
    with_freeze_results = {}
    without_freeze_results = {}
    
    # Only calculate for years 2025 through 2029
    for year in range(2025, 2030):
        # Create household for this year
        household = build_household(income, year, income_types, wage_growth)
        
        # Calculate with freeze extension
        with_freeze_df = calculate_household_df(household, year, freeze_thresholds=True)
        with_freeze_results[year] = float(with_freeze_df["household_net_income"].iloc[0])
        
        # Calculate without freeze extension (status quo - thresholds would be uprated)
        without_freeze_df = calculate_household_df(household, year, freeze_thresholds=False)
        without_freeze_results[year] = float(without_freeze_df["household_net_income"].iloc[0])
    
    return {
        "with_freeze": with_freeze_results,
        "without_freeze": without_freeze_results
    }