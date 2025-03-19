from fastapi import APIRouter, HTTPException
from .models import WageGrowthRequest, CalculationResponse
from .calculator import calculate_impact_over_years, get_projected_thresholds, OBR_EARNINGS_GROWTH, CURRENT_PARAMETERS
from typing import Dict, List, Union

router = APIRouter(prefix="/api")


@router.post("/calculate", response_model=CalculationResponse)
async def calculate_impact(request: WageGrowthRequest):
    """
    Calculate the impact of extending the income tax threshold freeze to 2028/29 and 2029/30.
    
    Args:
        request: Income and wage growth request
    
    Returns:
        CalculationResponse with impact analysis
    """
    try:
        # Convert the income items to a list of dictionaries
        income_items = [{"amount": item.amount, "type": item.type} for item in request.incomes]
        
        # Calculate impact over years using the provided parameters
        results = calculate_impact_over_years(
            incomes=income_items,
            wage_growth=request.wage_growth
        )
        
        # Get projected thresholds for both scenarios
        baseline_thresholds, reform_thresholds = get_projected_thresholds()
        
        with_freeze_results = results["with_freeze"]
        without_freeze_results = results["without_freeze"]
        
        # Format results for chart - only for years 2025-2029
        chart_data = []
        for year in range(2025, 2030):
            chart_data.append({
                "year": year,
                "with_freeze": with_freeze_results.get(year, 0),
                "without_freeze": without_freeze_results.get(year, 0),
                "difference": without_freeze_results.get(year, 0) - with_freeze_results.get(year, 0)
            })
        
        # Convert year keys to strings for JSON compatibility
        with_freeze_str_keys = {str(k): v for k, v in with_freeze_results.items()}
        without_freeze_str_keys = {str(k): v for k, v in without_freeze_results.items()}
        
        # Calculate total impact - differences only matter in 2028-2029
        # since the freeze is already in place until 2027/28
        total_impact = sum(
            without_freeze_results.get(year, 0) - with_freeze_results.get(year, 0) 
            for year in range(2028, 2030)
        )
        
        # Fill in wage growth values - use OBR if empty dict was passed or fall back to custom values
        complete_wage_growth = {}
        for year in range(2026, 2030):
            year_str = str(year)
            if not request.wage_growth:  # Empty dict = use OBR projections
                complete_wage_growth[year_str] = OBR_EARNINGS_GROWTH.get(year_str, 0.02)
            else:
                complete_wage_growth[year_str] = request.wage_growth.get(
                    year_str, OBR_EARNINGS_GROWTH.get(year_str, 0.02)
                )
        
        # Calculate total base income
        total_base_income = sum(item.amount for item in request.incomes)
        
        # Calculate income type proportions for the assumptions
        income_types = {}
        for item in request.incomes:
            if item.type in income_types:
                income_types[item.type] += item.amount / total_base_income
            else:
                income_types[item.type] = item.amount / total_base_income
            
        # Format tax parameters for response
        tax_parameters = {
            "current": CURRENT_PARAMETERS,
            "baseline": {
                param: {str(year): value for year, value in years.items()}
                for param, years in baseline_thresholds.items()
            },
            "reform": {
                param: {str(year): value for year, value in years.items()}
                for param, years in reform_thresholds.items()
            }
        }
        
        return CalculationResponse(
            with_freeze=with_freeze_str_keys,
            without_freeze=without_freeze_str_keys,
            chart_data=chart_data,
            total_impact=total_impact,
            assumptions={
                "base_income": total_base_income,
                "wage_growth": complete_wage_growth,
                "income_types": income_types,
                "obr_earnings_growth": {str(k): v for k, v in OBR_EARNINGS_GROWTH.items()}
            },
            tax_parameters=tax_parameters
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))