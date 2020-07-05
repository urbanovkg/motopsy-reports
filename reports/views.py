from django.shortcuts import render, get_object_or_404
from django.http import HttpResponse, FileResponse
import json
from docxtpl import DocxTemplate
from django.conf import settings
from .models import Report
from io import BytesIO
from datetime import date, datetime
from django.utils import dateformat
from openpyxl import Workbook, load_workbook

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
        services = request.POST.get("services_table", None)
        materials = request.POST.get("materials_table", None)
        parts = request.POST.get("parts_table", None)
        uts = request.POST.get("uts_table", None)

        obj = Report.objects.create(doc_type=report_data['doctype'], ass_reason=report_data['assreason'], used_methods=report_data['usedmethods'], exchange_rate=report_data['exchangerate'], report_number=report_data['contractnum'], inspection_date=report_data['idate'], calculation_date=report_data['cdate'], client_name=report_data['customer'], ownership_identification=report_data['property'], inspection_place=report_data['position'], evaluation_purpose=report_data['purpose'], results_purpose=report_data['appointment'], cost_type=report_data['costtype'], contract_price=report_data['contractcost'], contract_price_in_words=report_data['costinwords'], vehicle_model=vehicle_data['model'], vehicle_year=vehicle_data['year'], vehicle_regnum=vehicle_data['regnum'], vehicle_vin=vehicle_data['vin'], vehicle_frame=vehicle_data['frame'], vehicle_passport=vehicle_data['passport'], vehicle_volume=vehicle_data['volume'], vehicle_mileage=vehicle_data['mileage'], vehicle_color=vehicle_data['color'], vehicle_gearbox=vehicle_data['gearbox'], vehicle_steering=vehicle_data['steering'], ass_object=vehicle_data['assobject'], vehicle_type=vehicle_data['type'], vehicle_body=vehicle_data['body'], hourcost=vehicle_data['hourcost'], vehicle_owner=vehicle_data['owner'], vehicle_adress=vehicle_data['adress'], disassembly_text=inspection_text['disassembly'], repair_text=inspection_text['repair'], painting_text=inspection_text['painting'], additional_text=inspection_text['additional'], hidden_text=inspection_text['hidden'], parts_text=inspection_text['parts'], services_table=services, materials_table=materials, parts_table=parts, uts_table=uts, services_result=report_data['servicesres'], materials_result=report_data['materialsres'], uts_percent=report_data['utspercent'])

    reports = Report.objects.order_by('inspection_date')
    num_reports=Report.objects.all().count()
    return render(request, 'list.html', context={'num_reports':num_reports, 'reports':reports})


def is_json(myjson):
    try:
        myvar = json.loads(myjson)
    except ValueError as e:
        myvar = json.loads('[]')
    finally:
        return myvar


def report_create(request, pk):
    all_report = get_object_or_404(Report, pk=pk)

    services_table_list = is_json(all_report.services_table)
    materials_table_list = is_json(all_report.materials_table)
    parts_table_list = is_json(all_report.parts_table)
    uts_table_list = is_json(all_report.uts_table)

    obj_lowercase = all_report.ass_object.lower()
    doc = DocxTemplate(settings.MEDIA_ROOT + "/report.docx")
    context = {'document_type' : all_report.doc_type, 'assessment_reason' : all_report.ass_reason, 'used_methods' : Report.METHOD_CHOICES[int(all_report.used_methods)][1], 'assessment_object' : all_report.ass_object, 'vehicle_gearbox' : all_report.vehicle_gearbox, 'vehicle_steering' : all_report.vehicle_steering, 'exchange_rate' : all_report.exchange_rate, 'object_lowercase' : obj_lowercase, 'contract_number' : all_report.report_number, 'inspection_date': dateformat.format(all_report.inspection_date, settings.DATE_FORMAT) + ' г.', 'calc_date': dateformat.format(all_report.calculation_date, settings.DATE_FORMAT) + ' г.' , 'customer_name': all_report.client_name, 'property_owner': Report.OWNERSHIP_CHOICES[int(all_report.ownership_identification)][1], 'vehicle_location': all_report.inspection_place , 'evaluation_purpose': Report.EVALUATION_CHOICES[int(all_report.evaluation_purpose)][1], 'evaluation_appointment': Report.RESULTS_CHOICES[int(all_report.results_purpose)][1], 'cost_type': Report.COST_CHOICES[int(all_report.cost_type)][1],'cost_type_id': all_report.cost_type, 'contract_cost': all_report.contract_price,  'vehicle_model': all_report.vehicle_model, 'vehicle_year': all_report.vehicle_year, 'vehicle_number': all_report.vehicle_regnum, 'vehicle_vin': all_report.vehicle_vin, 'vehicle_frame': all_report.vehicle_frame, 'vehicle_passport': all_report.vehicle_passport, 'vehicle_engine_volume': all_report.vehicle_volume, 'vehicle_mileage': all_report.vehicle_mileage, 'vehicle_color': all_report.vehicle_color, 'vehicle_type': all_report.vehicle_type, 'vehicle_body_type': all_report.vehicle_body, 'cost_per_hour': all_report.hourcost, 'vehicle_owner': all_report.vehicle_owner, 'vehicle_adress': all_report.vehicle_adress, 'disassembly': all_report.disassembly_text, 'repair': all_report.repair_text, 'painting': all_report.painting_text, 'additional': all_report.additional_text, 'hidden': all_report.hidden_text, 'parts': all_report.parts_text, 'services_table': services_table_list, 'materials_table': materials_table_list, 'parts_table': parts_table_list, 'uts_table': uts_table_list, 's_result': all_report.services_result, 'm_result': all_report.materials_result, 'uts_percent': all_report.uts_percent,}

    if all_report.cost_type == "0":
        file_name = ' Восстановление.docx'
    else:
        file_name = ' Восстановление с УТС.docx'

    doc.render(context)
    byte_io = BytesIO()
    doc.save(byte_io)
    byte_io.seek(0)
    return FileResponse(byte_io, as_attachment=True, filename=all_report.report_number.split('/')[0] + file_name)

def contract_create(request, pk):
    all_report = get_object_or_404(Report, pk=pk)
    doc = DocxTemplate(settings.MEDIA_ROOT + "/contract.docx")
    context = {'document_type' : all_report.doc_type, 'assessment_object' : all_report.ass_object, 'contract_number' : all_report.report_number, 'inspection_date': dateformat.format(all_report.inspection_date, settings.DATE_FORMAT) + ' г.', 'customer_name': all_report.client_name, 'evaluation_purpose': Report.EVALUATION_CHOICES[int(all_report.evaluation_purpose)][1], 'contract_cost': all_report.contract_price, 'contract_cost_in_words': all_report.contract_price_in_words, 'vehicle_model': all_report.vehicle_model, 'vehicle_number': all_report.vehicle_regnum,}
    doc.render(context)
    byte_io = BytesIO()
    doc.save(byte_io)
    byte_io.seek(0)
    return FileResponse(byte_io, as_attachment=True, filename=all_report.report_number.split('/')[0] + " Договор.docx")

def cash_document(request, pk):
    all_report = get_object_or_404(Report, pk=pk)
    services_table_list = is_json(all_report.services_table)
    materials_table_list = is_json(all_report.materials_table)
    parts_table_list = is_json(all_report.parts_table)
    uts_table_list = is_json(all_report.uts_table)
    wb = load_workbook(settings.MEDIA_ROOT + "/excel.xlsx")
    activeSheet = wb.active
    activeSheet["B1"] = all_report.doc_type
    activeSheet["B2"] = all_report.report_number
    activeSheet["B3"] = all_report.ass_reason
    activeSheet["B4"] = dateformat.format(all_report.inspection_date, settings.DATE_FORMAT) + ' г.'
    activeSheet["B5"] = dateformat.format(all_report.calculation_date, settings.DATE_FORMAT) + ' г.'
    activeSheet["B6"] = all_report.client_name
    activeSheet["B7"] = Report.OWNERSHIP_CHOICES[int(all_report.ownership_identification)][1]
    activeSheet["B8"] = all_report.inspection_place
    activeSheet["B9"] = Report.EVALUATION_CHOICES[int(all_report.evaluation_purpose)][1]
    activeSheet["B10"] = Report.RESULTS_CHOICES[int(all_report.results_purpose)][1]
    activeSheet["B11"] = Report.COST_CHOICES[int(all_report.cost_type)][1]
    activeSheet["B12"] = Report.METHOD_CHOICES[int(all_report.used_methods)][1]
    activeSheet["B13"] = float(all_report.contract_price.replace(' ', '').replace(',', '.'))
    activeSheet["B14"] = all_report.contract_price_in_words

    activeSheet["B16"] = all_report.ass_object
    activeSheet["B17"] = all_report.vehicle_model
    activeSheet["B18"] = all_report.vehicle_regnum
    activeSheet["B19"] = all_report.vehicle_vin
    activeSheet["B20"] = all_report.vehicle_frame
    activeSheet["B21"] = all_report.vehicle_passport
    activeSheet["B22"] = all_report.vehicle_year
    activeSheet["B23"] = all_report.vehicle_volume
    activeSheet["B24"] = all_report.vehicle_mileage
    activeSheet["B25"] = all_report.vehicle_color
    activeSheet["B26"] = all_report.vehicle_type + ' ' + all_report.vehicle_body
    activeSheet["B27"] = all_report.vehicle_gearbox
    activeSheet["B28"] = all_report.vehicle_steering
    activeSheet["B29"] = all_report.vehicle_owner
    activeSheet["B30"] = all_report.vehicle_adress

    activeSheet["B32"] = float(all_report.exchange_rate)
    activeSheet["B33"] = all_report.hourcost

    utsSheet = wb.worksheets[7]
    utsLen = len(uts_table_list)
    for elem in range(utsLen):
        utsSheet.cell(column=1, row=elem+2, value=elem+1)
        utsSheet.cell(column=2, row=elem+2, value=uts_table_list[elem]['text'])
        utsSheet.cell(column=3, row=elem+2, value=uts_table_list[elem]['quant'])
        utsSheet.cell(column=4, row=elem+2, value=float(uts_table_list[elem]['uts'].replace(' ', '').replace(',', '.')))
        utsSheet.cell(column=5, row=elem+2, value='=D{}*Средн!$D$22'.format(elem+2))
    utsSheet["G2"] = '=SUM(D2:D{}'.format(utsLen+1)+')'
    utsSheet["H2"] = '=SUM(E2:E{}'.format(utsLen+1)+')'
    utsSheet["G4"] = float(all_report.uts_percent.replace(' ', '').replace(',', '.'))

    damageSheet = wb.worksheets[5]
    servicesLen = len(services_table_list)
    for elem in range(servicesLen):
        damageSheet.cell(column=1, row=elem+2, value=elem+1)
        damageSheet.cell(column=2, row=elem+2, value=services_table_list[elem]['text'])
        damageSheet.cell(column=3, row=elem+2, value=services_table_list[elem]['quant'])
        damageSheet.cell(column=4, row=elem+2, value=float(services_table_list[elem]['norm'].replace(' ', '').replace(',', '.')))
        damageSheet.cell(column=5, row=elem+2, value='=C{}'.format(elem+2)+'*D{}*Дано!$B$33'.format(elem+2))
    damageSheet["G2"] = '=SUM(E2:E{}'.format(servicesLen+1)+')'
    materialsLen = len(materials_table_list)
    materialsStartRow = servicesLen+4
    damageSheet.cell(column=1, row=materialsStartRow-1, value='№')
    damageSheet.cell(column=2, row=materialsStartRow-1, value='Материалы')
    damageSheet.cell(column=3, row=materialsStartRow-1, value='Кол-во')
    damageSheet.cell(column=4, row=materialsStartRow-1, value='Цена')
    damageSheet.cell(column=5, row=materialsStartRow-1, value='Стоимость')
    for elem in range(materialsLen):
        damageSheet.cell(column=1, row=elem+materialsStartRow, value=elem+1)
        damageSheet.cell(column=2, row=elem+materialsStartRow, value=materials_table_list[elem]['text'])
        damageSheet.cell(column=3, row=elem+materialsStartRow, value=materials_table_list[elem]['quant'])
        damageSheet.cell(column=4, row=elem+materialsStartRow, value=float(materials_table_list[elem]['norm'].replace(' ', '').replace(',', '.')))
        damageSheet.cell(column=5, row=elem+materialsStartRow, value='=C{}'.format(elem+materialsStartRow)+'*D{}'.format(elem+materialsStartRow))
    partsLen = len(parts_table_list)
    partsStartRow = materialsLen+materialsStartRow+2
    damageSheet["H2"] = '=SUM(E{}'.format(materialsStartRow)+':E{}'.format(partsStartRow-3)+')'
    damageSheet.cell(column=1, row=partsStartRow-1, value='№')
    damageSheet.cell(column=2, row=partsStartRow-1, value='Запасные части')
    damageSheet.cell(column=3, row=partsStartRow-1, value='Кол-во')
    damageSheet.cell(column=4, row=partsStartRow-1, value='Цена')
    damageSheet.cell(column=5, row=partsStartRow-1, value='Стоимость')
    for elem in range(partsLen):
        damageSheet.cell(column=1, row=elem+partsStartRow, value=elem+1)
        damageSheet.cell(column=2, row=elem+partsStartRow, value=parts_table_list[elem]['text'])
        damageSheet.cell(column=3, row=elem+partsStartRow, value=parts_table_list[elem]['quant'])
        damageSheet.cell(column=4, row=elem+partsStartRow, value=0)
        damageSheet.cell(column=5, row=elem+partsStartRow, value='=C{}'.format(elem+partsStartRow)+'*D{}'.format(elem+partsStartRow))
    damageSheet["I2"] = '=SUM(E{}'.format(partsStartRow)+':E{}'.format(partsStartRow+partsLen-1)+')'
    damageSheet["G4"] = float(all_report.services_result.replace(' ', '').replace(',', '.'))
    damageSheet["H4"] = float(all_report.materials_result.replace(' ', '').replace(',', '.'))
    byte_io = BytesIO()
    wb.save(byte_io)
    byte_io.seek(0)
    return FileResponse(byte_io, as_attachment=True, filename=all_report.report_number.split('/')[0] + ".xlsx")
