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
    
    // Tính tổng doanh số theo miền
    filteredData.forEach(item => {
        const mien = item.mien;
        mienData[mien] = (mienData[mien] || 0) + (item.doanhSoBan || 0);
    });
    
    // Lấy danh sách các ngành hàng
    const nganhHangs = [...new Set(filteredData.map(item => item.nganhHang))];
    
    // Tạo dữ liệu chi tiết theo ngành hàng cho từng miền
    const nganhDetailByMien = {};
    const totalQuantityByMien = {};
    const miens = Object.keys(mienData);
    
    miens.forEach(mien => {
        nganhDetailByMien[mien] = {};
        totalQuantityByMien[mien] = 0;
        nganhHangs.forEach(nganh => {
            nganhDetailByMien[mien][nganh] = {
                doanhSo: 0,
                soLuong: 0
            };
        });
    });
    
    // Tính tổng doanh số và số lượng theo ngành hàng và miền
    filteredData.forEach(item => {
        const mien = item.mien;
        const nganh = item.nganhHang;
        const doanhSo = item.doanhSoBan || 0;
        const soLuong = item.soLuong || 0;
        
        if (nganhDetailByMien[mien] && nganhDetailByMien[mien][nganh]) {
            nganhDetailByMien[mien][nganh].doanhSo += doanhSo;
            nganhDetailByMien[mien][nganh].soLuong += soLuong;
            totalQuantityByMien[mien] += soLuong;
        }
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
                        title: function(tooltipItems) {
                            return tooltipItems[0].label;
                        },
                        label: function(context) {
                            const mien = context.label;
                            const totalDoanhSo = context.raw;
                            const totalSoLuong = totalQuantityByMien[mien] || 0;
                            
                            const nganhDetails = nganhDetailByMien[mien];
                            if (!nganhDetails) return [];
                            
                            const sortedNganh = Object.entries(nganhDetails)
                                .sort((a, b) => b[1].doanhSo - a[1].doanhSo)
                                .filter(([_, data]) => data.doanhSo > 0);
                            
                            const lines = [];
                            lines.push(`Tổng doanh số: ${formatMoney(totalDoanhSo)}`);
                            lines.push(`Tổng số lượng: ${formatNumber(totalSoLuong)}`);
                            lines.push(``);
                            
                            sortedNganh.forEach(([nganh, data]) => {
                                const percentDoanhSo = ((data.doanhSo / totalDoanhSo) * 100).toFixed(1);
                                const percentSoLuong = ((data.soLuong / totalSoLuong) * 100).toFixed(1);
                                lines.push(`📊 ${nganh}:`);
                                lines.push(`   Doanh số: ${formatMoney(data.doanhSo)} (${percentDoanhSo}%)`);
                                lines.push(`   Số lượng: ${formatNumber(data.soLuong)} (${percentSoLuong}%)`);
                                lines.push(``);
                            });
                            
                            return lines;
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
                    title: { display: true, text: 'Miền', font: { size: 13, weight: 'bold' } },
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

    let html = `
        <div class="data-table">
            <h3><i class="fas fa-map-marker-alt"></i> Thống kê theo miền</h3>
            <div style="overflow-x: auto;">
                <table>
                    <thead>
                        <tr>
                            <th>Miền</th>
                            <th>Doanh số bán</th>
                            <th>Chiết khấu</th>
                            <th>Doanh thu thuần</th>
                            <th>Số đơn hàng</th>
                        </tr>
                    </thead>
                    <tbody>
    `;
    
    Object.entries(mienData).forEach(([mien, data]) => {
        html += `
            <tr>
                <td>${mien}</td>
                <td>${formatFullNumber(data.doanhSoBan)}</td>
                <td>${formatFullNumber(data.chietKhau)}</td>
                <td>${formatFullNumber(data.doanhThuThuan)}</td>
                <td>${formatNumber(data.soDonHang.size)}</td>
            </tr>
        `;
    });
    
    html += `
                    </tbody>
                </table>
            </div>
        </div>
    `;
    document.getElementById('regionTable').innerHTML = html;
}