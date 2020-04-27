$(function() { //Событие ready полной загрузки HTML и CSS

    $('.block:odd').css('background-color', 'LightSkyBlue'); //Все нечетные блоки окрашиваем

    let costValue = parseFloat($('#cost_per_hour').val()); //Записываем значение стоимости нормо-часа

    function setCost(thisElement) { //Функция изменения стоимости отдельного блока
        let workHours = parseFloat(thisElement.val()); //Записываем значение норма-часа текущего блока
        let quantWorks = thisElement.prevAll('.quant').val(); //Записываем значение количества работ
        let result;
        if (!quantWorks) { //Если нет значения количества работ
            result = costValue * workHours;
        } else { //Если есть значения количества работ
            quantWorks = parseFloat(quantWorks);
            if (thisElement.closest('#materials').attr('id') != 'materials') { //Если это не материалы
                result = costValue * workHours * quantWorks;
            } else { //Если это материалы
                result = workHours * quantWorks;
            }
        }
        thisElement.nextAll('.cost').text(result.toFixed(0)); //Записываем рядом и округляем
        let nearestCheckbox = thisElement.prevAll('.checkbox_style'); //Флажок в этом блоке
        if (nearestCheckbox.prop('checked')) {
            calcTempQuant(nearestCheckbox);
        } //Если меняется стоимость отмеченного блока пересчитываем предварительный результат
    }

    function setCosts() { //Функция изменения всех блоков
        console.time('Изменение стоимости всех отмеченных блоков');
        $('.norm').each(function() { //Перебираем нормо-часы каждого блока
            setCost($(this)); //Изменеем стоимость текущего блока
        });
        console.timeEnd('Изменение стоимости всех отмеченных блоков');
    }

    setCosts(); //Запускаем функцию изменения стоимости всех блоков

    $('#class').on('change', function() { //Событие при выборе класса ТС из выпадающего списка
        $('#cost_per_hour').val(this.value); //Записываем значение выбранного класса в поле стоимости нормо-часа
        costValue = this.value;
        setCosts();
    });

    function isNumeric(n) { //Функция проверки на число
        return isFinite(n) && n === String(parseFloat(n));
    }


    $('#cost_per_hour').on('change', function() { //Событие при изменении поля стоимости нормо-часа (тип класса)
        if (isNumeric($(this).val())) { //Если число
            costValue = $(this).val();
            setCosts();
        } else {
            $(this).val(0);
            costValue = 0;
            setCosts();
        }
    });

    $('.action_type').on('change', function() { //Событие при выборе типа ремонтного воздействия из выпадающего списка
        let at = $(this).children('select option:selected').val(); //Записываем значение выбранного ремонтного воздействия в переменную
        let tn = $(this).next('.norm'); //Записываем адрес текущего нормо-часа
        tn.val(at); //Записываем значение в поле часов
        setCost(tn); //Функция изменения стоимости
    });

    $('.norm').on('change', function() { //Событие при изменении полей количества часов
        if (isNumeric($(this).val())) { //Если число
            setCost($(this));
        } else {
            $(this).val(0);
            setCost($(this));
        }
    });

    $('.quant').on('change', function() { //Событие при изменении полей количества работ
        let tn = $(this).nextAll('.norm'); //Записываем адрес текущего нормо-часа
        if (isNumeric($(this).val())) { //Если число
            setCost(tn);
        } else {
            $(this).val(0);
            setCost(tn);
        }
    });

    let intPaint = 0;
    let intCalc = 0;

    $('.paint').on('change', function() { //Событие при изменении полей количества краски
        if (!isNumeric($(this).val())) { //Если не число
            $(this).val(0);
        }
        calcTempPaint();
    });

    function calcTempPaint() {
        console.time('Расчет количества краски');
        intPaint = 0;
        $('.paint').each(function() { //Перебираем блоки окраски
            if ($(this).prevAll('.checkbox_style').prop('checked')) {
                intPaint += parseFloat($(this).val());
            } //Если меняется количество краски отмеченного блока пересчитываем предварительный результат
        });
        $('#intermediate_calc').html(intCalc + ' с | ' + intPaint.toFixed(1) + ' л');
        console.timeEnd('Расчет количества краски');
    }

    $('#painting_work').children().children('.checkbox_style').on('change', function() {
        calcTempPaint();
    });



    function calcTempQuant(element) { //Функция предварительного подсчета
        let costElement = $(element).nextAll('.cost'); //Элемент "стоимость блока"
        let costElVal = parseFloat(costElement.text()); //Стоимость блока
        if (costElement.data('tempCost') === undefined) {
            costElement.data('tempCost', 0);
        } //Если нет предыдущего то 0
        intCalc += costElVal - costElement.data('tempCost');
        costElement.data('tempCost', costElVal); //при установке флажка записываем в элемент ДОМ значение стоимости блока
        $('#intermediate_calc').html(intCalc + ' с | ' + intPaint.toFixed(1) + ' л');
    }

    $("input:checkbox").on("change", function() { //Событие при выделении пунктов
        if (this.checked) {
            calcTempQuant($(this));
        } else {
            let costElement2 = $(this).nextAll('.cost');
            intCalc -= parseFloat(costElement2.data('tempCost')); //при снятии флажка отнимаем из общей суммы старое значение "стоимости блока"
            costElement2.removeData('tempCost'); //Удаляем из элемена ДОМ значение при снятии флажка
            $('#intermediate_calc').html(intCalc + ' с | ' + intPaint.toFixed(1) + ' л');
        }
    });

    $('#vehicle_types').on('change', function() { //Событие при выборе типа ТС
        $('#vehicle_type').val($('option:selected', this).text()); //Записываем выбранный текст в соседнее поле
    });

    $('#vehicle_body_types').on('change', function() { //Событие при выборе типа кузова
        $('#vehicle_body_type').val($('option:selected', this).text()); //Записываем выбранный текст в соседнее поле
    });

    let d = new Date(); //Текущая дата
    let god = d.getFullYear() - 2000; //Текущий полный год
    let mes = d.getMonth() + 1; //Текущий месяц
    let chi = d.getDate(); //Текущиее число
    if (mes < 10) {
        mes = '0' + mes;
    } //Если текущий месяц меньше 10-го, то добавляем ноль спереди

    $('#inspection_date').val((god + 2000) + '-' + mes + '-' + chi); //Дата оценки
    $('#calc_date').val((god + 2000) + '-' + mes + '-' + chi); //Дата расчета
    $('#contract_number').val('000-' + mes + '/' + god); //Номер договора

    $('.action_type_half').on('change', function() { //Событие при изменении разборок
        $(this).siblings('.text_style_hide').val($('option:selected', this).val() + $(this).siblings('.text_style_half').val()); //Записываем выбранный текст в скрытое поле
    });

    $('#icon_13').on('click', function() { //Выделяем все флажки ВРЕМЕННО
        $('input:checkbox').attr('checked', 'checked');
    });


    $('#calc_icon').on('click', function() { //Событие при щелчке на элементе с id=calc_icon
        console.time('FirstWay'); //Измеряем скорость. Можно посмотреть в консоли

        let fullArr = []; //Объявляем массив для хранения всех данных
        let disassemblyText = ''; // Текст разборок
        let repairText = ''; // Текст ремонтов
        let paintingText = ''; // Текст окраски
        let additionalText = ''; // Текст доп.работ
        let hiddenText = ''; // Текст скрытых поврежлений
        let partsText = ''; // Текст запчастей
        let idFirstSymbol; //Первый символ отмеченного ID
        let firstTimePainting = true; //Первое срабатывание цикла при обнаружении слова "Окраска"

        $('input:checkbox:checked').each(function(i, elem) { //ПЕРЕБИРАЕМ КАЖДЫЙ ОТМЕЧЕННЫЙ ФЛАЖОК
            fullArr[i] = { //Записываем всё в массив объектов
                id: $(this).val(), //Записываем значение каждого отмеченного флажка
                text: $(this).next('input').val(), //Текст около флажка
                position: $(this).nextAll('.position').val(), //Текст "позиция детали"
                action: $(this).parent().find('.action_type :selected').text(), //Текст "тип ремонтного воздействия"
                quant: $(this).nextAll('.quant').val(), //Количество нормо-часов
                paint: $(this).nextAll('.paint').val(), //Количество краски
                norm: $(this).nextAll('.norm').val(), //Значение нормо-часа
                cost: $(this).nextAll('.cost').text() //Стоимость пункта
            }
            //Если есть данные, то преобразуем в число, иначе 0
            if (fullArr[i].quant) {
                fullArr[i].quant = parseFloat(fullArr[i].quant);
            } else {
                fullArr[i].quant = 0;
            }
            if (fullArr[i].paint) {
                fullArr[i].paint = parseFloat(fullArr[i].paint);
            } else {
                fullArr[i].paint = 0;
            }
            if (fullArr[i].norm) {
                fullArr[i].norm = parseFloat(fullArr[i].norm);
            } else {
                fullArr[i].norm = 0;
            }
            if (fullArr[i].cost) {
                fullArr[i].cost = parseFloat(fullArr[i].cost);
            } else {
                fullArr[i].cost = 0;
            }

            idFirstSymbol = fullArr[i].id.charAt(0); //Первый символ отмеченного ID
            switch (idFirstSymbol) { //СПИСОК ВОССТАНОВЛЕНИЯ
                case 'Р': //Разборки
                    if (fullArr[i].position) {
                        disassemblyText += fullArr[i].text + ' ' + fullArr[i].position + '. ';
                    } else {
                        disassemblyText += fullArr[i].text + '. ';
                    }
                    break;
                case 'К': //Кузовные ремонты
                    if (fullArr[i].position) {
                        repairText += fullArr[i].text + ' ' + fullArr[i].position + ' – ' + fullArr[i].action + '. ';
                    } else {
                        repairText += fullArr[i].text + ' – ' + fullArr[i].action + '. ';
                    }
                    break;
                case 'З': //Прочие услуги
                    if (fullArr[i].norm > 0) { //Если стоимость услуг больше 0, то записываем в акт осмотра
                        if (fullArr[i].position) {
                            repairText += fullArr[i].text + ' ' + fullArr[i].position + ' – ' + fullArr[i].action + '. ';
                        } else {
                            repairText += fullArr[i].text + ' – ' + fullArr[i].action + '. ';
                        }
                    }
                    break;
                case 'О': //Окраска
                    if (fullArr[i].text.substring(0, 7) == 'Окраска') {
                        if (firstTimePainting) { // Первый раз убираем слово "Окраска", но ставим двоеточие
                            if (fullArr[i].position) {
                                paintingText += 'Окраска:' + fullArr[i].text.slice(7) + ' ' + fullArr[i].position + '; ';
                            } else {
                                paintingText += 'Окраска:' + fullArr[i].text.slice(7) + '; ';
                            }
                            firstTimePainting = false;
                        } else { // Остальные разы убираем слово "Окраска"
                            if (fullArr[i].position) {
                                paintingText += fullArr[i].text.slice(7) + ' ' + fullArr[i].position + '; ';
                            } else {
                                paintingText += fullArr[i].text.slice(7) + '; ';
                            }
                        }
                    } else { //Если прочее в разделе "окраска"
                        if (fullArr[i].position) {
                            paintingText += fullArr[i].text + ' ' + fullArr[i].position + '. ';
                        } else if (fullArr[i].quant > 0) {
                            paintingText += fullArr[i].text + ' – ' + fullArr[i].quant + ' кв.м. ';
                        } else {
                            paintingText += fullArr[i].text + '. ';
                        }
                    }
                    break;
                case 'Д': //Дополнительные работы
                    if (fullArr[i].quant > 0) {
                        if (fullArr[i].quant == 1) {
                            additionalText += fullArr[i].text + ' – ' + fullArr[i].quant + ' час. ';
                        } else if ((fullArr[i].quant > 1 && fullArr[i].quant < 5) || (fullArr[i].quant < 1)) {
                            additionalText += fullArr[i].text + ' – ' + fullArr[i].quant + ' часа. ';
                        } else {
                            additionalText += fullArr[i].text + ' – ' + fullArr[i].quant + ' часов. ';
                        }
                    } else {
                        additionalText += fullArr[i].text + '. ';
                    }
                    break;
                case 'С': //Скрытые повреждения
                    hiddenText += fullArr[i].text + '. ';
                    break;
                default:
                    break;
            }
            if (fullArr[i].action == 'замена') { //СПИСОК ЗАПЧАСТЕЙ
                if (fullArr[i].position) {
                    partsText += fullArr[i].text + ' ' + fullArr[i].position + '; ';
                } else {
                    partsText += fullArr[i].text + '; ';
                }
            }
            if (!fullArr[i].quant) { //Если количество = 0 то пусть = 1
                fullArr[i].quant = 1;
            }
        }); //Конец перебора флажков

        if (!firstTimePainting) { //Ставим точку в конце окрашиваемых деталей
            paintingText = paintingText.slice(0, -2) + '. ';
        }
        if (partsText) {partsText.slice(0, -2) + '.';} //Ставим точку в конце списка запчастей

        let fullText = disassemblyText + '<br>' + repairText + '<br>' + paintingText + '<br>' + additionalText + '<br>' + hiddenText + '<br>' + partsText + '<br>'; //Весь текст акта осмотра

        let fullArrLength = fullArr.length;
        let gluedArr = []; //Массив для хранения объединенных данных для таблиц
        let gluedArrCounter = 0;
        for (let i = 0; i < fullArrLength; i++) { //Перебор всего массива отмеченных данных. УБИРАЕМ ПОВТОРЯЮЩИЕСЯ ПУНКТЫ
            if ((i + 1 < fullArrLength) && (fullArr[i].text == fullArr[i + 1].text) && (fullArr[i].action == fullArr[i + 1].action)) {
                gluedArr[gluedArrCounter] = {
                    id: fullArr[i].id,
                    text: fullArr[i].text,
                    position: false,
                    action: fullArr[i].action,
                    quant: fullArr[i].quant + fullArr[i + 1].quant,
                    norm: (fullArr[i].norm + fullArr[i + 1].norm) / 2,
                    cost: fullArr[i].cost + fullArr[i + 1].cost
                }
                i++;
            } else {
                gluedArr[gluedArrCounter] = {
                    id: fullArr[i].id,
                    text: fullArr[i].text,
                    position: fullArr[i].position,
                    action: fullArr[i].action,
                    quant: fullArr[i].quant,
                    norm: fullArr[i].norm,
                    cost: fullArr[i].cost
                }
            }
            gluedArrCounter++;
        }

        let gluedArrLength = gluedArr.length;
        let servicesArr = []; //Массив для хранения данных таблицы услуг
        let servicesCounter = 0;
        let servicesTable = ''; //Переменная для хранения таблицы услуг
        let totalServicesCost = 0;
        let materialsArr = []; //Массив для хранения данных таблицы материалов
        let materialsCounter = 0;
        let materialsTable = ''; //Переменная для хранения таблицы материалов
        let totalMaterialsCost = 0;
        let partsArr = []; //Массив для хранения данных таблицы запчастей
        let partsCounter = 0;
        let partsTable = ''; //Переменная для хранения таблицы запчастей
        for (let i = 0; i < gluedArrLength; i++) {
            if (gluedArr[i].cost > 0) { //ТАБЛИЦЫ УСЛУГ И МАТЕРИАЛОВ
                idFirstSymbol = gluedArr[i].id.charAt(0);
                switch (idFirstSymbol) {
                    case 'М': //Материалы
                        materialsArr[materialsCounter] = {
                            text: gluedArr[i].text,
                            quant: gluedArr[i].quant,
                            norm: gluedArr[i].norm,
                            cost: gluedArr[i].cost
                        }

                        materialsCounter++;
                        totalMaterialsCost += gluedArr[i].cost;

                        materialsTable += '<tr><td>' + materialsCounter + '</td><td>' + gluedArr[i].text + '</td><td>' + gluedArr[i].quant.toString().replace('.', ',') + '</td><td>' + gluedArr[i].norm.toFixed(2).replace('.', ',') + '</td><td>' + gluedArr[i].cost.toFixed(2).replace('.', ',') + '</td></tr>';
                        break;
                    default: //Услуги
                        servicesCounter++;
                        totalServicesCost += gluedArr[i].cost;

                        //gluedArr[i].cost = gluedArr[i].cost.toFixed(2).replace('.', ',');
                        //gluedArr[i].quant = gluedArr[i].quant.toFixed(0).replace('.', ',');
                        //gluedArr[i].norm = gluedArr[i].norm.toFixed(1).replace('.', ',');

                        if (gluedArr[i].action) {
                            servicesArr[servicesCounter - 1] = {
                                text: gluedArr[i].text + ' – ' + gluedArr[i].action,
                                quant: gluedArr[i].quant,
                                norm: gluedArr[i].norm,
                                cost: gluedArr[i].cost
                            }
                            servicesTable += '<tr><td>' + servicesCounter + '</td><td>' + gluedArr[i].text + ' – ' + gluedArr[i].action + '</td><td>' + gluedArr[i].quant.toString().replace('.', ',') + '</td><td>' + gluedArr[i].norm.toFixed(1).replace('.', ',') + '</td><td>' + gluedArr[i].cost.toFixed(2).replace('.', ',') + '</td></tr>';
                        } else {
                            servicesArr[servicesCounter - 1] = {
                                text: gluedArr[i].text,
                                quant: gluedArr[i].quant,
                                norm: gluedArr[i].norm,
                                cost: gluedArr[i].cost
                            }
                            servicesTable += '<tr><td>' + servicesCounter + '</td><td>' + gluedArr[i].text + '</td><td>' + gluedArr[i].quant.toString().replace('.', ',') + '</td><td>' + gluedArr[i].norm.toFixed(1).replace('.', ',') + '</td><td>' + gluedArr[i].cost.toFixed(2).replace('.', ',') + '</td></tr>';
                        }
                        break;
                }
            }

            if (gluedArr[i].action == 'замена') { //ТАБЛИЦА ЗАПЧАСТЕЙ
                partsCounter++;
                if (gluedArr[i].position) {
                    partsArr[partsCounter - 1] = {
                        text: gluedArr[i].text + ' ' + gluedArr[i].position,
                        quant: gluedArr[i].quant
                    }
                    partsTable += '<tr><td>' + partsCounter + '</td><td>' + gluedArr[i].text + ' ' + gluedArr[i].position + '</td><td>' + gluedArr[i].quant + '</td><td>0,00</td><td>0,00</td></tr>';
                } else {
                    partsArr[partsCounter - 1] = {
                        text: gluedArr[i].text,
                        quant: gluedArr[i].quant
                    }
                    partsTable += '<tr><td>' + partsCounter + '</td><td>' + gluedArr[i].text + '</td><td>' + gluedArr[i].quant + '</td><td>0,00</td><td>0,00</td></tr>';
                }
            }
        }

        let totalCost = totalServicesCost + totalMaterialsCost;
/*
        $('#finished_text').html(fullText);
        $('#finished_calc').html('<table border="1" cellspacing="0">' + servicesTable + '</table>');
        $('#finished_mat').html('<table id="mat_table" border="1" cellspacing="0">' + materialsTable + '</table>');
        $('#finished_parts').html('<table border="1" cellspacing="0">' + partsTable + '</table>');
*/
        $('#total_calc').text('Услуг: ' + totalServicesCost + ' сом');
        $('#total_mat').text('Материалов: ' + totalMaterialsCost + ' сом');
        $('#total_sum').text('Всего: ' + totalCost + ' сом');

        let reportData = {
            contractnum: $('#contract_number').val(),
            idate: $('#inspection_date').val(),
            cdate: $('#calc_date').val(),
            customer: $('#customer_name').val(),
            property: $('#property_owner').val(),
            position: $('#vehicle_location').val(),
            purpose: $('#evaluation_purpose').val(),
            appointment: $('#evaluation_appointment').val(),
            costtype: $('#cost_type').val(),
            contractcost: $('#contract_cost').val(),
            costinwords: $('#contract_cost_in_words').val(),
            servicesres: totalServicesCost,
            materialsres: totalMaterialsCost
        }

        let vehicleData = {
            model: $('#vehicle_model').val(),
            year: $('#vehicle_year').val(),
            regnum: $('#vehicle_number').val(),
            vin: $('#vehicle_vin').val(),
            frame: $('#vehicle_frame').val(),
            passport: $('#vehicle_passport').val(),
            volume: $('#vehicle_engine_volume').val(),
            mileage: $('#vehicle_mileage').val(),
            color: $('#vehicle_color').val(),
            type: $('#vehicle_type').val(),
            body: $('#vehicle_body_type').val(),
            hourcost: $('#cost_per_hour').val(),
            owner: $('#vehicle_owner').val(),
            adress: $('#vehicle_adress').val()
        }

        let inspectionText = {
            disassembly: disassemblyText,
            repair: repairText,
            painting: paintingText,
            additional: additionalText,
            hidden: hiddenText,
            parts: partsText
        }

        $('#vehicle_data_text').val(JSON.stringify(vehicleData));
        $('#report_data_text').val(JSON.stringify(reportData));
        $('#inspection_text').val(JSON.stringify(inspectionText));
        $('#services_table').val(JSON.stringify(servicesArr));
        $('#materials_table').val(JSON.stringify(materialsArr));
        $('#parts_table').val(JSON.stringify(partsArr));

        $('#hidden_button, #hidden_field, #hidden_br').show();

        console.timeEnd('FirstWay');
    }); //Конец расчета
}); //Конец события полной загрузки HTML и CSS
