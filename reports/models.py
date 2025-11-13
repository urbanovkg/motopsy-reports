from django.db import models
from django.urls import reverse
from datetime import date
import os, re
from datetime import datetime


# Create your models here.


class Report(models.Model):
    doc_type = models.CharField("Тип документа", max_length=32, help_text="Отчет или Заключение", default="Отчет")
    ass_reason = models.CharField("Основание оценки", max_length=256,
                                  help_text="Договор, запрос, определение, постановление", default="Договор")

    report_number = models.CharField("Номер отчета", max_length=32, help_text="Введи в фомате ннн-мм/гг",
                                     default="000-00/20")
    inspection_date = models.DateField("Дата осмотра (договора)", default=date.today)
    calculation_date = models.DateField("Дата расчета", default=date.today)
    client_name = models.CharField("Ф.И.О. заказчика", max_length=256, help_text="Введи Ф.И.О. полностью",
                                   default="Н/у")
    PRIVATE = "0"
    MUNICIPAL = "1"
    STATE = "2"
    UNKNOWN = "3"
    OWNERSHIP_CHOICES = [
        (PRIVATE, 'Частная собственность'),
        (MUNICIPAL, 'Муниципальная собственность'),
        (STATE, 'Государственная собственность'),
        (UNKNOWN, 'Н/у'),
    ]
    ownership_identification = models.CharField("Право собственности", max_length=1, choices=OWNERSHIP_CHOICES,
                                                default=PRIVATE)
    inspection_place = models.CharField("Место осмотра:", max_length=256, help_text="Введи хотя бы населенный пункт",
                                        default="Н/у")
    ACCIDENT = "0"
    IGNITION = "1"
    OTHER = "2"
    EVALUATION_CHOICES = [
        (ACCIDENT, 'Определение стоимости ущерба, причиненного вследствие дорожно-транспортного происшествия'),
        (IGNITION, 'Определение стоимости ущерба, причиненного вследствие возгорания транспортного средства'),
        (OTHER, 'Определение стоимости причиненного ущерба'),
    ]
    evaluation_purpose = models.CharField("Цель оценки", max_length=1, choices=EVALUATION_CHOICES, default=ACCIDENT)
    INSURANCE = "0"
    REPARATION = "1"
    MANAGEMENT = "2"
    RESULTS_CHOICES = [
        (INSURANCE, 'Для страховой выплаты'),
        (REPARATION, 'Для возмещения убытков (ст. 14 ГК КР)'),
        (MANAGEMENT, 'Для принятия управленческих решений'),
    ]
    results_purpose = models.CharField("Назначение результатов оценки", max_length=1, choices=RESULTS_CHOICES,
                                       default=REPARATION)
    ONLY_RECOVERY = "0"
    RECOVERY_WIDTH_APPEARANCE = "1"
    ONLY_SCRAP = "2"
    RECOVERY_WIDTH_SCRAP = "3"
    COST_CHOICES = [
        (ONLY_RECOVERY, 'Рыночная стоимость восстановления'),
        (RECOVERY_WIDTH_APPEARANCE, 'Рыночная стоимость восстановления и утрата товарной стоимости'),
        (ONLY_SCRAP, 'Рыночная стоимость годных остатков (утилизационная стоимость)'),
        (RECOVERY_WIDTH_SCRAP, 'Рыночная стоимость годных остатков (утилизационная стоимость)'),
    ]
    cost_type = models.CharField("Вид определяемой стоимости", max_length=1, choices=COST_CHOICES,
                                 default=ONLY_RECOVERY)

    FOR_RECOVERY = "0"
    FOR_RECOVERY_UTS = "1"
    FOR_SCRAP = "2"
    FOR_RECOVERY_SCRAP = "3"
    METHOD_CHOICES = [
        (FOR_RECOVERY,
         'Метод поэлементного расчета затратного подхода и метод рыночной информации сравнительного подхода'),
        (FOR_RECOVERY_UTS,
         'Метод поэлементного расчета затратного подхода и метод рыночной информации сравнительного подхода'),
        (FOR_SCRAP,
         'Метод расчета годных остатков затратным подходом и метод рыночной информации сравнительного подхода'),
        (FOR_RECOVERY_SCRAP,
         'Методы поэлементного расчета восстановления и годных остатков затратными подходами, метод рыночной информации сравнительного подхода'),
    ]
    used_methods = models.CharField("Подходы и методы", max_length=1, choices=METHOD_CHOICES, default=FOR_RECOVERY)

    contract_price = models.CharField("Сумма оплаты (договора)", max_length=32, default="0")
    contract_price_in_words = models.CharField("Сумма оплаты (прописью)", max_length=256, default="Ноль")
    exchange_rate = models.CharField("Курс доллара к сому", max_length=32, default="75.0000")
    ass_object = models.CharField("Объект оценки", max_length=256, default="Транспортное средство")
    vehicle_model = models.CharField("Марка, модель ТС", max_length=256, default="Н/у")
    vehicle_year = models.CharField("Год выпуска", max_length=4, default="Н/у")
    vehicle_regnum = models.CharField("Гос. (рег.) номер ТС", max_length=32, default="Н/у")
    vehicle_vin = models.CharField("Номер кузова (VIN)", max_length=32, default="Н/у")
    vehicle_frame = models.CharField("Номер рамы (шасси)", max_length=32, default="-")
    vehicle_passport = models.CharField("Номер техпаспорта", max_length=32, default="Н/у")
    vehicle_volume = models.CharField("Объем ДВС", max_length=32, default="", blank=True)
    vehicle_mileage = models.CharField("Пробег", max_length=32, default="Н/у")
    vehicle_color = models.CharField("Цвет", max_length=32, default="Н/у")
    vehicle_type = models.CharField("Тип ТС", max_length=128, default="Н/у")
    vehicle_body = models.CharField("Тип кузова ТС", max_length=32, default="Н/у")
    vehicle_gearbox = models.CharField("Тип коробки передач", max_length=32, default="Н/у")
    vehicle_steering = models.CharField("Положение руля", max_length=32, default="Н/у")
    vehicle_owner = models.CharField("Владелец ТС", max_length=256, default="Н/у")
    vehicle_adress = models.CharField("Адрес регистрации ТС", max_length=256, default="Н/у")
    hourcost = models.IntegerField("Стоимость нормо-часа", default=600)
    kz = models.CharField("Кз", max_length=32, default="0.7")
    kv = models.CharField("Кв", max_length=32, default="0.35")
    kop = models.CharField("Коп", max_length=32, default="0.5")

    definition_text = models.TextField("Текст осмотра", default="", blank=True)
    disassembly_text = models.TextField("Текст разборок", default="", blank=True)
    repair_text = models.TextField("Текст ремонтов", default="", blank=True)
    painting_text = models.TextField("Текст окраски", default="", blank=True)
    additional_text = models.TextField("Текст доп. работ", default="", blank=True)
    hidden_text = models.TextField("Текст скрытых повреждений", default="", blank=True)
    parts_text = models.TextField("Текст запчастей", default="", blank=True)
    damaged_body_parts_text = models.TextField("Текст повреждений кузова", default="", blank=True)
    damaged_other_parts_text = models.TextField("Текст прочих повреждений", default="", blank=True)
    unbroken_parts_text = models.TextField("Текст уцелевших деталей", default="", blank=True)

    services_table = models.TextField("Таблица услуг (JSON)", default="", blank=True)
    materials_table = models.TextField("Таблица материалов (JSON)", default="", blank=True)
    parts_table = models.TextField("Таблица запчастей (JSON)", default="", blank=True)
    uts_table = models.TextField("Таблица УТС (JSON)", default="", blank=True)
    ost_table = models.TextField("Таблица остатков (JSON)", default="", blank=True)

    services_result = models.CharField("Всего услуг, сом", max_length=32, default=0)
    materials_result = models.CharField("Всего материалов, сом", max_length=32, default=0)
    total_result = models.CharField("Всего материалов и услуг, сом", max_length=32, default=0)
    uts_percent = models.CharField("Всего УТС, %", max_length=32, default=0)
    ost_percent = models.CharField("Всего остатков, %", max_length=32, default=0)

    # Сырые JSON-слепки, которые ты уже отправляешь из формы:
    inspection_text_json = models.JSONField(null=True, blank=True, default=dict)
    report_data_json = models.JSONField(null=True, blank=True, default=dict)
    vehicle_data_json = models.JSONField(null=True, blank=True, default=dict)

    ui_state = models.JSONField(null=True, blank=True, default=dict)

    def publish(self):
        self.save()

    def __str__(self):
        return self.report_number

    def get_absolute_url(self):
        return reverse('model-detail-view', args=[str(self.id)])


# helper
def report_photo_upload_to(instance, filename):
    # кладём в папку отчёта: report_photos/<report_id>/<filename>
    import os
    base = os.path.basename(filename)
    return f"report_photos/{instance.report_id}/{base}"

class ReportPhoto(models.Model):
    report  = models.ForeignKey(Report, on_delete=models.CASCADE, related_name='photos')
    image   = models.ImageField(upload_to=report_photo_upload_to)  # ВАЖНО: используем функцию!
    caption = models.CharField(max_length=255, blank=True, default='')
    order   = models.PositiveIntegerField(default=0)

