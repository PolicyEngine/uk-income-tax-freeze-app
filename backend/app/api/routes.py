from fastapi import APIRouter, HTTPException
from .models import WageGrowthRequest, CalculationResponse
from .calculator import calculate_impact_over_years
from typing import Dict, List, Union

router = APIRouter(prefix="/api")


@router.post("/calculate", response_model=CalculationResponse)
async def calculate_impact(request: WageGrowthRequest):
    """
    Calculate the impact of income tax threshold freezes based on the provided income and wage growth.
    
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
        
        # Format results for chart
        chart_data = []
        for year in range(2023, 2030):
            chart_data.append({
                "year": year,
                "with_freeze": with_freeze_results.get(year, 0),
                "without_freeze": without_freeze_results.get(year, 0),
                "difference": without_freeze_results.get(year, 0) - with_freeze_results.get(year, 0)
            })
        
        # Convert year keys to strings for JSON compatibility
        with_freeze_str_keys = {str(k): v for k, v in with_freeze_results.items()}
        without_freeze_str_keys = {str(k): v for k, v in without_freeze_results.items()}
        
        # Calculate total impact (the extra tax paid due to frozen thresholds)
        total_impact = sum(
            without_freeze_results.get(year, 0) - with_freeze_results.get(year, 0) 
            for year in range(2023, 2030)
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