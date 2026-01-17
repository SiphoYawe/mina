# Mina Bridge - Comprehensive Bug Report

**Date**: January 17, 2026
**Testing Method**: Automated E2E testing with parallel subagents
**Server**: localhost:3000
**Agents Deployed**: 7 (6 successful, 1 failed due to script error)

---

## Executive Summary

Total issues identified: **22**
- **HIGH Priority**: 1
- **MEDIUM Priority**: 11
- **LOW Priority**: 10

---

## 1. Wallet Connection Issues

### WALLET-001: Missing Environment Variable Silent Failure
- **Severity**: HIGH
- **Component**: `wallet-provider.tsx`
- **Description**: When `NEXT_PUBLIC_REOWN_PROJECT_ID` is not set, the wallet connection silently fails without user feedback
- **Expected**: Error message or fallback behavior
- **Actual**: Silent failure, users cannot connect
- **Recommendation**: Add validation and display error message if project ID is missing

### WALLET-002: Loading Spinner Flash
- **Severity**: LOW
- **Component**: `connect-button.tsx`
- **Description**: Brief loading spinner flash on initial render before hydration completes
- **Impact**: Minor visual glitch
- **Recommendation**: Consider skeleton state or delayed loading indicator

### WALLET-003: localStorage Cleanup
- **Severity**: LOW
- **Component**: Wallet state persistence
- **Description**: Old wallet connection data not cleaned up on disconnect in some edge cases
- **Recommendation**: Ensure complete state cleanup on disconnect

---

## 2. Chain & Token Selector Issues

### SELECTOR-001: Token Dropdown Mobile Overflow
- **Severity**: MEDIUM
- **Component**: `token-selector.tsx`
- **Description**: Token selector dropdown can overflow viewport on mobile devices with long token lists
- **Expected**: Dropdown stays within viewport with scroll
- **Actual**: Content overflows, causing horizontal scroll
- **Recommendation**: Add `max-height` and `overflow-y: auto` with viewport boundary checking

### SELECTOR-002: No Loading Skeleton for Tokens
- **Severity**: LOW
- **Component**: `token-selector.tsx`
- **Description**: No skeleton/shimmer loading state while tokens are being fetched
- **Impact**: Blank state appears before tokens load
- **Recommendation**: Add skeleton loading animation

---

## 3. Amount Input & Quote Issues

### QUOTE-001: Missing Min/Max Amount Validation
- **Severity**: MEDIUM
- **Component**: `bridge-form.tsx`, `use-bridge-quote.ts`
- **Description**: No validation for minimum or maximum bridge amounts before fetching quote
- **Expected**: Display min/max constraints from API before quote fetch
- **Actual**: Invalid amounts only caught after quote request fails
- **Recommendation**: Fetch and display amount constraints upfront

### QUOTE-002: No Exchange Rate Display
- **Severity**: MEDIUM
- **Component**: `bridge-form.tsx`
- **Description**: Exchange rate between source and destination tokens not displayed
- **Expected**: Show rate like "1 ETH = X USDC"
- **Actual**: Only shows estimated output amount
- **Recommendation**: Calculate and display exchange rate

### QUOTE-003: No Alternative Routes Display
- **Severity**: MEDIUM
- **Component**: `bridge-form.tsx`
- **Description**: Only one route shown even when alternatives exist
- **Expected**: Option to view/select alternative routes
- **Actual**: Single route displayed
- **Recommendation**: Show alternative routes with trade-offs (speed vs cost)

### QUOTE-004: Hardcoded USDC Address
- **Severity**: MEDIUM
- **Component**: `use-bridge-quote.ts`
- **Description**: USDC address hardcoded as `0xeb62eee3685fc4c43992febcd9e75443a2dc32ff`
- **Risk**: May fail on chains where this address doesn't represent USDC
- **Recommendation**: Fetch token addresses dynamically per chain

---

## 4. Settings Panel Issues

### SETTINGS-001: No Text Input for Custom Slippage
- **Severity**: LOW
- **Component**: `settings-panel.tsx`
- **Description**: Custom slippage only adjustable via slider, no text input for precise values
- **Expected**: Text input for exact percentage (e.g., "0.35%")
- **Actual**: Only slider with 0.1 step increments
- **Recommendation**: Add optional text input alongside slider

### SETTINGS-002: Auto-deposit Not Persisted
- **Severity**: MEDIUM
- **Component**: `settings-store.ts`
- **Description**: Auto-deposit preference not persisted to localStorage
- **Expected**: Setting survives page refresh
- **Actual**: Resets to default on reload
- **Recommendation**: Add `autoDeposit` to persisted state

### SETTINGS-003: Auto-deposit Doesn't Affect Quote
- **Severity**: MEDIUM
- **Component**: `use-bridge-quote.ts`
- **Description**: Auto-deposit toggle doesn't modify quote request parameters
- **Expected**: Quote should reflect auto-deposit cost/steps
- **Actual**: Same quote regardless of toggle state
- **Recommendation**: Pass auto-deposit flag to quote API

### SETTINGS-004: Escape Key Doesn't Close Panel
- **Severity**: LOW
- **Component**: `settings-panel.tsx`
- **Description**: Pressing Escape key doesn't close the settings drawer
- **Expected**: Escape closes modal/drawer (standard UX pattern)
- **Actual**: No keyboard shortcut to close
- **Recommendation**: Add `useEffect` with keydown listener for Escape

---

## 5. Execution Modal Issues

### EXEC-001: Limited Explorer URLs
- **Severity**: MEDIUM
- **Component**: `execution-modal.tsx`
- **Description**: Only 12 chains have explorer URLs configured, but app supports 40+ chains
- **Impact**: Many transactions won't have "View on Explorer" links
- **Recommendation**: Add complete explorer URL mapping or fetch dynamically

---

## 6. UI/UX & Accessibility Issues

### UI-001: Undefined bg-bg-card Token
- **Severity**: MEDIUM
- **Component**: Various
- **Description**: CSS token `bg-bg-card` used but not defined in design system
- **Impact**: Falls back to transparent/undefined
- **Recommendation**: Define token or replace with `bg-bg-surface` or `bg-bg-elevated`

### A11Y-001: Missing ARIA Label - Chain Dropdown
- **Severity**: LOW
- **Component**: `chain-selector.tsx`
- **Description**: Chain selector dropdown trigger missing `aria-label`
- **Recommendation**: Add `aria-label="Select source chain"`

### A11Y-002: Missing ARIA Label - Token Dropdown
- **Severity**: LOW
- **Component**: `token-selector.tsx`
- **Description**: Token selector dropdown trigger missing `aria-label`
- **Recommendation**: Add `aria-label="Select token"`

### A11Y-003: Missing ARIA Label - Amount Input
- **Severity**: LOW
- **Component**: `bridge-form.tsx`
- **Description**: Amount input missing descriptive `aria-label`
- **Recommendation**: Add `aria-label="Bridge amount"`

---

## 7. Error Handling Issues

### ERR-001: Token Load Failure Silent
- **Severity**: MEDIUM
- **Component**: `bridge-form.tsx`
- **Description**: When token fetching fails, no error message shown to user
- **Expected**: Toast or inline error message
- **Actual**: Silent failure, token list appears empty
- **Recommendation**: Add error state display with retry option

### ERR-002: No Offline Detection
- **Severity**: MEDIUM
- **Component**: Global
- **Description**: App doesn't detect or handle offline state
- **Expected**: Banner/toast indicating offline status
- **Actual**: Operations fail silently or with generic errors
- **Recommendation**: Add `navigator.onLine` listener and offline banner

### ERR-003: Wallet Disconnect During Transaction
- **Severity**: LOW
- **Component**: `execution-modal.tsx`
- **Description**: If wallet disconnects mid-transaction, no graceful handling
- **Expected**: Detect disconnect, show appropriate message
- **Actual**: Transaction gets stuck or shows generic error
- **Recommendation**: Monitor wallet connection state during execution

### ERR-004: No Retry for Chain Loading
- **Severity**: LOW
- **Component**: Chain fetching logic
- **Description**: If chain list fails to load, no retry mechanism
- **Recommendation**: Add automatic retry with exponential backoff

---

## Positive Findings

The following areas passed testing with good results:

1. **SSR Handling**: Proper client-side checks prevent hydration mismatches
2. **Error Boundaries**: ErrorBoundary wraps BridgeForm correctly
3. **Keyboard Navigation**: Chain/token selectors support Arrow keys, Enter, Escape
4. **Design System**: Consistent use of color tokens, typography scales
5. **Animations**: Smooth Framer Motion transitions with reduced-motion support
6. **Focus Indicators**: Visible focus states for accessibility
7. **Debouncing**: 500ms debounce on quote fetching works correctly
8. **Race Condition Protection**: Cancelled flag pattern prevents stale data
9. **Search Highlighting**: Token/chain search highlights matching text

---

## Test Coverage Gaps

The following areas couldn't be fully tested:

1. **Receipt Page**: Testing agent failed due to script parsing error
2. **Transaction History Polling**: Not fully verified
3. **Real Wallet Transactions**: Would require testnet funds
4. **Multi-wallet Scenarios**: Only single wallet tested

---

## Recommendations by Priority

### Immediate (Before Demo)
1. Fix WALLET-001 (environment variable validation)
2. Fix SELECTOR-001 (mobile dropdown overflow)
3. Fix ERR-001 (token load error display)

### Short-term
1. Add min/max amount validation (QUOTE-001)
2. Persist auto-deposit setting (SETTINGS-002)
3. Add Escape key to close settings (SETTINGS-004)
4. Define missing CSS token (UI-001)

### Nice-to-have
1. Exchange rate display (QUOTE-002)
2. Alternative routes (QUOTE-003)
3. Custom slippage text input (SETTINGS-001)
4. Complete explorer URL coverage (EXEC-001)

---

## Files Affected

| Component | File Path | Issue Count |
|-----------|-----------|-------------|
| Wallet | `components/wallet/wallet-provider.tsx` | 1 |
| Wallet | `components/wallet/connect-button.tsx` | 2 |
| Bridge Form | `components/bridge/bridge-form.tsx` | 4 |
| Settings | `components/bridge/settings-panel.tsx` | 2 |
| Settings Store | `lib/stores/settings-store.ts` | 1 |
| Quote Hook | `lib/hooks/use-bridge-quote.ts` | 2 |
| Execution | `components/bridge/execution-modal.tsx` | 2 |
| Selectors | `components/bridge/chain-selector.tsx` | 2 |
| Selectors | `components/bridge/token-selector.tsx` | 2 |
| Global | Various | 4 |

---

*Report generated by automated E2E testing suite*
