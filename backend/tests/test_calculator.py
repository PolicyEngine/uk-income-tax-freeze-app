import pytest
from app.api.calculator import calculate_over_years


def test_calculate_over_years_with_freeze():
    """
    Test that calculation with freeze returns expected results.
    """
    income = 50000
    results = calculate_over_years(income, freeze_thresholds=True)
    
    # Basic checks
    assert len(results) == 8  # 2022-2029
    assert 2022 in results
    assert 2029 in results
    
    # Income should be positive
    for year, net_income in results.items():
        assert net_income > 0
        
    # Income should decrease or stay the same over years with frozen thresholds
    # (as inflation pushes more income into higher tax bands)
    for year in range(2023, 2030):
        assert results[year] <= results[year-1]


def test_calculate_over_years_without_freeze():
    """
    Test that calculation without freeze returns expected results.
    """
    income = 50000
    results = calculate_over_years(income, freeze_thresholds=False)
    
    # Basic checks
    assert len(results) == 8  # 2022-2029
    assert 2022 in results
    assert 2029 in results
    
    # Income should be positive
    for year, net_income in results.items():
        assert net_income > 0


def test_with_freeze_less_favorable_than_without():
    """
    Test that take-home pay with frozen thresholds is less than with inflation-adjusted thresholds.
    """
    income = 50000
    with_freeze = calculate_over_years(income, freeze_thresholds=True)
    without_freeze = calculate_over_years(income, freeze_thresholds=False)
    
    # First year should be identical
    assert with_freeze[2022] == without_freeze[2022]
    
    # Subsequent years should show impact of freeze
    for year in range(2023, 2030):
        assert with_freeze[year] <= without_freeze[year]