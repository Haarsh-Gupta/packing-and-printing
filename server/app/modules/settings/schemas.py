from pydantic import BaseModel, Field
from typing import Optional

class SiteSettingsBase(BaseModel):
    company_name: str
    company_address: str
    company_state_code: str
    company_gstin: Optional[str] = None
    company_pan: Optional[str] = None
    bank_details: Optional[str] = None
    shipping_is_taxable: bool = True

class SiteSettingsUpdate(BaseModel):
    company_name: Optional[str] = None
    company_address: Optional[str] = None
    company_state_code: Optional[str] = None
    company_gstin: Optional[str] = None
    company_pan: Optional[str] = None
    bank_details: Optional[str] = None
    shipping_is_taxable: Optional[bool] = None

class SiteSettingsResponse(SiteSettingsBase):
    id: int

    model_config = {"from_attributes": True}
