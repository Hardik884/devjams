export const formatINR = (n) => {
  if (n === undefined || n === null) return '-'
  return new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2 }).format(n)
}

export const formatPrice = (price) => {
  if (price === undefined || price === null || isNaN(price)) return '0.00'
  return new Intl.NumberFormat('en-IN', { 
    minimumFractionDigits: 2,
    maximumFractionDigits: 2 
  }).format(Number(price))
}

export const formatPercentage = (percentage) => {
  if (percentage === undefined || percentage === null || isNaN(percentage)) return '0.00'
  return new Intl.NumberFormat('en-IN', { 
    minimumFractionDigits: 2,
    maximumFractionDigits: 2 
  }).format(Number(percentage))
}

export const formatCurrency = (amount, currency = 'INR') => {
  if (amount === undefined || amount === null || isNaN(amount)) return '₹0.00'
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(Number(amount))
}

export const formatNumber = (num) => {
  if (num === undefined || num === null || isNaN(num)) return '0'
  return new Intl.NumberFormat('en-IN').format(Number(num))
}

export const formatLargeNumber = (num) => {
  if (num === undefined || num === null || isNaN(num)) return '0'
  const absNum = Math.abs(num)
  
  if (absNum >= 1e9) {
    return (num / 1e9).toFixed(2) + 'B'
  } else if (absNum >= 1e7) {
    return (num / 1e7).toFixed(2) + 'Cr'
  } else if (absNum >= 1e5) {
    return (num / 1e5).toFixed(2) + 'L'
  } else if (absNum >= 1e3) {
    return (num / 1e3).toFixed(2) + 'K'
  }
  
  return formatNumber(num)
}
