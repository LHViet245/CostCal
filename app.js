/**
 * App Định Giá Tạp Hoá Đa Kênh
 * Tính giá bán cho 3 kênh: Offline, Grab, Shopee
 */

// ===== Constants =====
const DEFAULT_TAX_RATE = 0.015; // 1.5%
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
    targetPrice: 0,
    taxRate: DEFAULT_TAX_RATE * 100,
    grabAdFee: 10,
    shopeeAdFee: 10,
    offlineAdFee: 0,
    pricingMode: 'profit',
    priceStyle: 'none',
    isDetailMode: false
};

const UNIT_CONVERSIONS = {
    kg: { base: 'g', factor: 1000 },
    g: { base: 'g', factor: 1 },
    lít: { base: 'ml', factor: 1000 },
    ml: { base: 'ml', factor: 1 },
    cái: { base: 'unit', factor: 1 },
    hộp: { base: 'unit', factor: 1 },
    thùng: { base: 'unit', factor: 1 },
    gói: { base: 'unit', factor: 1 }
};

const PRESETS = {
    dryGoods: {
        lossRate: 2,
        riskRate: 1,
        profitRate: 25
    },
    freshFood: {
        lossRate: 8,
        riskRate: 4,
        profitRate: 20
    },
    dairy: {
        lossRate: 4,
        riskRate: 2,
        profitRate: 18
    },
    frozen: {
        lossRate: 5,
        riskRate: 3,
        profitRate: 22
    }
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
    profitMode: document.getElementById('profitMode'),
    priceMode: document.getElementById('priceMode'),
    modeButtons: document.querySelectorAll('.mode-btn'),
    targetPrice: document.getElementById('targetPrice'),

    // Settings
    taxRate: document.getElementById('taxRate'),
    priceStyle: document.getElementById('priceStyle'),
    presetSelect: document.getElementById('presetSelect'),
    resetBtn: document.getElementById('resetBtn'),

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
    offlineTotalPercent: document.getElementById('offlineTotalPercent'),
    offlineProfitPercent: document.getElementById('offlineProfitPercent'),
    offlineRoundedHint: document.getElementById('offlineRoundedHint'),
    offlinePsychHint: document.getElementById('offlinePsychHint'),

    // Results - Grab
    grabPrice: document.getElementById('grabPrice'),
    grabCost: document.getElementById('grabCost'),
    grabTax: document.getElementById('grabTax'),
    grabPlatformFee: document.getElementById('grabPlatformFee'),
    grabAdFeeAmount: document.getElementById('grabAdFeeAmount'),
    grabTotalDeduct: document.getElementById('grabTotalDeduct'),
    grabProfit: document.getElementById('grabProfit'),
    grabTotalPercent: document.getElementById('grabTotalPercent'),
    grabProfitPercent: document.getElementById('grabProfitPercent'),
    grabRoundedHint: document.getElementById('grabRoundedHint'),
    grabPsychHint: document.getElementById('grabPsychHint'),
    grabError: document.getElementById('grabError'),

    // Results - Shopee
    shopeePrice: document.getElementById('shopeePrice'),
    shopeeCost: document.getElementById('shopeeCost'),
    shopeeTax: document.getElementById('shopeeTax'),
    shopeePlatformFee: document.getElementById('shopeePlatformFee'),
    shopeeAdFeeAmount: document.getElementById('shopeeAdFeeAmount'),
    shopeeTotalDeduct: document.getElementById('shopeeTotalDeduct'),
    shopeeProfit: document.getElementById('shopeeProfit'),
    shopeeTotalPercent: document.getElementById('shopeeTotalPercent'),
    shopeeProfitPercent: document.getElementById('shopeeProfitPercent'),
    shopeeRoundedHint: document.getElementById('shopeeRoundedHint'),
    shopeePsychHint: document.getElementById('shopeePsychHint'),
    shopeeError: document.getElementById('shopeeError'),

    // Unit warning
    unitWarning: document.getElementById('unitWarning')
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
 * Format percent with 1 decimal place
 */
function formatPercent(value) {
    if (!value || isNaN(value)) return '0%';
    const formatter = new Intl.NumberFormat('vi-VN', {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1
    });
    return `${formatter.format(value)}%`;
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
 * Parse decimal number from string with comma/dot separator
 */
function parseDecimal(str) {
    if (!str) return 0;
    const cleaned = str.replace(/[^\d.,]/g, '');
    if (!cleaned) return 0;

    const lastSeparator = Math.max(cleaned.lastIndexOf('.'), cleaned.lastIndexOf(','));
    if (lastSeparator === -1) {
        const value = parseFloat(cleaned);
        return isNaN(value) ? 0 : value;
    }

    const integerPart = cleaned.slice(0, lastSeparator).replace(/[.,]/g, '');
    const decimalPart = cleaned.slice(lastSeparator + 1).replace(/[.,]/g, '');
    const normalized = `${integerPart}.${decimalPart}`;
    const value = parseFloat(normalized);
    return isNaN(value) ? 0 : value;
}

/**
 * Parse percent input
 */
function parsePercent(str) {
    return parseDecimal(str);
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

/**
 * Sanitize percent input, allowing one decimal separator
 */
function sanitizePercentInput(input) {
    const value = input.value;
    const cleaned = value.replace(/[^\d.,]/g, '');
    const lastSeparator = Math.max(cleaned.lastIndexOf('.'), cleaned.lastIndexOf(','));

    if (lastSeparator === -1) {
        input.value = cleaned;
        return;
    }

    const integerPart = cleaned.slice(0, lastSeparator).replace(/[.,]/g, '');
    const decimalPart = cleaned.slice(lastSeparator + 1).replace(/[.,]/g, '');
    if (decimalPart.length === 0 && lastSeparator === cleaned.length - 1) {
        input.value = `${integerPart}.`;
        return;
    }
    input.value = `${integerPart}.${decimalPart}`;
}

/**
 * Suggest psychological price
 */
function getPsychologicalPrice(price, style) {
    if (!price || style === 'none') return null;
    const tail = style === 'ends9' ? 900 : 500;
    const step = 1000;
    let suggestion = Math.floor(price / step) * step + tail;
    if (suggestion < price) {
        suggestion += step;
    }
    return suggestion;
}

// ===== Calculation Functions =====

/**
 * Calculate real cost from detail inputs
 */
function calculateRealCost() {
    const purchase = parseNumber(elements.purchasePrice.value);
    const shipping = parseNumber(elements.shippingCost.value);
    const lossRate = parsePercent(elements.lossRate.value) / 100;
    const riskRate = parsePercent(elements.riskRate.value) / 100;

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
    const wholesaleUnit = elements.wholesaleUnit.value;
    const retailUnit = elements.retailUnit.value;

    const wholesaleMeta = UNIT_CONVERSIONS[wholesaleUnit] || { base: wholesaleUnit, factor: 1 };
    const retailMeta = UNIT_CONVERSIONS[retailUnit] || { base: retailUnit, factor: 1 };

    let costPerRetailUnit;

    if (wholesaleMeta.base === retailMeta.base) {
        const wholesaleBaseQty = wholesaleQty * wholesaleMeta.factor;
        const retailBaseQty = retailQty * retailMeta.factor;
        const costPerBaseUnit = totalCost / wholesaleBaseQty;
        costPerRetailUnit = (costPerBaseUnit * retailBaseQty) + packagingCost;
        if (elements.unitWarning) {
            elements.unitWarning.classList.add('hidden');
        }
    } else {
        // Fallback to simple ratio if units are incompatible
        costPerRetailUnit = (totalCost / wholesaleQty) * retailQty + packagingCost;
        if (elements.unitWarning) {
            elements.unitWarning.classList.remove('hidden');
        }
    }

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

    if (totalCost <= 0 && elements.unitWarning) {
        elements.unitWarning.classList.add('hidden');
    }

    return unitCost;
}

/**
 * Calculate selling price for a channel
 */
function calculateChannel(channel, realCost, profitRate, targetPrice, taxRate, priceStyle) {
    const platformFee = PLATFORM_FEES[channel];
    const adFee = channel === 'offline' ? parsePercent(elements.offlineAdFeeInput.value) / 100 :
        channel === 'grab' ? parsePercent(elements.grabAdFee.value) / 100 :
            parsePercent(elements.shopeeAdFee.value) / 100;

    // Total deduction percentage
    const totalDeduction = taxRate + platformFee + adFee;

    // Check if deduction >= 100%
    if (totalDeduction >= 1) {
        return {
            error: true,
            maxAdFee: ((1 - taxRate - platformFee) * 100).toFixed(1)
        };
    }

    let rawPrice = 0;
    let sellingPrice = 0;
    let desiredProfit = 0;

    if (state.pricingMode === 'profit') {
        desiredProfit = realCost * profitRate;
        rawPrice = (realCost + desiredProfit) / (1 - totalDeduction);
        const roundingStep = ROUNDING_STEPS[channel];
        sellingPrice = roundUp(rawPrice, roundingStep);
    } else {
        rawPrice = targetPrice;
        sellingPrice = rawPrice;
    }

    const roundingStep = ROUNDING_STEPS[channel];
    const roundedSuggestion = roundUp(rawPrice, roundingStep);
    const psychologicalSuggestion = getPsychologicalPrice(
        state.pricingMode === 'profit' ? sellingPrice : roundedSuggestion,
        priceStyle
    );

    // Calculate actual values
    const tax = sellingPrice * taxRate;
    const platformFeeAmount = sellingPrice * platformFee;
    const adFeeAmount = sellingPrice * adFee;
    const totalDeductAmount = realCost + tax + platformFeeAmount + adFeeAmount;
    const actualProfit = sellingPrice - totalDeductAmount;
    const actualProfitRate = realCost > 0 ? (actualProfit / realCost) * 100 : 0;

    return {
        error: false,
        sellingPrice,
        realCost,
        tax,
        platformFeeAmount,
        adFeeAmount,
        totalDeductAmount,
        actualProfit,
        totalDeductionPercent: totalDeduction * 100,
        actualProfitRate,
        roundedSuggestion,
        psychologicalSuggestion
    };
}

/**
 * Update all channel results
 */
function updateResults() {
    const realCost = getTotalCost();
    const profitRate = parsePercent(elements.profitRate.value) / 100;
    const targetPrice = parseNumber(elements.targetPrice.value);
    const taxRate = parsePercent(elements.taxRate.value) / 100;
    const priceStyle = elements.priceStyle.value;

    // Update real cost display in detail mode
    if (state.isDetailMode) {
        elements.realCostDisplay.textContent = formatCurrency(realCost);
    }

    // Skip if no cost entered
    if (realCost <= 0 || (state.pricingMode === 'price' && targetPrice <= 0)) {
        resetResults();
        return;
    }

    // Calculate each channel
    const channels = ['offline', 'grab', 'shopee'];

    channels.forEach(channel => {
        const result = calculateChannel(channel, realCost, profitRate, targetPrice, taxRate, priceStyle);
        const priceEl = elements[`${channel}Price`];
        const costEl = elements[`${channel}Cost`];
        const taxEl = elements[`${channel}Tax`];
        const platformFeeEl = elements[`${channel}PlatformFee`];
        const adFeeEl = channel === 'offline' ? elements.offlineAdFee : elements[`${channel}AdFeeAmount`];
        const totalDeductEl = elements[`${channel}TotalDeduct`];
        const profitEl = elements[`${channel}Profit`];
        const totalPercentEl = elements[`${channel}TotalPercent`];
        const profitPercentEl = elements[`${channel}ProfitPercent`];
        const roundedHintEl = elements[`${channel}RoundedHint`];
        const psychHintEl = elements[`${channel}PsychHint`];
        const errorEl = elements[`${channel}Error`];
        const cardEl = priceEl.closest('.channel-card');

        if (result.error) {
            // Show error state
            cardEl.classList.add('error');
            if (errorEl) {
                errorEl.classList.remove('hidden');
                errorEl.textContent = `⚠️ Tổng phí vượt 100%! Giảm QC xuống dưới ${result.maxAdFee}%`;
            }
            priceEl.textContent = '---';
            if (costEl) costEl.textContent = '---';
            taxEl.textContent = '---';
            if (platformFeeEl) platformFeeEl.textContent = '---';
            if (adFeeEl) adFeeEl.textContent = '---';
            if (totalDeductEl) totalDeductEl.textContent = '---';
            profitEl.textContent = '--- ❌';
            if (totalPercentEl) totalPercentEl.textContent = '---';
            if (profitPercentEl) profitPercentEl.textContent = '---';
            if (roundedHintEl) roundedHintEl.classList.add('hidden');
            if (psychHintEl) psychHintEl.classList.add('hidden');
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
            if (totalPercentEl) totalPercentEl.textContent = formatPercent(result.totalDeductionPercent);
            if (profitPercentEl) profitPercentEl.textContent = formatPercent(result.actualProfitRate);

            if (roundedHintEl) {
                if (state.pricingMode === 'price' && result.roundedSuggestion !== result.sellingPrice) {
                    roundedHintEl.textContent = `Gợi ý làm tròn: ${formatCurrency(result.roundedSuggestion)}`;
                    roundedHintEl.classList.remove('hidden');
                } else {
                    roundedHintEl.classList.add('hidden');
                }
            }

            if (psychHintEl) {
                if (result.psychologicalSuggestion && elements.priceStyle.value !== 'none') {
                    psychHintEl.textContent = `Giá đẹp: ${formatCurrency(result.psychologicalSuggestion)}`;
                    psychHintEl.classList.remove('hidden');
                } else {
                    psychHintEl.classList.add('hidden');
                }
            }
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
    elements.offlineTotalPercent.textContent = '0%';
    elements.offlineProfitPercent.textContent = '0%';
    elements.offlineRoundedHint.classList.add('hidden');
    elements.offlinePsychHint.classList.add('hidden');

    elements.grabPrice.textContent = '0đ';
    elements.grabTax.textContent = '0đ';
    elements.grabProfit.textContent = '0đ ✅';
    elements.grabTotalPercent.textContent = '0%';
    elements.grabProfitPercent.textContent = '0%';
    elements.grabRoundedHint.classList.add('hidden');
    elements.grabPsychHint.classList.add('hidden');
    elements.grabError.classList.add('hidden');

    elements.shopeePrice.textContent = '0đ';
    elements.shopeeTax.textContent = '0đ';
    elements.shopeeProfit.textContent = '0đ ✅';
    elements.shopeeTotalPercent.textContent = '0%';
    elements.shopeeProfitPercent.textContent = '0%';
    elements.shopeeRoundedHint.classList.add('hidden');
    elements.shopeePsychHint.classList.add('hidden');
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

function setPricingMode(mode) {
    if (mode !== 'profit' && mode !== 'price') return;
    state.pricingMode = mode;

    elements.modeButtons.forEach(button => {
        const isActive = button.dataset.mode === mode;
        button.classList.toggle('active', isActive);
        button.setAttribute('aria-pressed', isActive ? 'true' : 'false');
    });

    if (mode === 'profit') {
        if (elements.profitMode) {
            elements.profitMode.classList.remove('hidden');
        }
        if (elements.priceMode) {
            elements.priceMode.classList.add('hidden');
        }
    } else {
        if (elements.profitMode) {
            elements.profitMode.classList.add('hidden');
        }
        if (elements.priceMode) {
            elements.priceMode.classList.remove('hidden');
        }
    }

    saveSettings();
    updateResults();
}

function applyPreset(presetKey) {
    const preset = PRESETS[presetKey];
    if (!preset) return;

    if (state.pricingMode !== 'profit') {
        setPricingMode('profit');
    }

    elements.lossRate.value = preset.lossRate;
    elements.riskRate.value = preset.riskRate;
    elements.profitRate.value = preset.profitRate;
    updateResults();
    saveSettings();
}

function resetAll() {
    state = { ...DEFAULT_SETTINGS };
    localStorage.removeItem('pricingAppSettings');

    elements.lossRate.value = state.lossRate;
    elements.riskRate.value = state.riskRate;
    elements.profitRate.value = state.profitRate;
    elements.targetPrice.value = '';
    elements.taxRate.value = state.taxRate;
    elements.grabAdFee.value = state.grabAdFee;
    elements.shopeeAdFee.value = state.shopeeAdFee;
    elements.offlineAdFeeInput.value = state.offlineAdFee;
    elements.priceStyle.value = state.priceStyle;
    elements.presetSelect.value = '';

    elements.totalCost.value = '';
    elements.purchasePrice.value = '';
    elements.shippingCost.value = '';
    elements.packagingCost.value = '0';
    elements.wholesaleQty.value = '1';
    elements.retailQty.value = '1';
    elements.wholesaleUnit.value = 'kg';
    elements.retailUnit.value = 'kg';

    elements.quickMode.classList.remove('hidden');
    elements.detailMode.classList.add('hidden');
    elements.modeLabel.textContent = 'Chi tiết ▼';
    elements.toggleMode.classList.remove('active');
    if (elements.unitWarning) {
        elements.unitWarning.classList.add('hidden');
    }

    setPricingMode(state.pricingMode);
}

// ===== LocalStorage =====

function saveSettings() {
    const settings = {
        lossRate: parsePercent(elements.lossRate.value),
        riskRate: parsePercent(elements.riskRate.value),
        profitRate: parsePercent(elements.profitRate.value),
        targetPrice: parseNumber(elements.targetPrice.value),
        taxRate: parsePercent(elements.taxRate.value),
        grabAdFee: parsePercent(elements.grabAdFee.value),
        shopeeAdFee: parsePercent(elements.shopeeAdFee.value),
        offlineAdFee: parsePercent(elements.offlineAdFeeInput.value),
        priceStyle: elements.priceStyle.value,
        pricingMode: state.pricingMode,
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
            elements.targetPrice.value = state.targetPrice ? new Intl.NumberFormat('vi-VN').format(state.targetPrice) : '';
            elements.taxRate.value = state.taxRate ?? DEFAULT_SETTINGS.taxRate;
            elements.grabAdFee.value = state.grabAdFee;
            elements.shopeeAdFee.value = state.shopeeAdFee;
            elements.offlineAdFeeInput.value = state.offlineAdFee;
            elements.priceStyle.value = state.priceStyle || 'none';

            if (state.pricingMode) {
                setPricingMode(state.pricingMode);
            }

            // Apply mode
            if (state.isDetailMode) {
                elements.quickMode.classList.add('hidden');
                elements.detailMode.classList.remove('hidden');
                elements.modeLabel.textContent = 'Thu gọn ▲';
                elements.toggleMode.classList.add('active');
            }
        } else {
            elements.lossRate.value = state.lossRate;
            elements.riskRate.value = state.riskRate;
            elements.profitRate.value = state.profitRate;
            elements.taxRate.value = state.taxRate;
            elements.grabAdFee.value = state.grabAdFee;
            elements.shopeeAdFee.value = state.shopeeAdFee;
            elements.offlineAdFeeInput.value = state.offlineAdFee;
            elements.priceStyle.value = state.priceStyle;
            setPricingMode(state.pricingMode);
        }
    } catch (e) {
        console.warn('Could not load settings:', e);
    }
}

// ===== Event Listeners =====

function setupEventListeners() {
    // Mode toggle
    elements.toggleMode.addEventListener('click', toggleDetailMode);
    elements.modeButtons.forEach(button => {
        button.addEventListener('click', () => {
            setPricingMode(button.dataset.mode);
        });
    });

    // All number inputs - format and recalculate
    const numberInputs = [
        elements.totalCost,
        elements.purchasePrice,
        elements.shippingCost,
        elements.packagingCost,
        elements.targetPrice
    ];

    numberInputs.forEach(input => {
        if (input) {
            input.addEventListener('input', () => {
                updateResults();
                if (input === elements.targetPrice) {
                    saveSettings();
                }
            });

            input.addEventListener('blur', () => {
                formatInputAsCurrency(input);
                updateResults();
                if (input === elements.targetPrice) {
                    saveSettings();
                }
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
        elements.taxRate,
        elements.offlineAdFeeInput,
        elements.grabAdFee,
        elements.shopeeAdFee
    ];

    percentInputs.forEach(input => {
        if (input) {
            input.addEventListener('input', () => {
                sanitizePercentInput(input);
                updateResults();
                saveSettings();
            });
        }
    });

    if (elements.priceStyle) {
        elements.priceStyle.addEventListener('change', () => {
            updateResults();
            saveSettings();
        });
    }

    if (elements.presetSelect) {
        elements.presetSelect.addEventListener('change', () => {
            applyPreset(elements.presetSelect.value);
        });
    }

    if (elements.resetBtn) {
        elements.resetBtn.addEventListener('click', resetAll);
    }
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
