// src/api/types.ts

export interface InventoryAgingItem {
  inventoryClass: string;
  days1To180: string;
  days181To365: string;
  days366To730: string;
  days731To1095: string;
  days1096To1460: string;
  days1461Plus: string;
  total: string;
}

export interface OrderIntakeItem {
  month: string;
  abp: string;
  abpExport: string;
  dc: string;
  dcExport: string;
  total: string;
  scm: string;
}

// src/api/types.ts - Order Intake related types

// Frontend display format (converted from API strings to numbers)
export interface MonthlyData {
  month: string;
  abp: number; // amA_VALUE from API
  abpExp: number; // abP_EXPORT_VALUE from API
  dc: number; // dC_VALUE from API
  dcExp: number; // dC_EXPORT_VALUE from API
  total: number; // total from API
  scm: number; // scM_VALUE from API
}

export interface AdjustmentData {
  opening: MonthlyData;
  cancelled: MonthlyData;
  rebook: MonthlyData;
}

export interface OrderIntakeData {
  currentYear: MonthlyData[]; // from data.intake
  currentYearTotal: MonthlyData; // calculated total
  adjustments: AdjustmentData; // from data.intakeMisc
  adjustmentsTotal: MonthlyData; // calculated total
  previousYear: MonthlyData[]; // from data.intakePrev
  previousYearTotal: MonthlyData; // calculated total
  yesterday: MonthlyData; // from data.intakeYest[0]
}

// API Response interfaces (matching actual API response structure)
export interface OrderIntakeApiRow {
  month: string;
  amA_QTY: string; // AMA Quantity
  amA_VALUE: string; // AMA Value -> maps to abp
  dC_QTY: string; // DC Quantity
  dC_VALUE: string; // DC Value -> maps to dc
  scM_QTY: string; // SCM Quantity
  scM_VALUE: string; // SCM Value -> maps to scm
  abP_EXPORT_QTY: string; // ABP Export Quantity
  abP_EXPORT_VALUE: string; // ABP Export Value -> maps to abpExp
  dC_EXPORT_QTY: string; // DC Export Quantity
  dC_EXPORT_VALUE: string; // DC Export Value -> maps to dcExp
  total: string; // Total value
}

export interface OrderIntakeAdjustmentApiRow {
  month: string; // "Opening", "Cancelled", "rebook"
  amA_QTY: string;
  amA_VALUE: string;
  dC_QTY: string;
  dC_VALUE: string;
  scM_QTY: string;
  scM_VALUE: string;
  abP_EXPORT_QTY: string;
  abP_EXPORT_VALUE: string;
  dC_EXPORT_QTY: string;
  dC_EXPORT_VALUE: string;
  total: string;
}

export interface OrderIntakeYesterdayApiRow {
  month: string; // "Yesterday"
  amA_QTY: string;
  amA_VALUE: string;
  dC_QTY: string;
  dC_VALUE: string;
  scM_QTY: string;
  scM_VALUE: string;
  abP_EXPORT_QTY: string;
  abP_EXPORT_VALUE: string;
  dC_EXPORT_QTY: string;
  dC_EXPORT_VALUE: string;
  total: string;
}

// Complete API response structure
export interface OrderIntakeApiResponse {
  status_Code: number;
  status: string;
  message: string;
  data: {
    intake: OrderIntakeApiRow[]; // Current year monthly data
    intakeMisc: OrderIntakeAdjustmentApiRow[]; // Opening, Cancelled, Rebook
    intakePrev: OrderIntakeApiRow[]; // Previous year data
    intakeYest: OrderIntakeYesterdayApiRow[]; // Yesterday data (single item array)
  };
}

// Request interfaces (simplified since we only need one API call)
export interface OrderIntakeRequest {
  // Empty body for the single API call
}

// Column mapping reference for developers
export interface ColumnMapping {
  display: string; // What we show in UI
  apiField: string; // Field name in API response
  description: string;
}

export const ORDER_INTAKE_COLUMN_MAPPING: ColumnMapping[] = [
  {
    display: "ABP",
    apiField: "amA_VALUE",
    description: "AMA (Automotive Manufacturing Asia) Value",
  },
  {
    display: "ABP EXP",
    apiField: "abP_EXPORT_VALUE",
    description: "ABP Export Value",
  },
  {
    display: "DC",
    apiField: "dC_VALUE",
    description: "DC (Distribution Center) Value",
  },
  {
    display: "DC EXP",
    apiField: "dC_EXPORT_VALUE",
    description: "DC Export Value",
  },
  {
    display: "Total",
    apiField: "total",
    description: "Total Value",
  },
  {
    display: "SCM",
    apiField: "scM_VALUE",
    description: "SCM (Supply Chain Management) Value",
  },
];

// API Response interfaces (matching actual API response)
export interface SalesSummaryApiItem {
  description: string;
  currentMonth: string;
  ytd: string;
}

export interface MonthlyBreakdownApiItem {
  month: string;
  currentYear: string;
  previousYear: string;
}

export interface SalesSummaryApiData {
  summary: SalesSummaryApiItem[];
  todaySale: string;
  monthlyBreakdown: MonthlyBreakdownApiItem[];
}

export interface SalesSummaryApiResponse {
  status_Code: number;
  status: string;
  message: string;
  data: SalesSummaryApiData;
}

// Frontend display format (clean interfaces for UI)
export interface SalesSummaryItem {
  description: string;
  currentMonth: string;
  ytd: string;
}

export interface MonthlyBreakdownItem {
  month: string;
  currentYear: string;
  previousYear: string;
}

export interface SalesResponse {
  summary: SalesSummaryItem[];
  todaySale: string;
  monthlyBreakdown: MonthlyBreakdownItem[];
}

// Request payload interface
export interface SalesRequest {
  fromDate?: string;
  toDate?: string;
  salesType?: string;
}

// Credit Limit Types
export interface CreditLimitApiRow {
  customeR_NAME: string;
  overalL_CREDIT_LIMIT: number;
  outstandainG_AMT: number;
  ordeR_INTAKE: number;
  pendinG_ORDER: number;
  credit_hold: string; // "Y" or "N"
  customeR_NUMBER: string;
}

export interface CreditLimitApiResponse {
  status_Code: number;
  status: string;
  message: string;
  data: CreditLimitApiRow[];
}

export interface CreditLimitData {
  id: string;
  companyName: string;
  creditLimit: number;
  outstanding: number;
  orderIntake: number;
  pendingOrder: number;
  creditHold: boolean;
  customerNumber: string;
}

export interface UpdateOrderIntakeRequest {
  customerNumber: string;
  orderIntake: number;
}

// Product Sales Types
export interface ProductSalesOverviewApiRow {
  product: string;
  soldQty: number;
  soldValue: number;
  pendingQty: number;
  pendingValue: number;
}

export interface ProductSalesOverviewApiTotal {
  soldQty: number;
  soldValue: number;
  pendingQty: number;
  pendingValue: number;
}

export interface ProductSalesOverviewApiData {
  data: ProductSalesOverviewApiRow[];
  total: ProductSalesOverviewApiTotal;
}

export interface ProductSalesOverviewApiResponse {
  status_Code: number;
  status: string;
  message: string;
  data: ProductSalesOverviewApiData;
}

export interface ProductSalesData {
  product: string;
  soldQty: number;
  soldValue: number;
  pendingQty: number;
  pendingValue: number;
}

export interface ProductSalesRequest {
  fromDate?: string;
  toDate?: string;
  productCategory?: string;
}

// ABP Sales Types
export interface AbpSalesOverviewApiRow {
  abpName: string;
  bookedQty: number;
  bookedValue: number;
  billedQty: number;
  billedValue: number;
  pendingQty: number;
  pendingValue: number;
}

export interface AbpSalesOverviewApiTotal {
  bookedQty: number;
  bookedValue: number;
  billedQty: number;
  billedValue: number;
  pendingQty: number;
  pendingValue: number;
}

export interface AbpSalesOverviewApiData {
  data: AbpSalesOverviewApiRow[];
  total: AbpSalesOverviewApiTotal;
}

export interface AbpSalesOverviewApiResponse {
  status_Code: number;
  status: string;
  message: string;
  data: AbpSalesOverviewApiData;
}

export interface ABPSalesData {
  abpName: string;
  bookedQty: number;
  bookedValue: number;
  billedQty: number;
  billedValue: number;
  pendingQty: number;
  pendingValue: number;
}

// Commissioning Types
export interface CommissioningDashboardApiDto {
  total: number;
  closed: number;
  pending: number;
  cancelled: number;
  today: number;
  overdue: number;
}

export interface CommissioningDetailApiDto {
  jobNo: string;
  serialNumber: string;
  qrCode: string;
  customerName: string;
  contactPerson: string;
  designation: string;
  customerEmail: string;
  customerMobile: string;
  installAddress: string;
  commissioningStart: string;
  amaName: string;
}

export interface CommissioningApiData {
  dashboard: CommissioningDashboardApiDto;
  details: CommissioningDetailApiDto[];
}

export interface CommissioningApiResponse {
  status_Code: number;
  status: string;
  message: string;
  data: CommissioningApiData;
}

export interface CommissioningDashboard {
  total: number;
  closed: number;
  pending: number;
  cancelled: number;
  today: number;
  overdue: number;
}

export interface CommissioningDetail {
  jobNo: string;
  serialNumber: string;
  qrCode: string;
  customerName: string;
  contactPerson: string;
  designation: string;
  customerEmail: string;
  customerMobile: string;
  installAddress: string;
  commissioningStart: string;
  amaName: string;
}

export interface CommissioningData {
  dashboard: CommissioningDashboard;
  details: CommissioningDetail[];
}

export type DueType = "TODAY" | "OVERDUE" | null;

export interface CommissioningDataLegacy {
  dueToday: number;
  overDue: number;
  commissioned: number;
  pending: number;
  cancelled: number;
  totalRequest: number;
}

export interface CommissioningItem {
  id: string;
  companyName: string;
  location: string;
  abpAssigned: string;
  contactPerson: string;
  designation: string;
  serialNo: string;
  qrCode: string;
  jobNo: string;
  dueDate: string;
  status: "due_today" | "over_due" | "commissioned" | "pending" | "cancelled";
}

// Order Register Types
export interface OrderRegisterApiColumn {
  index: number;
  name: string;
}

export interface OrderRegisterApiRow {
  ORDER_NUMBER: string;
  BUYER: string;
  CREATION_DATE: string;
  BOOKED_DATE: string;
  PROMISE_DATE: string;
  ORDERED_ITEM: string;
  PENDING_QUANTITY: number;
  ASSE_VALUE: number;
  ITEM_DESC: string;
}

export interface OrderRegisterApiResultSet {
  resultSetIndex: number;
  columns: OrderRegisterApiColumn[];
  rows: any[];
}

export interface OrderRegisterApiData {
  storedProcedure: string;
  totalResultSets: number;
  results: OrderRegisterApiResultSet[];
}

export interface OrderRegisterApiResponse {
  status_Code: number;
  status: string;
  message: string;
  data: OrderRegisterApiData;
}

export interface OrderData {
  orderNo: string;
  buyer: string;
  enteredOn: string;
  promiseDt: string;
  itemCode: string;
  description: string;
  qty: number;
  value: number;
}

export interface SummaryData {
  spares: number;
  mains: number;
  total?: number;
}

// Order Register Book Types
export interface OrderRegisterBookApiRow {
  orderNumber: string;
  buyer: string;
  creationDate: string;
  bookedDate: string;
  promiseDate: string;
  orderedItem: string;
  pendingQuantity: number;
  asseValue: number;
  itemDescription: string;
}

export interface OrderRegisterBookApiSummary {
  totalAsseValue: number;
  totalAmount: number;
}

export interface OrderRegisterBookApiData {
  data: OrderRegisterBookApiRow[];
  summary: OrderRegisterBookApiSummary;
}

export interface OrderRegisterBookApiResponse {
  status_Code: number;
  status: string;
  message: string;
  data: OrderRegisterBookApiData;
}

export interface OrderBookData {
  orderNo: string;
  buyer: string;
  enteredOn: string;
  promiseDt: string;
  itemCode: string;
  description: string;
  qty: number;
  value: number;
}

export interface SummaryBookData {
  spares: number;
  mains: number;
  total?: number;
}

export interface OrderRegisterBookRequest {
  fromDate?: string;
  toDate?: string;
  buyerId?: string;
  orderStatus?: string;
}

// Inventory Aging Monthly Types
export interface MonthOptionApi {
  monthDescription: string;
  monthId: number;
}

export interface InventoryAgingDataApi {
  inventoryClass: string;
  days1To180: number;
  days181To365: number;
  days366To730: number;
  days731To1095: number;
  days1096To1460: number;
  days1461Plus: number;
  total: number;
}

export interface InventoryAgingSummaryApi {
  totalDays1To180: number;
  totalDays181To365: number;
  totalDays366To730: number;
  totalDays731To1095: number;
  totalDays1096To1460: number;
  totalDays1461Plus: number;
  grandTotal: number;
  percentage1To180: number;
  percentage181To365: number;
  percentage366To730: number;
  percentage731To1095: number;
  percentage1096To1460: number;
  percentage1461Plus: number;
}

export interface InventoryAgingApiResponseData {
  agingData: InventoryAgingDataApi[];
  selectedMonth: string;
  summary: InventoryAgingSummaryApi;
  importedComponents: [];
  tracedEquipment: [];
}

export interface MonthsApiResponse {
  status_Code: number;
  status: string;
  message: string;
  data: MonthOptionApi[];
}

export interface InventoryAgingApiResponse {
  status_Code: number;
  status: string;
  message: string;
  data: InventoryAgingApiResponseData;
}

export interface MonthOption {
  monthDescription: string;
  monthId: number;
}

export interface InventoryAgingData {
  inventoryClass: string;
  days1To180: number;
  days181To365: number;
  days366To730: number;
  days731To1095: number;
  days1096To1460: number;
  days1461Plus: number;
  total: number;
}

export interface InventoryAgingSummary {
  totalDays1To180: number;
  totalDays181To365: number;
  totalDays366To730: number;
  totalDays731To1095: number;
  totalDays1096To1460: number;
  totalDays1461Plus: number;
  grandTotal: number;
  percentage1To180: number;
  percentage181To365: number;
  percentage366To730: number;
  percentage731To1095: number;
  percentage1096To1460: number;
  percentage1461Plus: number;
}

export interface InventoryAgingResponse {
  agingData: InventoryAgingData[];
  selectedMonth: string;
  summary: InventoryAgingSummary;
  importedComponents: ImportedComponentItem[];
  importedTradedComponents: ImportedComponentItem[];
  bottomTotals: BottomTotals;
}

// export interface ImportedComponentItem {
//   subClass: string;
//   total: string;
// }

// export interface BottomTotals {
//   khopoli: string;
//   mfg: string;
//   pune: string;
//   mfg84: string;
// }

export interface MonthsResponse {
  months: MonthOption[];
}

// Debtors Aging Types
export interface DebtorsAgingApiData {
  sNo: number;
  customerAccount: string;
  customerName: string;
  customerType: string;
  balance: number;
  notDue: number;
  days0To30: number;
  days31To60: number;
  days61To90: number;
  days91To120: number;
  days121To180: number;
  days181To365: number;
  days366To730: number;
  days731To1095: number;
  above1095: number;
}

export interface DebtorsAgingSummaryApi {
  totalBalance: number;
  totalNotDue: number;
  totalDays0To30: number;
  totalDays31To60: number;
  totalDays61To90: number;
  totalDays91To120: number;
  totalDays121To180: number;
  totalDays181To365: number;
  totalDays366To730: number;
  totalDays731To1095: number;
  totalAbove1095: number;
}

export interface CustomerTypeApi {
  type: string;
  label: string;
  color: string;
  icon: string;
}

export interface DebtorsAgingApiResponseData {
  data: DebtorsAgingApiData[];
  summary: DebtorsAgingSummaryApi;
  selectedType: string;
}

export interface CustomerTypesApiResponseData {
  customerTypes: CustomerTypeApi[];
}

export interface DebtorsAgingApiResponse {
  status_Code: number;
  status: string;
  message: string;
  data: DebtorsAgingApiResponseData;
}

export interface CustomerTypesApiResponse {
  status_Code: number;
  status: string;
  message: string;
  data: CustomerTypesApiResponseData;
}

export interface DebtorsAgingData {
  sNo: number;
  customerAccount: string;
  customerName: string;
  customerType: string;
  balance: number;
  notDue: number;
  days0To30: number;
  days31To60: number;
  days61To90: number;
  days91To120: number;
  days121To180: number;
  days181To365: number;
  days365To730: number;
  days731To1095: number;
  above1095: number;
}

export interface DebtorsAgingSummary {
  totalBalance: number;
  totalNotDue: number;
  totalDays0To30: number;
  totalDays31To60: number;
  totalDays61To90: number;
  totalDays91To120: number;
  totalDays121To180: number;
  totalDays181To365: number;
  totalDays365To730: number;
  totalDays731To1095: number;
  totalAbove1095: number;
}

export interface DebtorsAgingResponse {
  data: DebtorsAgingData[];
  summary: DebtorsAgingSummary;
  selectedType: string;
}

export interface CustomerTypeTab {
  type: string;
  label: string;
  color: string;
  icon: string;
}

export interface CustomerTypesResponse {
  customerTypes: CustomerTypeTab[];
}

// ========== INVENTORY AGING (AS ON DATE) TYPES - UPDATED ==========

// Imported Components / Traded Equipment item
export interface ImportedComponentApiItem {
  inV_SUB_CLASS: string;
  cTotal: number;
}

export interface ImportedComponentItem {
  subClass: string;
  total: string;
}

// Bottom totals
export interface BottomTotalsApi {
  khopoli: number;
  mfg: number;
  pune: number;
  mfg_84: number;
}

export interface BottomTotals {
  khopoli: string;
  mfg: string;
  pune: string;
  mfg_84: string;
}

// Detailed aging data row (API format)
export interface InventoryDateApiRow {
  inventoryClass: string;
  inventorySubClass: string;
  invIdFlag: string;
  organizationId: number;
  days1To180: string | number;
  days181To365: string | number;
  days366To540: string | number;
  days541To730: string | number;
  days731To1095: string | number;
  days1096To1460: string | number;
  days1461To1825: string | number;
  days1826To2190: string | number;
  days2191To2555: string | number;
  days2555Plus: string | number;
  total: string | number;
}

// API response data structure
export interface InventoryDateApiData {
  importedComponents: ImportedComponentApiItem[];
  importedTradedComponents: ImportedComponentApiItem[];
  bottomTotals: BottomTotalsApi;
  detailedAgingData: InventoryDateApiRow[];
}

// Complete API response structure
export interface InventoryDateApiResponse {
  status_Code: number;
  status: string;
  message: string;
  data: InventoryDateApiData;
}

// Frontend display format (detailed aging data)
export interface InventoryDateItem {
  inventoryClass: string;
  days1To180: string;
  days181To365: string;
  days366To540: string;
  days541To730: string;
  days731To1095: string;
  days1096To1460: string;
  days1461To1825: string;
  days1826To2190: string;
  days2191To2555: string;
  days2555Plus: string;
  total: string;
}

// Complete frontend response
export interface InventoryDateResponse {
  detailedAgingData: InventoryDateItem[];
  importedComponents: ImportedComponentItem[];
  importedTradedComponents: ImportedComponentItem[];
  bottomTotals: BottomTotals;
}

// Request interface (empty body for this endpoint)
export interface InventoryDateRequest {
  // Empty body - endpoint doesn't require parameters
}

// ========== PIN VALIDATION TYPES ==========
export interface PinValidationRequest {
  pin: number;
}

export interface PinValidationApiResponse {
  status_Code: number;
  status: string;
  message: string;
  data: boolean;
}

export interface PinValidationResponse {
  isValid: boolean;
  message: string;
}

// ========== SEARCH PASSWORDS TYPES ==========
export interface SearchPasswordsRequest {
  type: string;
  searchValue: string;
}

export interface SearchPasswordsApiResponse {
  status_Code: number;
  status: string;
  message: string;
  data: {
    asset_Id: any;
    serialno: any;
    admin_Pass: string;
    av_Valid_Admin_Pwd: string;
    av_Valid_Lock_Pwd: string;
    addln_Pwd_Id: number;
    short_Desc: string;
    siteurl: string;
    addln_Pwd: string;
    addln_User: string;
    empid: number;
    empname: string;
    code?: string;
    adminPass?: string;
    avAdminPass?: string;
    avLockPass?: string;
    username?: string;
    url?: string;
    pass?: string;
  }[];
}

export interface AssetMasterData {
  empId: number;
  empName: string;
  code: string;
  adminPassword: string;
  avAdminPassword: string;
  avLockPassword: string;
}

export interface AdditionalPasswordData {
  empId: number;
  empName: string;
  username: string;
  url: string;
  password: string;
}

export interface SearchPasswordsResponse {
  type: "assetMaster" | "additionalPassword";
  data: AssetMasterData[] | AdditionalPasswordData[];
}

// ========== UPDATE PASSWORD TYPES ==========
export interface UpdatePasswordRequest {
  type: number;
  password: string;
  recordId: number;
}

export interface UpdatePasswordApiResponse {
  status_Code: number;
  status: string;
  message: string;
}

export interface UpdatePasswordResponse {
  success: boolean;
  message: string;
}

// ========== MIS TYPES ==========
export interface DropdownOption {
  id: string;
  name: string;
}

export interface DropdownApiResponse {
  status_Code?: number;
  status?: string;
  message?: string;
  data: DropdownOption[];
}

export interface GetAbpPartnersRequest {
  region: string;
  salesRep: string;
}

// export interface MisPerformanceDataWrapper {
//   data: MisPerformanceRow[];
//   total: MisPerformanceRow;
// }

// Budget Years API Response
export type BudgetYearResponse = {
  status_Code: number;
  status: string;
  message: string;
  data: {
    id: number;
    name: string;
  }[];
};

// Budget Months API Response
export type BudgetMonthResponse = {
  status_Code: number;
  status: string;
  message: string;
  data: {
    value: string;
    name: string;
  }[];
};

export interface BudgetMISPayload {
  start: string;
  end: string;
  start_c: string;
  lStart: string;
  lEnd: string;
  lStart_c: string;
  l2Start: string | null;
  l2End: string | null;
  l2Start_c: string | null;
  l3Start: string | null;
  l3End: string | null;
  l3Start_c: string | null;
  l4Start: string | null;
  l4End: string | null;
  l4Start_c: string | null;
  l5Start: string | null;
  l5End: string | null;
  l5Start_c: string | null;
  market: "DOM" | "EXP" | "BOTH";
  dataMode: "S" | "O";
  last5Years: boolean;
  budgetYearIndex: number;
  region: string | null;
  salesRep: string | null;
  partyNo: string | null;
  activeStatus: "A" | "I" | "B";
  achievement: string;
  viewMode: "ABP" | "Product";
}

// ── ABP-wise response ─────────────────────────────────────────────────────────
export interface ABPDetailRow {
  amaName: string;
  partyNo: string;
  abpStatus: string;
  lastYear: string;
  current: string;
  lastYear2: string | null;
  lastYear3: string | null;
  lastYear4: string | null;
  lastYear5: string | null;
  growth: number;
  budget: string;
  variance: string;
  achievement: number;
  cValue: number;
}

export interface ABPWiseData {
  abpDetails: ABPDetailRow[];
  abpTotal: ABPDetailRow;
  dcTotal: ABPDetailRow;
  combinedTotal: ABPDetailRow; // ← NEW: Total (ABP + DC) from API
}

export interface ABPWiseResponse {
  status_Code: number;
  status: string;
  message: string;
  data: ABPWiseData;
}

// ── Product-wise response ──────────────────────────────────────────────────────
export interface ProductSummaryRow {
  product: string;
  lY_Qty: number;
  cY_Qty: number;
  l2_Qty: number | null;
  l3_Qty: number | null;
  l4_Qty: number | null;
  l5_Qty: number | null;
  budget_Qty: number;
  variance_Qty: number;
  growth_Qty: number;
  achievement_Qty: number;
  lY_Value: string;
  cY_Value: string;
  l2_Value: string | null;
  l3_Value: string | null;
  l4_Value: string | null;
  l5_Value: string | null;
  budget_Value: string;
  variance_Value: string;
  growth_Value: number;
  achievement_Value: number;
  mtL_Cost: string;
  margin: number;
}

export interface ModelDetailRow extends ProductSummaryRow {
  models: string;
}

/**
 * Shared shape for abpTotal, dcTotal and combinedTotal rows
 * inside the /GetBudgetMIS_Product response.
 * Uses `rowType` (e.g. "Total (ABP)", "Total (DC)", "Total (ABP + DC)")
 * instead of `product`/`models`.
 * `margin` is optional — present on abpTotal, absent on dcTotal/combinedTotal.
 */
export interface ProductTotalRow {
  rowType: string;
  lY_Qty: number;
  cY_Qty: number;
  l2_Qty: number | null;
  l3_Qty: number | null;
  l4_Qty: number | null;
  l5_Qty: number | null;
  budget_Qty: number;
  variance_Qty: number;
  growth_Qty: number;
  achievement_Qty: number;
  lY_Value: string;
  cY_Value: string;
  l2_Value: string | null;
  l3_Value: string | null;
  l4_Value: string | null;
  l5_Value: string | null;
  budget_Value: string;
  variance_Value: string;
  growth_Value: number;
  achievement_Value: number;
  mtL_Cost: string;
  margin?: number; // optional
}

export interface ProductWiseData {
  productSummary: ProductSummaryRow[];
  modelDetails: ModelDetailRow[];
  abpTotal: ProductTotalRow; // ← NEW: replaces client-side sum
  dcTotal: ProductTotalRow; // ← updated shape (rowType + full qty/value)
  combinedTotal: ProductTotalRow; // ← NEW: Total (ABP + DC) from API
}

export interface ProductWiseResponse {
  status_Code: number;
  status: string;
  message: string;
  data: ProductWiseData;
}

export type ABPDataRow = {
  abP_Name: string;
  party_No: string;
  abP_Status: string;
  lastYear?: string;
  current?: string;
  growth?: number;
  budget?: string;
  variance?: string;
  achievement?: number;
  year5?: string;
  year4?: string;
  year3?: string;
  year2?: string;
  lastYear_Value?: number;
  current_Value?: number;
  budget_Value?: number;
  year5_Value?: number;
  year4_Value?: number;
  year3_Value?: number;
  year2_Value?: number;
  [key: string]: any;
};

export type TotalRow = {
  label: string;
  lastYear?: string;
  current?: string;
  growth?: number;
  budget?: string;
  variance?: string;
  achievement?: number;
  year5?: string;
  year4?: string;
  year3?: string;
  year2?: string;
  lastYear_Value?: number;
  current_Value?: number;
  budget_Value?: number;
  year5_Value?: number;
  year4_Value?: number;
  year3_Value?: number;
  year2_Value?: number;
  [key: string]: any;
};

// API Error Response
export interface ApiErrorResponse {
  message: string;
  error?: string;
}

// login and menu

// ---- Indef App Auth types ----

export interface ApiResponseWrapper<T> {
  status_Code: number;
  status: string;
  message: string;
  data: T;
}

export interface MenuAccessItem {
  menuId: number;
  key: string;
  title: string;
  route: string | null;
  icon: string | null;
}

export interface RegisterResponseData {
  userId: number;
  email: string;
  status: string; // "pending" | "active"
}

export interface OrgAccessItem {
  orgId: number;
  code: string; // 'IML' | 'CSIL' | 'DAEDALUS'
  name: string;
}

// update these two existing interfaces to add orgAccess:
export interface LoginResponseData {
  userId: number;
  email: string;
  orgAccess: OrgAccessItem[];
}

export interface CheckDeviceResponseData {
  userId: number;
  email: string;
  orgAccess: OrgAccessItem[];
}

export interface MenuAccessResponseData {
  menuAccess: MenuAccessItem[];
}
