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

  $('#contract_cost').on('change', function() { //Событие при изменении поля "сумма оплаты цифрами"
    let dig = $(this).val();
    switch (dig) {
      case "1 500":
        $('#contract_cost_in_words').val("Одна тысяча пятьсот");
        break;
      case "2 000":
        $('#contract_cost_in_words').val("Две тысячи");
        break;
      case "2 500":
        $('#contract_cost_in_words').val("Две тысячи пятьсот");
        break;
      case "3 000":
        $('#contract_cost_in_words').val("Три тысячи");
        break;
      case "3 500":
        $('#contract_cost_in_words').val("Три тысячи пятьсот");
        break;
    }
  });

  $('.action_type').on('change', function() { //Событие при выборе типа ремонтного воздействия из выпадающего списка
    let at = $(this).children('select option:selected').val(); //Записываем значение выбранного ремонтного воздействия в переменную
    let tn = $(this).next('.norm'); //Записываем адрес текущего нормо-часа
    let us = $(this).children('select option:selected').attr('data-uts');
    tn.val(at); //Записываем значение в поле часов
    setCost(tn); //Функция изменения стоимости
    if (us) {
      tn.attr('data-uts', us);
    }
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
    if ($(this).nextAll('.paint')) {
      calcTempPaint();
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

  function calcTempPaint() { //Функция расчета количества краски
    console.time('Расчет количества краски');
    let intQuant;
    intPaint = 0;
    $('.paint').each(function() { //Перебираем блоки окраски
      intQuant = $(this).prevAll('.quant').val();
      if (!intQuant) {
        intQuant = 1;
      }
      if ($(this).prevAll('.checkbox_style').prop('checked')) {
        intPaint += parseFloat($(this).val()) * parseFloat(intQuant);
      } //Если меняется количество краски отмеченного блока пересчитываем предварительный результат
    });
    $('#intermediate_calc').html(intCalc + ' с<br>' + intPaint.toFixed(1) + ' л');
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
    $('#intermediate_calc').html(intCalc + ' с<br>' + intPaint.toFixed(1) + ' л');
  }

  $("input:checkbox").on("change", function() { //Событие при выделении пунктов
    if (this.checked) {
      calcTempQuant($(this));
    } else {
      let costElement2 = $(this).nextAll('.cost');
      intCalc -= parseFloat(costElement2.data('tempCost')); //при снятии флажка отнимаем из общей суммы старое значение "стоимости блока"
      costElement2.removeData('tempCost'); //Удаляем из элемена ДОМ значение при снятии флажка
      $('#intermediate_calc').html(intCalc + ' с<br>' + intPaint.toFixed(1) + ' л');
    }
  });

  $('#vehicle_types').on('change', function() { //Событие при выборе типа ТС
    $('#vehicle_type').val($('option:selected', this).text()); //Записываем выбранный текст в соседнее поле
  });

  $('#vehicle_body_types').on('change', function() { //Событие при выборе типа кузова
    $('#vehicle_body_type').val($('option:selected', this).text()); //Записываем выбранный текст в соседнее поле
  });

  $('#customer_names').on('change', function() { //Событие при выборе заказчика
    $('#customer_name').val($('option:selected', this).val()); //Записываем выбранный текст в соседнее поле
  });

  $('#vehicle_locations').on('change', function() { //Событие при выборе места осмотра
    $('#vehicle_location').val($('option:selected', this).val()); //Записываем выбранный текст в соседнее поле
  });

  let d = new Date(); //Текущая дата
  let fullgod = d.getFullYear(); //Текущий полный год
  let shortgod = d.getFullYear() - 2000; //Текущий краткий год
  let mes = d.getMonth() + 1; //Текущий месяц
  let chi = d.getDate(); //Текущиее число

  if (mes < 10) {
    mes = '0' + mes;
  } //Если текущий месяц меньше 10-го, то добавляем ноль спереди

  if (chi < 10) {
    chi = '0' + chi;
  } //Если текущий месяц меньше 10-го, то добавляем ноль спереди

  $('#inspection_date').val(fullgod + '-' + mes + '-' + chi); //Дата оценки
  $('#contract_number').val('000-' + mes + '/' + shortgod); //Номер договора

  d.setDate(d.getDate() + 1); //Следующий день
  fullgod = d.getFullYear(); //Текущий полный год
  mes = d.getMonth() + 1; //Текущий месяц
  chi = d.getDate(); //Текущиее число

  if (mes < 10) {
    mes = '0' + mes;
  } //Если текущий месяц меньше 10-го, то добавляем ноль спереди

  if (chi < 10) {
    chi = '0' + chi;
  } //Если текущий месяц меньше 10-го, то добавляем ноль спереди

  $('#calc_date').val(fullgod + '-' + mes + '-' + chi); //Дата расчета

  $('.action_type_half').on('change', function() { //Событие при изменении разборок 1
    $(this).siblings('.text_style_hide').val($('option:selected', this).val() + $(this).siblings('.text_style_half').val()); //Записываем выбранный текст в скрытое поле
  });

  $('.text_style_half').on('change', function() { //Событие при изменении разборок 2
    $(this).siblings('.text_style_hide').val($('option:selected', $(this).siblings('.action_type_half')).val() + $(this).val()); //Записываем выбранный текст в скрытое поле
  });

  let month = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
  $('#inspection_date, #contract_number').on('change', function() { //Событие при изменении даты оценки и номера отчета
    let assDate = new Date($('#inspection_date').val());
    let assGod = assDate.getFullYear(); //Текущий полный год
    let assMes = assDate.getMonth(); //Текущий месяц
    let assChi = assDate.getDate(); //Текущиее число

    if (assChi < 10) {
      assChi = '0' + assChi;
    } //Если текущее число меньше 10, то добавляем ноль спереди

    $('#ass_reason').val('Договор №' + $('#contract_number').val() + ' от ' + assChi + ' ' + month[assMes] + ' ' + assGod + ' г.'); //Записываем выбранный текст в поле "основание оценки"
  });

  $('#customer_name').on('change', function() { //Событие при изменении заказчика
    $('#vehicle_owner').val($(this).val()); //Записываем текст в поле "владелец"
  });

  /*
    $('#intermediate_calc').on('click', function() { //Выделяем все флажки ВРЕМЕННО
      $('.checkbox_style').attr('checked', 'checked');
    });
  */

  let re = /(?=\B(?:\d{3})+(?!\d))/g;
  let formatted = '';

  function formatting(number) { //Функция превращения числа в строку формата "1 280 154,00"
    formatted = number + "";
    formatted = formatted.toString().replace(re, ' ').replace('.', ',');
    return formatted;
  }

  $('.square').each(function(i, elem) { //Записываем данные в квадраты навигации
    $(this).data('id', i);
  });

  $('.section').each(function(i, elem) { //Те же данные в секкции
    $(this).data('id', i);
  });

  $(".square").click(function() { //Функция показа определенной секции блоков
    console.time('Показ секции блока');
    let thisId = $(this).data('id');
    $('.empty_div').css('height', '5.5em');
    $(".square").css('background-color', 'LightSkyBlue');
    $(this).css('background-color', 'red');
    $('.section').hide();
    $('.section').each(function(i, elem) {
      if ($(this).data('id') == thisId) {
        $(this).show();
      }
    });
    console.timeEnd('Показ секции блока');
  });

  let showCounter = 0;
  $("#intermediate_calc").click(function() { //Функция показа всех секций
    console.time('Показ всех секкций');
    switch (showCounter) {
      case 0: //показать все блоки
        $('.empty_div').css('height', '0');
        $('#first_empty_div').css('height', '5.5em');
        $(".square").css('background-color', 'LightSkyBlue');
        $('.section').show();
        $('.block').show();
      alert('Все блоки');
        showCounter += 1;
        break;
      case 1: //показать блоки для остатков
        $('.empty_div').css('height', '0');
        $('#first_empty_div').css('height', '5.5em');
        $(".square").css('background-color', 'LightSkyBlue');
        $('.section').show();
        $('.block').hide();
        $('[data-ost]').parent().show();
        $('#distortion').parent().show();
        $('#hidden_damage').children('.block').show();
        alert('Блоки годных остатков');
        showCounter += 1;
        break;
      default: //показать выделенные блоки
        $('.empty_div').css('height', '0');
        $('#first_empty_div').css('height', '5.5em');
        $(".square").css('background-color', 'LightSkyBlue');
        $('.section').show();
        $('.block').hide();
        $('input:checkbox:checked').parent().show();
        alert('Отмеченные блоки');
        showCounter = 0;
        break;
    }


    console.timeEnd('Показ всех секкций');
  });


  $('.checkbox_style').each(function() {
    let rrr = $(this).nextAll('.norm');
    if (rrr.attr('data-ost')) {
      $(this).css('box-shadow', 'inset 0 0 0.3em 0.3em green');
    }
  });

  $('.cost').on('click', function() { // Функция убирает пункт из расчета остаточной...
    let thisNorm = $(this).siblings('.norm');
    if (thisNorm.attr('data-ost')) {
      thisNorm.attr('data-ost-temp', thisNorm.attr('data-ost'));
      thisNorm.removeAttr('data-ost');
      $(this).siblings('.checkbox_style').css('box-shadow', 'inset 0 0 0.3em 0.3em #FF4500');
    } else if (thisNorm.attr('data-ost-temp')) { // ...и возвращает
      thisNorm.attr('data-ost', thisNorm.attr('data-ost-temp'));
      thisNorm.removeAttr('data-ost-temp');
      $(this).siblings('.checkbox_style').css('box-shadow', 'inset 0 0 0.3em 0.3em green');
    }
  });

  $('#calc_icon').on('click', function() { //Событие при щелчке на элементе с id=calc_icon

    console.time('Весь расчет'); //Измеряем скорость. Можно посмотреть в консоли

    let fullArr = []; //Объявляем массив для хранения всех данных
    let disassemblyText = ''; // Текст разборок
    let repairText = ''; // Текст ремонтов
    let paintingText = ''; // Текст окраски
    let additionalText = ''; // Текст доп.работ
    let hiddenText = ''; // Текст скрытых поврежлений
    let partsText = ''; // Текст запчастей

    let ostArr = []; //Объявляем массив для хранения остатков
    let damagedBodyPartsText = ''; // Поврежденные кузовные части
    let damagedOtherPartsText = ''; // Прочие поврежденные детали
    let unbrokenPartsText = ''; // Текст уцелевших запчастей
    let totalOst = 0; //Переменная для остатков, %

    let idFirstSymbol; //Первый символ отмеченного ID
    let idTwoFirstSymbols; //Первые 2 символа отмеченного ID
    let damageType = Array(8).fill(0); //массив для типа повреждений
    let firstTimePainting = true; //Первое срабатывание цикла при обнаружении слова "Окраска"

    console.time('Перебор флагов');
    let sample;

    function lcFirst(str) {
      if (!str) return str;
      return str[0].toLowerCase() + str.slice(1);
    }

    function ucFirst(str) {
      if (!str) return str;
      return str[0].toUpperCase() + str.slice(1);
    }

    function endDot(str) {
      if (!str) return str;
      return str.slice(0, -2) + '.';
    }

    $('[data-ost]').each(function(i, elem) { //Перебираем каждый флажок для остатков
      ostArr[i] = { //Записываем всё в массив объектов
        id: $(this).siblings('.checkbox_style').val(), //Записываем значение каждого отмеченного флажка
        checked: $(this).siblings('.checkbox_style').prop('checked'),
        text: lcFirst($(this).siblings('.text_style').val()), //Текст около флажка
        position: $(this).siblings('.position').val(), //Текст "позиция детали"
        ost: $(this).attr('data-ost') //Процент остаточный
      }

      if (ostArr[i].ost) {
        ostArr[i].ost = parseFloat(ostArr[i].ost);
      } else {
        ostArr[i].ost = 0;
      }

      if (!ostArr[i].checked) {
        totalOst += ostArr[i].ost;
      }


      /*
      idFirstSymbol = ostArr[i].id.charAt(0); //Первый символ отмеченного ID
      if (ostArr[i].checked) { //СПИСОК ОСТАТОЧНЫЙ
        switch (idFirstSymbol) {
          case 'К': //Кузовные
            if (ostArr[i].position) {
              damagedBodyPartsText += ostArr[i].text + ' ' + ostArr[i].position + '; ';
            } else {
              damagedBodyPartsText += ostArr[i].text + '; ';
            }
            break;
          default:
            if (ostArr[i].position) {
              damagedOtherPartsText += ostArr[i].text + ' ' + ostArr[i].position + '; ';
            } else {
              damagedOtherPartsText += ostArr[i].text + '; ';
            }
            break;
        }
      } else {
                 if (ostArr[i].position) {
                   unbrokenPartsText += ostArr[i].text + ' ' + ostArr[i].position + '; ';
                 } else {
                   unbrokenPartsText += ostArr[i].text + '; ';
                 }
               } */

    });

    totalOst += 4.5;

    let ostArrLength = ostArr.length;
    let gluedOstArr = []; //Массив для хранения объединенных данных для таблицы
    let gluedDamArr = []; //Массив для хранения объединенных данных для поврежденных частей
    let ostCounter = 0;


    for (let i = 0; i < ostArrLength; i++) { //Перебор всего массива зеленых флагов. УБИРАЕМ ПОВТОРЯЮЩИЕСЯ ПУНКТЫ
      if (!ostArr[i].checked) {
        if ((i + 1 < ostArrLength) && (ostArr[i].text == ostArr[i + 1].text) && (!ostArr[i + 1].checked)) {
          gluedOstArr[ostCounter] = {
            id: ostArr[i].id.charAt(0), //Первый символ ID
            text: ucFirst(ostArr[i].text) + ' - 2 шт.',
            position: ostArr[i].position,
            textFull: ucFirst(ostArr[i].text) + ' (' + ostArr[i].position + ' и ' + ostArr[i + 1].position + ')',
            ost: formatting((ostArr[i].ost + ostArr[i + 1].ost).toFixed(1))
          }
          i++;
        } else {
          gluedOstArr[ostCounter] = {
            id: ostArr[i].id.charAt(0), //Первый символ ID
            text: ucFirst(ostArr[i].text),
            position: ostArr[i].position,
            textFull: ucFirst(ostArr[i].text) + ' ' + ostArr[i].position,
            ost: formatting(ostArr[i].ost.toFixed(1))
          }
        }
        ostCounter++;
      }
    }

    let gluedOstArrLength = gluedOstArr.length;
    for (let i = 0; i < gluedOstArrLength; i++) {
      if (gluedOstArr[i].position) {
        unbrokenPartsText += lcFirst(gluedOstArr[i].textFull) + '; ';
      } else {
        unbrokenPartsText += lcFirst(gluedOstArr[i].text) + '; ';
      }
    }

    ostCounter = 0;
    for (let i = 0; i < ostArrLength; i++) { //Перебор всего массива зеленых флагов. УБИРАЕМ ПОВТОРЯЮЩИЕСЯ ПУНКТЫ
      if (ostArr[i].checked) { //Отмеченных
        if ((i + 1 < ostArrLength) && (ostArr[i].text == ostArr[i + 1].text) && (ostArr[i + 1].checked)) {
          gluedDamArr[ostCounter] = {
            id: ostArr[i].id.charAt(0), //Первый символ ID
            text: ucFirst(ostArr[i].text) + ' - 2 шт.',
            position: ostArr[i].position,
            textFull: ucFirst(ostArr[i].text) + ' (' + ostArr[i].position + ' и ' + ostArr[i + 1].position + ')',
          }
          i++;
        } else {
          gluedDamArr[ostCounter] = {
            id: ostArr[i].id.charAt(0), //Первый символ ID
            text: ucFirst(ostArr[i].text),
            position: ostArr[i].position,
            textFull: ucFirst(ostArr[i].text) + ' ' + ostArr[i].position,
          }
        }
        ostCounter++;
      }
    }



    let gluedOstDamLength = gluedDamArr.length;
    for (let i = 0; i < gluedOstDamLength; i++) {
      switch (gluedDamArr[i].id) {
        case 'К': //Кузовные
          if (gluedDamArr[i].position) {
            damagedBodyPartsText += lcFirst(gluedDamArr[i].textFull) + '; ';
          } else {
            damagedBodyPartsText += lcFirst(gluedDamArr[i].text) + '; ';
          }
          break;
        default:
          if (gluedDamArr[i].position) {
            damagedOtherPartsText += lcFirst(gluedDamArr[i].textFull) + '; ';
          } else {
            damagedOtherPartsText += lcFirst(gluedDamArr[i].text) + '; ';
          }
          break;
      }

    }

    lcFirst(damagedBodyPartsText);
    lcFirst(damagedOtherPartsText);
    lcFirst(unbrokenPartsText);

    gluedOstArr[gluedOstArrLength] = {
      text: 'Прочее',
      position: false,
      ost: formatting('4.5')
    }

    $('input:checkbox:checked').each(function(i, elem) { //Перебираем каждый отмеченный флажок
      sample = $(this).nextAll();
      fullArr[i] = { //Записываем всё в массив объектов
        id: $(this).val(), //Записываем значение каждого отмеченного флажка
        text: $(this).next('input').val(), //Текст около флажка
        position: sample.filter('.position').val(), //Текст "позиция детали"
        action: sample.filter('.action_type').children('option:selected').text(), //Текст "тип ремонтного воздействия"
        quant: sample.filter('.quant').val(), //Количество нормо-часов
        paint: sample.filter('.paint').val(), //Количество краски
        norm: sample.filter('.norm').val(), //Значение нормо-часа
        cost: sample.filter('.cost').text(), //Стоимость пункта
        uts: sample.filter('.norm').attr('data-uts'), //Процент УТС
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
      if (fullArr[i].uts) {
        fullArr[i].uts = parseFloat(fullArr[i].uts);
      } else {
        fullArr[i].uts = 0;
      }




      idTwoFirstSymbols = fullArr[i].id.slice(0, 2); //Первые два символа отмеченного ID
      switch (idTwoFirstSymbols) {
        case 'К0': //Кузовные ремонты
          damageType[0]++;
          break;
        case 'З1': //Передняя часть
          damageType[1]++;
          break;
        case 'З2': //Центральная часть
          damageType[2]++;
          break;
        case 'З3': //Задняя часть
          damageType[3]++;
          break;
        case 'З4': //Моторный отсек
          damageType[4]++;
          break;
        case 'З5': //Салон
          damageType[5]++;
          break;
        case 'П1': //Передняя ходовка
          damageType[6]++;
          break;
        case 'П2': //Задняя ходовка
          damageType[7]++;
          break;
        default:
          break;
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
        case 'П': //Прочие услуги
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
                paintingText += 'Подготовка, грунтование и окраска:' + fullArr[i].text.slice(7) + ' ' + fullArr[i].position + ',';
              } else {
                paintingText += 'Подготовка, грунтование и окраска:' + fullArr[i].text.slice(7) + ',';
              }
              firstTimePainting = false;
            } else { // Остальные разы убираем слово "Окраска"
              if (fullArr[i].position) {
                paintingText += fullArr[i].text.slice(7) + ' ' + fullArr[i].position + ',';
              } else {
                paintingText += fullArr[i].text.slice(7) + ',';
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
          partsText += lcFirst(fullArr[i].text) + ' ' + fullArr[i].position + '; ';
        } else {
          partsText += lcFirst(fullArr[i].text) + '; ';
        }
      }
      if (!fullArr[i].quant) { //Если количество = 0 то пусть = 1
        fullArr[i].quant = 1;
      }
    }); //Конец перебора флажков
    console.timeEnd('Перебор флагов');

    if (!firstTimePainting) { //Ставим точку в конце окрашиваемых деталей
      paintingText = paintingText.slice(0, -1) + '. ';
    }

    partsText = ucFirst(endDot(partsText));


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
          cost: fullArr[i].cost + fullArr[i + 1].cost,
          uts: fullArr[i].uts + fullArr[i + 1].uts
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
          cost: fullArr[i].cost,
          uts: fullArr[i].uts
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
    let utsArr = []; //Массив для хранения данных таблицы УТС
    let utsCounter = 0;
    let totalUTS = 0; //Переменная для суммы УТС, %


    for (let i = 0; i < gluedArrLength; i++) {
      if (gluedArr[i].cost > 0) { //ТАБЛИЦЫ УСЛУГ И МАТЕРИАЛОВ
        idFirstSymbol = gluedArr[i].id.charAt(0);
        switch (idFirstSymbol) {
          case 'М': //Материалы
            materialsArr[materialsCounter] = {
              text: gluedArr[i].text,
              quant: formatting(gluedArr[i].quant),
              norm: formatting(gluedArr[i].norm),
              cost: formatting(gluedArr[i].cost)
            }

            materialsCounter++;
            totalMaterialsCost += gluedArr[i].cost;

            materialsTable += '<tr><td>' + materialsCounter + '</td><td>' + gluedArr[i].text + '</td><td>' + gluedArr[i].quant.toString().replace('.', ',') + '</td><td>' + gluedArr[i].norm.toFixed(2).replace('.', ',') + '</td><td>' + gluedArr[i].cost.toFixed(2).replace('.', ',') + '</td></tr>';
            break;
          default: //Услуги
            servicesCounter++;
            totalServicesCost += gluedArr[i].cost;

            if (gluedArr[i].action) {
              servicesArr[servicesCounter - 1] = {
                text: gluedArr[i].text + ' – ' + gluedArr[i].action,
                quant: formatting(gluedArr[i].quant),
                norm: formatting(gluedArr[i].norm),
                cost: formatting(gluedArr[i].cost)
              }
              servicesTable += '<tr><td>' + servicesCounter + '</td><td>' + gluedArr[i].text + ' – ' + gluedArr[i].action + '</td><td>' + gluedArr[i].quant.toString().replace('.', ',') + '</td><td>' + gluedArr[i].norm.toFixed(1).replace('.', ',') + '</td><td>' + gluedArr[i].cost.toFixed(2).replace('.', ',') + '</td></tr>';
            } else {
              servicesArr[servicesCounter - 1] = {
                text: gluedArr[i].text,
                quant: formatting(gluedArr[i].quant),
                norm: formatting(gluedArr[i].norm),
                cost: formatting(gluedArr[i].cost)
              }
              servicesTable += '<tr><td>' + servicesCounter + '</td><td>' + gluedArr[i].text + '</td><td>' + gluedArr[i].quant.toString().replace('.', ',') + '</td><td>' + gluedArr[i].norm.toFixed(1).replace('.', ',') + '</td><td>' + gluedArr[i].cost.toFixed(2).replace('.', ',') + '</td></tr>';
            }

            if (gluedArr[i].uts > 0) {
              totalUTS += gluedArr[i].uts;
              utsCounter++;
              utsArr[utsCounter - 1] = {
                text: servicesArr[servicesCounter - 1].text,
                quant: servicesArr[servicesCounter - 1].quant,
                uts: formatting(gluedArr[i].uts)
              }
            }


            break;
        }
      }

      if (gluedArr[i].action == 'замена') { //ТАБЛИЦА ЗАПЧАСТЕЙ
        partsCounter++;
        if (gluedArr[i].position) {
          partsArr[partsCounter - 1] = {
            text: gluedArr[i].text + ' ' + gluedArr[i].position,
            quant: formatting(gluedArr[i].quant)
          }
          partsTable += '<tr><td>' + partsCounter + '</td><td>' + gluedArr[i].text + ' ' + gluedArr[i].position + '</td><td>' + gluedArr[i].quant + '</td><td>0,00</td><td>0,00</td></tr>';
        } else {
          partsArr[partsCounter - 1] = {
            text: gluedArr[i].text,
            quant: formatting(gluedArr[i].quant)
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

    let definitionText; // Текст "при осмотре установлено"

    function makeDefinitionText() { //Функция создания текста "при осмотре установлено"

      let damagedPartsText = ''; // Текст поврежденных частей
      let damagedPartsOptions = [" кузова,", " передней части кузова,", " центральной части кузова,", " задней части кузова,", " моторного отсека,", " салона,", " передней ходовой части,", " задней ходовой части,"];
      let damagedPartsSum = 0;
      for (let i = 1; i < damageType.length; i++) { // Сумма всех элементов массива кроме первого
        damagedPartsSum += damageType[i];
        if (damageType[i] < 1) {
          damagedPartsOptions[i] = "";
        }
      }

      if (damagedPartsSum > 0) { // Если сумма элементов массива повреждений больше 0
        damagedPartsText = ' Повреждены детали' + damagedPartsOptions[1] + damagedPartsOptions[6] + damagedPartsOptions[4] + damagedPartsOptions[2] + damagedPartsOptions[5] + damagedPartsOptions[3] + damagedPartsOptions[7];
        damagedPartsText = damagedPartsText.slice(0, -1) + ".";
      }

      let skewText = ''; // Текст перекоса
      if ($('#distortion').prop('checked')) { // Если выбран перекос
        let skewOptions = ["несложную деформацию", "деформацию средней сложности", "сложную деформацию", "особо сложную деформацию"];
        skewText = ' Кузов имеет ' + skewOptions[$('#selectedIndex').prop('selectedIndex')] + ' с нарушением геометрии – не соблюдены технологические зазоры между кузовными деталями.'
      }
      let accidentType = ["находится в разбитом состоянии после дорожно-транспортного происшествия.", "находится в обгоревшем состоянии.", "находится в поврежденном состоянии."];
      let evalPurp = $('#evaluation_purpose').val();
      definitionText = accidentType[evalPurp] + damagedPartsText + skewText;
    }

    makeDefinitionText();

    function calcKv(year) { //Функция расчета Кв
      let da = new Date(); //Текущая дата
      let fullYear = da.getFullYear(); //Текущий полный год
      let age = Number(year);
      let kv;
      if (age) {
        age = fullYear - age;
      }
      switch (true) {
        case (age <= 5):
          kv = 0.8;
          break;
        case (5 < age) && (age <= 10):
          kv = 0.65;
          break;
        case (10 < age) && (age <= 15):
          kv = 0.55;
          break;
        case (15 < age) && (age <= 20):
          kv = 0.4;
          break;
        default:
          kv = 0.35;
          break;
      }
      return kv;
    }

    function calcKop(percent) { //Функция расчета Коп
      let kop = (percent / 200 + 0.5).toFixed(2);
      return kop;
    }

    let ostForCalc = (0.7 * calcKv($('#vehicle_year').val()) * calcKop(totalOst) * totalOst).toFixed(2);
    damagedBodyPartsText = ucFirst(endDot(damagedBodyPartsText));
    damagedOtherPartsText = ucFirst(endDot(damagedOtherPartsText));
    unbrokenPartsText = ucFirst(endDot(unbrokenPartsText));
    $('#total_calc').html('Услуг: ' + totalServicesCost + ' сом<br>Материалов: ' + totalMaterialsCost + ' сом<br>Всего: ' + totalCost + ' сом<br>УТС: ' + totalUTS.toFixed(2) + ' %<br>Кузовных повреждений: ' + damageType[0] + ' шт.<br>Остатки: ' + totalOst.toFixed(2) + ' %<br>Кз = 0.7<br>Kв = ' + calcKv($('#vehicle_year').val()) + '<br>Kоп = ' + calcKop(totalOst) + '<br>Остатки для расчета: ' + ostForCalc + ' %<hr>');

    let reportData = {
      doctype: $('#doc_type').val(),
      assreason: $('#ass_reason').val(),
      contractnum: $('#contract_number').val(),
      idate: $('#inspection_date').val(),
      cdate: $('#calc_date').val(),
      customer: $('#customer_name').val(),
      property: $('#property_owner').val(),
      position: $('#vehicle_location').val(),
      purpose: $('#evaluation_purpose').val(),
      appointment: $('#evaluation_appointment').val(),
      costtype: $('#cost_type').val(),
      usedmethods: $('#cost_type').val(),
      contractcost: $('#contract_cost').val(),
      costinwords: $('#contract_cost_in_words').val(),
      exchangerate: $('#exchange_rate').val(),
      servicesres: formatting(totalServicesCost),
      materialsres: formatting(totalMaterialsCost),
      totalres: formatting(totalCost),
      utspercent: formatting(totalUTS.toFixed(2)),
      ostpercent: formatting(totalOst.toFixed(2))
    }

    let vehicleData = {
      assobject: $('#ass_object').val(),
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
      gearbox: $('#vehicle_gearbox').val(),
      steering: $('#vehicle_steering').val(),
      hourcost: $('#cost_per_hour').val(),
      owner: $('#vehicle_owner').val(),
      adress: $('#vehicle_adress').val(),
      kz: formatting($('#vehicle_types').children('select option:selected').attr('data-kz')),
      kv: formatting(calcKv($('#vehicle_year').val())),
      kop: formatting(calcKop(totalOst))
    }

    let inspectionText = {
      definition: definitionText,
      disassembly: disassemblyText,
      repair: repairText,
      painting: paintingText,
      additional: additionalText,
      hidden: hiddenText,
      parts: partsText,
      damagedBodyParts: damagedBodyPartsText,
      damagedOtherParts: damagedOtherPartsText,
      unbrokenParts: unbrokenPartsText
    }

    $('#vehicle_data_text').val(JSON.stringify(vehicleData));
    $('#report_data_text').val(JSON.stringify(reportData));
    $('#inspection_text').val(JSON.stringify(inspectionText));
    $('#services_table').val(JSON.stringify(servicesArr));
    $('#materials_table').val(JSON.stringify(materialsArr));
    $('#parts_table').val(JSON.stringify(partsArr));
    $('#uts_table').val(JSON.stringify(utsArr));
    $('#ost_table').val(JSON.stringify(gluedOstArr));
    $('#hidden_button, #hidden_field, #hidden_br').show();

    console.timeEnd('Весь расчет');
  }); //Конец расчета


}); //Конец события полной загрузки HTML и CSS
