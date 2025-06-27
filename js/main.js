window.onload = function () {
  const codeInput = document.getElementById('codeInput');
  const packageCountInput = document.getElementById('packageCount');
  const aggregationList = document.getElementById('aggregationList');
  const markingList = document.getElementById('markingList');
  const aggCountSpan = document.getElementById('aggCount');
  const markCountSpan = document.getElementById('markCount');
  const totalPackagesSpan = document.getElementById('totalPackages');
  const markSerialSpan = document.getElementById('markSerial');
  const resetSerialBtn = document.getElementById('resetSerialBtn');

  let markSerialCounter = 0;
  let aggCounter = 1;
  let markCounter = 1;
  let totalPackages = 0;

  const allCodes = new Set();

  // Загрузка сохранённых значений
  const savedData = JSON.parse(localStorage.getItem('savedCodes'));
  const savedCount = localStorage.getItem('packageCount');
  const savedTotal = localStorage.getItem('totalPackages');

  if (savedCount && !isNaN(savedCount)) {
    packageCountInput.value = savedCount;
  }

  if (savedTotal && !isNaN(savedTotal)) {
    totalPackages = parseInt(savedTotal);
    updateTotalPackages();
  }

  if (savedData) {
    if (savedData.aggregation) {
      savedData.aggregation.forEach(obj => {
        const code = obj.code;
        const count = obj.count || '1';
        addCode(aggregationList, code, true, count);
        allCodes.add(code);
        totalPackages += parseInt(count);
      });
    }
    if (savedData.marking) {
      savedData.marking.forEach(code => {
        addCode(markingList, code, false);
        allCodes.add(code);
        totalPackages += 1;
      });
    }
    updateTotalPackages();
    updateCounters();
  }

  codeInput.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') {
      const rawCode = this.value.trim();

      if (rawCode.length < 6) {
        alert("❌ Код должен содержать минимум 6 символов.");
        return;
      }

      if (/^[a-zA-Z]/.test(rawCode)) {
        alert("❌ Код не должен начинаться с буквы.");
        return;
      }

      const onlyDigits = /^\d+$/;
      const hasLetter = /[a-zA-Z]/;

      if (onlyDigits.test(rawCode)) {
        const processed = rawCode.replace(/^00/, '');
        if (allCodes.has(processed)) {
          alert("❌ Такой код уже был введён ранее.");
          return;
        }
        const count = parseInt(packageCountInput.value) || 1;
        addCode(aggregationList, processed, true, count);
        totalPackages += count;
        updateTotalPackages();
        allCodes.add(processed);
      } else if (hasLetter.test(rawCode)) {
        const processed = rawCode.split('91UZF')[0];
        if (allCodes.has(processed)) {
          alert("❌ Такой код уже был введён ранее.");
          return;
        }
        addCode(markingList, processed, false);
        markSerialCounter++;
        updateSerialCounter();
        totalPackages += 1;
        updateTotalPackages();
        allCodes.add(processed);
      } else {
        alert("❌ Код должен состоять только из цифр (агрегация) или содержать хотя бы одну букву (маркировка).");
        return;
      }

      saveToLocalStorage();
      this.value = '';
    }
  });

  function addCode(container, code, isAgg, count = '') {
    const item = document.createElement('div');
    item.className = 'code-row';
    item.innerHTML = `
      <span class="index"></span>
      <span class="code">${code}</span>
      <span class="amount">${isAgg ? count : ''}</span>
      <span class="remove-btn" style="cursor: pointer;">✕</span>
    `;
    container.appendChild(item);

    item.querySelector('.remove-btn').addEventListener('click', () => {
      const amount = parseInt(item.querySelector('.amount')?.textContent || '1');
      if (isAgg) {
        totalPackages -= amount;
      } else {
        totalPackages -= 1;
      }

      container.removeChild(item);
      allCodes.delete(code);
      renumberCodes(container);
      updateCounters();
      updateTotalPackages();
      saveToLocalStorage();
    });

    renumberCodes(container);
    updateCounters();
  }

  function renumberCodes(container) {
    const rows = container.querySelectorAll('.code-row');
    rows.forEach((row, index) => {
      const indexSpan = row.querySelector('.index');
      if (indexSpan) {
        indexSpan.textContent = index + 1;
      }
    });

    if (container.id === 'aggregationList') {
      aggCounter = rows.length + 1;
    } else if (container.id === 'markingList') {
      markCounter = rows.length + 1;
    }
  }

  function saveToLocalStorage() {
    const aggregationCodes = Array.from(aggregationList.querySelectorAll('.code-row')).map(row => {
      return {
        code: row.querySelector('.code')?.textContent?.trim(),
        count: row.querySelector('.amount')?.textContent?.trim()
      };
    });

    const markingCodes = Array.from(markingList.querySelectorAll('.code')).map(el => el.textContent.trim());

    const data = {
      aggregation: aggregationCodes,
      marking: markingCodes
    };

    localStorage.setItem('savedCodes', JSON.stringify(data));
    localStorage.setItem('packageCount', packageCountInput.value);
    localStorage.setItem('totalPackages', totalPackages.toString());
  }

  function updateSerialCounter() {
    markSerialSpan.textContent = markSerialCounter;
  }

  resetSerialBtn.addEventListener('click', () => {
    markSerialCounter = 0;
    updateSerialCounter();
  });

  packageCountInput.addEventListener('input', () => {
    const val = parseInt(packageCountInput.value);
    if (!isNaN(val) && val > 0) {
      localStorage.setItem('packageCount', val);
    }
  });

  function updateTotalPackages() {
    totalPackagesSpan.textContent = totalPackages;
  }

  function updateCounters() {
    const aggCount = aggregationList.querySelectorAll('.code-row').length;
    const markCount = markingList.querySelectorAll('.code-row').length;

    flashUpdate(aggCountSpan, ` ${aggCount}`);
    flashUpdate(markCountSpan, ` ${markCount}`);
  }

  function flashUpdate(element, text) {
    element.textContent = text;
    element.classList.add('flash');
    setTimeout(() => {
      element.classList.remove('flash');
    }, 400);
  }

  const boxes = document.querySelectorAll('.box');

  boxes.forEach(box => {
    const copyBtn = box.querySelector('.copy-btn');
    const clearBtn = box.querySelector('.clear-btn');
    const codeList = box.querySelector('.code-list');

    copyBtn.addEventListener('click', () => {
      const rows = codeList.querySelectorAll('.code-row');
      let codes = [];

      rows.forEach(row => {
        const code = row.querySelector('.code')?.textContent?.trim();
        if (code) codes.push(code);
      });

      if (codes.length) {
        navigator.clipboard.writeText(codes.join('\n')).then(() => {
          alert('Коды скопированы в буфер обмена!');
        }).catch(err => {
          alert('Ошибка копирования: ' + err);
        });
      } else {
        alert('Нет кодов для копирования.');
      }
    });

    clearBtn.addEventListener('click', () => {
      const rows = codeList.querySelectorAll('.code-row');

      rows.forEach(row => {
        const code = row.querySelector('.code')?.textContent?.trim();
        const amount = parseInt(row.querySelector('.amount')?.textContent || '1');

        if (code) {
          allCodes.delete(code);
          if (box.id === 'aggregationBox') {
            totalPackages -= amount;
          } else {
            totalPackages -= 1;
          }
        }
      });

      codeList.innerHTML = '';

      if (box.id === 'aggregationBox') {
        aggCounter = 1;
      } else if (box.id === 'markingBox') {
        markCounter = 1;
        markSerialCounter = 0;
        updateSerialCounter();
      }

      updateCounters();
      updateTotalPackages();
      saveToLocalStorage();
    });
  });
};

document.getElementById('exportExcelBtn').addEventListener('click', () => {
  const aggRows = aggregationList.querySelectorAll('.code-row');
  const markRows = markingList.querySelectorAll('.code-row');

  const aggData = [];
  aggRows.forEach(row => {
    const code = row.querySelector('.code')?.textContent.trim();
    if (code) aggData.push([code]);
  });

  const markData = [];
  markRows.forEach(row => {
    const code = row.querySelector('.code')?.textContent.trim();
    if (code) markData.push([code]);
  });

  const wb = XLSX.utils.book_new();

  if (aggData.length) {
    const ws1 = XLSX.utils.aoa_to_sheet(aggData);
    XLSX.utils.book_append_sheet(wb, ws1, 'Агрегационные');
  }

  if (markData.length) {
    const ws2 = XLSX.utils.aoa_to_sheet(markData);
    XLSX.utils.book_append_sheet(wb, ws2, 'Маркировочные');
  }

  const today = new Date();
  const dateStr = today.toISOString().slice(0, 10);
  XLSX.writeFile(wb, `Коды_${dateStr}.xlsx`);
});


