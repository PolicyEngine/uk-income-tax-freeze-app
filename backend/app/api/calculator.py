from policyengine_uk import Microsimulation
from typing import Dict


def calculate_over_years(income: float, freeze_thresholds: bool = True) -> Dict[int, float]:
    """
    Calculate household net income over multiple years based on the freeze policy.
    
    Args:
        income: Annual employment income
        freeze_thresholds: Whether to freeze income tax thresholds or adjust for inflation
        
    Returns:
        Dictionary mapping years to net income values
    """
    results = {}
    for year in range(2022, 2030):
        # Create simulation for each year
        simulation = Microsimulation()
        
        # Create synthetic household with given income
        simulation.add_person(
            person_id=0, 
            age=40, 
            employment_income=income
        )
        simulation.set_household_weight(0, 1)
        
        # Apply income tax threshold adjustments based on freeze policy
        if not freeze_thresholds and year > 2022:
            # Assume 2% inflation for uprating thresholds
            inflation_adjustment = (1.02) ** (year - 2022)
            # Adjust thresholds if not frozen
            simulation.modify_parameters(
                lambda p, year=year, adj=inflation_adjustment: adjust_thresholds(p, year, adj)
            )
            
        # Calculate net income
        simulation.calculate("household_net_income")
        
        # Store result for this year
        results[year] = float(simulation.calculate("household_net_income").values[0])
    
    return results


def adjust_thresholds(parameters, year: int, adjustment_factor: float):
    """
    Adjust income tax thresholds based on an inflation factor.
    
    Args:
        parameters: PolicyEngine parameters tree
        year: The tax year
        adjustment_factor: The inflation adjustment factor
        
    Returns:
        Modified parameters
    """
    # Adjust income tax thresholds for inflation
    for threshold in ["personal_allowance", "basic_rate_limit", "higher_rate_limit"]:
        if hasattr(parameters.gov.hmrc.income_tax, threshold):
            current_value = getattr(parameters.gov.hmrc.income_tax, threshold).values[-1]
            setattr(
                parameters.gov.hmrc.income_tax, 
                threshold, 
                current_value * adjustment_factor
            )
    return parameters