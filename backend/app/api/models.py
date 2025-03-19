from pydantic import BaseModel, Field
from typing import Dict, List, Optional, Union, Any


class WageGrowthRequest(BaseModel):
    income: float = Field(..., description="Current annual income in GBP (2025)")
    wage_growth: Dict[str, float] = Field(
        default_factory=lambda: {"2026": 0.02, "2027": 0.02, "2028": 0.02, "2029": 0.02},
        description="Annual wage growth rate for future years (e.g., {'2026': 0.02, '2027': 0.02, '2028': 0.02, '2029': 0.02} for 2% growth)"
    )
    income_types: Dict[str, float] = Field(
        default_factory=lambda: {"employment_income": 1.0},
        description="Proportion of income by type (should sum to 1.0)"
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