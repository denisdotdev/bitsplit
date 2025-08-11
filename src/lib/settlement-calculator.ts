interface UserBalance {
  userId: string
  balance: number
}

interface Settlement {
  fromUserId: string
  toUserId: string
  amount: number
}

export function calculateOptimalSettlements(balances: UserBalance[]): Settlement[] {
  const settlements: Settlement[] = []
  
  const debtors = balances.filter(b => b.balance < 0).map(b => ({ ...b }))
  const creditors = balances.filter(b => b.balance > 0).map(b => ({ ...b }))
  
  for (const debtor of debtors) {
    let debt = Math.abs(debtor.balance)
    
    for (const creditor of creditors) {
      if (debt === 0 || creditor.balance === 0) continue
      
      const settlementAmount = Math.min(debt, creditor.balance)
      
      settlements.push({
        fromUserId: debtor.userId,
        toUserId: creditor.userId,
        amount: settlementAmount
      })
      
      debt -= settlementAmount
      creditor.balance -= settlementAmount
    }
  }
  
  return settlements
}

export function calculateUserBalances(expenses: any[], userId?: string): UserBalance[] {
  const balances = new Map<string, number>()
  
  for (const expense of expenses) {
    if (!balances.has(expense.paidById)) {
      balances.set(expense.paidById, 0)
    }
    
    balances.set(expense.paidById, balances.get(expense.paidById)! + expense.amount)
    
    for (const split of expense.splits) {
      if (!balances.has(split.userId)) {
        balances.set(split.userId, 0)
      }
      
      balances.set(split.userId, balances.get(split.userId)! - split.amount)
    }
  }
  
  const result: UserBalance[] = []
  for (const [userId, balance] of balances.entries()) {
    if (Math.abs(balance) > 0.00000001) {
      result.push({ userId, balance })
    }
  }
  
  return result
}