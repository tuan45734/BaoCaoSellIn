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
    initializeNPPFilters(); // Khởi tạo NPP filters ngay từ đầu
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
    
    // Đếm số đơn hàng duy nhất dựa trên maDon
    const uniqueOrders = new Set(filteredData.map(item => item.maDon).filter(maDon => maDon));
    const totalTransactions = uniqueOrders.size;

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
                <h3>Số đơn hàng</h3>
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
        kvData[kv] = (kvData[kv] || 0) + (item.doanhSoBan || 0); // Đổi từ doanhThuThuan sang doanhSoBan
    });

    charts.barKVDetail = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: Object.keys(kvData),
            datasets: [{
                label: 'Doanh số bán',
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
                    title: {
                        display: true,
                        text: 'Doanh số bán',
                        font: {
                            size: 13,
                            weight: 'bold'
                        }
                    },
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
    
    // Cập nhật tiêu đề
    const chartTitle = document.querySelector('#byArea .full-width-chart h3');
    if (chartTitle) {
        chartTitle.innerHTML = '<i class="fas fa-chart-bar"></i> Doanh số bán chi tiết theo khu vực';
    }
}

function updatePieChartMien() {
    const ctx = document.getElementById('pieChartMien').getContext('2d');
    const mienData = {};

    filteredData.forEach(item => {
        const mien = item.mien;
        mienData[mien] = (mienData[mien] || 0) + (item.doanhSoBan || 0); // Đổi từ doanhThuThuan sang doanhSoBan
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
    
    // Cập nhật tiêu đề
    const chartTitle = document.querySelector('#overview .chart-container:first-child h3');
    if (chartTitle) {
        chartTitle.innerHTML = '<i class="fas fa-chart-pie"></i> Doanh số bán theo miền';
    }
}

function updateBarChartKV() {
    const ctx = document.getElementById('barChartKV').getContext('2d');
    const kvData = {};

    filteredData.forEach(item => {
        const kv = item.maKhuVuc;
        kvData[kv] = (kvData[kv] || 0) + (item.doanhSoBan || 0); // Đổi từ doanhThuThuan sang doanhSoBan
    });

    charts.barKV = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: Object.keys(kvData),
            datasets: [{
                label: 'Doanh số bán',
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
                    title: {
                        display: true,
                        text: 'Doanh số bán',
                        font: {
                            size: 12,
                            weight: 'bold'
                        }
                    },
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
    
    // Cập nhật tiêu đề
    const chartTitle = document.querySelector('#overview .chart-container:nth-child(2) h3');
    if (chartTitle) {
        chartTitle.innerHTML = '<i class="fas fa-chart-bar"></i> Doanh số bán theo khu vực';
    }
}

function updateLineChartDaily() {
    const ctx = document.getElementById('lineChartDaily').getContext('2d');
    
    // Lấy danh sách các miền
    const miens = [...new Set(filteredData.map(item => item.mien))];
    
    // Tạo dữ liệu cho từng miền
    const dailyDataByMien = {};
    const allDates = new Set();
    
    // Khởi tạo dữ liệu cho từng miền
    miens.forEach(mien => {
        dailyDataByMien[mien] = {};
    });
    
    // Thu thập dữ liệu
    filteredData.forEach(item => {
        const date = item.ngay;
        const mien = item.mien;
        allDates.add(date);
        
        if (!dailyDataByMien[mien][date]) {
            dailyDataByMien[mien][date] = 0;
        }
        dailyDataByMien[mien][date] += (item.doanhSoBan || 0); // Đổi từ doanhThuThuan sang doanhSoBan
    });
    
    // Sắp xếp các ngày
    const sortedDates = Array.from(allDates).sort((a, b) => {
        return parseDate(a) - parseDate(b);
    });
    
    // Mảng màu sắc cho các miền
    const colors = ['#667eea', '#ff7300', '#b10000', '#4ecdc4', '#45b7d1', '#96ceb4'];
    
    // Tạo datasets
    const datasets = miens.map((mien, index) => {
        return {
            label: `Miền ${mien}`,
            data: sortedDates.map(date => dailyDataByMien[mien][date] || 0),
            borderColor: colors[index % colors.length],
            backgroundColor: 'transparent',
            tension: 0.4,
            fill: false,
            borderWidth: 3
        };
    });
    
    // Cập nhật tiêu đề của biểu đồ
    const chartTitle = document.querySelector('#overview .full-width-chart h3');
    if (chartTitle) {
        chartTitle.innerHTML = '<i class="fas fa-chart-line"></i> Xu hướng doanh số bán theo ngày';
    }
    
    charts.lineDaily = new Chart(ctx, {
        type: 'line',
        data: {
            labels: sortedDates,
            datasets: datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: 'index',
                intersect: false,
            },
            plugins: {
                datalabels: {
                    display: false
                },
                legend: {
                    position: 'top',
                    labels: {
                        font: {
                            size: 13
                        },
                        usePointStyle: true,
                        boxWidth: 8
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
                            let label = context.dataset.label || '';
                            let value = context.raw || 0;
                            return `${label}: ${formatMoney(value)}`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Doanh số bán',
                        font: {
                            size: 13,
                            weight: 'bold'
                        }
                    },
                    ticks: {
                        callback: function(value) {
                            if (value >= 1000000000) {
                                return (value / 1000000000).toFixed(1).replace('.', ',') + ' tỷ';
                            } else if (value >= 1000000) {
                                return (value / 1000000).toFixed(1).replace('.', ',') + ' tr';
                            } else {
                                return formatMoney(value);
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
                            size: 11
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
        mienData[mien] = (mienData[mien] || 0) + (item.doanhSoBan || 0); // Đổi từ doanhThuThuan sang doanhSoBan
    });

    charts.barMienDetail = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: Object.keys(mienData),
            datasets: [{
                label: 'Doanh số bán',
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
                    title: {
                        display: true,
                        text: 'Doanh số bán',
                        font: {
                            size: 13,
                            weight: 'bold'
                        }
                    },
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
    
    // Cập nhật tiêu đề
    const chartTitle = document.querySelector('#byRegion .full-width-chart h3');
    if (chartTitle) {
        chartTitle.innerHTML = '<i class="fas fa-chart-bar"></i> Doanh số bán chi tiết theo miền';
    }
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
        provinceData[tinh] = (provinceData[tinh] || 0) + (item.doanhSoBan || 0); // Đổi từ doanhThuThuan sang doanhSoBan
    });

    const sortedProvinces = Object.entries(provinceData)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 20);

    charts.barProvince = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: sortedProvinces.map(item => item[0]),
            datasets: [{
                label: 'Doanh số bán',
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
                    title: {
                        display: true,
                        text: 'Doanh số bán',
                        font: {
                            size: 13,
                            weight: 'bold'
                        }
                    },
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
    
    // Cập nhật tiêu đề
    const chartTitle = document.querySelector('#byProvince .full-width-chart h3');
    if (chartTitle) {
        chartTitle.innerHTML = '<i class="fas fa-chart-bar"></i> Doanh số bán theo tỉnh';
    }
}

function showNPPDetailModal(nppName) {
    const modal = document.getElementById('nppDetailModal');
    document.getElementById('nppDetailName').textContent = nppName;
    
    const nppOrders = filteredData.filter(item => item.NPP === nppName);
    
    // Sắp xếp theo ngày và mã đơn
    nppOrders.sort((a, b) => {
        const dateCompare = parseDate(a.ngay) - parseDate(b.ngay);
        if (dateCompare !== 0) return dateCompare;
        return (a.maDon || '').localeCompare(b.maDon || '');
    });
    
    // Nhóm các đơn hàng theo mã đơn
    const ordersByDon = {};
    nppOrders.forEach(item => {
        const maDon = item.maDon || 'Không có mã';
        if (!ordersByDon[maDon]) {
            ordersByDon[maDon] = {
                items: [],
                ngay: item.ngay,
                tongSoLuong: 0,
                tongDoanhSoBan: 0,
                tongChietKhau: 0,
                tongDoanhThuThuan: 0
            };
        }
        ordersByDon[maDon].items.push(item);
        ordersByDon[maDon].tongSoLuong += item.soLuong || 0;
        ordersByDon[maDon].tongDoanhSoBan += item.doanhSoBan || 0;
        ordersByDon[maDon].tongChietKhau += item.chietKhau || 0;
        ordersByDon[maDon].tongDoanhThuThuan += item.doanhThuThuan || 0;
    });
    
    let totalSales = 0;
    let totalDiscount = 0;
    let totalRevenue = 0;
    let totalQuantity = 0;
    
    let html = '<div class="orders-container">';
    
    // Tạo HTML cho từng đơn hàng
    Object.entries(ordersByDon).forEach(([maDon, order], index) => {
        totalSales += order.tongDoanhSoBan;
        totalDiscount += order.tongChietKhau;
        totalRevenue += order.tongDoanhThuThuan;
        totalQuantity += order.tongSoLuong;
        
        const orderId = `order-${index}-${maDon.replace(/\s/g, '')}`;
        
        html += `
            <div class="order-card" style="margin-bottom: 15px; border: 1px solid #ddd; border-radius: 8px; overflow: hidden;">
                <div class="order-header" onclick="toggleOrder('${orderId}')" style="background: linear-gradient(135deg, #667eea20 0%, #ff730020 100%); padding: 12px 15px; cursor: pointer; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #ddd;">
                    <div style="display: flex; align-items: center; gap: 15px; flex-wrap: wrap;">
                        <i class="fas fa-chevron-down" id="icon-${orderId}" style="transition: transform 0.3s;"></i>
                        <span><i class="fas fa-file-invoice"></i> <strong>Đơn hàng: ${maDon}</strong></span>
                        <span><i class="fas fa-calendar"></i> Ngày: ${order.ngay}</span>
                        <span><i class="fas fa-cubes"></i> SL: ${formatNumber(order.tongSoLuong)}</span>
                        <span><i class="fas fa-chart-line"></i> DSB: ${formatFullNumber(order.tongDoanhSoBan)}</span>
                        <span><i class="fas fa-percent"></i> CK: ${formatFullNumber(order.tongChietKhau)}</span>
                        <span><i class="fas fa-dollar-sign"></i> DTT: ${formatFullNumber(order.tongDoanhThuThuan)}</span>
                    </div>
                    <span style="color: #ff7300; font-size: 13px;">Nhấp để xem chi tiết</span>
                </div>
                <div id="${orderId}" class="order-details" style="display: none; padding: 15px; background: white;">
                    <table class="detail-table" style="width: 100%;">
                        <thead>
                            <tr>
                                <th>Ngày</th>
                                <th>Mã đơn</th>
                                <th>Tên sản phẩm</th>
                                <th>Số lượng</th>
                                <th>Doanh số bán</th>
                                <th>Chiết khấu</th>
                                <th>Doanh thu thuần</th>
                            </tr>
                        </thead>
                        <tbody>
        `;
        
        // Thêm chi tiết từng sản phẩm
        order.items.forEach(item => {
            html += `
                <tr>
                    <td>${item.ngay || ''}</td>
                    <td>${item.maDon || ''}</td>
                    <td style="text-align: left;">${item.ten || ''}</td>
                    <td>${formatNumber(item.soLuong || 0)}</td>
                    <td>${formatFullNumber(item.doanhSoBan)}</td>
                    <td>${formatFullNumber(item.chietKhau)}</td>
                    <td>${formatFullNumber(item.doanhThuThuan)}</td>
                </tr>
            `;
        });
        
        html += `
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    });
    
    html += '</div>';
    
    document.getElementById('nppDetailContainer').innerHTML = html;
    
    const uniqueOrders = Object.keys(ordersByDon).length;
    
    document.getElementById('nppDetailTotal').innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px; background: linear-gradient(135deg, #667eea 0%, #ff7300 100%); color: white; padding: 15px; border-radius: 8px;">
            <span>
                <i class="fas fa-box"></i> Tổng sản phẩm: ${formatNumber(nppOrders.length)}
                | <i class="fas fa-cubes"></i> Tổng số lượng: ${formatNumber(totalQuantity)}
            </span>
            <span>
                <i class="fas fa-file-invoice"></i> Tổng đơn hàng: ${formatNumber(uniqueOrders)}
                | <i class="fas fa-chart-line"></i> DSB: ${formatFullNumber(totalSales)}
                | <i class="fas fa-percent"></i> CK: ${formatFullNumber(totalDiscount)}
                | <i class="fas fa-dollar-sign"></i> DTT: ${formatFullNumber(totalRevenue)}
            </span>
        </div>
    `;
    
    modal.style.display = 'block';
}
function expandAllOrders() {
    const orderDetails = document.querySelectorAll('[id^="order-"]');
    orderDetails.forEach(order => {
        order.style.display = 'block';
        const icon = document.getElementById(`icon-${order.id}`);
        if (icon) icon.style.transform = 'rotate(0deg)';
    });
}
function collapseAllOrders() {
    const orderDetails = document.querySelectorAll('[id^="order-"]');
    orderDetails.forEach(order => {
        order.style.display = 'none';
        const icon = document.getElementById(`icon-${order.id}`);
        if (icon) icon.style.transform = 'rotate(-90deg)';
    });
}
function toggleOrder(orderId) {
    const orderDiv = document.getElementById(orderId);
    const icon = document.getElementById(`icon-${orderId}`);
    
    if (orderDiv.style.display === 'none') {
        orderDiv.style.display = 'block';
        icon.style.transform = 'rotate(0deg)';
    } else {
        orderDiv.style.display = 'none';
        icon.style.transform = 'rotate(-90deg)';
    }
}
function getOrderTotal(orders, maDon, field) {
    return orders
        .filter(item => item.maDon === maDon)
        .reduce((sum, item) => sum + (item[field] || 0), 0);
}

// Hàm phụ trợ để tính tổng số lượng theo đơn hàng
function getOrderQuantity(orders, maDon) {
    return orders
        .filter(item => item.maDon === maDon)
        .reduce((sum, item) => sum + (item.soLuong || 0), 0);
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
        nppData[npp] = (nppData[npp] || 0) + (item.doanhSoBan || 0); // Đổi từ doanhThuThuan sang doanhSoBan
    });

    const sortedNPP = Object.entries(nppData)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 20);

    charts.barNPPTop = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: sortedNPP.map(item => item[0]),
            datasets: [{
                label: 'Doanh số bán',
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
                    title: {
                        display: true,
                        text: 'Doanh số bán',
                        font: {
                            size: 13,
                            weight: 'bold'
                        }
                    },
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
    
    // Cập nhật tiêu đề
    const chartTitle = document.querySelector('#byNPP .full-width-chart h3');
    if (chartTitle) {
        chartTitle.innerHTML = '<i class="fas fa-chart-bar"></i> Doanh số bán theo NPP';
    }
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
                soDonHang: new Set() // Dùng Set để lưu mã đơn hàng duy nhất
            };
        }
        mienData[mien].doanhSoBan += item.doanhSoBan || 0;
        mienData[mien].chietKhau += item.chietKhau || 0;
        mienData[mien].doanhThuThuan += item.doanhThuThuan || 0;
        if (item.maDon) {
            mienData[mien].soDonHang.add(item.maDon);
        }
    });

    let html = '<h3><i class="fas fa-map-marker-alt"></i> Thống kê theo miền</h3>';
    html += '<table><thead><tr><th>Miền</th><th>Doanh số bán</th><th>Chiết khấu</th><th>Doanh thu thuần</th><th>Số đơn hàng</th></tr></thead><tbody>';
    
    Object.entries(mienData).forEach(([mien, data]) => {
        html += `<tr>
            <td>${mien}</td>
            <td>${formatFullNumber(data.doanhSoBan)}</td>
            <td>${formatFullNumber(data.chietKhau)}</td>
            <td>${formatFullNumber(data.doanhThuThuan)}</td>
            <td>${formatNumber(data.soDonHang.size)}</td>
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
                soDonHang: new Set()
            };
        }
        kvData[kv].doanhSoBan += item.doanhSoBan || 0;
        kvData[kv].chietKhau += item.chietKhau || 0;
        kvData[kv].doanhThuThuan += item.doanhThuThuan || 0;
        if (item.maDon) {
            kvData[kv].soDonHang.add(item.maDon);
        }
    });

    let html = '<h3><i class="fas fa-layer-group"></i> Thống kê theo khu vực</h3>';
    html += '<table><thead><tr><th>Khu vực</th><th>Doanh số bán</th><th>Chiết khấu</th><th>Doanh thu thuần</th><th>Số đơn hàng</th></tr></thead><tbody>';
    
    Object.entries(kvData).forEach(([kv, data]) => {
        html += `<tr>
            <td>${kv}</td>
            <td>${formatFullNumber(data.doanhSoBan)}</td>
            <td>${formatFullNumber(data.chietKhau)}</td>
            <td>${formatFullNumber(data.doanhThuThuan)}</td>
            <td>${formatNumber(data.soDonHang.size)}</td>
        </tr>`;
    });
    
    html += '</tbody></table>';
    document.getElementById('areaTable').innerHTML = html;
}
// Hàm hiển thị modal chi tiết sản phẩm theo tỉnh
function showProvinceDetailModal(provinceName) {
    const modal = document.getElementById('provinceDetailModal');
    document.getElementById('provinceDetailName').textContent = provinceName;
    
    const data = getProvinceFilteredData();
    const provinceItems = data.filter(item => item.tinh === provinceName);
    
    // Gộp các sản phẩm trùng nhau
    const productMap = {};
    provinceItems.forEach(item => {
        const ten = item.ten || 'Không có tên';
        if (!productMap[ten]) {
            productMap[ten] = {
                ten: ten,
                soLuong: 0,
                doanhSoBan: 0,
                chietKhau: 0,
                doanhThuThuan: 0,
                npps: new Set(),
                items: []
            };
        }
        productMap[ten].soLuong += item.soLuong || 0;
        productMap[ten].doanhSoBan += item.doanhSoBan || 0;
        productMap[ten].chietKhau += item.chietKhau || 0;
        productMap[ten].doanhThuThuan += item.doanhThuThuan || 0;
        if (item.NPP) {
            productMap[ten].npps.add(item.NPP.trim());
        }
        productMap[ten].items.push(item);
    });
    
    // Chuyển thành mảng và sắp xếp theo doanh thu
    const products = Object.values(productMap).sort((a, b) => b.doanhThuThuan - a.doanhThuThuan);
    
    let totalSales = 0;
    let totalDiscount = 0;
    let totalRevenue = 0;
    let totalQuantity = 0;
    
    let html = '';
    products.forEach((product, index) => {
        totalSales += product.doanhSoBan;
        totalDiscount += product.chietKhau;
        totalRevenue += product.doanhThuThuan;
        totalQuantity += product.soLuong;
        
        const giaTrungBinh = product.soLuong > 0 ? Math.round(product.doanhSoBan / product.soLuong) : 0;
        const nppList = Array.from(product.npps).join(', ');
        
        html += `<tr>
            <td>${index + 1}</td>
            <td style="text-align: left; max-width: 400px;">${product.ten}</td>
            <td>${formatNumber(product.soLuong)}</td>
            <td>${formatFullNumber(product.doanhSoBan)}</td>
            <td>${formatFullNumber(product.chietKhau)}</td>
            <td>${formatFullNumber(product.doanhThuThuan)}</td>
            <td>${formatMoney(giaTrungBinh)}</td>
            <td>${formatNumber(product.npps.size)}</td>
            <td>
                <button class="apply-btn" onclick="showNPPByProductModal('${provinceName}', '${product.ten.replace(/'/g, "\\'")}')" 
                    style="padding: 5px 10px; font-size: 12px; background: #4ecdc4;">
                    <i class="fas fa-users"></i> Xem NPP
                </button>
            </td>
        </tr>`;
    });
    
    document.getElementById('provinceDetailBody').innerHTML = html;
    
    document.getElementById('provinceDetailInfo').innerHTML = `
        <i class="fas fa-map-marker-alt"></i> Tỉnh: <strong>${provinceName}</strong> | 
        <i class="fas fa-box"></i> Số sản phẩm: <strong>${formatNumber(products.length)}</strong> | 
        <i class="fas fa-cubes"></i> Tổng số lượng: <strong>${formatNumber(totalQuantity)}</strong> | 
        <i class="fas fa-chart-line"></i> DSB: <strong>${formatFullNumber(totalSales)}</strong> | 
        <i class="fas fa-percent"></i> CK: <strong>${formatFullNumber(totalDiscount)}</strong> | 
        <i class="fas fa-dollar-sign"></i> DTT: <strong>${formatFullNumber(totalRevenue)}</strong>
    `;
    
    document.getElementById('provinceDetailTotal').innerHTML = `
        <div style="background: linear-gradient(135deg, #667eea 0%, #ff7300 100%); color: white; padding: 15px; border-radius: 8px; text-align: right;">
            <i class="fas fa-chart-pie"></i> Tổng: 
            Số lượng: ${formatNumber(totalQuantity)} | 
            DSB: ${formatFullNumber(totalSales)} | 
            CK: ${formatFullNumber(totalDiscount)} | 
            DTT: ${formatFullNumber(totalRevenue)}
        </div>
    `;
    
    modal.style.display = 'block';
}

// Hàm đóng modal chi tiết tỉnh
function closeProvinceDetailModal() {
    const modal = document.getElementById('provinceDetailModal');
    modal.style.display = 'none';
}

// Hàm hiển thị modal chi tiết NPP theo sản phẩm
function showNPPByProductModal(provinceName, productName) {
    const modal = document.getElementById('nppByProductModal');
    document.getElementById('nppByProductName').innerHTML = `${productName} - <span style="font-size: 14px; color: #ff7300;">${provinceName}</span>`;
    
    const data = getProvinceFilteredData();
    const productItems = data.filter(item => item.tinh === provinceName && item.ten === productName);
    
    // Nhóm theo NPP
    const nppMap = {};
    productItems.forEach(item => {
        const npp = item.NPP ? item.NPP.trim() : 'Không có NPP';
        if (!nppMap[npp]) {
            nppMap[npp] = {
                npp: npp,
                tinh: item.tinh,
                khuVuc: item.maKhuVuc,
                soLuong: 0,
                doanhSoBan: 0,
                chietKhau: 0,
                doanhThuThuan: 0,
                ngay: item.ngay
            };
        }
        nppMap[npp].soLuong += item.soLuong || 0;
        nppMap[npp].doanhSoBan += item.doanhSoBan || 0;
        nppMap[npp].chietKhau += item.chietKhau || 0;
        nppMap[npp].doanhThuThuan += item.doanhThuThuan || 0;
    });
    
    const nppList = Object.values(nppMap).sort((a, b) => b.doanhThuThuan - a.doanhThuThuan);
    
    let totalSales = 0;
    let totalDiscount = 0;
    let totalRevenue = 0;
    let totalQuantity = 0;
    
    let html = '';
    nppList.forEach(npp => {
        totalSales += npp.doanhSoBan;
        totalDiscount += npp.chietKhau;
        totalRevenue += npp.doanhThuThuan;
        totalQuantity += npp.soLuong;
        
        html += `<tr>
            <td><i class="fas fa-user-tie"></i> ${npp.npp}</td>
            <td>${npp.tinh}</td>
            <td>${npp.khuVuc}</td>
            <td>${formatNumber(npp.soLuong)}</td>
            <td>${formatFullNumber(npp.doanhSoBan)}</td>
            <td>${formatFullNumber(npp.chietKhau)}</td>
            <td>${formatFullNumber(npp.doanhThuThuan)}</td>
            <td>${npp.ngay}</td>
        </tr>`;
    });
    
    document.getElementById('nppByProductBody').innerHTML = html;
    
    document.getElementById('nppByProductInfo').innerHTML = `
        <span style="background: #4ecdc4; color: white; padding: 5px 10px; border-radius: 5px;">
            <i class="fas fa-box"></i> Sản phẩm: ${productName} | 
            <i class="fas fa-cubes"></i> Tổng SL: ${formatNumber(totalQuantity)} | 
            <i class="fas fa-chart-line"></i> DSB: ${formatFullNumber(totalSales)} | 
            <i class="fas fa-percent"></i> CK: ${formatFullNumber(totalDiscount)} | 
            <i class="fas fa-dollar-sign"></i> DTT: ${formatFullNumber(totalRevenue)}
        </span>
    `;
    
    document.getElementById('nppByProductTotal').innerHTML = `
        <i class="fas fa-users"></i> Tổng số NPP: ${formatNumber(nppList.length)} |
        <i class="fas fa-cubes"></i> Tổng SL: ${formatNumber(totalQuantity)} |
        <i class="fas fa-chart-line"></i> DSB: ${formatFullNumber(totalSales)} |
        <i class="fas fa-percent"></i> CK: ${formatFullNumber(totalDiscount)} |
        <i class="fas fa-dollar-sign"></i> DTT: ${formatFullNumber(totalRevenue)}
    `;
    
    modal.style.display = 'block';
}

// Hàm đóng modal chi tiết NPP theo sản phẩm
function closeNPPByProductModal() {
    const modal = document.getElementById('nppByProductModal');
    modal.style.display = 'none';
}

// Hàm xuất dữ liệu tỉnh ra Excel
function exportProvinceToExcel() {
    const provinceName = document.getElementById('provinceDetailName').textContent;
    const table = document.getElementById('provinceDetailTable');
    const rows = table.querySelectorAll('tr');
    
    let csv = [];
    
    // Thêm thông tin tỉnh
    const info = document.getElementById('provinceDetailInfo').textContent;
    csv.push(['Thông tin:', info]);
    csv.push([]);
    
    // Thêm header
    const headers = [];
    table.querySelectorAll('thead th').forEach(th => {
        headers.push(th.textContent);
    });
    csv.push(headers);
    
    // Thêm dữ liệu
    rows.forEach((row, index) => {
        if (index === 0) return; // Bỏ qua header vì đã thêm
        const rowData = [];
        row.querySelectorAll('td').forEach(td => {
            // Loại bỏ HTML tags và lấy text content
            rowData.push(td.textContent.trim());
        });
        if (rowData.length > 0) {
            csv.push(rowData);
        }
    });
    
    // Thêm tổng
    const total = document.getElementById('provinceDetailTotal').textContent;
    csv.push([]);
    csv.push(['Tổng:', total]);
    
    // Tạo file CSV
    const csvContent = csv.map(row => row.join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' }); // Thêm BOM cho UTF-8
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.download = `san_pham_${provinceName}_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
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
                soDonHang: new Set(),
                soLuong: 0,
                soSanPham: new Set(),
                mien: item.mien,
                khuVuc: item.maKhuVuc,
                items: [] // Lưu tất cả items để dùng cho popup
            };
        }
        provinceData[tinh].doanhSoBan += item.doanhSoBan || 0;
        provinceData[tinh].chietKhau += item.chietKhau || 0;
        provinceData[tinh].doanhThuThuan += item.doanhThuThuan || 0;
        provinceData[tinh].soLuong += item.soLuong || 0;
        if (item.maDon) {
            provinceData[tinh].soDonHang.add(item.maDon);
        }
        if (item.ten) {
            provinceData[tinh].soSanPham.add(item.ten);
        }
        provinceData[tinh].items.push(item);
    });

    let html = '<h3><i class="fas fa-city"></i> Thống kê theo tỉnh (Click vào tỉnh để xem chi tiết sản phẩm)</h3>';
    
    let filterInfo = [];
    if (provinceFilter.mien) filterInfo.push(`Miền: ${provinceFilter.mien}`);
    if (provinceFilter.khuVuc) filterInfo.push(`Khu vực: ${provinceFilter.khuVuc}`);
    
    if (filterInfo.length > 0) {
        html += `<p style="margin-bottom: 10px; color: #ff7300;"><i class="fas fa-info-circle"></i> Đang lọc: ${filterInfo.join(' - ')}</p>`;
    }
    
    html += '<table><thead><tr><th>Tỉnh</th><th>Miền</th><th>Khu vực</th><th>SL sản phẩm</th><th>Tổng số lượng</th><th>Doanh số bán</th><th>Chiết khấu</th><th>Doanh thu thuần</th><th>Số đơn hàng</th></tr></thead><tbody>';
    
    Object.entries(provinceData)
        .sort((a, b) => b[1].doanhThuThuan - a[1].doanhThuThuan)
        .forEach(([tinh, data]) => {
            html += `<tr onclick="showProvinceDetailModal('${tinh.replace(/'/g, "\\'")}')" style="cursor: pointer;">
                <td><i class="fas fa-map-marker-alt" style="color: #ff7300; margin-right: 5px;"></i>${tinh}</td>
                <td>${data.mien}</td>
                <td>${data.khuVuc}</td>
                <td>${formatNumber(data.soSanPham.size)}</td>
                <td>${formatNumber(data.soLuong)}</td>
                <td>${formatFullNumber(data.doanhSoBan)}</td>
                <td>${formatFullNumber(data.chietKhau)}</td>
                <td>${formatFullNumber(data.doanhThuThuan)}</td>
                <td>${formatNumber(data.soDonHang.size)}</td>
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
                soDonHang: new Set(),
                mien: item.mien,
                tinh: item.tinh
            };
        }
        nppData[npp].doanhSoBan += item.doanhSoBan || 0;
        nppData[npp].chietKhau += item.chietKhau || 0;
        nppData[npp].doanhThuThuan += item.doanhThuThuan || 0;
        if (item.maDon) {
            nppData[npp].soDonHang.add(item.maDon);
        }
    });

    let html = '<h3><i class="fas fa-users"></i> Thống kê theo NPP (Click vào NPP để xem chi tiết)</h3>';
    
    let filterInfo = [];
    if (nppFilter.mien) filterInfo.push(`Miền: ${nppFilter.mien}`);
    if (nppFilter.khuVuc) filterInfo.push(`Khu vực: ${nppFilter.khuVuc}`);
    if (nppFilter.tinh) filterInfo.push(`Tỉnh: ${nppFilter.tinh}`);
    
    if (filterInfo.length > 0) {
        html += `<p style="margin-bottom: 10px; color: #4ecdc4;"><i class="fas fa-info-circle"></i> Đang lọc: ${filterInfo.join(' - ')}</p>`;
    }
    
    html += '<table><thead><tr><th>NPP</th><th>Miền</th><th>Tỉnh</th><th>Doanh số bán</th><th>Chiết khấu</th><th>Doanh thu thuần</th><th>Số đơn hàng</th></tr></thead><tbody>';
    
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
                <td>${formatNumber(data.soDonHang.size)}</td>
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

// SỬA LỖI: Cập nhật hàm openNPPModal để giữ lại giá trị đã chọn
function openNPPModal() {
    const modal = document.getElementById('nppModal');
    
    // Lưu lại các giá trị hiện tại trước khi khởi tạo lại
    const currentMien = nppFilter.mien;
    const currentKhuVuc = nppFilter.khuVuc;
    const currentTinh = nppFilter.tinh;
    
    // Khởi tạo lại các options
    initializeNPPFilters();
    
    // Khôi phục lại các giá trị đã chọn
    if (currentMien) {
        document.getElementById('nppMienFilter').value = currentMien;
        // Cập nhật options khu vực dựa trên miền đã chọn
        updateNPPKhuVucOptions();
    }
    
    if (currentKhuVuc) {
        // Đợi một chút để options khu vực được cập nhật
        setTimeout(() => {
            document.getElementById('nppKhuVucFilter').value = currentKhuVuc;
            // Cập nhật options tỉnh dựa trên khu vực đã chọn
            updateNPPTinhOptions();
            
            if (currentTinh) {
                // Đợi thêm một chút để options tỉnh được cập nhật
                setTimeout(() => {
                    document.getElementById('nppTinhFilter').value = currentTinh;
                }, 50);
            }
        }, 50);
    }
    
    modal.style.display = 'block';
}

// Đóng modal NPP
function closeNPPModal() {
    const modal = document.getElementById('nppModal');
    modal.style.display = 'none';
}

// SỬA LỖI: Cập nhật hàm updateNPPKhuVucOptions để giữ lại giá trị đã chọn nếu có
function updateNPPKhuVucOptions() {
    const selectedMien = document.getElementById('nppMienFilter').value;
    const kvSelect = document.getElementById('nppKhuVucFilter');
    const tinhSelect = document.getElementById('nppTinhFilter');

    // Lưu giá trị hiện tại của khu vực
    const currentKhuVuc = kvSelect.value;

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

    // Khôi phục giá trị khu vực nếu có
    if (currentKhuVuc && khuVucs.includes(currentKhuVuc)) {
        kvSelect.value = currentKhuVuc;
    }

    // Reset tỉnh khi đổi khu vực
    tinhSelect.innerHTML = '<option value="">Tất cả tỉnh</option>';
}

// SỬA LỖI: Cập nhật hàm updateNPPTinhOptions để giữ lại giá trị đã chọn nếu có
function updateNPPTinhOptions() {
    const selectedMien = document.getElementById('nppMienFilter').value;
    const selectedKV = document.getElementById('nppKhuVucFilter').value;
    const tinhSelect = document.getElementById('nppTinhFilter');

    // Lưu giá trị hiện tại của tỉnh
    const currentTinh = tinhSelect.value;

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

    // Khôi phục giá trị tỉnh nếu có
    if (currentTinh && tinhs.includes(currentTinh)) {
        tinhSelect.value = currentTinh;
    }
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

// SỬA LỖI: Cập nhật hàm initializeNPPFilters để khởi tạo với giá trị từ nppFilter
function initializeNPPFilters() {
    const miens = [...new Set(salesData.map(item => item.mien))];
    const mienSelect = document.getElementById('nppMienFilter');

    mienSelect.innerHTML = '<option value="">Tất cả miền</option>';
    miens.sort().forEach(mien => {
        const option = document.createElement('option');
        option.value = mien;
        option.textContent = mien;
        mienSelect.appendChild(option);
    });

    // Khôi phục giá trị miền từ filter
    if (nppFilter.mien) {
        mienSelect.value = nppFilter.mien;
    }

    // Cập nhật options khu vực dựa trên miền đã chọn
    updateNPPKhuVucOptions();

    // Khôi phục giá trị khu vực từ filter
    if (nppFilter.khuVuc) {
        setTimeout(() => {
            document.getElementById('nppKhuVucFilter').value = nppFilter.khuVuc;
            // Cập nhật options tỉnh dựa trên khu vực đã chọn
            updateNPPTinhOptions();
            
            // Khôi phục giá trị tỉnh từ filter
            if (nppFilter.tinh) {
                setTimeout(() => {
                    document.getElementById('nppTinhFilter').value = nppFilter.tinh;
                }, 50);
            }
        }, 50);
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

// Cập nhật window.onclick để đóng các modal mới
window.onclick = function(event) {
    const provinceModal = document.getElementById('provinceModal');
    const nppModal = document.getElementById('nppModal');
    const nppDetailModal = document.getElementById('nppDetailModal');
    const provinceDetailModal = document.getElementById('provinceDetailModal');
    const nppByProductModal = document.getElementById('nppByProductModal');
    
    if (event.target == provinceModal) {
        closeProvinceModal();
    }
    if (event.target == nppModal) {
        closeNPPModal();
    }
    if (event.target == nppDetailModal) {
        closeNPPDetailModal();
    }
    if (event.target == provinceDetailModal) {
        closeProvinceDetailModal();
    }
    if (event.target == nppByProductModal) {
        closeNPPByProductModal();
    }
}