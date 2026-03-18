// script.js
let charts = {};
let filteredData = [];
let provinceFilter = {
    mien: '',
    khuVuc: ''
};
let nppFilter = {
    mien: '',
    khuVuc: '',
    tinh: ''
};
document.addEventListener('DOMContentLoaded', function () {
    initializeDatePickers();
    filteredData = [...salesData];
    initializeProvinceFilters();
    updateAll();
});

function parseDate(dateStr) {
    if (!dateStr) return null;
    const parts = dateStr.split('/');
    return new Date(parts[2], parts[1] - 1, parts[0]);
}

function formatMoney(amount) {
    if (amount >= 1000000000) {
        const ty = amount / 1000000000;
        const tyStr = ty.toString();
        const decimalIndex = tyStr.indexOf('.');
        if (decimalIndex === -1) {
            return tyStr + ',0 tỷ';
        } else {
            const firstDecimal = tyStr.substring(0, decimalIndex + 2);
            return firstDecimal.replace('.', ',') + ' tỷ';
        }
    } else if (amount >= 1000000) {
        const trieu = amount / 1000000;
        const trieuStr = trieu.toString();
        const decimalIndex = trieuStr.indexOf('.');
        if (decimalIndex === -1) {
            return trieuStr + ',0 tr';
        } else {
            const firstDecimal = trieuStr.substring(0, decimalIndex + 2);
            return firstDecimal.replace('.', ',') + ' tr';
        }
    } else {
        return new Intl.NumberFormat('vi-VN').format(amount) + ' đ';
    }
}

// Hàm format số đầy đủ cho bảng
function formatFullNumber(amount) {
    if (amount === null || amount === undefined || amount === '') return '0 đ';
    return new Intl.NumberFormat('vi-VN').format(amount) + ' đ';
}
function formatNumber(num) {
    return new Intl.NumberFormat('vi-VN').format(num);
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
    updateStats();
    updateCharts();
    updateTables();
}

function updateStats() {
    const totalRevenue = filteredData.reduce((sum, item) => sum + (item.doanhThuThuan || 0), 0);
    const totalSales = filteredData.reduce((sum, item) => sum + (item.doanhSoBan || 0), 0);
    const totalDiscount = filteredData.reduce((sum, item) => sum + (item.chietKhau || 0), 0);
    const totalTransactions = filteredData.length;

    const statsGrid = document.getElementById('overviewStats');
    statsGrid.innerHTML = `
        <div class="stat-card">
            <div class="stat-icon"><i class="fas fa-dollar-sign"></i></div>
            <div class="stat-info">
                <h3>Tổng doanh thu thuần</h3>
                <div class="value">${formatMoney(totalRevenue)}</div>
            </div>
        </div>
        <div class="stat-card">
            <div class="stat-icon"><i class="fas fa-chart-line"></i></div>
            <div class="stat-info">
                <h3>Tổng doanh số bán</h3>
                <div class="value">${formatMoney(totalSales)}</div>
            </div>
        </div>
        <div class="stat-card">
            <div class="stat-icon"><i class="fas fa-percent"></i></div>
            <div class="stat-info">
                <h3>Tổng chiết khấu</h3>
                <div class="value">${formatMoney(totalDiscount)}</div>
            </div>
        </div>
        <div class="stat-card">
            <div class="stat-icon"><i class="fas fa-file-invoice"></i></div>
            <div class="stat-info">
                <h3>Số giao dịch</h3>
                <div class="value">${formatNumber(totalTransactions)}</div>
            </div>
        </div>
    `;
}

function updateCharts() {
    Object.values(charts).forEach(chart => {
        if (chart) chart.destroy();
    });

    updatePieChartMien();
    updateBarChartKV();
    updateLineChartDaily();
    updateBarChartMienDetail();
    updateBarChartKVDetail();
    updateBarChartProvince();
    updateBarChartNPPTop(); // Sẽ dùng filter hiện tại
}
function updateBarChartKVDetail() {
    const ctx = document.getElementById('barChartKVDetail').getContext('2d');
    const kvData = {};
    
    filteredData.forEach(item => {
        const kv = item.maKhuVuc;
        kvData[kv] = (kvData[kv] || 0) + (item.doanhThuThuan || 0);
    });

    charts.barKVDetail = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: Object.keys(kvData),
            datasets: [{
                label: 'Doanh thu thuần',
                data: Object.values(kvData),
                backgroundColor: '#ff7300'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                datalabels: {
                    display: true,
                    anchor: 'end',
                    align: 'top',
                    offset: 4,
                    formatter: (value) => {
                        if (value >= 1000000000) {
                            const ty = value / 1000000000;
                            const rounded = Math.round(ty * 10) / 10;
                            return rounded.toString().replace('.', ',') + ' tỷ';
                        } else {
                            const trieu = value / 1000000;
                            const rounded = Math.round(trieu * 10) / 10;
                            return rounded.toString().replace('.', ',') + ' tr';
                        }
                    },
                    color: '#333',
                    font: {
                        weight: 'bold',
                        size: 14
                    },
                    rotation: 0
                },
                legend: {
                    labels: {
                        font: {
                            size: 13
                        }
                    }
                },
                tooltip: {
                    bodyFont: {
                        size: 13
                    },
                    titleFont: {
                        size: 13
                    },
                    callbacks: {
                        label: function(context) {
                            return formatMoney(context.raw);
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            if (value >= 1000000000) {
                                return (value / 1000000000).toFixed(1).replace('.', ',') + ' tỷ';
                            } else if (value >= 1000000) {
                                return (value / 1000000).toFixed(1).replace('.', ',') + ' tr';
                            } else {
                                return value;
                            }
                        },
                        font: {
                            size: 13
                        }
                    }
                },
                x: {
                    ticks: {
                        maxRotation: 30,
                        minRotation: 30,
                        font: {
                            size: 13
                        }
                    }
                }
            }
        },
        plugins: [ChartDataLabels]
    });
}

function updatePieChartMien() {
    const ctx = document.getElementById('pieChartMien').getContext('2d');
    const mienData = {};

    filteredData.forEach(item => {
        const mien = item.mien;
        mienData[mien] = (mienData[mien] || 0) + (item.doanhThuThuan || 0);
    });

    charts.pieMien = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: Object.keys(mienData),
            datasets: [{
                data: Object.values(mienData),
                backgroundColor: ['#667eea', '#ff7300', '#b10000', '#4ecdc4', '#45b7d1', '#96ceb4']
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                datalabels: {
                    display: true,
                    formatter: (value, context) => {
                        let total = context.dataset.data.reduce((a, b) => a + b, 0);
                        let percentage = ((value / total) * 100).toFixed(1);
                        return percentage + '%';
                    },
                    color: 'white',
                    font: { weight: 'bold', size: 14 }
                },
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            let label = context.label || '';
                            let value = context.raw || 0;
                            let total = context.dataset.data.reduce((a, b) => a + b, 0);
                            let percentage = ((value / total) * 100).toFixed(2);
                            return `${label}: ${formatMoney(value)} (${percentage}%)`;
                        }
                    }
                }
            }
        },
        plugins: [ChartDataLabels]
    });
}

function updateBarChartKV() {
    const ctx = document.getElementById('barChartKV').getContext('2d');
    const kvData = {};

    filteredData.forEach(item => {
        const kv = item.maKhuVuc;
        kvData[kv] = (kvData[kv] || 0) + (item.doanhThuThuan || 0);
    });

    charts.barKV = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: Object.keys(kvData),
            datasets: [{
                label: 'Doanh thu thuần',
                data: Object.values(kvData),
                backgroundColor: '#667eea'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                datalabels: {
                    display: true,
                    anchor: 'end',
                    align: 'top',
                    formatter: (value) => {
                        if (value >= 1000000000) {
                            return (value / 1000000000).toFixed(1).replace('.', ',') + ' tỷ';
                        } else {
                            return (value / 1000000).toFixed(1).replace('.', ',') + ' tr';
                        }
                    },
                    color: '#333',
                    font: { weight: 'bold', size: 11 },
                    rotation: -45
                },
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            return formatMoney(context.raw);
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function (value) {
                            return formatMoney(value);
                        }
                    }
                }
            }
        },
        plugins: [ChartDataLabels]
    });
}

function updateLineChartDaily() {
    const ctx = document.getElementById('lineChartDaily').getContext('2d');
    const dailyData = {};
    
    filteredData.forEach(item => {
        const date = item.ngay;
        dailyData[date] = (dailyData[date] || 0) + (item.doanhThuThuan || 0);
    });

    const sortedDates = Object.keys(dailyData).sort((a, b) => {
        return parseDate(a) - parseDate(b);
    });

    charts.lineDaily = new Chart(ctx, {
        type: 'line',
        data: {
            labels: sortedDates,
            datasets: [{
                label: 'Doanh thu thuần',
                data: sortedDates.map(date => dailyData[date]),
                borderColor: '#667eea',
                backgroundColor: 'rgba(102, 126, 234, 0.1)',
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                datalabels: {
                    display: true,
                    align: 'top',
                    offset: 10,
                    formatter: (value) => {
                        if (value >= 1000000000) {
                            const ty = value / 1000000000;
                            const rounded = Math.round(ty * 10) / 10;
                            return rounded.toString().replace('.', ',') + ' tỷ';
                        } else {
                            const trieu = value / 1000000;
                            const rounded = Math.round(trieu * 10) / 10;
                            return rounded.toString().replace('.', ',') + ' tr';
                        }
                    },
                    color: '#667eea',
                    font: {
                        weight: 'bold',
                        size: 13
                    },
                    rotation: 0
                },
                legend: {
                    labels: {
                        font: {
                            size: 13
                        }
                    }
                },
                tooltip: {
                    bodyFont: {
                        size: 13
                    },
                    titleFont: {
                        size: 13
                    },
                    callbacks: {
                        label: function(context) {
                            return formatMoney(context.raw);
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            if (value >= 1000000000) {
                                return (value / 1000000000).toFixed(1).replace('.', ',') + ' tỷ';
                            } else if (value >= 1000000) {
                                return (value / 1000000).toFixed(1).replace('.', ',') + ' tr';
                            } else {
                                return value;
                            }
                        },
                        font: {
                            size: 12
                        }
                    }
                },
                x: {
                    ticks: {
                        maxRotation: 30,
                        minRotation: 30,
                        font: {
                            size: 12
                        }
                    }
                }
            }
        },
        plugins: [ChartDataLabels]
    });
}

function updateBarChartMienDetail() {
    const ctx = document.getElementById('barChartMienDetail').getContext('2d');
    const mienData = {};
    
    filteredData.forEach(item => {
        const mien = item.mien;
        mienData[mien] = (mienData[mien] || 0) + (item.doanhThuThuan || 0);
    });

    charts.barMienDetail = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: Object.keys(mienData),
            datasets: [{
                label: 'Doanh thu thuần',
                data: Object.values(mienData),
                backgroundColor: '#667eea'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                datalabels: {
                    display: true,
                    anchor: 'end',
                    align: 'top',
                    offset: 4,
                    formatter: (value) => {
                        if (value >= 1000000000) {
                            const ty = value / 1000000000;
                            const rounded = Math.round(ty * 10) / 10;
                            return rounded.toString().replace('.', ',') + ' tỷ';
                        } else {
                            const trieu = value / 1000000;
                            const rounded = Math.round(trieu * 10) / 10;
                            return rounded.toString().replace('.', ',') + ' tr';
                        }
                    },
                    color: '#333',
                    font: {
                        weight: 'bold',
                        size: 14
                    },
                    rotation: 0
                },
                legend: {
                    labels: {
                        font: {
                            size: 13
                        }
                    }
                },
                tooltip: {
                    bodyFont: {
                        size: 13
                    },
                    titleFont: {
                        size: 13
                    },
                    callbacks: {
                        label: function(context) {
                            return formatMoney(context.raw);
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            if (value >= 1000000000) {
                                return (value / 1000000000).toFixed(1).replace('.', ',') + ' tỷ';
                            } else if (value >= 1000000) {
                                return (value / 1000000).toFixed(1).replace('.', ',') + ' tr';
                            } else {
                                return value;
                            }
                        },
                        font: {
                            size: 13
                        }
                    }
                },
                x: {
                    ticks: {
                        maxRotation: 30,
                        minRotation: 30,
                        font: {
                            size: 14
                        }
                    }
                }
            }
        },
        plugins: [ChartDataLabels]
    });
}
function updateBarChartKV() {
    const ctx = document.getElementById('barChartKV').getContext('2d');
    const kvData = {};
    
    filteredData.forEach(item => {
        const kv = item.maKhuVuc;
        kvData[kv] = (kvData[kv] || 0) + (item.doanhThuThuan || 0);
    });

    charts.barKV = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: Object.keys(kvData),
            datasets: [{
                label: 'Doanh thu thuần',
                data: Object.values(kvData),
                backgroundColor: '#667eea'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                datalabels: {
                    display: true,
                    anchor: 'end',
                    align: 'top',
                    offset: 4,
                    formatter: (value) => {
                        if (value >= 1000000000) {
                            return (value / 1000000000).toFixed(1).replace('.', ',') + ' tỷ';
                        } else {
                            return (value / 1000000).toFixed(1).replace('.', ',') + ' tr';
                        }
                    },
                    color: '#333',
                    font: {
                        weight: 'bold',
                        size: 12
                    },
                    rotation: 0
                },
                legend: {
                    labels: {
                        font: {
                            size: 13
                        }
                    }
                },
                tooltip: {
                    bodyFont: {
                        size: 13
                    },
                    titleFont: {
                        size: 13
                    },
                    callbacks: {
                        label: function(context) {
                            return formatMoney(context.raw);
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            if (value >= 1000000000) {
                                return (value / 1000000000).toFixed(1).replace('.', ',') + ' tỷ';
                            } else if (value >= 1000000) {
                                return (value / 1000000).toFixed(1).replace('.', ',') + ' tr';
                            } else {
                                return value;
                            }
                        },
                        font: {
                            size: 12
                        }
                    }
                },
                x: {
                    ticks: {
                        maxRotation: 30,
                        minRotation: 30,
                        font: {
                            size: 12
                        }
                    }
                }
            }
        },
        plugins: [ChartDataLabels]
    });
}
function updateBarChartKV() {
    const ctx = document.getElementById('barChartKV').getContext('2d');
    const kvData = {};

    filteredData.forEach(item => {
        const kv = item.maKhuVuc;
        kvData[kv] = (kvData[kv] || 0) + (item.doanhThuThuan || 0);
    });

    charts.barKV = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: Object.keys(kvData),
            datasets: [{
                label: 'Doanh thu thuần',
                data: Object.values(kvData),
                backgroundColor: '#667eea'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                datalabels: {
                    display: true,
                    anchor: 'end',
                    align: 'top',
                    offset: 4,
                    formatter: (value) => {
                        if (value >= 1000000000) {
                            return (value / 1000000000).toFixed(1).replace('.', ',') + ' tỷ';
                        } else {
                            return (value / 1000000).toFixed(1).replace('.', ',') + ' tr';
                        }
                    },
                    color: '#333',
                    font: {
                        weight: 'bold',
                        size: 10
                    },
                    rotation: 0
                },
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            return formatMoney(context.raw);
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function (value) {
                            return formatMoney(value);
                        },
                        font: {
                            size: 10
                        }
                    }
                },
                x: {
                    ticks: {
                        maxRotation: 30,
                        minRotation: 30,
                        font: {
                            size: 10
                        }
                    }
                }
            }
        },
        plugins: [ChartDataLabels]
    });
}

function updateBarChartProvince() {
    const ctx = document.getElementById('barChartProvince').getContext('2d');
    if (!ctx) return;
    
    if (charts.barProvince) {
        charts.barProvince.destroy();
    }
    
    const data = getProvinceFilteredData();
    const provinceData = {};
    
    data.forEach(item => {
        const tinh = item.tinh;
        provinceData[tinh] = (provinceData[tinh] || 0) + (item.doanhThuThuan || 0);
    });

    const sortedProvinces = Object.entries(provinceData)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 20);

    charts.barProvince = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: sortedProvinces.map(item => item[0]),
            datasets: [{
                label: 'Doanh thu thuần',
                data: sortedProvinces.map(item => item[1]),
                backgroundColor: '#ff6b6b'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                datalabels: {
                    display: true,
                    anchor: 'end',
                    align: 'top',
                    offset: 4,
                    formatter: (value) => {
                        if (value >= 1000000000) {
                            const ty = value / 1000000000;
                            const rounded = Math.round(ty * 10) / 10;
                            return rounded.toString().replace('.', ',') + ' tỷ';
                        } else {
                            const trieu = value / 1000000;
                            const rounded = Math.round(trieu * 10) / 10;
                            return rounded.toString().replace('.', ',') + ' tr';
                        }
                    },
                    color: '#333',
                    font: {
                        weight: 'bold',
                        size: 12
                    },
                    rotation: 0
                },
                legend: {
                    labels: {
                        font: {
                            size: 13
                        }
                    }
                },
                tooltip: {
                    bodyFont: {
                        size: 13
                    },
                    titleFont: {
                        size: 13
                    },
                    callbacks: {
                        label: function(context) {
                            return formatMoney(context.raw);
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            if (value >= 1000000000) {
                                return (value / 1000000000).toFixed(1).replace('.', ',') + ' tỷ';
                            } else if (value >= 1000000) {
                                return (value / 1000000).toFixed(1).replace('.', ',') + ' tr';
                            } else {
                                return value;
                            }
                        },
                        font: {
                            size: 12
                        }
                    }
                },
                x: {
                    ticks: {
                        maxRotation: 45,
                        minRotation: 45,
                        font: {
                            size: 11
                        }
                    }
                }
            }
        },
        plugins: [ChartDataLabels]
    });
}

function showNPPDetailModal(nppName) {
    const modal = document.getElementById('nppDetailModal');
    document.getElementById('nppDetailName').textContent = nppName;
    
    const nppOrders = filteredData.filter(item => item.NPP === nppName);
    
    let totalSales = 0;
    let totalDiscount = 0;
    let totalRevenue = 0;
    
    let html = '';
    nppOrders.forEach(item => {
        totalSales += item.doanhSoBan || 0;
        totalDiscount += item.chietKhau || 0;
        totalRevenue += item.doanhThuThuan || 0;
        
        html += `<tr>
            <td>${item.ngay || ''}</td>
            <td>${item.mien || ''}</td>
            <td>${item.maKhuVuc || ''}</td>
            <td>${item.tinh || ''}</td>
            <td>${formatFullNumber(item.doanhSoBan)}</td>
            <td>${formatFullNumber(item.chietKhau)}</td>
            <td>${formatFullNumber(item.doanhThuThuan)}</td>
        </tr>`;
    });
    
    document.getElementById('nppDetailBody').innerHTML = html;
    document.getElementById('nppDetailTotal').innerHTML = `
        <i class="fas fa-chart-line"></i> 
        Tổng: DSB: ${formatFullNumber(totalSales)} | 
        CK: ${formatFullNumber(totalDiscount)} | 
        DTT: ${formatFullNumber(totalRevenue)} | 
        SL: ${nppOrders.length} đơn
    `;
    
    modal.style.display = 'block';
}

function closeNPPDetailModal() {
    const modal = document.getElementById('nppDetailModal');
    modal.style.display = 'none';
}
function updateBarChartNPPTop() {
    const ctx = document.getElementById('barChartNPPTop').getContext('2d');
    
    if (charts.barNPPTop) {
        charts.barNPPTop.destroy();
    }
    
    const data = getNPPFilteredData();
    const nppData = {};
    
    data.forEach(item => {
        const npp = item.NPP;
        nppData[npp] = (nppData[npp] || 0) + (item.doanhThuThuan || 0);
    });

    const sortedNPP = Object.entries(nppData)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 20);

    charts.barNPPTop = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: sortedNPP.map(item => item[0]),
            datasets: [{
                label: 'Doanh thu thuần',
                data: sortedNPP.map(item => item[1]),
                backgroundColor: '#4ecdc4'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            onClick: (event, activeElements) => {
                if (activeElements.length > 0) {
                    const index = activeElements[0].index;
                    const npp = sortedNPP[index][0];
                    showNPPDetailModal(npp);
                }
            },
            plugins: {
                datalabels: {
                    display: true,
                    anchor: 'end',
                    align: 'top',
                    offset: 4,
                    formatter: (value) => {
                        return formatMoney(value);
                    },
                    color: '#333',
                    font: {
                        weight: 'bold',
                        size: 12
                    },
                    rotation: 0
                },
                legend: {
                    labels: {
                        font: {
                            size: 13
                        }
                    }
                },
                tooltip: {
                    bodyFont: {
                        size: 13
                    },
                    titleFont: {
                        size: 13
                    },
                    callbacks: {
                        label: function(context) {
                            return formatMoney(context.raw);
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return formatMoney(value);
                        },
                        font: {
                            size: 12
                        }
                    }
                },
                x: {
                    ticks: {
                        maxRotation: 45,
                        minRotation: 45,
                        font: {
                            size: 10
                        }
                    }
                }
            }
        },
        plugins: [ChartDataLabels]
    });
}

function updateTables() {
    updateRegionTable();
    updateAreaTable();
    updateProvinceTable();
    updateNPPData(); // Thay đổi ở đây
}

function updateRegionTable() {
    const mienData = {};
    
    filteredData.forEach(item => {
        const mien = item.mien;
        if (!mienData[mien]) {
            mienData[mien] = {
                doanhSoBan: 0,
                chietKhau: 0,
                doanhThuThuan: 0,
                soGiaoDich: 0
            };
        }
        mienData[mien].doanhSoBan += item.doanhSoBan || 0;
        mienData[mien].chietKhau += item.chietKhau || 0;
        mienData[mien].doanhThuThuan += item.doanhThuThuan || 0;
        mienData[mien].soGiaoDich++;
    });

    let html = '<h3><i class="fas fa-map-marker-alt"></i> Thống kê theo miền</h3>';
    html += '<table><thead><tr><th>Miền</th><th>Doanh số bán</th><th>Chiết khấu</th><th>Doanh thu thuần</th><th>Số giao dịch</th></tr></thead><tbody>';
    
    Object.entries(mienData).forEach(([mien, data]) => {
        html += `<tr>
            <td>${mien}</td>
            <td>${formatFullNumber(data.doanhSoBan)}</td>
            <td>${formatFullNumber(data.chietKhau)}</td>
            <td>${formatFullNumber(data.doanhThuThuan)}</td>
            <td>${formatNumber(data.soGiaoDich)}</td>
        </tr>`;
    });
    
    html += '</tbody></table>';
    document.getElementById('regionTable').innerHTML = html;
}

function updateAreaTable() {
    const kvData = {};
    
    filteredData.forEach(item => {
        const kv = item.maKhuVuc;
        if (!kvData[kv]) {
            kvData[kv] = {
                doanhSoBan: 0,
                chietKhau: 0,
                doanhThuThuan: 0,
                soGiaoDich: 0
            };
        }
        kvData[kv].doanhSoBan += item.doanhSoBan || 0;
        kvData[kv].chietKhau += item.chietKhau || 0;
        kvData[kv].doanhThuThuan += item.doanhThuThuan || 0;
        kvData[kv].soGiaoDich++;
    });

    let html = '<h3><i class="fas fa-layer-group"></i> Thống kê theo khu vực</h3>';
    html += '<table><thead><tr><th>Khu vực</th><th>Doanh số bán</th><th>Chiết khấu</th><th>Doanh thu thuần</th><th>Số giao dịch</th></tr></thead><tbody>';
    
    Object.entries(kvData).forEach(([kv, data]) => {
        html += `<tr>
            <td>${kv}</td>
            <td>${formatFullNumber(data.doanhSoBan)}</td>
            <td>${formatFullNumber(data.chietKhau)}</td>
            <td>${formatFullNumber(data.doanhThuThuan)}</td>
            <td>${formatNumber(data.soGiaoDich)}</td>
        </tr>`;
    });
    
    html += '</tbody></table>';
    document.getElementById('areaTable').innerHTML = html;
}

function updateProvinceTable() {
    const data = getProvinceFilteredData();
    const provinceData = {};
    
    data.forEach(item => {
        const tinh = item.tinh;
        if (!provinceData[tinh]) {
            provinceData[tinh] = {
                doanhSoBan: 0,
                chietKhau: 0,
                doanhThuThuan: 0,
                soGiaoDich: 0,
                mien: item.mien,
                khuVuc: item.maKhuVuc
            };
        }
        provinceData[tinh].doanhSoBan += item.doanhSoBan || 0;
        provinceData[tinh].chietKhau += item.chietKhau || 0;
        provinceData[tinh].doanhThuThuan += item.doanhThuThuan || 0;
        provinceData[tinh].soGiaoDich++;
    });

    let html = '<h3><i class="fas fa-city"></i> Thống kê theo tỉnh</h3>';
    
    let filterInfo = [];
    if (provinceFilter.mien) filterInfo.push(`Miền: ${provinceFilter.mien}`);
    if (provinceFilter.khuVuc) filterInfo.push(`Khu vực: ${provinceFilter.khuVuc}`);
    
    if (filterInfo.length > 0) {
        html += `<p style="margin-bottom: 10px; color: #ff7300;"><i class="fas fa-info-circle"></i> Đang lọc: ${filterInfo.join(' - ')}</p>`;
    }
    
    html += '<table><thead><tr><th>Tỉnh</th><th>Miền</th><th>Khu vực</th><th>Doanh số bán</th><th>Chiết khấu</th><th>Doanh thu thuần</th><th>Số giao dịch</th></tr></thead><tbody>';
    
    Object.entries(provinceData)
        .sort((a, b) => b[1].doanhThuThuan - a[1].doanhThuThuan)
        .forEach(([tinh, data]) => {
            html += `<tr>
                <td>${tinh}</td>
                <td>${data.mien}</td>
                <td>${data.khuVuc}</td>
                <td>${formatFullNumber(data.doanhSoBan)}</td>
                <td>${formatFullNumber(data.chietKhau)}</td>
                <td>${formatFullNumber(data.doanhThuThuan)}</td>
                <td>${formatNumber(data.soGiaoDich)}</td>
            </tr>`;
        });
    
    html += '</tbody></table>';
    document.getElementById('provinceTable').innerHTML = html;
}

function updateNPPTable() {
    const data = getNPPFilteredData();
    const nppData = {};
    
    data.forEach(item => {
        const npp = item.NPP;
        if (!nppData[npp]) {
            nppData[npp] = {
                doanhSoBan: 0,
                chietKhau: 0,
                doanhThuThuan: 0,
                soGiaoDich: 0,
                mien: item.mien,
                tinh: item.tinh
            };
        }
        nppData[npp].doanhSoBan += item.doanhSoBan || 0;
        nppData[npp].chietKhau += item.chietKhau || 0;
        nppData[npp].doanhThuThuan += item.doanhThuThuan || 0;
        nppData[npp].soGiaoDich++;
    });

    let html = '<h3><i class="fas fa-users"></i> Thống kê theo NPP (Click vào NPP để xem chi tiết)</h3>';
    
    let filterInfo = [];
    if (nppFilter.mien) filterInfo.push(`Miền: ${nppFilter.mien}`);
    if (nppFilter.khuVuc) filterInfo.push(`Khu vực: ${nppFilter.khuVuc}`);
    if (nppFilter.tinh) filterInfo.push(`Tỉnh: ${nppFilter.tinh}`);
    
    if (filterInfo.length > 0) {
        html += `<p style="margin-bottom: 10px; color: #4ecdc4;"><i class="fas fa-info-circle"></i> Đang lọc: ${filterInfo.join(' - ')}</p>`;
    }
    
    html += '<table><thead><tr><th>NPP</th><th>Miền</th><th>Tỉnh</th><th>Doanh số bán</th><th>Chiết khấu</th><th>Doanh thu thuần</th><th>Số giao dịch</th></tr></thead><tbody>';
    
    Object.entries(nppData)
        .sort((a, b) => b[1].doanhThuThuan - a[1].doanhThuThuan)
        .forEach(([npp, data]) => {
            html += `<tr onclick="showNPPDetailModal('${npp.replace(/'/g, "\\'")}')" style="cursor: pointer;">
                <td>${npp}</td>
                <td>${data.mien}</td>
                <td>${data.tinh}</td>
                <td>${formatFullNumber(data.doanhSoBan)}</td>
                <td>${formatFullNumber(data.chietKhau)}</td>
                <td>${formatFullNumber(data.doanhThuThuan)}</td>
                <td>${formatNumber(data.soGiaoDich)}</td>
            </tr>`;
        });
    
    html += '</tbody></table>';
    document.getElementById('nppTable').innerHTML = html;
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
function openNPPModal() {
    const modal = document.getElementById('nppModal');
    modal.style.display = 'block';
    initializeNPPFilters();
}

// Đóng modal NPP
function closeNPPModal() {
    const modal = document.getElementById('nppModal');
    modal.style.display = 'none';
}
function updateNPPKhuVucOptions() {
    const selectedMien = document.getElementById('nppMienFilter').value;
    const kvSelect = document.getElementById('nppKhuVucFilter');
    const tinhSelect = document.getElementById('nppTinhFilter');

    let filteredByMien = salesData;
    if (selectedMien) {
        filteredByMien = salesData.filter(item => item.mien === selectedMien);
    }

    const khuVucs = [...new Set(filteredByMien.map(item => item.maKhuVuc))];

    kvSelect.innerHTML = '<option value="">Tất cả khu vực</option>';
    khuVucs.sort().forEach(kv => {
        const option = document.createElement('option');
        option.value = kv;
        option.textContent = kv;
        kvSelect.appendChild(option);
    });

    // Reset tỉnh khi đổi khu vực
    tinhSelect.innerHTML = '<option value="">Tất cả tỉnh</option>';
}
function updateNPPTinhOptions() {
    const selectedMien = document.getElementById('nppMienFilter').value;
    const selectedKV = document.getElementById('nppKhuVucFilter').value;
    const tinhSelect = document.getElementById('nppTinhFilter');

    let filteredData = salesData;
    if (selectedMien) {
        filteredData = filteredData.filter(item => item.mien === selectedMien);
    }
    if (selectedKV) {
        filteredData = filteredData.filter(item => item.maKhuVuc === selectedKV);
    }

    const tinhs = [...new Set(filteredData.map(item => item.tinh))];

    tinhSelect.innerHTML = '<option value="">Tất cả tỉnh</option>';
    tinhs.sort().forEach(tinh => {
        const option = document.createElement('option');
        option.value = tinh;
        option.textContent = tinh;
        tinhSelect.appendChild(option);
    });
}
function applyNPPFilter() {
    nppFilter.mien = document.getElementById('nppMienFilter').value;
    nppFilter.khuVuc = document.getElementById('nppKhuVucFilter').value;
    nppFilter.tinh = document.getElementById('nppTinhFilter').value;

    closeNPPModal();
    updateNPPData();
}
function resetNPPFilter() {
    document.getElementById('nppMienFilter').value = '';
    document.getElementById('nppKhuVucFilter').innerHTML = '<option value="">Tất cả khu vực</option>';
    document.getElementById('nppTinhFilter').innerHTML = '<option value="">Tất cả tỉnh</option>';
    nppFilter = { mien: '', khuVuc: '', tinh: '' };

    closeNPPModal();
    updateNPPData();
}
function getNPPFilteredData() {
    let data = [...filteredData];

    if (nppFilter.mien) {
        data = data.filter(item => item.mien === nppFilter.mien);
    }
    if (nppFilter.khuVuc) {
        data = data.filter(item => item.maKhuVuc === nppFilter.khuVuc);
    }
    if (nppFilter.tinh) {
        data = data.filter(item => item.tinh === nppFilter.tinh);
    }

    return data;
}
function updateNPPData() {
    updateBarChartNPPTop();
    updateNPPTable();
}
function initializeNPPFilters() {
    const miens = [...new Set(salesData.map(item => item.mien))];
    const mienSelect = document.getElementById('nppMienFilter');

    const currentMien = mienSelect.value;

    mienSelect.innerHTML = '<option value="">Tất cả miền</option>';
    miens.sort().forEach(mien => {
        const option = document.createElement('option');
        option.value = mien;
        option.textContent = mien;
        mienSelect.appendChild(option);
    });

    if (currentMien) {
        mienSelect.value = currentMien;
    }

    updateNPPKhuVucOptions();

    if (nppFilter.khuVuc) {
        document.getElementById('nppKhuVucFilter').value = nppFilter.khuVuc;
    }
    if (nppFilter.tinh) {
        document.getElementById('nppTinhFilter').value = nppFilter.tinh;
    }
}
function openProvinceModal() {
    const modal = document.getElementById('provinceModal');
    modal.style.display = 'block';
    initializeProvinceFilters();
}

function closeProvinceModal() {
    const modal = document.getElementById('provinceModal');
    modal.style.display = 'none';
}

function applyProvinceFilter() {
    provinceFilter.mien = document.getElementById('provinceMienFilter').value;
    provinceFilter.khuVuc = document.getElementById('provinceKhuVucFilter').value;
    closeProvinceModal();
    updateProvinceData();
}

function resetProvinceFilter() {
    document.getElementById('provinceMienFilter').value = '';
    document.getElementById('provinceKhuVucFilter').innerHTML = '<option value="">Tất cả khu vực</option>';
    provinceFilter.mien = '';
    provinceFilter.khuVuc = '';
    closeProvinceModal();
    updateProvinceData();
}

function initializeProvinceFilters() {
    const miens = [...new Set(salesData.map(item => item.mien))];
    const mienSelect = document.getElementById('provinceMienFilter');

    const currentValue = mienSelect.value;

    mienSelect.innerHTML = '<option value="">Tất cả miền</option>';
    miens.sort().forEach(mien => {
        const option = document.createElement('option');
        option.value = mien;
        option.textContent = mien;
        mienSelect.appendChild(option);
    });

    if (currentValue) {
        mienSelect.value = currentValue;
    }

    updateKhuVucOptions();

    if (provinceFilter.khuVuc) {
        document.getElementById('provinceKhuVucFilter').value = provinceFilter.khuVuc;
    }
}

function updateKhuVucOptions() {
    const selectedMien = document.getElementById('provinceMienFilter').value;
    const kvSelect = document.getElementById('provinceKhuVucFilter');

    let filteredByMien = salesData;
    if (selectedMien) {
        filteredByMien = salesData.filter(item => item.mien === selectedMien);
    }

    const khuVucs = [...new Set(filteredByMien.map(item => item.maKhuVuc))];

    kvSelect.innerHTML = '<option value="">Tất cả khu vực</option>';
    khuVucs.sort().forEach(kv => {
        const option = document.createElement('option');
        option.value = kv;
        option.textContent = kv;
        kvSelect.appendChild(option);
    });
}

function updateProvinceData() {
    updateBarChartProvince();
    updateProvinceTable();
}

function getProvinceFilteredData() {
    let data = [...filteredData];

    if (provinceFilter.mien) {
        data = data.filter(item => item.mien === provinceFilter.mien);
    }
    if (provinceFilter.khuVuc) {
        data = data.filter(item => item.maKhuVuc === provinceFilter.khuVuc);
    }

    return data;
}

window.onclick = function(event) {
    const provinceModal = document.getElementById('provinceModal');
    const nppModal = document.getElementById('nppModal');
    const nppDetailModal = document.getElementById('nppDetailModal');
    
    if (event.target == provinceModal) {
        closeProvinceModal();
    }
    if (event.target == nppModal) {
        closeNPPModal();
    }
    if (event.target == nppDetailModal) {
        closeNPPDetailModal();
    }
}