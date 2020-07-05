from django.db import models
from django.urls import reverse
from datetime import date

# Create your models here.
class Report(models.Model):
    doc_type = models.CharField("Тип документа", max_length=32, help_text="Отчет или Заключение", default="Отчет")
    ass_reason = models.CharField("Основание оценки", max_length=256, help_text="Договор, запрос, определение, постановление", default="Договор")

    report_number = models.CharField("Номер отчета", max_length=32, help_text="Введи в фомате ннн-мм/гг", default="000-00/20")
    inspection_date = models.DateField("Дата осмотра (договора)", default=date.today)
    calculation_date = models.DateField("Дата расчета", default=date.today)
    client_name = models.CharField("Ф.И.О. заказчика", max_length=256, help_text="Введи Ф.И.О. полностью", default="Н/у")
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
    ownership_identification = models.CharField("Право собственности", max_length=1, choices=OWNERSHIP_CHOICES, default=PRIVATE)
    inspection_place = models.CharField("Место осмотра:", max_length=256, help_text="Введи хотя бы населенный пункт", default="Н/у")
    ACCIDENT = "0"
    IGNITION = "1"
    OTHER = "2"
    EVALUATION_CHOICES = [
        (ACCIDENT, 'Определение стоимости ущерба, причиненного вследствие дорожно-транспортного происшествия'),
        (IGNITION, 'Определение стоимости ущерба, причиненного вследствие возгорания транспортного средства'),
        (OTHER, 'Определение стоимости причиненного ущерба'),
    ]
    evaluation_purpose = models.CharField("Цель оценки", max_length=1, choices=EVALUATION_CHOICES, default=ACCIDENT)
    REPARATION = "0"
    INSURANCE = "1"
    MANAGEMENT = "2"
    RESULTS_CHOICES = [
        (REPARATION, 'Для возмещения убытков (ст. 14 ГК КР)'),
        (INSURANCE, 'Для страховой выплаты'),
        (MANAGEMENT, 'Для принятия управленческих решений'),
    ]
    results_purpose = models.CharField("Назначение результатов оценки", max_length=1, choices=RESULTS_CHOICES, default=REPARATION)
    ONLY_RECOVERY = "0"
    RECOVERY_WIDTH_APPEARANCE = "1"
    COST_CHOICES = [
        (ONLY_RECOVERY, 'Рыночная стоимость восстановления'),
        (RECOVERY_WIDTH_APPEARANCE, 'Рыночная стоимость восстановления и утрата товарной стоимости'),
    ]
    cost_type = models.CharField("Вид определяемой стоимости", max_length=1, choices=COST_CHOICES, default=ONLY_RECOVERY)

    FOR_RECOVERY = "0"
    FOR_SCRAP = "1"
    FOR_MARKET = "2"
    METHOD_CHOICES = [
        (FOR_RECOVERY, 'Метод поэлементного расчета затратного подхода и метод рыночной информации сравнительного подхода'),
        (FOR_SCRAP, 'Метод расчета годных остатков затратным подходом и метод рыночной информации сравнительного подхода'),
        (FOR_MARKET, 'Метод сравнительного анализа продаж'),
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
    vehicle_frame = models.CharField("Номер рамы (шасси)", max_length=32, default="Н/у")
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

    disassembly_text = models.TextField("Текст разборок", default="", blank=True)
    repair_text = models.TextField("Текст ремонтов", default="", blank=True)
    painting_text = models.TextField("Текст окраски", default="", blank=True)
    additional_text = models.TextField("Текст доп. работ", default="", blank=True)
    hidden_text = models.TextField("Текст скрытых повреждений", default="", blank=True)
    parts_text = models.TextField("Текст запчастей", default="", blank=True)

    services_table = models.TextField("Таблица услуг (JSON)", default = "", blank=True)
    materials_table = models.TextField("Таблица материалов (JSON)", default = "", blank=True)
    parts_table = models.TextField("Таблица запчастец (JSON)", default = "", blank=True)
    uts_table = models.TextField("Таблица УТС (JSON)", default = "", blank=True)

    services_result = models.CharField("Всего услуг, сом", max_length=32, default=0)
    materials_result = models.CharField("Всего материалов, сом", max_length=32, default=0)
    uts_percent = models.CharField("Всего УТС, %", max_length=32, default=0)

    def publish(self):
        self.save()

    def __str__(self):
        return self.report_number

    def get_absolute_url(self):
        return reverse('model-detail-view', args=[str(self.id)])
