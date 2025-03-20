import pytest
from app.api.calculator import calculate_impact_over_years


def test_calculate_impact_over_years():
    """
    Test that calculation returns expected results for both freeze scenarios.
    """
    # Create a simple income list with employment income
    incomes = [{"amount": 50000, "type": "employment_income"}]
    wage_growth = {}  # Use default OBR projections
    
    # Call the function that's being tested
    results = calculate_impact_over_years(incomes, wage_growth)
    
    # Check that we have both scenarios
    assert "with_freeze" in results
    assert "without_freeze" in results
    
    # Check we have results for years 2025-2029
    with_freeze = results["with_freeze"]
    without_freeze = results["without_freeze"]
    
    for year in range(2025, 2030):
        assert year in with_freeze
        assert year in without_freeze
        
        # Income should be positive
        assert with_freeze[year] > 0
        assert without_freeze[year] > 0
    
    # Frozen thresholds should result in less net income in 2028 and 2029
    # (years where the freeze is extended but not in baseline)
    for year in [2028, 2029]:
        assert with_freeze[year] < without_freeze[year]
    
    # Years 2025-2027 should be identical in both scenarios
    # (freeze already exists in both scenarios)
    for year in range(2025, 2028):
        assert with_freeze[year] == without_freeze[year]