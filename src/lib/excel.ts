import ExcelJS from "exceljs";
import { computeDeviceLiveSpecs } from "./hardware";
import { COMPONENT_TYPES, DEVICE_TYPES, PURCHASE_CATEGORY_DEFINITIONS } from "./constants";

/**
 * Applies consistent, high-contrast corporate styling to an ExcelJS worksheet:
 * - Header row: Slate-800 (#1E293B) solid fill, bold white text, height 26, centered
 * - Data rows: alternating zebra striping (#F8FAFC), thin slate borders, height 20
 * - Auto-calculated column widths based on maximum content length + padding
 */
export function applyWorksheetStyling(worksheet: ExcelJS.Worksheet) {
  // 1. Style Header Row
  const headerRow = worksheet.getRow(1);
  headerRow.height = 26;
  headerRow.font = {
    name: "Calibri",
    size: 11,
    bold: true,
    color: { argb: "FFFFFFFF" },
  };
  headerRow.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF1E293B" }, // Slate-800
  };
  headerRow.alignment = {
    vertical: "middle",
    horizontal: "center",
    wrapText: false,
  };

  // 2. Style Data Rows (Zebra striping and borders)
  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber > 1) {
      row.height = 20;
      row.font = { name: "Calibri", size: 10 };
      row.alignment = { vertical: "middle" };

      // Alternating row background
      if (rowNumber % 2 === 0) {
        row.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFF8FAFC" }, // Slate-50
        };
      }

      // Thin borders for grid structure
      row.eachCell((cell) => {
        cell.border = {
          top: { style: "thin", color: { argb: "FFE2E8F0" } },
          left: { style: "thin", color: { argb: "FFE2E8F0" } },
          bottom: { style: "thin", color: { argb: "FFE2E8F0" } },
          right: { style: "thin", color: { argb: "FFE2E8F0" } },
        };
      });
    }
  });

  // 3. Auto-fit Column Widths
  worksheet.columns.forEach((column) => {
    let maxLength = 0;
    column.eachCell?.({ includeEmpty: true }, (cell) => {
      const cellValue = cell.value !== undefined && cell.value !== null ? cell.value.toString() : "";
      maxLength = Math.max(maxLength, cellValue.length);
    });
    column.width = Math.max(maxLength + 4, 12);
  });
}

/**
 * Tab 1: Computers & Workstations
 */
export function buildComputersWorksheet(workbook: ExcelJS.Workbook, devices: any[]) {
  const sheet = workbook.addWorksheet("Computers & Workstations");

  sheet.columns = [
    { header: "Device Type", key: "deviceType" },
    { header: "Brand", key: "brand" },
    { header: "Model", key: "model" },
    { header: "Serial Number", key: "serialNumber" },
    { header: "Processor (CPU)", key: "cpu" },
    { header: "Total RAM", key: "ram" },
    { header: "Total Storage", key: "storage" },
    { header: "Status", key: "status" },
    { header: "Mounted Parts", key: "componentsCount" },
    { header: "Assigned Custodian", key: "custodianName" },
    { header: "Custodian Email", key: "custodianEmail" },
    { header: "Department", key: "custodianDept" },
    { header: "Assigned Date", key: "assignedDate" },
    { header: "Purchase Date", key: "purchaseDate" },
    { header: "Warranty Expiry", key: "warrantyExpiry" },
  ];

  devices.forEach((d) => {
    const liveSpecs = computeDeviceLiveSpecs(d);
    const activeAssignment = d.assignments?.find((a: any) => a.unassignedAt === null) || d.assignments?.[0];
    const employee = activeAssignment?.employee;
    const typeLabel = (DEVICE_TYPES as any)[d.deviceType]?.label || d.deviceType;

    sheet.addRow({
      deviceType: typeLabel,
      brand: d.brand,
      model: d.model,
      serialNumber: d.serialNumber,
      cpu: d.cpu || "N/A",
      ram: liveSpecs.ramSummary && liveSpecs.ramSummary !== "Modular / None" ? liveSpecs.ramSummary : d.ram || "Modular",
      storage: liveSpecs.storageSummary && liveSpecs.storageSummary !== "Modular / None" ? liveSpecs.storageSummary : d.storage || "Modular",
      status: d.status,
      componentsCount: d.components?.length || 0,
      custodianName: employee ? employee.name : "Unassigned",
      custodianEmail: employee ? employee.email : "—",
      custodianDept: employee ? employee.department : "—",
      assignedDate: activeAssignment?.assignedAt ? new Date(activeAssignment.assignedAt).toISOString().split("T")[0] : "—",
      purchaseDate: d.purchaseDate ? new Date(d.purchaseDate).toISOString().split("T")[0] : "—",
      warrantyExpiry: d.warrantyExpiry ? new Date(d.warrantyExpiry).toISOString().split("T")[0] : "—",
    });
  });

  applyWorksheetStyling(sheet);
  return sheet;
}

/**
 * Tab 2: Components & Spare Parts
 */
export function buildComponentsWorksheet(workbook: ExcelJS.Workbook, components: any[]) {
  const sheet = workbook.addWorksheet("Components & Spare Parts");

  sheet.columns = [
    { header: "Category", key: "category" },
    { header: "Brand", key: "brand" },
    { header: "Model", key: "model" },
    { header: "Capacity", key: "capacity" },
    { header: "Technical Specs", key: "specs" },
    { header: "Serial Number", key: "serialNumber" },
    { header: "Status", key: "status" },
    { header: "Current Placement", key: "placement" },
    { header: "Host Computer Serial", key: "hostSerial" },
    { header: "Current Custodian", key: "custodianName" },
    { header: "Custodian Department", key: "custodianDept" },
    { header: "Purchase Price (EGP)", key: "purchasePrice" },
    { header: "Linked Receipt", key: "receiptTitle" },
    { header: "Registered Date", key: "createdAt" },
  ];

  components.forEach((c) => {
    const typeDef = (COMPONENT_TYPES as any)[c.type];
    const categoryLabel = typeDef?.label || c.type;
    const activeAssignment = c.device?.assignments?.find((a: any) => a.unassignedAt === null) || c.device?.assignments?.[0];
    const employee = activeAssignment?.employee;

    let placement = "IT Storage Shelf";
    let hostSerial = "—";
    if (c.device) {
      placement = `Mounted in ${c.device.brand} ${c.device.model}`;
      hostSerial = c.device.serialNumber;
    } else if (c.status === "DEFECTIVE") {
      placement = "Quarantine / Defective Bin";
    }

    sheet.addRow({
      category: categoryLabel,
      brand: c.brand,
      model: c.model,
      capacity: c.capacity || "—",
      specs: c.specs || "—",
      serialNumber: c.serialNumber,
      status: c.status,
      placement,
      hostSerial,
      custodianName: employee ? employee.name : c.device ? "Machine Unassigned" : "In IT Custody",
      custodianDept: employee ? employee.department : "IT Department",
      purchasePrice: c.purchasePrice ? Number(c.purchasePrice) : 0,
      receiptTitle: c.purchaseItem?.purchase?.title || c.purchaseItem?.purchase?.vendor || "—",
      createdAt: c.createdAt ? new Date(c.createdAt).toISOString().split("T")[0] : "—",
    });
  });

  // Format currency column as numbers
  sheet.getColumn("purchasePrice").numFmt = '#,##0.00 "EGP"';

  applyWorksheetStyling(sheet);
  return sheet;
}

/**
 * Tab 3: Purchases & Expenses
 */
export function buildPurchasesWorksheet(workbook: ExcelJS.Workbook, purchases: any[]) {
  const sheet = workbook.addWorksheet("Purchases & Expenses");

  sheet.columns = [
    { header: "Purchase Date", key: "purchaseDate" },
    { header: "Vendor / Supplier", key: "vendor" },
    { header: "Invoice Number", key: "invoiceNumber" },
    { header: "Receipt Title", key: "title" },
    { header: "Category", key: "category" },
    { header: "Item Description", key: "itemName" },
    { header: "Tracking Mode", key: "trackingMode" },
    { header: "Unit Price (EGP)", key: "unitPrice" },
    { header: "Quantity", key: "quantity" },
    { header: "Line Total (EGP)", key: "totalPrice" },
    { header: "Invoice Total (EGP)", key: "invoiceTotal" },
    { header: "Purchased By", key: "purchasedBy" },
    { header: "Stocked in Inventory", key: "isStocked" },
    { header: "Notes", key: "notes" },
  ];

  purchases.forEach((p) => {
    const formattedDate = p.purchaseDate ? new Date(p.purchaseDate).toISOString().split("T")[0] : "—";

    if (!p.items || p.items.length === 0) {
      sheet.addRow({
        purchaseDate: formattedDate,
        vendor: p.vendor,
        invoiceNumber: p.invoiceNumber || "—",
        title: p.title || "—",
        category: "—",
        itemName: "No items listed",
        trackingMode: "—",
        unitPrice: 0,
        quantity: 0,
        totalPrice: 0,
        invoiceTotal: Number(p.totalAmount) || 0,
        purchasedBy: p.purchasedBy,
        isStocked: "—",
        notes: p.notes || "—",
      });
    } else {
      p.items.forEach((item: any, idx: number) => {
        const catDef = (PURCHASE_CATEGORY_DEFINITIONS as any)[item.category];
        const categoryLabel = catDef?.label || item.category;
        const isStocked = item.components && item.components.length > 0 ? "Yes (In Stock)" : item.isTracked ? "Pending Stock" : "N/A (Untracked)";

        sheet.addRow({
          purchaseDate: formattedDate,
          vendor: p.vendor,
          invoiceNumber: p.invoiceNumber || "—",
          title: p.title || "—",
          category: categoryLabel,
          itemName: item.name,
          trackingMode: item.isTracked ? "Tracked Hardware Asset" : "Expense Proof Consumable",
          unitPrice: Number(item.unitPrice) || 0,
          quantity: item.quantity,
          totalPrice: Number(item.totalPrice) || 0,
          invoiceTotal: idx === 0 ? Number(p.totalAmount) || 0 : "", // Only display grand total on first item line
          purchasedBy: p.purchasedBy,
          isStocked,
          notes: item.notes || p.notes || "—",
        });
      });
    }
  });

  sheet.getColumn("unitPrice").numFmt = '#,##0.00 "EGP"';
  sheet.getColumn("totalPrice").numFmt = '#,##0.00 "EGP"';
  sheet.getColumn("invoiceTotal").numFmt = '#,##0.00 "EGP"';

  applyWorksheetStyling(sheet);
  return sheet;
}

/**
 * Tab 4: Staff Directory & Custody
 */
export function buildEmployeesWorksheet(workbook: ExcelJS.Workbook, employees: any[]) {
  const sheet = workbook.addWorksheet("Staff & Hardware Custody");

  sheet.columns = [
    { header: "Employee Name", key: "name" },
    { header: "Email Address", key: "email" },
    { header: "Department", key: "department" },
    { header: "Assigned Computer", key: "computerName" },
    { header: "Computer Serial", key: "computerSerial" },
    { header: "Device Type", key: "deviceType" },
    { header: "Assignment Date", key: "assignedDate" },
    { header: "Mounted Parts in Custody", key: "partsList" },
    { header: "Total Parts Count", key: "partsCount" },
    { header: "Linked User Role", key: "userRole" },
  ];

  employees.forEach((emp) => {
    const activeAssignment = emp.assignments?.find((a: any) => a.unassignedAt === null) || emp.assignments?.[0];
    const device = activeAssignment?.device;

    const parts = device?.components?.map((c: any) => {
      const typeDef = (COMPONENT_TYPES as any)[c.type];
      return `${typeDef?.shortLabel || c.type}: ${c.brand} ${c.model}${c.capacity ? ` (${c.capacity})` : ""}`;
    }) || [];

    sheet.addRow({
      name: emp.name,
      email: emp.email,
      department: emp.department,
      computerName: device ? `${device.brand} ${device.model}` : "None (No PC assigned)",
      computerSerial: device ? device.serialNumber : "—",
      deviceType: device ? (DEVICE_TYPES as any)[device.deviceType]?.label || device.deviceType : "—",
      assignedDate: activeAssignment?.assignedAt ? new Date(activeAssignment.assignedAt).toISOString().split("T")[0] : "—",
      partsList: parts.length > 0 ? parts.join("; ") : "None",
      partsCount: parts.length,
      userRole: emp.user?.role || "Standard Employee",
    });
  });

  applyWorksheetStyling(sheet);
  return sheet;
}

/**
 * Tab 5: Network Printers
 */
export function buildPrintersWorksheet(workbook: ExcelJS.Workbook, printers: any[]) {
  const sheet = workbook.addWorksheet("Network Printers");

  sheet.columns = [
    { header: "Brand", key: "brand" },
    { header: "Model", key: "model" },
    { header: "Serial Number", key: "serialNumber" },
    { header: "Office Location", key: "location" },
    { header: "IP Address", key: "ipAddress" },
    { header: "MAC Address", key: "macAddress" },
    { header: "Connection Type", key: "connectionType" },
    { header: "Status", key: "status" },
    { header: "Color Printing", key: "colorSupport" },
    { header: "Duplex Printing", key: "duplexSupport" },
    { header: "Last Ink Refill Date", key: "lastRefillDate" },
    { header: "Total Refills Logged", key: "refillsCount" },
  ];

  printers.forEach((p) => {
    sheet.addRow({
      brand: p.brand,
      model: p.model,
      serialNumber: p.serialNumber,
      location: p.location,
      ipAddress: p.ipAddress || "—",
      macAddress: p.macAddress || "—",
      connectionType: p.connectionType || "NETWORK",
      status: p.status === "WORKING" ? "Working" : "In Repair",
      colorSupport: p.colorSupport ? "Yes" : "Monochrome Only",
      duplexSupport: p.duplexSupport ? "Yes (Two-sided)" : "Single-sided",
      lastRefillDate: p.lastRefillDate ? new Date(p.lastRefillDate).toISOString().split("T")[0] : "No refills logged",
      refillsCount: p.inkRefills?.length || 0,
    });
  });

  applyWorksheetStyling(sheet);
  return sheet;
}

/**
 * Tab 6: Network Infrastructure & Cabling
 */
export function buildNetworkWorksheet(workbook: ExcelJS.Workbook, networkDevices: any[]) {
  const sheet = workbook.addWorksheet("Network & Cabling");

  sheet.columns = [
    { header: "Switch / Router", key: "deviceName" },
    { header: "Hardware Role", key: "deviceType" },
    { header: "Brand & Model", key: "deviceModel" },
    { header: "Management IP", key: "ipAddress" },
    { header: "Switch Port", key: "port" },
    { header: "Port Label", key: "portLabel" },
    { header: "Target Type", key: "targetType" },
    { header: "Connected Target Name", key: "targetName" },
    { header: "Cable Type", key: "cableType" },
    { header: "Link Speed", key: "speed" },
    { header: "Cable Color", key: "cableColor" },
    { header: "VLAN", key: "vlan" },
    { header: "Wall Outlet Plate", key: "wallOutlet" },
    { header: "Notes", key: "notes" },
  ];

  networkDevices.forEach((dev) => {
    (dev.outgoingConnections || []).forEach((conn: any) => {
      const isUplink = !!conn.targetNetworkDeviceId;
      const isComputer = !!conn.targetDeviceId;
      const isPrinter = !!conn.targetPrinterId;

      const targetType = isUplink
        ? "Switch Trunk / Uplink"
        : isComputer
        ? "Workstation PC"
        : isPrinter
        ? "Network Printer"
        : conn.endpointType || "Wall Jack / Other";

      const targetName = isUplink
        ? `${conn.targetNetworkDevice?.name || "Switch"} (Port ${conn.targetNetworkPort || "?"})`
        : isComputer
        ? `${conn.targetDevice?.brand || ""} ${conn.targetDevice?.model || ""}`.trim()
        : isPrinter
        ? `${conn.targetPrinter?.brand || ""} ${conn.targetPrinter?.model || ""}`.trim()
        : conn.endpointName || "—";

      sheet.addRow({
        deviceName: dev.name,
        deviceType: dev.deviceType,
        deviceModel: `${dev.brand} ${dev.model}`,
        ipAddress: dev.ipAddress || "—",
        port: `Port ${conn.fromPort}`,
        portLabel: conn.fromPortLabel || `Port ${conn.fromPort}`,
        targetType,
        targetName,
        cableType: conn.cableType,
        speed: conn.speed,
        cableColor: conn.cableColor || "Standard",
        vlan: conn.vlan || "Default (1)",
        wallOutlet: conn.wallOutlet || "Direct",
        notes: conn.notes || "—",
      });
    });
  });

  applyWorksheetStyling(sheet);
  return sheet;
}

