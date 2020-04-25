from django.shortcuts import render, get_object_or_404
from django.http import HttpResponse, FileResponse
import json
from docxtpl import DocxTemplate
from django.conf import settings
from .models import Report
from io import BytesIO
from datetime import date, datetime
from django.utils import dateformat

# Create your views here.
def login(request):
    return render(request, 'login.html', {})

def index(request):
    return render(request, 'index.html', {})

def list(request):
    if request.method == 'POST':
        report_data = json.loads (request.POST.get("report_data_text", None))
        vehicle_data = json.loads (request.POST.get("vehicle_data_text", None))
        inspection_text = json.loads (request.POST.get("inspection_text", None))
        services = json.loads (request.POST.get("services_table", None))
        materials = json.loads (request.POST.get("materials_table", None))
        parts = json.loads (request.POST.get("parts_table", None))

        obj = Report.objects.create(report_number=report_data['contractnum'], inspection_date=report_data['idate'], calculation_date=report_data['cdate'], client_name=report_data['customer'], ownership_identification=report_data['property'], inspection_place=report_data['position'], evaluation_purpose=report_data['purpose'], results_purpose=report_data['appointment'], cost_type=report_data['costtype'], contract_price=report_data['contractcost'], contract_price_in_words=report_data['costinwords'], vehicle_model=vehicle_data['model'], vehicle_year=vehicle_data['year'], vehicle_regnum=vehicle_data['regnum'], vehicle_vin=vehicle_data['vin'], vehicle_frame=vehicle_data['frame'], vehicle_passport=vehicle_data['passport'], vehicle_volume=vehicle_data['volume'], vehicle_mileage=vehicle_data['mileage'], vehicle_color=vehicle_data['color'], vehicle_type=vehicle_data['type'], vehicle_body=vehicle_data['body'], hourcost=vehicle_data['hourcost'], vehicle_owner=vehicle_data['owner'], vehicle_adress=vehicle_data['adress'], disassembly_text=inspection_text['disassembly'], repair_text=inspection_text['repair'], painting_text=inspection_text['painting'], additional_text=inspection_text['additional'], hidden_text=inspection_text['hidden'], parts_text=inspection_text['parts'], services_table=services, materials_table=materials, parts_table=parts)

    reports = Report.objects.order_by('inspection_date')
    num_reports=Report.objects.all().count()
    return render(request, 'list.html', context={'num_reports':num_reports, 'reports':reports})

def report_create(request, pk):
    all_report = get_object_or_404(Report, pk=pk)
    doc = DocxTemplate(settings.MEDIA_ROOT + "/template.docx")
    context = {'contract_number' : all_report.report_number, 'inspection_date': dateformat.format(all_report.inspection_date, settings.DATE_FORMAT) + ' г.', 'calc_date': dateformat.format(all_report.calculation_date, settings.DATE_FORMAT) + ' г.' , 'customer_name': all_report.client_name, 'property_owner': all_report.ownership_identification, 'vehicle_location': all_report.inspection_place , 'evaluation_purpose': all_report.evaluation_purpose, 'evaluation_appointment': all_report.results_purpose, 'cost_type': all_report.cost_type, 'contract_cost': all_report.contract_price,  'vehicle_model': all_report.vehicle_model, 'vehicle_year': all_report.vehicle_year, 'vehicle_number': all_report.vehicle_regnum, 'vehicle_vin': all_report.vehicle_vin, 'vehicle_frame': all_report.vehicle_frame, 'vehicle_passport': all_report.vehicle_passport, 'vehicle_engine_volume': all_report.vehicle_volume, 'vehicle_mileage': all_report.vehicle_mileage, 'vehicle_color': all_report.vehicle_color, 'vehicle_type': all_report.vehicle_type, 'vehicle_body_type': all_report.vehicle_body, 'cost_per_hour': all_report.hourcost, 'vehicle_owner': all_report.vehicle_owner, 'vehicle_adress': all_report.vehicle_adress, 'disassembly': all_report.disassembly_text, 'repair': all_report.repair_text, 'painting': all_report.painting_text, 'additional': all_report.additional_text, 'hidden': all_report.hidden_text, 'parts': all_report.parts_text}
    doc.render(context)
    byte_io = BytesIO()
    doc.save(byte_io)
    byte_io.seek(0)
    return FileResponse(byte_io, as_attachment=True, filename=all_report.report_number.split('/')[0] + ".docx")
