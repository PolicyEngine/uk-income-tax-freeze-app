from policyengine_uk import Simulation
from typing import Dict, List, Union
import pandas as pd
import numpy as np

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
    simulation = Simulation(situation=household, reform=FREEZE_REFORM if freeze_thresholds else None)
    
    return simulation.calculate_dataframe(VARIABLES, year)


def build_household(
    income: float, 
    year: int, 
    income_types: Dict[str, float],
    wage_growth: Dict[str, float]
) -> dict:
    """
    Create a household dictionary for PolicyEngine simulation.
    
    Args:
        income: Base income amount
        year: The simulation year
        income_types: Dictionary mapping income types to proportions
        wage_growth: Dictionary mapping years to growth rates
        
    Returns:
        Household dictionary for PolicyEngine
    """
    # Apply wage growth to income for years after the current year (2023)
    current_year = 2023
    adjusted_income = income
    
    # Apply compounding growth for each year
    for growth_year in range(current_year + 1, year + 1):
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
    Calculate the impact of income tax threshold freezes over multiple years.
    
    Args:
        income: Base income (current year)
        wage_growth: Dictionary of wage growth rates by year
        income_types: Dictionary of income type proportions
        
    Returns:
        Dictionary with results for both policy scenarios
    """
    with_freeze_results = {}
    without_freeze_results = {}
    
    for year in range(2023, 2030):
        # Create household for this year
        household = build_household(income, year, income_types, wage_growth)
        
        # Calculate with freeze
        with_freeze_df = calculate_household_df(household, year, freeze_thresholds=True)
        with_freeze_results[year] = float(with_freeze_df["household_net_income"].iloc[0])
        
        # Calculate without freeze
        without_freeze_df = calculate_household_df(household, year, freeze_thresholds=False)
        without_freeze_results[year] = float(without_freeze_df["household_net_income"].iloc[0])
    
    return {
        "with_freeze": with_freeze_results,
        "without_freeze": without_freeze_results
    }