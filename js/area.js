// js/area.js
let areaCharts = {};

function updateAreaCharts() {
    if (areaCharts.barKVDetail) areaCharts.barKVDetail.destroy();
    updateBarChartKVDetail();
}

function updateAreaTables() {
    updateAreaTable();
}

function updateBarChartKVDetail() {
    const ctx = document.getElementById('barChartKVDetail').getContext('2d');
    const kvData = {};
    
    filteredData.forEach(item => {
        const kv = item.maKhuVuc;
        kvData[kv] = (kvData[kv] || 0) + (item.doanhSoBan || 0);
    });

    areaCharts.barKVDetail = new Chart(ctx, {
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
                        return formatMoney(value);
                    },
                    color: '#333',
                    font: { weight: 'bold', size: 14 }
                },
                legend: {
                    labels: { font: { size: 13 } }
                },
                tooltip: {
                    bodyFont: { size: 13 },
                    titleFont: { size: 13 },
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
                    title: { display: true, text: 'Doanh số bán', font: { size: 13, weight: 'bold' } },
                    ticks: {
                        callback: function(value) {
                            return formatMoney(value);
                        },
                        font: { size: 13 }
                    }
                },
                x: {
                    ticks: {
                        maxRotation: 30,
                        minRotation: 30,
                        font: { size: 13 }
                    }
                }
            }
        },
        plugins: [ChartDataLabels]
    });
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