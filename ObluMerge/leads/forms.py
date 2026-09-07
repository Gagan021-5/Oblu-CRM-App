from django import forms
from .models import (
    Lead, LeadFollowUp, LeadRemark, CallLog,
    ReasonCode, RemarkRelevance, LeadSource, LeadStage
)
from customer_dashboard.models import SalesPerson


class LeadUploadForm(forms.Form):
    """CSV/Excel upload for bulk lead import."""
    file        = forms.FileField(
        label="Upload CSV / Excel",
        widget=forms.FileInput(attrs={"accept": ".csv,.xlsx,.xls"})
    )
    salesperson = forms.ModelChoiceField(
        queryset=SalesPerson.objects.all().order_by("name"),
        required=False,
        empty_label="— Assign to salesperson (optional) —"
    )
    source      = forms.ModelChoiceField(
        queryset=LeadSource.objects.filter(is_active=True).order_by("name"),
        required=False,
        empty_label="— Select lead source (optional) —"
    )


class LeadCreateForm(forms.ModelForm):
    class Meta:
        model   = Lead
        fields  = [
            "name", "phone", "email",
            "state", "district", "address",
            "source", "salesperson", "stage",
            "status", "followup_date", "followup_note",
            "extra_data",
        ]
        widgets = {
            "followup_date": forms.DateInput(attrs={"type": "date"}),
            "extra_data":    forms.Textarea(attrs={"rows": 3,
                                                   "placeholder": '{"product_interest": "X"}'}),
            "address":       forms.Textarea(attrs={"rows": 2}),
            "followup_note": forms.Textarea(attrs={"rows": 2}),
        }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        for field in self.fields.values():
            field.widget.attrs.setdefault("class", "form-control")
        self.fields["stage"].queryset = LeadStage.objects.order_by("order")
        self.fields["source"].queryset = LeadSource.objects.filter(
            is_active=True).order_by("name")
        self.fields["salesperson"].queryset = SalesPerson.objects.order_by("name")


class LeadEditForm(LeadCreateForm):
    pass


class LeadStageUpdateForm(forms.Form):
    """Used by the AJAX drag-and-drop Kanban."""
    lead_id  = forms.IntegerField()
    stage_id = forms.IntegerField()


class CallLogForm(forms.ModelForm):
    class Meta:
        model   = CallLog
        fields  = ["connection_status", "duration_minutes"]
        widgets = {
            "duration_minutes": forms.NumberInput(
                attrs={"placeholder": "Duration (mins)", "min": 0}
            ),
        }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        for field in self.fields.values():
            field.widget.attrs.setdefault("class", "form-control")


class LeadRemarkForm(forms.ModelForm):
    class Meta:
        model   = LeadRemark
        fields  = [
            "remark", "reason_code", "relevance",
            "quoted_price", "requested_price", "product_discussed",
            "not_interested_why",
        ]
        widgets = {
            "remark":            forms.Textarea(attrs={"rows": 3,
                                                        "placeholder": "Your notes…"}),
            "quoted_price":      forms.NumberInput(attrs={"step": "0.01"}),
            "requested_price":   forms.NumberInput(attrs={"step": "0.01"}),
            "product_discussed": forms.TextInput(attrs={"placeholder": "Product name"}),
        }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        for field in self.fields.values():
            field.widget.attrs.setdefault("class", "form-control")
        self.fields["reason_code"].queryset = ReasonCode.objects.filter(
            is_active=True).order_by("category")
        self.fields["relevance"].queryset = RemarkRelevance.objects.all()
        # Price / not-interested fields are hidden by default;
        # JS shows them based on reason_code selection
        for f in ["quoted_price", "requested_price",
                  "product_discussed", "not_interested_why"]:
            self.fields[f].required = False


class LeadFollowUpForm(forms.ModelForm):
    class Meta:
        model   = LeadFollowUp
        fields  = ["followup_date", "note"]
        widgets = {
            "followup_date": forms.DateInput(attrs={"type": "date"}),
            "note":          forms.Textarea(attrs={"rows": 2}),
        }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        for field in self.fields.values():
            field.widget.attrs.setdefault("class", "form-control")