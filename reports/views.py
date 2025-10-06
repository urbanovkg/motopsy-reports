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
from django.http import JsonResponse  # вверху файла

# Create your views here.
# views.py
from django.contrib.auth.decorators import login_required

# УДАЛИ/КОММЕНТИРУЙ это (не нужно):
# def login(request):
#     return render(request, 'login.html', {})



def index(request):
    return render(request, 'index.html', {})


@login_required
def list(request):
    if request.method == 'POST':
        # 0) pk для режима редактирования
        pk = request.POST.get('report_id') or None

        # 1) Прочитать JSON из скрытых полей
        report_data     = json.loads(request.POST.get("report_data_text") or "{}")
        vehicle_data    = json.loads(request.POST.get("vehicle_data_text") or "{}")
        inspection_text = json.loads(request.POST.get("inspection_text") or "{}")

        services  = request.POST.get("services_table")
        materials = request.POST.get("materials_table")
        parts     = request.POST.get("parts_table")
        uts       = request.POST.get("uts_table")
        ost       = request.POST.get("ost_table")

        ui_state_raw = request.POST.get("ui_state")
        ui_state = json.loads(ui_state_raw) if ui_state_raw else {}

        # 2) Сопоставление ключей ИЗ script.js -> поля модели
        defaults = dict(
            # --- данные отчёта (ключи: см. script.js -> reportData)
            doc_type               = report_data.get("doctype"),
            inspection_date        = report_data.get("idate") or None,
            calculation_date       = report_data.get("cdate") or None,
            report_number          = report_data.get("contractnum"),
            ass_reason             = report_data.get("assreason"),
            client_name            = report_data.get("customer"),
            ownership_identification = report_data.get("property"),
            inspection_place       = report_data.get("position"),
            evaluation_purpose     = report_data.get("purpose"),
            results_purpose        = report_data.get("appointment"),
            cost_type              = report_data.get("costtype"),
            contract_price         = report_data.get("contractcost"),
            contract_price_in_words= report_data.get("costinwords"),
            exchange_rate          = report_data.get("exchangerate"),

            # --- данные объекта (ключи: см. script.js -> vehicleData)
            ass_object      = vehicle_data.get("assobject"),
            vehicle_model   = vehicle_data.get("model"),
            vehicle_year    = vehicle_data.get("year"),
            vehicle_regnum  = vehicle_data.get("regnum"),
            vehicle_vin     = vehicle_data.get("vin"),
            vehicle_frame   = vehicle_data.get("frame"),
            vehicle_passport= vehicle_data.get("passport"),
            vehicle_volume  = vehicle_data.get("volume"),
            vehicle_mileage = vehicle_data.get("mileage"),
            vehicle_color   = vehicle_data.get("color"),
            vehicle_type    = vehicle_data.get("type"),
            vehicle_body    = vehicle_data.get("body"),
            vehicle_gearbox = vehicle_data.get("gearbox"),
            vehicle_steering= vehicle_data.get("steering"),
            hourcost        = vehicle_data.get("hourcost"),
            vehicle_owner   = vehicle_data.get("owner"),
            vehicle_adress  = vehicle_data.get("adress"),

            # --- «таблицы» и доп. JSON
            services_table  = services,
            materials_table = materials,
            parts_table     = parts,
            uts_table       = uts,
            ost_table       = ost,

            # Если у вас есть JSONField — можно класть как есть; иначе сериализуйте в строку
            inspection_text_json = inspection_text,
            report_data_json     = report_data,
            vehicle_data_json    = vehicle_data,

            # --- ВАЖНО: распаковываем текст Акта по полям модели (для DOCX)
            definition_text=inspection_text.get("definition", ""),
            disassembly_text=inspection_text.get("disassembly", ""),
            repair_text=inspection_text.get("repair", ""),
            painting_text=inspection_text.get("painting", ""),
            additional_text=inspection_text.get("additional", ""),
            hidden_text=inspection_text.get("hidden", ""),
            parts_text=inspection_text.get("parts", ""),
            damaged_body_parts_text=inspection_text.get("damagedBodyParts", ""),
            damaged_other_parts_text=inspection_text.get("damagedOtherParts", ""),
            unbroken_parts_text=inspection_text.get("unbrokenParts", ""),

            # --- снимок UI с фронта
            ui_state = ui_state,
        )

        # 3) Привести даты, если в модели DateField
        for key in ('inspection_date', 'calculation_date'):
            if defaults[key]:
                try:
                    defaults[key] = datetime.strptime(defaults[key], "%Y-%m-%d").date()
                except Exception:
                    defaults[key] = None

        # 4) UPDATE если pk пришёл, иначе CREATE
        if pk:
            obj = get_object_or_404(Report, pk=pk)

            # не перезатираем поля пустыми значениями
            for k, v in defaults.items():
                if v in (None, ""):
                    continue
                setattr(obj, k, v)

            # report_number обязателен — подстрахуемся
            if not obj.report_number:
                obj.report_number = obj.report_number or datetime.now().strftime("%Y%m%d/%H%M%S")

            obj.save()
        else:
            # при создании номер обязателен
            if not defaults.get("report_number"):
                defaults["report_number"] = datetime.now().strftime("%Y%m%d/%H%M%S")
            obj = Report.objects.create(**defaults)

    # ваш рендер списка
    reports = Report.objects.order_by('inspection_date')
    num_reports = Report.objects.count()
    return render(request, 'list.html', {'num_reports': num_reports, 'reports': reports})

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
    ost_table_list = is_json(all_report.ost_table)

    obj_lowercase = all_report.ass_object.lower()
    doc = DocxTemplate(settings.MEDIA_ROOT + "/report.docx")
    context = {'document_type' : all_report.doc_type, 'assessment_reason' : all_report.ass_reason, 'used_methods' : Report.METHOD_CHOICES[int(all_report.used_methods)][1], 'assessment_object' : all_report.ass_object, 'vehicle_gearbox' : all_report.vehicle_gearbox, 'vehicle_steering' : all_report.vehicle_steering, 'exchange_rate' : all_report.exchange_rate, 'object_lowercase' : obj_lowercase, 'contract_number' : all_report.report_number, 'inspection_date': dateformat.format(all_report.inspection_date, settings.DATE_FORMAT) + ' г.', 'calc_date': dateformat.format(all_report.calculation_date, settings.DATE_FORMAT) + ' г.' , 'customer_name': all_report.client_name, 'property_owner': Report.OWNERSHIP_CHOICES[int(all_report.ownership_identification)][1], 'vehicle_location': all_report.inspection_place , 'evaluation_purpose': Report.EVALUATION_CHOICES[int(all_report.evaluation_purpose)][1], 'evaluation_appointment': Report.RESULTS_CHOICES[int(all_report.results_purpose)][1], 'cost_type': Report.COST_CHOICES[int(all_report.cost_type)][1], 'cost_type_id': all_report.cost_type, 'contract_cost': all_report.contract_price,  'vehicle_model': all_report.vehicle_model, 'vehicle_year': all_report.vehicle_year, 'vehicle_number': all_report.vehicle_regnum, 'vehicle_vin': all_report.vehicle_vin, 'vehicle_frame': all_report.vehicle_frame, 'vehicle_passport': all_report.vehicle_passport, 'vehicle_engine_volume': all_report.vehicle_volume, 'vehicle_mileage': all_report.vehicle_mileage, 'vehicle_color': all_report.vehicle_color, 'vehicle_type': all_report.vehicle_type, 'vehicle_body_type': all_report.vehicle_body, 'cost_per_hour': all_report.hourcost, 'vehicle_owner': all_report.vehicle_owner, 'vehicle_adress': all_report.vehicle_adress, 'disassembly': all_report.disassembly_text, 'damagedBodyParts': all_report.damaged_body_parts_text, 'unbrokenParts': all_report.unbroken_parts_text, 'damagedOtherParts': all_report.damaged_other_parts_text, 'definition': all_report.definition_text, 'repair': all_report.repair_text, 'painting': all_report.painting_text, 'additional': all_report.additional_text, 'hidden': all_report.hidden_text, 'parts': all_report.parts_text, 'services_table': services_table_list, 'materials_table': materials_table_list, 'parts_table': parts_table_list, 'uts_table': uts_table_list, 'ost_table': ost_table_list, 's_result': all_report.services_result, 'm_result': all_report.materials_result, 't_result': all_report.total_result, 'uts_percent': all_report.uts_percent, 'ost_percent': all_report.ost_percent, 'kv': all_report.kv, 'kz': all_report.kz, 'kop': all_report.kop,}

    if all_report.cost_type == "0":
        file_name = ' Ремонт.docx'
    elif all_report.cost_type == "1":
        file_name = ' Ремонт и УТС.docx'
    elif all_report.cost_type == "2":
        file_name = ' Лом.docx'
    else:
        file_name = ' Лом и ремонт.docx'

    doc.render(context)
    byte_io = BytesIO()
    doc.save(byte_io)
    byte_io.seek(0)
    return FileResponse(byte_io, as_attachment=True, filename=all_report.report_number.split('/')[0] + file_name)


def contract_create(request, pk):
    all_report = get_object_or_404(Report, pk=pk)
    doc = DocxTemplate(settings.MEDIA_ROOT + "/contract.docx")
    context = {'document_type' : all_report.doc_type, 'assessment_object' : all_report.ass_object, 'contract_number' : all_report.report_number, 'inspection_date': dateformat.format(all_report.inspection_date, settings.DATE_FORMAT) + ' г.', 'customer_name': all_report.client_name, 'evaluation_purpose': Report.EVALUATION_CHOICES[int(all_report.evaluation_purpose)][1], 'cost_type': Report.COST_CHOICES[int(all_report.cost_type)][1], 'contract_cost': all_report.contract_price, 'contract_cost_in_words': all_report.contract_price_in_words, 'vehicle_model': all_report.vehicle_model, 'vehicle_number': all_report.vehicle_regnum,}
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
    ost_table_list = is_json(all_report.ost_table)
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
        utsSheet.cell(column=5, row=elem+2, value='=D{}*Средн!$D$22/100'.format(elem+2))
    utsSheet["G2"] = '=SUM(D2:D{}'.format(utsLen+1)+')'
    utsSheet["H2"] = '=SUM(E2:E{}'.format(utsLen+1)+')'
    utsSheet["G4"] = float(all_report.uts_percent.replace(' ', '').replace(',', '.'))

    ostSheet = wb.worksheets[8]
    ostLen = len(ost_table_list)
    for elem in range(ostLen):
        ostSheet.cell(column=1, row=elem+3, value=ost_table_list[elem]['text'])
        ostSheet.cell(column=2, row=elem+3, value=float(ost_table_list[elem]['ost'].replace(' ', '').replace(',', '.')))
        ostSheet.cell(column=3, row=elem+3, value='=($E$2*$F$2*$G$2*Средн!$D$22*B{})/100'.format(elem+3))
    ostSheet["E2"] = float(all_report.kz.replace(' ', '').replace(',', '.'))
    ostSheet["F2"] = float(all_report.kv.replace(' ', '').replace(',', '.'))
    ostSheet["G2"] = float(all_report.kop.replace(' ', '').replace(',', '.'))
    ostSheet["E4"] = float(all_report.ost_percent.replace(' ', '').replace(',', '.'))
    ostSheet["F4"] = '=SUM(B3:B{}'.format(ostLen+2)+')'
    ostSheet["G4"] = '=SUM(C3:C{}'.format(ostLen+2)+')'

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




def report_json(request, pk: int):
    """Отдаёт JSON для префилла UI по отчёту pk."""
    report = get_object_or_404(Report, pk=pk)

    def d(val):
        return "" if val is None else str(val)

    data = {
        "fields": {
            # раздел «Данные отчёта»
            "doc_type": d(report.doc_type),
            "inspection_date": report.inspection_date.strftime("%Y-%m-%d") if report.inspection_date else "",
            "calc_date": report.calculation_date.strftime("%Y-%m-%d") if report.calculation_date else "",
            "contract_number": d(report.report_number),
            "ass_reason": d(report.ass_reason),
            "customer_name": d(report.client_name),
            "property_owner": d(report.ownership_identification),  # value у <select>
            "vehicle_location": d(report.inspection_place),
            "evaluation_purpose": d(report.evaluation_purpose),
            "evaluation_appointment": d(report.results_purpose),
            "cost_type": d(report.cost_type),
            "contract_cost": d(report.contract_price),
            "contract_cost_in_words": d(report.contract_price_in_words),
            "exchange_rate": d(report.exchange_rate),

            # раздел «Данные объекта оценки»
            "ass_object": d(report.ass_object),
            "vehicle_model": d(report.vehicle_model),
            "vehicle_year": d(report.vehicle_year),
            "vehicle_number": d(report.vehicle_regnum),
            "vehicle_vin": d(report.vehicle_vin),
            "vehicle_frame": d(report.vehicle_frame),
            "vehicle_passport": d(report.vehicle_passport),
            "vehicle_engine_volume": d(report.vehicle_volume),
            "vehicle_mileage": d(report.vehicle_mileage),
            "vehicle_color": d(report.vehicle_color),
            "vehicle_type": d(report.vehicle_type),          # текстовое поле рядом с селектом типов
            "vehicle_body_type": d(report.vehicle_body),     # текстовое поле рядом с селектом кузова
            "vehicle_gearbox": d(report.vehicle_gearbox),
            "vehicle_steering": d(report.vehicle_steering),
            "cost_per_hour": d(report.hourcost),
            "class": d(report.hourcost),  # чтобы синхронизировать селект «Класс ТС»
            "vehicle_owner": d(report.vehicle_owner),
            "vehicle_adress": d(report.vehicle_adress),
        },

        # Блоки работ/материалов (чекбоксы и т.д.) восстанавливаем, если вы начнёте хранить «снимок UI».
        # На первом этапе оставьте пустым — см. Шаг 5 (опционально) ниже.
        "blocks": report.ui_state.get("blocks", []) if report.ui_state else []
    }
    return JsonResponse(data)








def edit(request, pk: int):
    # Рендерим ту же index.html, но прокидываем pk
    return render(request, 'index.html', {"prefill_id": pk})

