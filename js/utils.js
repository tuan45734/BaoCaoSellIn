// js/utils.js
function parseDate(dateStr) {
    if (!dateStr) return null;
    const parts = dateStr.split('/');
    return new Date(parts[2], parts[1] - 1, parts[0]);
}

// Format tiền KHÔNG làm tròn, hiển thị chính xác
function formatMoney(amount) {
    if (amount >= 1000000000) {
        // Xử lý tỷ - KHÔNG làm tròn, hiển thị 1 chữ số thập phân chính xác
        const ty = amount / 1000000000;
        // Chuyển thành string và lấy 1 chữ số thập phân KHÔNG làm tròn
        const tyStr = ty.toString();
        const decimalIndex = tyStr.indexOf('.');
        
        if (decimalIndex === -1) {
            return tyStr + ',0 tỷ';
        } else {
            // Lấy 1 chữ số thập phân KHÔNG làm tròn
            const firstDecimal = tyStr.substring(0, decimalIndex + 2);
            return firstDecimal.replace('.', ',') + ' tỷ';
        }
    } else if (amount >= 1000000) {
        // Xử lý triệu - KHÔNG làm tròn, hiển thị 1 chữ số thập phân chính xác
        const trieu = amount / 1000000;
        const trieuStr = trieu.toString();
        const decimalIndex = trieuStr.indexOf('.');
        
        if (decimalIndex === -1) {
            return trieuStr + ',0 tr';
        } else {
            // Lấy 1 chữ số thập phân KHÔNG làm tròn
            const firstDecimal = trieuStr.substring(0, decimalIndex + 2);
            return firstDecimal.replace('.', ',') + ' tr';
        }
    } else {
        // Dưới 1 triệu, hiển thị số đầy đủ
        return new Intl.NumberFormat('vi-VN').format(amount) + ' đ';
    }
}

// Format số đầy đủ (không rút gọn)
function formatFullNumber(amount) {
    if (amount === null || amount === undefined || amount === '') return '0 đ';
    return new Intl.NumberFormat('vi-VN').format(amount) + ' đ';
}

// Format số (không có đơn vị tiền)
function formatNumber(num) {
    return new Intl.NumberFormat('vi-VN').format(num);
}

// Xóa dấu tiếng Việt
function removeDiacritics(str) {
    const accents = 'àáảãạâầấẩẫậăằắẳẵặèéẻẽẹêềếểễệđìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵ';
    const noAccents = 'aaaaaaaaaaaaaaaaaeeeeeeeeeeediiiiiooooooooooooooooouuuuuuuuuuuyyyyy';
    
    return str.toLowerCase()
        .split('')
        .map(char => {
            const index = accents.indexOf(char);
            return index !== -1 ? noAccents[index] : char;
        })
        .join('');
}