/**
 * App Định Giá Tạp Hoá Đa Kênh
 * Tính giá bán cho 3 kênh: Offline, Grab, Shopee
 */

// ===== Constants =====
const TAX_RATE = 0.015; // 1.5%
const PLATFORM_FEES = {
    offline: 0,
    grab: 0.25,    // 25%
    shopee: 0.15   // 15%
};
const ROUNDING_STEPS = {
    offline: 1000,
    grab: 500,
    shopee: 500
};
const DEFAULT_SETTINGS = {
    lossRate: 5,
    riskRate: 3,
    profitRate: 20,
    grabAdFee: 10,
    shopeeAdFee: 10,
    isDetailMode: false
};

// ===== State =====
let state = { ...DEFAULT_SETTINGS };

// ===== DOM Elements =====
const elements = {
    // Mode toggle
    toggleMode: document.getElementById('toggleMode'),
    modeLabel: document.getElementById('modeLabel'),
    quickMode: document.getElementById('quickMode'),
    detailMode: document.getElementById('detailMode'),

    // Quick mode inputs
    totalCost: document.getElementById('totalCost'),

    // Detail mode inputs
    purchasePrice: document.getElementById('purchasePrice'),
    shippingCost: document.getElementById('shippingCost'),
    lossRate: document.getElementById('lossRate'),
    riskRate: document.getElementById('riskRate'),
    realCostDisplay: document.getElementById('realCostDisplay'),

    // Unit conversion
    wholesaleQty: document.getElementById('wholesaleQty'),
    wholesaleUnit: document.getElementById('wholesaleUnit'),
    retailQty: document.getElementById('retailQty'),
    retailUnit: document.getElementById('retailUnit'),
    packagingCost: document.getElementById('packagingCost'),
    unitCostDisplay: document.getElementById('unitCostDisplay'),

    // Profit
    profitRate: document.getElementById('profitRate'),

    // Ad fees
    offlineAdFeeInput: document.getElementById('offlineAdFeeInput'),
    grabAdFee: document.getElementById('grabAdFee'),
    shopeeAdFee: document.getElementById('shopeeAdFee'),

    // Results - Offline
    offlinePrice: document.getElementById('offlinePrice'),
    offlineCost: document.getElementById('offlineCost'),
    offlineTax: document.getElementById('offlineTax'),
    offlinePlatformFee: document.getElementById('offlinePlatformFee'),
    offlineAdFee: document.getElementById('offlineAdFee'),
    offlineTotalDeduct: document.getElementById('offlineTotalDeduct'),
    offlineProfit: document.getElementById('offlineProfit'),

    // Results - Grab
    grabPrice: document.getElementById('grabPrice'),
    grabCost: document.getElementById('grabCost'),
    grabTax: document.getElementById('grabTax'),
    grabPlatformFee: document.getElementById('grabPlatformFee'),
    grabAdFeeAmount: document.getElementById('grabAdFeeAmount'),
    grabTotalDeduct: document.getElementById('grabTotalDeduct'),
    grabProfit: document.getElementById('grabProfit'),
    grabError: document.getElementById('grabError'),

    // Results - Shopee
    shopeePrice: document.getElementById('shopeePrice'),
    shopeeCost: document.getElementById('shopeeCost'),
    shopeeTax: document.getElementById('shopeeTax'),
    shopeePlatformFee: document.getElementById('shopeePlatformFee'),
    shopeeAdFeeAmount: document.getElementById('shopeeAdFeeAmount'),
    shopeeTotalDeduct: document.getElementById('shopeeTotalDeduct'),
    shopeeProfit: document.getElementById('shopeeProfit'),
    shopeeError: document.getElementById('shopeeError')
};

// ===== Utility Functions =====

/**
 * Format number with Vietnamese locale (comma separator)
 */
function formatCurrency(value) {
    if (!value || isNaN(value)) return '0đ';
    return new Intl.NumberFormat('vi-VN').format(Math.round(value)) + 'đ';
}

/**
 * Parse number from formatted string
 * Vietnamese format: 500.000 = 500000 (dots are thousand separators)
 */
function parseNumber(str) {
    if (!str) return 0;
    // Remove all non-digit characters (dots, commas, spaces, currency symbols)
    const cleaned = str.replace(/[^\d]/g, '');
    const value = parseInt(cleaned, 10);
    return isNaN(value) ? 0 : value;
}

/**
 * Format input as currency while typing
 */
function formatInputAsCurrency(input) {
    const value = parseNumber(input.value);
    if (value > 0) {
        input.value = new Intl.NumberFormat('vi-VN').format(value);
    }
}

/**
 * Round UP to nearest step
 */
function roundUp(value, step) {
    return Math.ceil(value / step) * step;
}

// ===== Calculation Functions =====

/**
 * Calculate real cost from detail inputs
 */
function calculateRealCost() {
    const purchase = parseNumber(elements.purchasePrice.value);
    const shipping = parseNumber(elements.shippingCost.value);
    const lossRate = parseNumber(elements.lossRate.value) / 100;
    const riskRate = parseNumber(elements.riskRate.value) / 100;

    const loss = purchase * lossRate;
    const risk = purchase * riskRate;

    return purchase + shipping + loss + risk;
}

/**
 * Calculate cost per retail unit
 * Example: 500,000đ for 50kg, sell 1kg each → 10,000đ per unit
 */
function calculateUnitCost(totalCost) {
    const wholesaleQty = parseNumber(elements.wholesaleQty.value) || 1;
    const retailQty = parseNumber(elements.retailQty.value) || 1;
    const packagingCost = parseNumber(elements.packagingCost.value) || 0;

    // Cost per wholesale unit
    const costPerWholesaleUnit = totalCost / wholesaleQty;

    // Cost per retail unit (including packaging)
    const costPerRetailUnit = (costPerWholesaleUnit * retailQty) + packagingCost;

    return costPerRetailUnit;
}

/**
 * Get total cost based on current mode, then convert to per-unit cost
 */
function getTotalCost() {
    let totalCost;
    if (state.isDetailMode) {
        totalCost = calculateRealCost();
    } else {
        totalCost = parseNumber(elements.totalCost.value);
    }

    // Apply unit conversion
    const unitCost = calculateUnitCost(totalCost);

    // Update display
    if (elements.unitCostDisplay) {
        elements.unitCostDisplay.textContent = formatCurrency(unitCost);
    }

    return unitCost;
}

/**
 * Calculate selling price for a channel
 */
function calculateChannel(channel, realCost, profitRate) {
    const platformFee = PLATFORM_FEES[channel];
    const adFee = channel === 'offline' ? parseNumber(elements.offlineAdFeeInput.value) / 100 :
        channel === 'grab' ? parseNumber(elements.grabAdFee.value) / 100 :
            parseNumber(elements.shopeeAdFee.value) / 100;

    // Total deduction percentage
    const totalDeduction = TAX_RATE + platformFee + adFee;

    // Check if deduction >= 100%
    if (totalDeduction >= 1) {
        return {
            error: true,
            maxAdFee: ((1 - TAX_RATE - platformFee) * 100).toFixed(1)
        };
    }

    // Desired profit amount
    const desiredProfit = realCost * profitRate;

    // Raw selling price
    const rawPrice = (realCost + desiredProfit) / (1 - totalDeduction);

    // Round UP
    const roundingStep = ROUNDING_STEPS[channel];
    const sellingPrice = roundUp(rawPrice, roundingStep);

    // Calculate actual values
    const tax = sellingPrice * TAX_RATE;
    const platformFeeAmount = sellingPrice * platformFee;
    const adFeeAmount = sellingPrice * adFee;
    const totalDeductAmount = realCost + tax + platformFeeAmount + adFeeAmount;
    const actualProfit = sellingPrice - totalDeductAmount;

    return {
        error: false,
        sellingPrice,
        realCost,
        tax,
        platformFeeAmount,
        adFeeAmount,
        totalDeductAmount,
        actualProfit,
        totalDeductionPercent: (totalDeduction * 100).toFixed(1)
    };
}

/**
 * Update all channel results
 */
function updateResults() {
    const realCost = getTotalCost();
    const profitRate = parseNumber(elements.profitRate.value) / 100;

    // Update real cost display in detail mode
    if (state.isDetailMode) {
        elements.realCostDisplay.textContent = formatCurrency(realCost);
    }

    // Skip if no cost entered
    if (realCost <= 0) {
        resetResults();
        return;
    }

    // Calculate each channel
    const channels = ['offline', 'grab', 'shopee'];

    channels.forEach(channel => {
        const result = calculateChannel(channel, realCost, profitRate);
        const priceEl = elements[`${channel}Price`];
        const costEl = elements[`${channel}Cost`];
        const taxEl = elements[`${channel}Tax`];
        const platformFeeEl = elements[`${channel}PlatformFee`];
        const adFeeEl = channel === 'offline' ? elements.offlineAdFee : elements[`${channel}AdFeeAmount`];
        const totalDeductEl = elements[`${channel}TotalDeduct`];
        const profitEl = elements[`${channel}Profit`];
        const errorEl = elements[`${channel}Error`];
        const cardEl = priceEl.closest('.channel-card');

        if (result.error) {
            // Show error state
            cardEl.classList.add('error');
            if (errorEl) {
                errorEl.classList.remove('hidden');
                errorEl.innerHTML = `⚠️ Tổng phí vượt 100%!<br>Giảm QC xuống dưới ${result.maxAdFee}%`;
            }
            priceEl.textContent = '---';
            if (costEl) costEl.textContent = '---';
            taxEl.textContent = '---';
            if (platformFeeEl) platformFeeEl.textContent = '---';
            if (adFeeEl) adFeeEl.textContent = '---';
            if (totalDeductEl) totalDeductEl.textContent = '---';
            profitEl.textContent = '--- ❌';
        } else {
            // Show normal state
            cardEl.classList.remove('error');
            if (errorEl) {
                errorEl.classList.add('hidden');
            }
            priceEl.textContent = formatCurrency(result.sellingPrice);
            if (costEl) costEl.textContent = formatCurrency(result.realCost);
            taxEl.textContent = formatCurrency(result.tax);
            if (platformFeeEl) platformFeeEl.textContent = formatCurrency(result.platformFeeAmount);
            if (adFeeEl) adFeeEl.textContent = formatCurrency(result.adFeeAmount);
            if (totalDeductEl) totalDeductEl.textContent = formatCurrency(result.totalDeductAmount);
            profitEl.textContent = formatCurrency(result.actualProfit) + ' ✅';
        }
    });
}

/**
 * Reset all results to zero
 */
function resetResults() {
    elements.offlinePrice.textContent = '0đ';
    elements.offlineTax.textContent = '0đ';
    elements.offlineProfit.textContent = '0đ ✅';

    elements.grabPrice.textContent = '0đ';
    elements.grabTax.textContent = '0đ';
    elements.grabProfit.textContent = '0đ ✅';
    elements.grabError.classList.add('hidden');

    elements.shopeePrice.textContent = '0đ';
    elements.shopeeTax.textContent = '0đ';
    elements.shopeeProfit.textContent = '0đ ✅';
    elements.shopeeError.classList.add('hidden');

    document.querySelectorAll('.channel-card').forEach(card => {
        card.classList.remove('error');
    });
}

// ===== Mode Toggle =====

function toggleDetailMode() {
    state.isDetailMode = !state.isDetailMode;

    if (state.isDetailMode) {
        elements.quickMode.classList.add('hidden');
        elements.detailMode.classList.remove('hidden');
        elements.modeLabel.textContent = 'Thu gọn ▲';
        elements.toggleMode.classList.add('active');
    } else {
        elements.quickMode.classList.remove('hidden');
        elements.detailMode.classList.add('hidden');
        elements.modeLabel.textContent = 'Chi tiết ▼';
        elements.toggleMode.classList.remove('active');
    }

    saveSettings();
    updateResults();
}

// ===== LocalStorage =====

function saveSettings() {
    const settings = {
        lossRate: parseNumber(elements.lossRate.value),
        riskRate: parseNumber(elements.riskRate.value),
        profitRate: parseNumber(elements.profitRate.value),
        grabAdFee: parseNumber(elements.grabAdFee.value),
        shopeeAdFee: parseNumber(elements.shopeeAdFee.value),
        isDetailMode: state.isDetailMode
    };

    localStorage.setItem('pricingAppSettings', JSON.stringify(settings));
}

function loadSettings() {
    try {
        const saved = localStorage.getItem('pricingAppSettings');
        if (saved) {
            const settings = JSON.parse(saved);
            state = { ...DEFAULT_SETTINGS, ...settings };

            // Apply to inputs
            elements.lossRate.value = state.lossRate;
            elements.riskRate.value = state.riskRate;
            elements.profitRate.value = state.profitRate;
            elements.grabAdFee.value = state.grabAdFee;
            elements.shopeeAdFee.value = state.shopeeAdFee;

            // Apply mode
            if (state.isDetailMode) {
                elements.quickMode.classList.add('hidden');
                elements.detailMode.classList.remove('hidden');
                elements.modeLabel.textContent = 'Thu gọn ▲';
                elements.toggleMode.classList.add('active');
            }
        }
    } catch (e) {
        console.warn('Could not load settings:', e);
    }
}

// ===== Event Listeners =====

function setupEventListeners() {
    // Mode toggle
    elements.toggleMode.addEventListener('click', toggleDetailMode);

    // All number inputs - format and recalculate
    const numberInputs = [
        elements.totalCost,
        elements.purchasePrice,
        elements.shippingCost,
        elements.packagingCost
    ];

    numberInputs.forEach(input => {
        if (input) {
            input.addEventListener('input', () => {
                updateResults();
            });

            input.addEventListener('blur', () => {
                formatInputAsCurrency(input);
                updateResults();
            });
        }
    });

    // Unit conversion inputs
    const unitInputs = [
        elements.wholesaleQty,
        elements.retailQty
    ];

    unitInputs.forEach(input => {
        if (input) {
            input.addEventListener('input', () => {
                updateResults();
            });
        }
    });

    // Unit selectors
    const unitSelectors = [
        elements.wholesaleUnit,
        elements.retailUnit
    ];

    unitSelectors.forEach(select => {
        if (select) {
            select.addEventListener('change', () => {
                updateResults();
            });
        }
    });

    // Percentage inputs - just recalculate
    const percentInputs = [
        elements.lossRate,
        elements.riskRate,
        elements.profitRate,
        elements.offlineAdFeeInput,
        elements.grabAdFee,
        elements.shopeeAdFee
    ];

    percentInputs.forEach(input => {
        if (input) {
            input.addEventListener('input', () => {
                updateResults();
                saveSettings();
            });
        }
    });
}

// ===== PWA Service Worker =====

function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('./sw.js')
            .then(reg => {
                console.log('Service Worker registered:', reg.scope);
            })
            .catch(err => {
                console.warn('Service Worker registration failed:', err);
            });
    }
}

// ===== Initialize =====

function init() {
    loadSettings();
    setupEventListeners();
    registerServiceWorker();
    updateResults();
}

// Start the app
document.addEventListener('DOMContentLoaded', init);
