// js/npp.js
let nppCharts = {};
let nppSearchTerm = '';
let nppFilter = { mien: '', khuVuc: '', tinh: '' };

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

    if (nppFilter.mien) {
        mienSelect.value = nppFilter.mien;
    }

    updateNPPKhuVucOptions();

    if (nppFilter.khuVuc) {
        setTimeout(() => {
            document.getElementById('nppKhuVucFilter').value = nppFilter.khuVuc;
            updateNPPTinhOptions();
            
            if (nppFilter.tinh) {
                setTimeout(() => {
                    document.getElementById('nppTinhFilter').value = nppFilter.tinh;
                }, 50);
            }
        }, 50);
    }
    
    setupNPPSearch();
}

function setupNPPSearch() {
    const searchInput = document.getElementById('nppSearch');
    if (searchInput) {
        searchInput.addEventListener('input', function(e) {
            nppSearchTerm = removeDiacritics(e.target.value.trim());
            updateNPPTable();
        });
    }
}

function clearNPPSearch() {
    const searchInput = document.getElementById('nppSearch');
    if (searchInput) {
        searchInput.value = '';
        nppSearchTerm = '';
        updateNPPTable();
    }
}

function openNPPModal() {
    const modal = document.getElementById('nppModal');
    
    const currentMien = nppFilter.mien;
    const currentKhuVuc = nppFilter.khuVuc;
    const currentTinh = nppFilter.tinh;
    
    initializeNPPFilters();
    
    if (currentMien) {
        document.getElementById('nppMienFilter').value = currentMien;
        updateNPPKhuVucOptions();
    }
    
    if (currentKhuVuc) {
        setTimeout(() => {
            document.getElementById('nppKhuVucFilter').value = currentKhuVuc;
            updateNPPTinhOptions();
            
            if (currentTinh) {
                setTimeout(() => {
                    document.getElementById('nppTinhFilter').value = currentTinh;
                }, 50);
            }
        }, 50);
    }
    
    modal.style.display = 'block';
}

function closeNPPModal() {
    const modal = document.getElementById('nppModal');
    modal.style.display = 'none';
}

function updateNPPKhuVucOptions() {
    const selectedMien = document.getElementById('nppMienFilter').value;
    const kvSelect = document.getElementById('nppKhuVucFilter');
    const tinhSelect = document.getElementById('nppTinhFilter');

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

    if (currentKhuVuc && khuVucs.includes(currentKhuVuc)) {
        kvSelect.value = currentKhuVuc;
    }

    tinhSelect.innerHTML = '<option value="">Tất cả tỉnh</option>';
}

function updateNPPTinhOptions() {
    const selectedMien = document.getElementById('nppMienFilter').value;
    const selectedKV = document.getElementById('nppKhuVucFilter').value;
    const tinhSelect = document.getElementById('nppTinhFilter');

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

function updateBarChartNPPTop() {
    const ctx = document.getElementById('barChartNPPTop').getContext('2d');
    
    if (nppCharts.barNPPTop) {
        nppCharts.barNPPTop.destroy();
    }
    
    const data = getNPPFilteredData();
    const nppData = {};
    
    // Tính tổng doanh số theo NPP
    data.forEach(item => {
        const npp = item.NPP;
        nppData[npp] = (nppData[npp] || 0) + (item.doanhSoBan || 0);
    });
    
    // Lấy danh sách các ngành hàng
    const nganhHangs = [...new Set(data.map(item => item.nganhHang))];
    
    // Tạo dữ liệu chi tiết theo ngành hàng cho từng NPP
    const nganhDetailByNPP = {};
    const totalQuantityByNPP = {};
    const npps = Object.keys(nppData);
    
    npps.forEach(npp => {
        nganhDetailByNPP[npp] = {};
        totalQuantityByNPP[npp] = 0;
        nganhHangs.forEach(nganh => {
            nganhDetailByNPP[npp][nganh] = {
                doanhSo: 0,
                soLuong: 0
            };
        });
    });
    
    // Tính tổng doanh số và số lượng theo ngành hàng và NPP
    data.forEach(item => {
        const npp = item.NPP;
        const nganh = item.nganhHang;
        const doanhSo = item.doanhSoBan || 0;
        const soLuong = item.soLuong || 0;
        
        if (nganhDetailByNPP[npp] && nganhDetailByNPP[npp][nganh]) {
            nganhDetailByNPP[npp][nganh].doanhSo += doanhSo;
            nganhDetailByNPP[npp][nganh].soLuong += soLuong;
            totalQuantityByNPP[npp] += soLuong;
        }
    });

    const sortedNPP = Object.entries(nppData)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 20);

    nppCharts.barNPPTop = new Chart(ctx, {
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
                            const npp = context.label;
                            const totalDoanhSo = context.raw;
                            const totalSoLuong = totalQuantityByNPP[npp] || 0;
                            
                            const nganhDetails = nganhDetailByNPP[npp];
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
                    title: { display: true, text: 'NPP', font: { size: 13, weight: 'bold' } },
                    ticks: {
                        maxRotation: 45,
                        minRotation: 45,
                        font: { size: 10 }
                    }
                }
            }
        },
        plugins: [ChartDataLabels]
    });
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
                tinh: item.tinh,
                khuVuc: item.maKhuVuc
            };
        }
        nppData[npp].doanhSoBan += item.doanhSoBan || 0;
        nppData[npp].chietKhau += item.chietKhau || 0;
        nppData[npp].doanhThuThuan += item.doanhThuThuan || 0;
        if (item.maDon) {
            nppData[npp].soDonHang.add(item.maDon);
        }
    });

    let filteredNPP = Object.entries(nppData);
    if (nppSearchTerm) {
        filteredNPP = filteredNPP.filter(([npp]) => 
            removeDiacritics(npp.toLowerCase()).includes(nppSearchTerm)
        );
    }
    
    let html = '';
    
    let filterInfo = [];
    if (nppFilter.mien) filterInfo.push(`Miền: ${nppFilter.mien}`);
    if (nppFilter.khuVuc) filterInfo.push(`Khu vực: ${nppFilter.khuVuc}`);
    if (nppFilter.tinh) filterInfo.push(`Tỉnh: ${nppFilter.tinh}`);
    
    if (filterInfo.length > 0) {
        html += `<div class="search-result-info">
            <span><i class="fas fa-filter"></i> Đang lọc: ${filterInfo.join(' - ')}</span>
        </div>`;
    }
    
    if (nppSearchTerm) {
        html += `<div class="search-result-info">
            <span>
                <i class="fas fa-search"></i> Tìm kiếm "<strong>${nppSearchTerm}</strong>": 
                <span class="count">${filteredNPP.length}</span> NPP được tìm thấy
            </span>
            <span class="clear-link" onclick="clearNPPSearch()">
                <i class="fas fa-times"></i> Xóa tìm kiếm
            </span>
        </div>`;
    }
    
    // Tạo bảng với cấu trúc HTML đúng
    html += `
        <div class="data-table">
            <div style="overflow-x: auto;">
                <table>
                    <thead>
                        <tr>
                            <th>NPP</th>
                            <th>Miền</th>
                            <th>Khu vực</th>
                            <th>Tỉnh</th>
                            <th>Doanh số bán</th>
                            <th>Chiết khấu</th>
                            <th>Doanh thu thuần</th>
                            <th>Số đơn hàng</th>
                        </tr>
                    </thead>
                    <tbody>
    `;
    
    filteredNPP
        .sort((a, b) => b[1].doanhThuThuan - a[1].doanhThuThuan)
        .forEach(([npp, data]) => {
            let displayNPP = npp;
            if (nppSearchTerm && removeDiacritics(npp.toLowerCase()).includes(nppSearchTerm)) {
                const regex = new RegExp(`(${nppSearchTerm})`, 'gi');
                displayNPP = npp.replace(regex, '<span class="search-highlight">$1</span>');
            }
            
            html += `
                <tr onclick="showNPPDetailModal('${npp.replace(/'/g, "\\'")}')" style="cursor: pointer;">
                    <td>${displayNPP}</td>
                    <td>${data.mien}</td>
                    <td>${data.khuVuc}</td>
                    <td>${data.tinh}</td>
                    <td>${formatFullNumber(data.doanhSoBan)}</td>
                    <td>${formatFullNumber(data.chietKhau)}</td>
                    <td>${formatFullNumber(data.doanhThuThuan)}</td>
                    <td>${formatNumber(data.soDonHang.size)}</td>
                </tr>
            `;
        });
    
    if (filteredNPP.length === 0) {
        html += `
            <tr>
                <td colspan="8" style="text-align: center; padding: 40px;">
                    <i class="fas fa-search" style="font-size: 40px; color: #ddd; margin-bottom: 10px; display: block;"></i>
                    Không tìm thấy NPP nào phù hợp với từ khóa "<strong>${nppSearchTerm}</strong>"
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
    
    document.getElementById('nppTable').innerHTML = html;
}

function showNPPDetailModal(nppName) {
    const modal = document.getElementById('nppDetailModal');
    document.getElementById('nppDetailName').textContent = nppName;
    
    const nppOrders = filteredData.filter(item => item.NPP === nppName);
    
    nppOrders.sort((a, b) => {
        const dateCompare = parseDate(a.ngay) - parseDate(b.ngay);
        if (dateCompare !== 0) return dateCompare;
        return (a.maDon || '').localeCompare(b.maDon || '');
    });
    
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
    
    Object.entries(ordersByDon).forEach(([maDon, order], index) => {
        totalSales += order.tongDoanhSoBan;
        totalDiscount += order.tongChietKhau;
        totalRevenue += order.tongDoanhThuThuan;
        totalQuantity += order.tongSoLuong;
        
        const orderId = `order-${index}-${maDon.replace(/\s/g, '')}`;
        
        html += `
            <div class="order-card">
                <div class="order-header" onclick="toggleOrder('${orderId}')">
                    <div>
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
                <div id="${orderId}" class="order-details" style="display: none;">
                    <table class="detail-table">
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
        <div>
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

function closeNPPDetailModal() {
    const modal = document.getElementById('nppDetailModal');
    modal.style.display = 'none';
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