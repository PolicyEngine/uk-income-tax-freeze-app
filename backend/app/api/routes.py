from fastapi import APIRouter, HTTPException
from .models import WageGrowthRequest, CalculationResponse
from .calculator import calculate_impact_over_years
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
        # Calculate impact over years using the provided parameters
        results = calculate_impact_over_years(
            income=request.income,
            wage_growth=request.wage_growth,
            income_types=request.income_types
        )
        
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
        
        return CalculationResponse(
            with_freeze=with_freeze_str_keys,
            without_freeze=without_freeze_str_keys,
            chart_data=chart_data,
            total_impact=total_impact,
            assumptions={
                "base_income": request.income,
                "wage_growth": request.wage_growth,
                "income_types": request.income_types
            }
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))