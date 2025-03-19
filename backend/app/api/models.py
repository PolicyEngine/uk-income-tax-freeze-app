from pydantic import BaseModel, Field
from typing import Dict, List, Optional, Union, Any


class IncomeItem(BaseModel):
    amount: float = Field(..., description="Income amount in GBP")
    type: str = Field(..., description="Type of income (employment_income, self_employment_income, etc.)")


class WageGrowthRequest(BaseModel):
    incomes: List[IncomeItem] = Field(..., description="List of income items with amounts and types")
    wage_growth: Dict[str, float] = Field(
        default_factory=lambda: {"2026": 0.02, "2027": 0.02, "2028": 0.02, "2029": 0.02},
        description="Annual wage growth rate for future years (e.g., {'2026': 0.02, '2027': 0.02, '2028': 0.02, '2029': 0.02} for 2% growth)"
    )


class YearlyDataPoint(BaseModel):
    year: int
    with_freeze: float
    without_freeze: float
    difference: float


class CalculationResponse(BaseModel):
    with_freeze: Dict[str, float]
    without_freeze: Dict[str, float]
    chart_data: List[Dict[str, Union[int, float]]]
    total_impact: float
    assumptions: Dict[str, Union[float, Dict[str, float]]]
    tax_parameters: Dict[str, Any] = Field(
        description="Information about tax parameters in each scenario"
    )