from django.db import models
from django.urls import reverse
from datetime import date

# Create your models here.
class Report(models.Model):
    report_number = models.CharField("Номер отчета (договора)", max_length=32, help_text="Введи в фомате ннн-мм/гг", default="000-00/20")
    inspection_date = models.DateField("Дата осмотра (договора)", default=date.today)
    calculation_date = models.DateField("Дата расчета", default=date.today)
    client_name = models.CharField("Ф.И.О. заказчика", max_length=128, help_text="Введи Ф.И.О. полностью", default="Н/у")
    PRIVATE = "1"
    MUNICIPAL = "2"
    STATE = "3"
    UNKNOWN = "4"
    OWNERSHIP_CHOICES = [
        (PRIVATE, 'Частная собственность'),
        (MUNICIPAL, 'Муниципальная собственность'),
        (STATE, 'Государственная собственность'),
        (UNKNOWN, 'Н/у'),
    ]
    ownership_identification = models.CharField("Право собственности", max_length=128, choices=OWNERSHIP_CHOICES, default=PRIVATE)
    inspection_place = models.CharField("Место осмотра:", max_length=128, help_text="Введи хотя бы населенный пункт", default="Н/у")
    ACCIDENT = "1"
    IGNITION = "2"
    OTHER = "3"
    EVALUATION_CHOICES = [
        (ACCIDENT, 'Определение стоимости ущерба, причиненного вследствие дорожно-транспортного происшествия'),
        (IGNITION, 'Определение стоимости ущерба, причиненного вследствие возгорания транспортного средства'),
        (OTHER, 'Определение стоимости причиненного ущерба'),
    ]
    evaluation_purpose = models.CharField("Цель оценки", max_length=128, choices=EVALUATION_CHOICES, default=ACCIDENT)
    REPARATION = "1"
    INSURANCE = "2"
    MANAGEMENT = "3"
    RESULTS_CHOICES = [
        (REPARATION, 'Для возмещения убытков (ст. 14 ГК КР)'),
        (INSURANCE, 'Для страховой выплаты'),
        (MANAGEMENT, 'Для принятия управленческих решений'),
    ]
    results_purpose = models.CharField("Назначение результатов оценки", max_length=128, choices=RESULTS_CHOICES, default=REPARATION)
    ONLY_RECOVERY = "1"
    RECOVERY_WIDTH_APPEARANCE = "2"
    COST_CHOICES = [
        (ONLY_RECOVERY, 'Рыночная стоимость восстановления транспортного средства'),
        (RECOVERY_WIDTH_APPEARANCE, 'Рыночная стоимость восстановления и утрата товарной стоимости транспортного средства'),
    ]
    cost_type = models.CharField("Вид определяемой стоимости", max_length=128, choices=COST_CHOICES, default=ONLY_RECOVERY)
    contract_price = models.IntegerField("Сумма оплаты (договора)", default=0)
    contract_price_in_words = models.CharField("Сумма оплаты (прописью)", max_length=128, default="Ноль")
    vehicle_model = models.CharField("Марка, модель ТС", max_length=128, default="Н/у")
    vehicle_year = models.CharField("Год выпуска", max_length=4, default="Н/у")
    vehicle_regnum = models.CharField("Гос. (рег.) номер ТС", max_length=32, default="Н/у")
    vehicle_vin = models.CharField("Номер кузова (VIN)", max_length=32, default="Н/у")
    vehicle_frame = models.CharField("Номер рамы (шасси)", max_length=32, default="Н/у")
    vehicle_passport = models.CharField("Номер техпаспорта", max_length=32, default="Н/у")
    vehicle_volume = models.CharField("Объем ДВС", max_length=16, default="Н/у")
    vehicle_mileage = models.CharField("Пробег", max_length=16, default="Н/у")
    vehicle_color = models.CharField("Цвет", max_length=32, default="Н/у")
    vehicle_type = models.CharField("Тип ТС", max_length=32, default="Н/у")
    vehicle_body = models.CharField("Тип кузова ТС", max_length=32, default="Н/у")
    vehicle_owner = models.CharField("Владелец ТС", max_length=256, default="Н/у")
    vehicle_adress = models.CharField("Адрес регистрации ТС", max_length=256, default="Н/у")
    hourcost = models.IntegerField("Стоимость нормо-часа", default=600)

    disassembly_text = models.TextField("Текст разборок", default="Н/у")
    repair_text = models.TextField("Текст ремонтов", default="Н/у")
    painting_text = models.TextField("Текст окраски", default="Н/у")
    additional_text = models.TextField("Текст доп. работ", default="Н/у")
    hidden_text = models.TextField("Текст скрытых повреждений", default="Н/у")
    parts_text = models.TextField("Текст запчастей", default="Н/у")

    services_table = models.TextField("Таблица услуг", default = "", blank=True)
    materials_table = models.TextField("Таблица материалов", default = "", blank=True)
    parts_table = models.TextField("Таблица запчастец", default = "", blank=True)

    def publish(self):
        self.save()

    def __str__(self):
        return self.report_number

    def get_absolute_url(self):
        return reverse('model-detail-view', args=[str(self.id)])
