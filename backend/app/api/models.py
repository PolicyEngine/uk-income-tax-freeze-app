from pydantic import BaseModel
from typing import Dict, List, Optional, Union


class IncomeRequest(BaseModel):
    income: float


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