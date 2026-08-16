"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, AlertCircle } from "lucide-react";
import { DEPARTMENT_OPTIONS } from "@/lib/constants";
import { createEmployeeAction, updateEmployeeAction } from "@/lib/actions/employees";

interface EmployeeFormProps {
  initialData?: {
    id: string;
    name: string;
    email: string;
    department: string;
  };
}

export function EmployeeForm({ initialData }: EmployeeFormProps) {
  const router = useRouter();
  const isEditing = !!initialData;

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [name, setName] = useState(initialData?.name || "");
  const [email, setEmail] = useState(initialData?.email || "");
  const [department, setDepartment] = useState(
    initialData?.department || DEPARTMENT_OPTIONS[0]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new FormData();
    formData.append("name", name);
    formData.append("email", email);
    formData.append("department", department);

    let res;
    if (isEditing && initialData) {
      res = await updateEmployeeAction(initialData.id, formData);
    } else {
      res = await createEmployeeAction(formData);
    }

    setLoading(false);

    if (res?.error) {
      setError(res.error);
    } else {
      if (isEditing && initialData) {
        router.push(`/employees/${initialData.id}`);
      } else if (res && "employeeId" in res && res.employeeId) {
        router.push(`/employees/${(res as any).employeeId}`);
      } else {
        router.push("/employees");
      }
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href={isEditing ? `/employees/${initialData.id}` : "/employees"}
          className="p-2 rounded-lg bg-card border border-border hover:bg-muted text-muted-foreground transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {isEditing ? "Edit Employee Profile" : "Add New Employee"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {isEditing
              ? "Update employee contact details and department"
              : "Register an employee who can be assigned company devices"}
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="glass-card p-6 space-y-5">
        <div>
          <label className="block text-xs font-semibold uppercase text-muted-foreground mb-1.5">
            Full Name
          </label>
          <input
            type="text"
            placeholder="e.g. Sarah Connor"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3.5 py-2.5 text-sm bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
            required
          />
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase text-muted-foreground mb-1.5">
            Work Email Address
          </label>
          <input
            type="email"
            placeholder="e.g. sarah.connor@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3.5 py-2.5 text-sm bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
            required
          />
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase text-muted-foreground mb-1.5">
            Department
          </label>
          <select
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            className="w-full px-3.5 py-2.5 text-sm bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
            required
          >
            {DEPARTMENT_OPTIONS.map((dept) => (
              <option key={dept} value={dept}>
                {dept}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
          <Link
            href={isEditing ? `/employees/${initialData.id}` : "/employees"}
            className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-primary-foreground bg-primary rounded-lg shadow-sm hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {loading ? "Saving..." : isEditing ? "Update Employee" : "Add Employee"}
          </button>
        </div>
      </form>
    </div>
  );
}
