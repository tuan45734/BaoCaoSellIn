let filteredData = [];

document.addEventListener('DOMContentLoaded', function () {
    initializeDatePickers();
    // Sử dụng enrichedSalesData thay vì salesData
    filteredData = [...enrichedSalesData];
    updateAll();
});

function applyFilters() {
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;

    filteredData = enrichedSalesData.filter(item => {
        if (startDate && endDate) {
            const itemDate = parseDate(item.ngay);
            const start = parseDate(startDate);
            const end = parseDate(endDate);
            if (itemDate < start || itemDate > end) return false;
        }
        return true;
    });

    updateAll();
}

function initializeDatePickers() {
    flatpickr.localize({
        weekdays: {
            shorthand: ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'],
            longhand: ['Chủ nhật', 'Thứ hai', 'Thứ ba', 'Thứ tư', 'Thứ năm', 'Thứ sáu', 'Thứ bảy']
        },
        months: {
            shorthand: ['Th1', 'Th2', 'Th3', 'Th4', 'Th5', 'Th6', 'Th7', 'Th8', 'Th9', 'Th10', 'Th11', 'Th12'],
            longhand: ['Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6', 'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12']
        },
        firstDayOfWeek: 1,
        rangeSeparator: ' đến ',
        weekAbbreviation: 'Tuần',
        scrollTitle: 'Cuộn để tăng',
        toggleTitle: 'Nhấn để chuyển',
        amPM: ['SA', 'CH'],
        yearAriaLabel: 'Năm'
    });

    flatpickr(".datepicker", {
        dateFormat: "d/m/Y",
        locale: 'vn',
        onChange: function () {
            applyFilters();
        },
        prevArrow: '<i class="fas fa-chevron-left"></i>',
        nextArrow: '<i class="fas fa-chevron-right"></i>',
        placeholder: 'dd/mm/yyyy'
    });
}

function applyFilters() {
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;

    filteredData = salesData.filter(item => {
        if (startDate && endDate) {
            const itemDate = parseDate(item.ngay);
            const start = parseDate(startDate);
            const end = parseDate(endDate);
            if (itemDate < start || itemDate > end) return false;
        }
        return true;
    });

    updateAll();
}

function updateAll() {
    updateOverviewStats();
    updateOverviewCharts();
    updateRegionTables();
    updateRegionCharts();
    updateAreaTables();
    updateAreaCharts();
    updateProvinceData();
    updateNPPData();
}

function switchTab(tabId, event) {
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');

    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    document.getElementById(tabId).classList.add('active');

    if (tabId === 'byProvince') {
        openProvinceModal();
        updateProvinceData();
    } else if (tabId === 'byNPP') {
        openNPPModal();
        updateNPPData();
    }
}

// Window click handler for modals
window.onclick = function(event) {
    const modals = [
        'provinceModal', 'nppModal', 'nppDetailModal', 
        'provinceDetailModal', 'nppByProductModal'
    ];
    
    modals.forEach(modalId => {
        const modal = document.getElementById(modalId);
        if (event.target == modal) {
            if (modalId === 'provinceModal') closeProvinceModal();
            if (modalId === 'nppModal') closeNPPModal();
            if (modalId === 'nppDetailModal') closeNPPDetailModal();
            if (modalId === 'provinceDetailModal') closeProvinceDetailModal();
            if (modalId === 'nppByProductModal') closeNPPByProductModal();
        }
    });
};