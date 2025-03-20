from typing import Dict, List, Tuple, Union

import numpy as np
import pandas as pd
from policyengine_core.reforms import Reform
from policyengine_uk import CountryTaxBenefitSystem, Microsimulation, Simulation

# OBR earnings growth projections (March 2024)
OBR_EARNINGS_GROWTH = {
    "2024": 0.0456,  # 4.56%
    "2025": 0.0297,  # 2.97%
    "2026": 0.0209,  # 2.09%
    "2027": 0.0198,  # 1.98%
    "2028": 0.0236,  # 2.36%
    "2029": 0.0265,  # 2.65%
}

# Tax parameters - current law
CURRENT_PARAMETERS = {
    "personal_allowance": 12_570,
    "basic_rate_limit": 37_700,
    "higher_rate_threshold": 50_270,
    "additional_rate_threshold": 125_140,
    "basic_rate": 0.20,
    "higher_rate": 0.40,
    "additional_rate": 0.45,
}

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
    "household_id",
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
    "household_weight",
]

baseline_microsimulation = Microsimulation(dataset="hf://policyengine/policyengine-uk-data/enhanced_frs_2022_23.h5")
reform_microsimulation = Microsimulation(reform=FREEZE_REFORM, dataset="hf://policyengine/policyengine-uk-data/enhanced_frs_2022_23.h5")

baseline_population_df_2028 = baseline_microsimulation.calculate_dataframe(VARIABLES[1:], 2028)
# Calculate selection probability
household_weights = baseline_population_df_2028.household_weight.values
selection_probs = household_weights / household_weights.sum()

# Select households
selected_households = np.random.choice(
    baseline_population_df_2028.household_id.values, 
    1000, 
    replace=False, 
    p=selection_probs
)
reform_population_df_2028 = reform_microsimulation.calculate_dataframe(VARIABLES[1:], 2028)

baseline_population_df_2029 = baseline_microsimulation.calculate_dataframe(VARIABLES[1:], 2029)
reform_population_df_2029 = reform_microsimulation.calculate_dataframe(VARIABLES[1:], 2029)

# Filter dataframes to selected households
def filter_to_selected(df, household_selection):
    return df.set_index("household_id").loc[household_selection].reset_index()

baseline_population_df_2028 = filter_to_selected(baseline_population_df_2028, selected_households)
reform_population_df_2028 = filter_to_selected(reform_population_df_2028, selected_households)
baseline_population_df_2029 = filter_to_selected(baseline_population_df_2029, selected_households)
reform_population_df_2029 = filter_to_selected(reform_population_df_2029, selected_households)

def calculate_household_df(
    household: dict, year: int, freeze_thresholds: bool = False
) -> pd.DataFrame:
    """
    From an OpenFisca-style household dictionary, year, and reform policy.

    Returns a dataframe with a row for each person and a column for relevant variables.
    """
    tax_system = reform_system if freeze_thresholds else baseline_system
    simulation = Simulation(situation=household, tax_benefit_system=tax_system)
    
    result = simulation.calculate_dataframe(VARIABLES, year)

    return result


def build_household(
    incomes: List[Dict[str, Union[float, str]]], 
    year: int, 
    wage_growth: Dict[str, float]
) -> dict:
    """
    Create a household dictionary for PolicyEngine simulation.
    
    Args:
        incomes: List of income items with amount and type
        year: The simulation year
        wage_growth: Dictionary mapping years to growth rates
        
    Returns:
        Household dictionary for PolicyEngine
    """
    # Apply wage growth to income for years after the base year (2025)
    base_year = 2025
    
    # Create person with multiple income sources
    person = {"age": 40}
    
    for income_item in incomes:
        income_type = income_item["type"]
        base_amount = income_item["amount"]
        
        # Apply compounding growth for each year after 2025
        adjusted_amount = base_amount
        for growth_year in range(base_year + 1, year + 1):
            if not wage_growth:  # Empty dict = use OBR projections
                growth_rate = OBR_EARNINGS_GROWTH.get(str(growth_year), 0.02)
            else:
                # Get growth rate from custom values or fall back to OBR
                obr_rate = OBR_EARNINGS_GROWTH.get(str(growth_year), 0.02)
                growth_rate = wage_growth.get(str(growth_year), obr_rate)
            adjusted_amount *= (1 + growth_rate)
        
        # Add or increment the income value in the person dict
        if income_type in person:
            person[income_type] += adjusted_amount
        else:
            person[income_type] = adjusted_amount
    
    return {"people": {"person": person}}


def calculate_impact_over_years(
    incomes: List[Dict[str, Union[float, str]]],
    wage_growth: Dict[str, float]
) -> Dict[str, Dict[int, float]]:
    """
    Calculate the impact of extending the income tax threshold freeze to 2028/29 and 2029/30.
    
    Args:
        incomes: List of income items with amount and type
        wage_growth: Dictionary of wage growth rates by year
        
    Returns:
        Dictionary with results for both policy scenarios
    """
    with_freeze_results = {}
    without_freeze_results = {}
    
    # Only calculate for years 2025 through 2029
    for year in range(2025, 2030):
        # Create household for this year
        household = build_household(incomes, year, wage_growth)
        
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


def get_income_percentile_impact_data() -> List[Dict[str, Union[float, int]]]:
    """
    Generate data for a scatter plot showing the percentage change in combined net income 
    across income percentiles due to the threshold freeze extension.
    
    Returns:
        List of dictionaries with income percentile and percentage change in net income
    """
    # First, calculate the impact for each household in 2028 and 2029
    baseline_income_2028 = baseline_population_df_2028.household_net_income.values
    baseline_income_2029 = baseline_population_df_2029.household_net_income.values
    baseline_combined_income = baseline_income_2028 + baseline_income_2029
    
    reform_income_2028 = reform_population_df_2028.household_net_income.values
    reform_income_2029 = reform_population_df_2029.household_net_income.values
    reform_combined_income = reform_income_2028 + reform_income_2029
    
    # Calculate the absolute difference in combined income (£)
    absolute_difference = baseline_combined_income - reform_combined_income
    
    # Calculate the percentage change in combined income (as decimal, not %)
    income_difference = baseline_combined_income - reform_combined_income
    percentage_change = income_difference / baseline_combined_income
    
    # Handle NaN, Infinity values, and clip at 0
    absolute_difference = pd.Series(absolute_difference).replace([np.inf, -np.inf], np.nan)
    absolute_difference = np.maximum(absolute_difference, 0)  # Clip at 0
    
    percentage_change = pd.Series(percentage_change).replace([np.inf, -np.inf], np.nan)
    percentage_change = np.maximum(percentage_change, 0)  # Clip at 0
    
    # Create a DataFrame with the necessary data
    impact_df = pd.DataFrame({
        'household_id': baseline_population_df_2028.household_id,
        'net_income': baseline_population_df_2028.household_net_income,
        'percentage_change': percentage_change.values,
        'absolute_difference': absolute_difference.values,
        'household_weight': baseline_population_df_2028.household_weight
    })
    
    # Drop rows with NaN values
    impact_df = impact_df.dropna()
    
    # Calculate percentiles based on household net income, as suggested
    impact_df['percentile'] = impact_df.net_income.rank(pct=True) * 100
    
    # Convert to list of dictionaries for the API response
    scatter_data = []
    for _, row in impact_df.iterrows():
        try:
            # Ensure all values are valid for JSON serialization
            percentile = float(row['percentile'])
            percentage_change = float(row['percentage_change']) * 100
            absolute_difference = float(row['absolute_difference'])
            
            # Check for NaN or infinity
            if (np.isnan(percentile) or np.isinf(percentile) or 
                np.isnan(percentage_change) or np.isinf(percentage_change) or
                np.isnan(absolute_difference) or np.isinf(absolute_difference)):
                continue
                
            scatter_data.append({
                'percentile': percentile,
                'percentage_change': percentage_change,  # Convert to percentage
                'absolute_difference': absolute_difference
            })
        except (ValueError, TypeError):
            # Skip any rows that can't be properly converted
            continue
    
    return scatter_data


def get_projected_thresholds() -> Tuple[Dict[str, Dict[int, float]], Dict[str, Dict[int, float]]]:
    """
    Calculate projected thresholds for both policy scenarios.
    
    Returns:
        Tuple of dictionaries containing thresholds for baseline and reform scenarios
    """
    # Baseline - thresholds uprated by CPI after 2027/28
    baseline_thresholds = {
        "personal_allowance": {},
        "basic_rate_limit": {},
        "higher_rate_threshold": {},
    }
    
    # Reform - thresholds frozen until 2029/30
    reform_thresholds = {
        "personal_allowance": {},
        "basic_rate_limit": {},
        "higher_rate_threshold": {},
    }
    
    # Apply projected CPI inflation (using OBR forecasts as a proxy)
    # CPI would uprate thresholds from 2028 onwards in the baseline
    cpi_uplift_2028 = 1.02  # Assumed 2% CPI for 2028/29
    cpi_uplift_2029 = 1.02  # Assumed 2% CPI for 2029/30
    
    # 2025-2027 thresholds are the same in both scenarios (already frozen)
    for year in range(2025, 2028):
        # Get the current parameters for easy reference
        pa = CURRENT_PARAMETERS["personal_allowance"]
        brl = CURRENT_PARAMETERS["basic_rate_limit"]
        hrt = CURRENT_PARAMETERS["higher_rate_threshold"]
        
        # Set baseline thresholds
        baseline_thresholds["personal_allowance"][year] = pa
        baseline_thresholds["basic_rate_limit"][year] = brl
        baseline_thresholds["higher_rate_threshold"][year] = hrt
        
        # Set reform thresholds (same in these years)
        reform_thresholds["personal_allowance"][year] = pa
        reform_thresholds["basic_rate_limit"][year] = brl
        reform_thresholds["higher_rate_threshold"][year] = hrt
    
    # 2028 - baseline would be uprated, reform would be frozen
    pa = CURRENT_PARAMETERS["personal_allowance"]
    brl = CURRENT_PARAMETERS["basic_rate_limit"]
    hrt = CURRENT_PARAMETERS["higher_rate_threshold"]
    
    # Baseline with CPI uprating
    baseline_thresholds["personal_allowance"][2028] = int(pa * cpi_uplift_2028)
    baseline_thresholds["basic_rate_limit"][2028] = int(brl * cpi_uplift_2028)
    baseline_thresholds["higher_rate_threshold"][2028] = int(hrt * cpi_uplift_2028)
    
    # Reform with frozen thresholds
    reform_thresholds["personal_allowance"][2028] = pa
    reform_thresholds["basic_rate_limit"][2028] = brl
    reform_thresholds["higher_rate_threshold"][2028] = hrt
    
    # 2029 - baseline would be uprated twice, reform would be frozen
    compound_uplift = cpi_uplift_2028 * cpi_uplift_2029
    
    # Baseline with compound CPI uprating
    baseline_thresholds["personal_allowance"][2029] = int(pa * compound_uplift)
    baseline_thresholds["basic_rate_limit"][2029] = int(brl * compound_uplift)
    baseline_thresholds["higher_rate_threshold"][2029] = int(hrt * compound_uplift)
    
    # Reform with frozen thresholds
    reform_thresholds["personal_allowance"][2029] = pa
    reform_thresholds["basic_rate_limit"][2029] = brl
    reform_thresholds["higher_rate_threshold"][2029] = hrt
    
    return baseline_thresholds, reform_thresholds