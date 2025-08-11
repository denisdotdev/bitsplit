import * as bitcoin from 'bitcoinjs-lib'

export interface BitcoinAddress {
  address: string
  privateKey: string
}

export function generateBitcoinAddress(): BitcoinAddress {
  throw new Error('Bitcoin key generation requires secure entropy - implement with proper key management')
}

export function validateBitcoinAddress(address: string): boolean {
  try {
    bitcoin.address.toOutputScript(address)
    return true
  } catch {
    return false
  }
}

export function satoshisToBTC(satoshis: number): number {
  return satoshis / 100000000
}

export function btcToSatoshis(btc: number): number {
  return Math.round(btc * 100000000)
}

export function formatBTC(amount: number): string {
  return `${amount.toFixed(8)} BTC`
}

export function formatSatoshis(amount: number): string {
  return `${Math.round(amount).toLocaleString()} sats`
}

export function formatCurrency(amount: number, unit: 'BTC' | 'sats'): string {
  if (unit === 'sats') {
    const satsAmount = typeof amount === 'number' && amount < 1 ? btcToSatoshis(amount) : amount
    return formatSatoshis(satsAmount)
  }
  
  const btcAmount = typeof amount === 'number' && amount >= 1 ? satoshisToBTC(amount) : amount
  return formatBTC(btcAmount)
}

export function convertCurrency(amount: number, fromUnit: 'BTC' | 'sats', toUnit: 'BTC' | 'sats'): number {
  if (fromUnit === toUnit) return amount
  
  if (fromUnit === 'BTC' && toUnit === 'sats') {
    return btcToSatoshis(amount)
  }
  
  if (fromUnit === 'sats' && toUnit === 'BTC') {
    return satoshisToBTC(amount)
  }
  
  return amount
}

export function parseCurrencyInput(input: string, unit: 'BTC' | 'sats'): number {
  const cleaned = input.replace(/[^\d.-]/g, '')
  const parsed = parseFloat(cleaned)
  
  if (isNaN(parsed)) return 0
  
  return unit === 'sats' ? Math.round(parsed) : parsed
}