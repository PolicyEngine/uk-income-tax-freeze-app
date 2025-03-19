from fastapi import APIRouter, HTTPException
from .models import IncomeRequest, CalculationResponse
from .calculator import calculate_over_years
from typing import Dict, List, Union

router = APIRouter(prefix="/api")


@router.post("/calculate", response_model=CalculationResponse)
async def calculate_impact(request: IncomeRequest):
    """
    Calculate the impact of income tax threshold freezes based on the provided income.
    
    Args:
        request: Income request containing income value
    
    Returns:
        CalculationResponse with impact analysis
    """
    try:
        # Calculate impact with current freeze
        with_freeze_results = calculate_over_years(request.income, freeze_thresholds=True)
        
        # Calculate impact without freeze
        without_freeze_results = calculate_over_years(request.income, freeze_thresholds=False)
        
        # Format results for chart
        chart_data = []
        for year in range(2022, 2030):
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
            for year in range(2022, 2030)
        )
        
        return CalculationResponse(
            with_freeze=with_freeze_str_keys,
            without_freeze=without_freeze_str_keys,
            chart_data=chart_data,
            total_impact=total_impact
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))