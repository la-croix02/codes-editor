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
  const productNameInput = document.getElementById('productName');
  const productSeriesInput = document.getElementById('productSeries');
  const saveRecordBtn = document.getElementById('saveRecordBtn');
  const downloadRecordsBtn = document.getElementById('downloadRecordsBtn');
  const clearRecordsBtn = document.getElementById('clearRecordsBtn');
  const recordCountSpan = document.getElementById('recordCount');
  const recordList = document.getElementById('recordList');

  let savedRecords = JSON.parse(localStorage.getItem('savedRecords') || '[]');
  updateRecordCounter();
  renderRecordList();

  let markSerialCounter = 0;
  let totalPackages = 0;
  const allCodes = new Set();

  const savedData = JSON.parse(localStorage.getItem('savedCodes'));
  const savedCount = localStorage.getItem('packageCount');

  if (savedCount && !isNaN(savedCount)) {
    packageCountInput.value = savedCount;
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

      if (rawCode.length < 6 || /^[a-zA-Z]/.test(rawCode)) {
        alert("❌ Неверный формат кода.");
        this.value = '';
        return;
      }

      const onlyDigits = /^\d+$/;
      const hasLetter = /[a-zA-Z]/;

      if (onlyDigits.test(rawCode)) {
        const processed = rawCode.replace(/^00/, '');
        if (allCodes.has(processed)) {
          alert("❌ Такой код уже был введён ранее.");
          this.value = '';
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
          this.value = '';
          return;
        }
        addCode(markingList, processed, false);
        markSerialCounter++;
        updateSerialCounter();
        totalPackages += 1;
        updateTotalPackages();
        allCodes.add(processed);
      } else {
        alert("❌ Код должен быть числовым или содержать хотя бы одну букву.");
        this.value = '';
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
      totalPackages -= isAgg ? amount : 1;
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
    container.querySelectorAll('.code-row').forEach((row, index) => {
      row.querySelector('.index').textContent = index + 1;
    });
  }

  function saveToLocalStorage() {
    const aggregationCodes = Array.from(aggregationList.querySelectorAll('.code-row')).map(row => ({
      code: row.querySelector('.code')?.textContent?.trim(),
      count: parseInt(row.querySelector('.amount')?.textContent?.trim() || '1')
    }));
    const markingCodes = Array.from(markingList.querySelectorAll('.code')).map(el => el.textContent.trim());

    localStorage.setItem('savedCodes', JSON.stringify({ aggregation: aggregationCodes, marking: markingCodes }));
    localStorage.setItem('packageCount', packageCountInput.value);
  }

  function updateSerialCounter() {
    markSerialSpan.textContent = markSerialCounter;
  }

  function updateTotalPackages() {
    totalPackagesSpan.textContent = totalPackages;
  }

  function updateCounters() {
    aggCountSpan.textContent = aggregationList.querySelectorAll('.code-row').length;
    markCountSpan.textContent = markingList.querySelectorAll('.code-row').length;
  }

  saveRecordBtn.addEventListener('click', () => {
    const name = productNameInput.value.trim();
    const series = productSeriesInput.value.trim();
    const aggCodes = Array.from(aggregationList.querySelectorAll('.code-row')).map(row => ({
      code: row.querySelector('.code').textContent.trim(),
      count: parseInt(row.querySelector('.amount').textContent || '1')
    }));
    const markCodes = Array.from(markingList.querySelectorAll('.code-row')).map(row => row.querySelector('.code').textContent.trim());

    if (!aggCodes.length && !markCodes.length) {
      alert("Нет данных для записи.");
      return;
    }

    const quantity = aggCodes.reduce((sum, a) => sum + a.count, 0) + markCodes.length;

    savedRecords.push({ name, series, aggregation: aggCodes, marking: markCodes, quantity });
    localStorage.setItem('savedRecords', JSON.stringify(savedRecords));
    updateRecordCounter();
    renderRecordList();

    productNameInput.value = '';
    productSeriesInput.value = '';
    aggregationList.innerHTML = '';
    markingList.innerHTML = '';
    totalPackages = 0;
    markSerialCounter = 0;
    allCodes.clear();

    updateTotalPackages();
    updateCounters();
    updateSerialCounter();
    saveToLocalStorage();
  });

  function renderRecordList() {
    recordList.innerHTML = '';
    savedRecords.forEach(rec => {
      const div = document.createElement('div');
      div.textContent = `${rec.name || 'Без названия'} ${rec.series || 'Без серии'}`;
      recordList.appendChild(div);
    });
  }

  downloadRecordsBtn.addEventListener('click', () => {
    if (!savedRecords.length) {
      alert('Нет записей для скачивания.');
      return;
    }

    const wb = XLSX.utils.book_new();
    const wsData = [];

    savedRecords.forEach(rec => {
      if (rec.name || rec.series) {
        wsData.push(['Наименование товара', rec.name || '']);
        wsData.push(['Серия', rec.series || '']);
        wsData.push(['Количество', rec.quantity]);
      } 

      if (rec.aggregation.length) {
        if (rec.name || rec.series) wsData.push(['Оригиналы:']);
        rec.aggregation.forEach(a => wsData.push([a.code]));
      }

      if (rec.marking.length) {
        if (rec.name || rec.series) wsData.push(['Штучные:']);
        rec.marking.forEach(m => wsData.push([m]));
      }

      wsData.push([]);
    });

    const ws = XLSX.utils.aoa_to_sheet(wsData);
    XLSX.utils.book_append_sheet(wb, ws, 'Записи');
    const dateStr = new Date().toISOString().slice(0, 10);
    XLSX.writeFile(wb, `Товары_${dateStr}.xlsx`);
  });

  clearRecordsBtn.addEventListener('click', () => {
    if (confirm('Удалить все записи?')) {
      savedRecords = [];
      localStorage.removeItem('savedRecords');
      updateRecordCounter();
      renderRecordList();
    }
  });

  function updateRecordCounter() {
    recordCountSpan.textContent = savedRecords.length;
  }

  // Restore copy and clear buttons
  document.querySelectorAll('.copy-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const list = btn.closest('.box').querySelector('.code-list');
      const codes = Array.from(list.querySelectorAll('.code')).map(span => span.textContent.trim()).join('\n');
      navigator.clipboard.writeText(codes).then(() => alert('Коды скопированы в буфер обмена!'));
    });
  });

  document.querySelectorAll('.clear-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const list = btn.closest('.box').querySelector('.code-list');
      const rows = list.querySelectorAll('.code-row');
      rows.forEach(row => {
        const code = row.querySelector('.code')?.textContent?.trim();
        const amount = parseInt(row.querySelector('.amount')?.textContent || '1');
        if (btn.closest('#aggregationBox')) {
          totalPackages -= amount;
        } else {
          totalPackages -= 1;
        }
        allCodes.delete(code);
        row.remove();
      });
      updateCounters();
      updateTotalPackages();
      saveToLocalStorage();
    });
  });
};

