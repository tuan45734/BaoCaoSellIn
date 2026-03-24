// js/province.js
let provinceCharts = {};
let provinceSearchTerm = '';
let provinceFilter = { mien: '', khuVuc: '' };

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
    
    setupProvinceSearch();
}

function setupProvinceSearch() {
    const searchInput = document.getElementById('provinceSearch');
    if (searchInput) {
        searchInput.addEventListener('input', function(e) {
            provinceSearchTerm = removeDiacritics(e.target.value.trim());
            updateProvinceTable();
        });
    }
}

function clearProvinceSearch() {
    const searchInput = document.getElementById('provinceSearch');
    if (searchInput) {
        searchInput.value = '';
        provinceSearchTerm = '';
        updateProvinceTable();
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

function updateProvinceData() {
    updateBarChartProvince();
    updateProvinceTable();
}

function updateBarChartProvince() {
    const ctx = document.getElementById('barChartProvince').getContext('2d');
    if (!ctx) return;
    
    if (provinceCharts.barProvince) {
        provinceCharts.barProvince.destroy();
    }
    
    const data = getProvinceFilteredData();
    const provinceData = {};
    
    // Tính tổng doanh số theo tỉnh
    data.forEach(item => {
        const tinh = item.tinh;
        provinceData[tinh] = (provinceData[tinh] || 0) + (item.doanhSoBan || 0);
    });
    
    // Lấy danh sách các ngành hàng
    const nganhHangs = [...new Set(data.map(item => item.nganhHang))];
    
    // Tạo dữ liệu chi tiết theo ngành hàng cho từng tỉnh
    const nganhDetailByTinh = {};
    const totalQuantityByTinh = {};
    const tinhs = Object.keys(provinceData);
    
    tinhs.forEach(tinh => {
        nganhDetailByTinh[tinh] = {};
        totalQuantityByTinh[tinh] = 0;
        nganhHangs.forEach(nganh => {
            nganhDetailByTinh[tinh][nganh] = {
                doanhSo: 0,
                soLuong: 0
            };
        });
    });
    
    // Tính tổng doanh số và số lượng theo ngành hàng và tỉnh
    data.forEach(item => {
        const tinh = item.tinh;
        const nganh = item.nganhHang;
        const doanhSo = item.doanhSoBan || 0;
        const soLuong = item.soLuong || 0;
        
        if (nganhDetailByTinh[tinh] && nganhDetailByTinh[tinh][nganh]) {
            nganhDetailByTinh[tinh][nganh].doanhSo += doanhSo;
            nganhDetailByTinh[tinh][nganh].soLuong += soLuong;
            totalQuantityByTinh[tinh] += soLuong;
        }
    });

    const sortedProvinces = Object.entries(provinceData)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 20);

    provinceCharts.barProvince = new Chart(ctx, {
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
                        return formatMoney(value);
                    },
                    color: '#333',
                    font: { weight: 'bold', size: 12 }
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
                            const tinh = context.label;
                            const totalDoanhSo = context.raw;
                            const totalSoLuong = totalQuantityByTinh[tinh] || 0;
                            
                            const nganhDetails = nganhDetailByTinh[tinh];
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
                        font: { size: 12 }
                    }
                },
                x: {
                    title: { display: true, text: 'Tỉnh', font: { size: 13, weight: 'bold' } },
                    ticks: {
                        maxRotation: 45,
                        minRotation: 45,
                        font: { size: 11 }
                    }
                }
            }
        },
        plugins: [ChartDataLabels]
    });
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
                items: []
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

    let filteredProvinces = Object.entries(provinceData);
    if (provinceSearchTerm) {
        filteredProvinces = filteredProvinces.filter(([tinh]) => 
            removeDiacritics(tinh.toLowerCase()).includes(provinceSearchTerm)
        );
    }
    
    // Sắp xếp theo doanh thu thuần giảm dần
    filteredProvinces.sort((a, b) => b[1].doanhThuThuan - a[1].doanhThuThuan);
    
    let html = '';
    
    let filterInfo = [];
    if (provinceFilter.mien) filterInfo.push(`Miền: ${provinceFilter.mien}`);
    if (provinceFilter.khuVuc) filterInfo.push(`Khu vực: ${provinceFilter.khuVuc}`);
    
    if (filterInfo.length > 0) {
        html += `<div class="search-result-info">
            <span><i class="fas fa-filter"></i> Đang lọc: ${filterInfo.join(' - ')}</span>
        </div>`;
    }
    
    if (provinceSearchTerm) {
        html += `<div class="search-result-info">
            <span>
                <i class="fas fa-search"></i> Tìm kiếm "<strong>${provinceSearchTerm}</strong>": 
                <span class="count">${filteredProvinces.length}</span> tỉnh được tìm thấy
            </span>
            <span class="clear-link" onclick="clearProvinceSearch()">
                <i class="fas fa-times"></i> Xóa tìm kiếm
            </span>
        </div>`;
    }
    
    // Tạo bảng với cấu trúc HTML đúng - THÊM CỘT STT
    html += `
        <div class="data-table">
            <div style="overflow-x: auto;">
                <table class="province-table">
                    <thead>
                        <tr>
                            <th style="width: 60px;">STT</th>
                            <th>Tỉnh</th>
                            <th>Miền</th>
                            <th>Khu vực</th>
                            <th>SL sản phẩm</th>
                            <th>Tổng số lượng</th>
                            <th>Doanh số bán</th>
                            <th>Chiết khấu</th>
                            <th>Doanh thu thuần</th>
                            <th>Số đơn hàng</th>
                        </tr>
                    </thead>
                    <tbody>
    `;
    
    filteredProvinces.forEach(([tinh, data], index) => {
        let displayTinh = tinh;
        if (provinceSearchTerm && removeDiacritics(tinh.toLowerCase()).includes(provinceSearchTerm)) {
            const regex = new RegExp(`(${provinceSearchTerm})`, 'gi');
            displayTinh = tinh.replace(regex, '<span class="search-highlight">$1</span>');
        }
        
        html += `
            <tr onclick="showProvinceDetailModal('${tinh.replace(/'/g, "\\'")}')" style="cursor: pointer;">
                <td style="text-align: center; font-weight: bold; color: #ff7300;">${index + 1}</td>
                <td><i class="fas fa-map-marker-alt" style="color: #ff7300; margin-right: 5px;"></i>${displayTinh}</td>
                <td>${data.mien}</td>
                <td>${data.khuVuc}</td>
                <td style="text-align: right;">${formatNumber(data.soSanPham.size)}</td>
                <td style="text-align: right;">${formatNumber(data.soLuong)}</td>
                <td style="text-align: right;">${formatFullNumber(data.doanhSoBan)}</td>
                <td style="text-align: right;">${formatFullNumber(data.chietKhau)}</td>
                <td style="text-align: right;">${formatFullNumber(data.doanhThuThuan)}</td>
                <td style="text-align: right;">${formatNumber(data.soDonHang.size)}</td>
            </tr>
        `;
    });
    
    if (filteredProvinces.length === 0) {
        html += `
            <tr>
                <td colspan="10" style="text-align: center; padding: 40px;">
                    <i class="fas fa-search" style="font-size: 40px; color: #ddd; margin-bottom: 10px; display: block;"></i>
                    Không tìm thấy tỉnh nào phù hợp với từ khóa "<strong>${provinceSearchTerm}</strong>"
                </td>
            </tr>
        `;
    }
    
    html += `
                    </tbody>
                </table>
            </div>
        </div>
    `;
    
    document.getElementById('provinceTable').innerHTML = html;
}

function showProvinceDetailModal(provinceName) {
    const modal = document.getElementById('provinceDetailModal');
    document.getElementById('provinceDetailName').textContent = provinceName;
    
    const data = getProvinceFilteredData();
    const provinceItems = data.filter(item => item.tinh === provinceName);
    
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
        
       
        
        html += `<tr>
            <td>${index + 1}</td>
            <td style="text-align: left; max-width: 400px;">${product.ten}</td>
            <td>${formatNumber(product.soLuong)}</td>
            <td>${formatFullNumber(product.doanhSoBan)}</td>
            <td>${formatFullNumber(product.chietKhau)}</td>
            <td>${formatFullNumber(product.doanhThuThuan)}</td>
           
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

function closeProvinceDetailModal() {
    const modal = document.getElementById('provinceDetailModal');
    modal.style.display = 'none';
}

function showNPPByProductModal(provinceName, productName) {
    const modal = document.getElementById('nppByProductModal');
    document.getElementById('nppByProductName').innerHTML = `${productName} - <span style="font-size: 14px; color: #ff7300;">${provinceName}</span>`;
    
    const data = getProvinceFilteredData();
    const productItems = data.filter(item => item.tinh === provinceName && item.ten === productName);
    
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

function closeNPPByProductModal() {
    const modal = document.getElementById('nppByProductModal');
    modal.style.display = 'none';
}

function exportProvinceToExcel() {
    const provinceName = document.getElementById('provinceDetailName').textContent;
    const table = document.getElementById('provinceDetailTable');
    const rows = table.querySelectorAll('tr');
    
    let csv = [];
    
    const info = document.getElementById('provinceDetailInfo').textContent;
    csv.push(['Thông tin:', info]);
    csv.push([]);
    
    const headers = [];
    table.querySelectorAll('thead th').forEach(th => {
        headers.push(th.textContent);
    });
    csv.push(headers);
    
    rows.forEach((row, index) => {
        if (index === 0) return;
        const rowData = [];
        row.querySelectorAll('td').forEach(td => {
            rowData.push(td.textContent.trim());
        });
        if (rowData.length > 0) {
            csv.push(rowData);
        }
    });
    
    const total = document.getElementById('provinceDetailTotal').textContent;
    csv.push([]);
    csv.push(['Tổng:', total]);
    
    const csvContent = csv.map(row => row.join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.download = `san_pham_${provinceName}_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
}