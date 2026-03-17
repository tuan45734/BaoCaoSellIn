// Biến toàn cục
let charts = {};
let filteredData = [];

// Khởi tạo
document.addEventListener('DOMContentLoaded', function() {
    initializeDatePickers();
    filteredData = [...salesData];
    updateAll();
});

// Parse date từ string d/m/yyyy
function parseDate(dateStr) {
    if (!dateStr) return null;
    const parts = dateStr.split('/');
    return new Date(parts[2], parts[1] - 1, parts[0]);
}

// Format số tiền - Tự động chuyển sang tỷ khi >= 1000 triệu
function formatMoney(amount) {
    if (amount >= 1000000000) {
        // Chuyển sang tỷ, làm tròn 1 số thập phân
        const ty = amount / 1000000000;
        return ty.toFixed(1).replace('.', ',') + ' tỷ';
    } else if (amount >= 1000000) {
        // Chuyển sang triệu, làm tròn 1 số thập phân
        const trieu = amount / 1000000;
        return trieu.toFixed(1).replace('.', ',') + ' tr';
    } else {
        // Dưới triệu thì giữ nguyên
        return new Intl.NumberFormat('vi-VN').format(amount) + ' đ';
    }
}

// Format số
function formatNumber(num) {
    return new Intl.NumberFormat('vi-VN').format(num);
}

// Khởi tạo date pickers với tiếng Việt
function initializeDatePickers() {
    // Cấu hình tiếng Việt cho flatpickr
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
        ordinal: function(nth) {
            return '';
        },
        rangeSeparator: ' đến ',
        weekAbbreviation: 'Tuần',
        scrollTitle: 'Cuộn để tăng',
        toggleTitle: 'Nhấn để chuyển',
        amPM: ['SA', 'CH'],
        yearAriaLabel: 'Năm'
    });

    flatpickr(".datepicker", {
        dateFormat: "d/m/Y",
        locale: 'vn', // Sử dụng locale tiếng Việt
        onChange: function() {
            applyFilters();
        },
        // Thêm các tùy chọn tiếng Việt
        prevArrow: '<i class="fas fa-chevron-left"></i>',
        nextArrow: '<i class="fas fa-chevron-right"></i>',
        placeholder: 'dd/mm/yyyy'
    });
}

// Áp dụng filters (chỉ theo ngày)
function applyFilters() {
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;

    filteredData = salesData.filter(item => {
        // Lọc theo ngày
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

// Cập nhật tất cả
function updateAll() {
    updateStats();
    updateCharts();
    updateTables();
    updateDataTable();
}

// Cập nhật thống kê
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

// Cập nhật charts
function updateCharts() {
    // Xóa charts cũ
    Object.values(charts).forEach(chart => {
        if (chart) chart.destroy();
    });
    
    updatePieChartMien();
    updateBarChartKV();
    updateLineChartDaily();
    updateBarChartMienDetail();
    updateBarChartKVDetail();
    updateBarChartProvinceTop();
    updateBarChartNPPTop();
}

// Pie chart theo miền
function updatePieChartMien() {
    const ctx = document.getElementById('pieChartMien').getContext('2d');
    
    // Group by miền
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
                backgroundColor: [
                    '#667eea',
                    '#ff7300',
                    '#b10000',
                    '#4ecdc4',
                    '#45b7d1',
                    '#96ceb4'
                ]
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
                    font: {
                        weight: 'bold',
                        size: 14
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
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

// Bar chart theo khu vực
function updateBarChartKV() {
    const ctx = document.getElementById('barChartKV').getContext('2d');
    
    // Group by khu vực
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
                    font: {
                        weight: 'bold',
                        size: 11
                    },
                    rotation: -45
                },
                tooltip: {
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
                        }
                    }
                }
            }
        },
        plugins: [ChartDataLabels]
    });
}

// Line chart theo ngày
function updateLineChartDaily() {
    const ctx = document.getElementById('lineChartDaily').getContext('2d');
    
    // Group by ngày
    const dailyData = {};
    filteredData.forEach(item => {
        const date = item.ngay;
        dailyData[date] = (dailyData[date] || 0) + (item.doanhThuThuan || 0);
    });

    // Sort by date
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
                            return (value / 1000000000).toFixed(1).replace('.', ',') + ' tỷ';
                        } else {
                            return (value / 1000000).toFixed(1).replace('.', ',') + ' tr';
                        }
                    },
                    color: '#667eea',
                    font: {
                        weight: 'bold',
                        size: 11
                    }
                },
                tooltip: {
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
                        }
                    }
                }
            }
        },
        plugins: [ChartDataLabels]
    });
}

// Bar chart chi tiết theo miền
function updateBarChartMienDetail() {
    const ctx = document.getElementById('barChartMienDetail').getContext('2d');
    
    // Group by miền
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
                        size: 11
                    },
                    rotation: -45
                },
                tooltip: {
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
                        }
                    }
                }
            }
        },
        plugins: [ChartDataLabels]
    });
}

// Bar chart chi tiết theo khu vực
function updateBarChartKVDetail() {
    const ctx = document.getElementById('barChartKVDetail').getContext('2d');
    
    // Group by khu vực
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
                        size: 11
                    },
                    rotation: -45
                },
                tooltip: {
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
                        }
                    }
                }
            }
        },
        plugins: [ChartDataLabels]
    });
}

// Bar chart top 20 tỉnh
function updateBarChartProvinceTop() {
    const ctx = document.getElementById('barChartProvinceTop').getContext('2d');
    
    // Group by tỉnh
    const provinceData = {};
    filteredData.forEach(item => {
        const tinh = item.tinh;
        provinceData[tinh] = (provinceData[tinh] || 0) + (item.doanhThuThuan || 0);
    });

    // Sort và lấy top 20
    const sortedProvinces = Object.entries(provinceData)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 20);

    charts.barProvinceTop = new Chart(ctx, {
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
                    rotation: -45
                },
                tooltip: {
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
                        }
                    }
                }
            }
        },
        plugins: [ChartDataLabels]
    });
}

// Bar chart top 20 NPP
function updateBarChartNPPTop() {
    const ctx = document.getElementById('barChartNPPTop').getContext('2d');
    
    // Group by NPP
    const nppData = {};
    filteredData.forEach(item => {
        const npp = item.NPP;
        nppData[npp] = (nppData[npp] || 0) + (item.doanhThuThuan || 0);
    });

    // Sort và lấy top 20
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
                    font: {
                        weight: 'bold',
                        size: 10
                    },
                    rotation: -45
                },
                tooltip: {
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
                        }
                    }
                }
            }
        },
        plugins: [ChartDataLabels]
    });
}

// Cập nhật bảng theo miền
function updateTables() {
    updateRegionTable();
    updateAreaTable();
    updateProvinceTable();
    updateNPPTable();
}

// Bảng theo miền
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
            <td>${formatMoney(data.doanhSoBan)}</td>
            <td>${formatMoney(data.chietKhau)}</td>
            <td>${formatMoney(data.doanhThuThuan)}</td>
            <td>${formatNumber(data.soGiaoDich)}</td>
        </tr>`;
    });
    
    html += '</tbody></table>';
    document.getElementById('regionTable').innerHTML = html;
}

// Bảng theo khu vực
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
            <td>${formatMoney(data.doanhSoBan)}</td>
            <td>${formatMoney(data.chietKhau)}</td>
            <td>${formatMoney(data.doanhThuThuan)}</td>
            <td>${formatNumber(data.soGiaoDich)}</td>
        </tr>`;
    });
    
    html += '</tbody></table>';
    document.getElementById('areaTable').innerHTML = html;
}

// Bảng theo tỉnh
function updateProvinceTable() {
    const provinceData = {};
    filteredData.forEach(item => {
        const tinh = item.tinh;
        if (!provinceData[tinh]) {
            provinceData[tinh] = {
                doanhSoBan: 0,
                chietKhau: 0,
                doanhThuThuan: 0,
                soGiaoDich: 0
            };
        }
        provinceData[tinh].doanhSoBan += item.doanhSoBan || 0;
        provinceData[tinh].chietKhau += item.chietKhau || 0;
        provinceData[tinh].doanhThuThuan += item.doanhThuThuan || 0;
        provinceData[tinh].soGiaoDich++;
    });

    let html = '<h3><i class="fas fa-city"></i> Thống kê theo tỉnh</h3>';
    html += '<table><thead><tr><th>Tỉnh</th><th>Doanh số bán</th><th>Chiết khấu</th><th>Doanh thu thuần</th><th>Số giao dịch</th></tr></thead><tbody>';
    
    // Sort theo doanh thu thuần giảm dần
    Object.entries(provinceData)
        .sort((a, b) => b[1].doanhThuThuan - a[1].doanhThuThuan)
        .forEach(([tinh, data]) => {
            html += `<tr>
                <td>${tinh}</td>
                <td>${formatMoney(data.doanhSoBan)}</td>
                <td>${formatMoney(data.chietKhau)}</td>
                <td>${formatMoney(data.doanhThuThuan)}</td>
                <td>${formatNumber(data.soGiaoDich)}</td>
            </tr>`;
        });
    
    html += '</tbody></table>';
    document.getElementById('provinceTable').innerHTML = html;
}

// Bảng theo NPP
function updateNPPTable() {
    const nppData = {};
    filteredData.forEach(item => {
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

    let html = '<h3><i class="fas fa-users"></i> Thống kê theo NPP</h3>';
    html += '<table><thead><tr><th>NPP</th><th>Miền</th><th>Tỉnh</th><th>Doanh số bán</th><th>Chiết khấu</th><th>Doanh thu thuần</th><th>Số giao dịch</th></tr></thead><tbody>';
    
    // Sort theo doanh thu thuần giảm dần
    Object.entries(nppData)
        .sort((a, b) => b[1].doanhThuThuan - a[1].doanhThuThuan)
        .forEach(([npp, data]) => {
            html += `<tr>
                <td>${npp}</td>
                <td>${data.mien}</td>
                <td>${data.tinh}</td>
                <td>${formatMoney(data.doanhSoBan)}</td>
                <td>${formatMoney(data.chietKhau)}</td>
                <td>${formatMoney(data.doanhThuThuan)}</td>
                <td>${formatNumber(data.soGiaoDich)}</td>
            </tr>`;
        });
    
    html += '</tbody></table>';
    document.getElementById('nppTable').innerHTML = html;
}

// Cập nhật bảng dữ liệu chính (Sắp xếp theo NPP)
function updateDataTable() {
    // Sắp xếp dữ liệu theo NPP
    const sortedData = [...filteredData].sort((a, b) => {
        const nppA = a.NPP || '';
        const nppB = b.NPP || '';
        return nppA.localeCompare(nppB);
    });

    let html = '';
    sortedData.forEach(item => {
        html += `<tr>
            <td>${item.mien || ''}</td>
            <td>${item.maKhuVuc || ''}</td>
            <td>${item.tinh || ''}</td>
            <td>${item.NPP || ''}</td>
            <td>${formatMoney(item.doanhSoBan)}</td>
            <td>${formatMoney(item.chietKhau)}</td>
            <td>${formatMoney(item.doanhThuThuan)}</td>
            <td>${item.ngay || ''}</td>
        </tr>`;
    });
    document.getElementById('tableBody').innerHTML = html;
}

// Chuyển tab
function switchTab(tabId) {
    // Update tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    
    // Update tab content
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    document.getElementById(tabId).classList.add('active');
}