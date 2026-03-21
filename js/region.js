// js/region.js
let regionCharts = {};

function updateRegionCharts() {
    if (regionCharts.barMienDetail) regionCharts.barMienDetail.destroy();
    updateBarChartMienDetail();
}

function updateRegionTables() {
    updateRegionTable();
}

function updateBarChartMienDetail() {
    const ctx = document.getElementById('barChartMienDetail').getContext('2d');
    const mienData = {};
    
    filteredData.forEach(item => {
        const mien = item.mien;
        mienData[mien] = (mienData[mien] || 0) + (item.doanhSoBan || 0);
    });

    regionCharts.barMienDetail = new Chart(ctx, {
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
                        font: { size: 14 }
                    }
                }
            }
        },
        plugins: [ChartDataLabels]
    });
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
                soDonHang: new Set()
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