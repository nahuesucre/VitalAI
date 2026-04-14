from pydantic import BaseModel


class MetricsOverview(BaseModel):
    patients_by_status: dict[str, int] = {}
    visits_by_status: dict[str, int] = {}
    alerts_by_type: dict[str, int] = {}
    alerts_by_severity: dict[str, int] = {}
    common_missing_procedures: list[dict] = []
    deviations_by_category: list[dict] = []
    total_patients: int = 0
    total_visits: int = 0
    total_alerts_open: int = 0
