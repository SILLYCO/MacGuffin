"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Search, Plus, Filter, Users, Eye, Laptop, ChevronRight } from "lucide-react";
import { DEPARTMENT_OPTIONS } from "@/lib/constants";
import { ExportExcelButton } from "@/components/ui/ExportExcelButton";

interface EmployeeItem {
  id: string;
  name: string;
  email: string;
  department: string;
  currentAssignment?: {
    device: {
      id: string;
      brand: string;
      model: string;
      serialNumber: string;
    };
  } | null;
}

interface EmployeeTableProps {
  employees: EmployeeItem[];
  userRole: string;
}

export function EmployeeTable({ employees, userRole }: EmployeeTableProps) {
  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState<string>("ALL");

  const isIT = userRole === "IT";

  const filteredEmployees = employees.filter((emp) => {
    const searchLower = search.toLowerCase();
    const device = emp.currentAssignment?.device;

    const matchesSearch =
      emp.name.toLowerCase().includes(searchLower) ||
      emp.email.toLowerCase().includes(searchLower) ||
      emp.department.toLowerCase().includes(searchLower) ||
      (device &&
        (`${device.brand} ${device.model} ${device.serialNumber}`)
          .toLowerCase()
          .includes(searchLower));

    const matchesDept = deptFilter === "ALL" || emp.department === deptFilter;

    return matchesSearch && matchesDept;
  });

  return (
    <div className="space-y-6">
      {/* Header controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Company Employees</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Directory of employees and their currently assigned laptop devices
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <ExportExcelButton scope="employees" label="Export (.xlsx)" />
          {isIT && (
            <Link
              href="/employees/new"
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground font-medium text-sm shadow-sm hover:bg-primary/90 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add New Employee
            </Link>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-card p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by name, email, department, or device..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
            <Filter className="w-3.5 h-3.5" />
            Department:
          </div>

          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="px-3 py-2 text-sm bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="ALL">All Departments</option>
            {DEPARTMENT_OPTIONS.map((dept) => (
              <option key={dept} value={dept}>
                {dept}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Employees Table */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/50 border-b border-border text-xs uppercase font-semibold text-muted-foreground tracking-wider">
              <tr>
                <th className="px-6 py-3.5">Employee</th>
                <th className="px-6 py-3.5">Department</th>
                <th className="px-6 py-3.5">Assigned Device</th>
                <th className="px-6 py-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-muted-foreground">
                    <Users className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    No employees match your search criteria.
                  </td>
                </tr>
              ) : (
                filteredEmployees.map((emp) => {
                  const device = emp.currentAssignment?.device;
                  return (
                    <tr
                      key={emp.id}
                      className="hover:bg-muted/40 transition-colors group"
                    >
                      <td className="px-6 py-4">
                        <div className="font-semibold text-foreground">{emp.name}</div>
                        <div className="text-xs text-muted-foreground">{emp.email}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex px-2.5 py-1 text-xs font-semibold rounded-md bg-secondary text-secondary-foreground">
                          {emp.department}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {device ? (
                          <Link
                            href={`/devices/${device.id}`}
                            className="inline-flex items-center gap-2 font-medium text-primary hover:underline"
                          >
                            <Laptop className="w-4 h-4 text-primary shrink-0" />
                            <span>
                              {device.brand} {device.model}
                            </span>
                            <span className="font-mono text-xs text-muted-foreground">
                              ({device.serialNumber})
                            </span>
                          </Link>
                        ) : (
                          <span className="text-xs text-muted-foreground italic">
                            No active laptop
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link
                          href={`/employees/${emp.id}`}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-primary bg-primary/10 rounded-md hover:bg-primary/20 transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          View Profile
                          <ChevronRight className="w-3 h-3 ml-0.5 opacity-60" />
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="p-4 border-t border-border/60 bg-muted/20 text-xs text-muted-foreground flex justify-between items-center">
          <span>
            Showing <strong>{filteredEmployees.length}</strong> of <strong>{employees.length}</strong> employees
          </span>
        </div>
      </div>
    </div>
  );
}
