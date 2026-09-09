import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import ExcelJS from "exceljs";
import {
  buildComputersWorksheet,
  buildComponentsWorksheet,
  buildPurchasesWorksheet,
  buildEmployeesWorksheet,
  buildPrintersWorksheet,
} from "@/lib/excel";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const scope = searchParams.get("scope") || "all";

    const workbook = new ExcelJS.Workbook();
    workbook.creator = "IT Asset Management System";
    workbook.lastModifiedBy = session.user.email || "IT Admin";
    workbook.created = new Date();
    workbook.modified = new Date();

    const timestamp = new Date().toISOString().split("T")[0];
    let filename = `it-inventory-full-${timestamp}.xlsx`;

    if (scope === "all") {
      // Sequential queries to avoid exhausting PgBouncer pooler connections
      const devices = await db.device.findMany({
        include: {
          components: true,
          assignments: {
            include: { employee: true },
            orderBy: { assignedAt: "desc" },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      const components = await db.component.findMany({
        include: {
          device: {
            include: {
              assignments: {
                include: { employee: true },
                orderBy: { assignedAt: "desc" },
              },
            },
          },
          purchaseItem: {
            include: { purchase: true },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      const purchases = await db.purchase.findMany({
        include: {
          items: {
            include: { components: true },
          },
        },
        orderBy: { purchaseDate: "desc" },
      });

      const employees = await db.employee.findMany({
        include: {
          assignments: {
            include: {
              device: {
                include: { components: true },
              },
            },
            orderBy: { assignedAt: "desc" },
          },
          user: true,
        },
        orderBy: { name: "asc" },
      });

      const printers = await db.printer.findMany({
        include: {
          inkRefills: {
            orderBy: { refillDate: "desc" },
          },
        },
        orderBy: { brand: "asc" },
      });

      buildComputersWorksheet(workbook, devices);
      buildComponentsWorksheet(workbook, components);
      buildPurchasesWorksheet(workbook, purchases);
      buildEmployeesWorksheet(workbook, employees);
      buildPrintersWorksheet(workbook, printers);

      filename = `it-assets-full-export-${timestamp}.xlsx`;
    } else if (scope === "devices") {
      const devices = await db.device.findMany({
        include: {
          components: true,
          assignments: {
            include: { employee: true },
            orderBy: { assignedAt: "desc" },
          },
        },
        orderBy: { createdAt: "desc" },
      });
      buildComputersWorksheet(workbook, devices);
      filename = `computers-workstations-${timestamp}.xlsx`;
    } else if (scope === "components") {
      const components = await db.component.findMany({
        include: {
          device: {
            include: {
              assignments: {
                include: { employee: true },
                orderBy: { assignedAt: "desc" },
              },
            },
          },
          purchaseItem: {
            include: { purchase: true },
          },
        },
        orderBy: { createdAt: "desc" },
      });
      buildComponentsWorksheet(workbook, components);
      filename = `components-inventory-${timestamp}.xlsx`;
    } else if (scope === "purchases") {
      const purchases = await db.purchase.findMany({
        include: {
          items: {
            include: { components: true },
          },
        },
        orderBy: { purchaseDate: "desc" },
      });
      buildPurchasesWorksheet(workbook, purchases);
      filename = `procurement-expenses-${timestamp}.xlsx`;
    } else if (scope === "employees") {
      const employees = await db.employee.findMany({
        include: {
          assignments: {
            include: {
              device: {
                include: { components: true },
              },
            },
            orderBy: { assignedAt: "desc" },
          },
          user: true,
        },
        orderBy: { name: "asc" },
      });
      buildEmployeesWorksheet(workbook, employees);
      filename = `staff-custody-directory-${timestamp}.xlsx`;
    } else if (scope === "printers") {
      const printers = await db.printer.findMany({
        include: {
          inkRefills: {
            orderBy: { refillDate: "desc" },
          },
        },
        orderBy: { brand: "asc" },
      });
      buildPrintersWorksheet(workbook, printers);
      filename = `network-printers-${timestamp}.xlsx`;
    } else {
      return new NextResponse("Invalid export scope", { status: 400 });
    }

    const buffer = await workbook.xlsx.writeBuffer();

    return new NextResponse(buffer as any, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store, max-age=0",
      },
    });
  } catch (error: any) {
    console.error("Export error:", error);
    return new NextResponse(`Export failed: ${error.message || "Internal server error"}`, {
      status: 500,
    });
  }
}
