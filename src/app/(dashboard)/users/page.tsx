"use client";

import React, { useEffect, useState } from "react";
import { useSession } from "@/hooks/use-session";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserPlus, Users, Shield, Check, X, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Modal } from "@/components/ui/modal";
import { SkeletonTableRows } from "@/components/ui/skeleton";

export default function UserManagementPage() {
  const { user } = useSession();
  const [users, setUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // New user modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("Password@123");
  const [newRole, setNewRole] = useState("STAFF");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/users");
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleToggleActive = async (targetId: string, currentActive: boolean) => {
    try {
      const res = await fetch("/api/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: targetId, active: !currentActive }),
      });
      if (res.ok) {
        await fetchUsers();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newName,
          email: newEmail,
          password: newPassword,
          role: newRole,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setFormError(data.error || "Failed to create user account.");
        setIsSubmitting(false);
        return;
      }

      setShowAddModal(false);
      setNewName("");
      setNewEmail("");
      await fetchUsers();
    } catch {
      setFormError("A network error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) return null;

  if (user.role !== "SYSTEM_ADMIN") {
    return (
      <div className="py-20 text-center max-w-md mx-auto">
        <h3 className="text-lg font-bold text-[#B3261E]">Access Restricted</h3>
        <p className="text-sm text-[#55645B] mt-1 mb-4">
          User management is restricted to System Administrators.
        </p>
        <Link href="/dashboard">
          <Button variant="outline" size="sm">
            Return to Dashboard
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-xl border border-[#D6DDD8] shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-heading font-bold text-[#1B5E20]">
              User & Role Management
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#DCEFDD] text-[#123F17]">
              {users.length} Total Users
            </span>
          </div>
          <p className="text-sm text-[#55645B] mt-1">
            Administer institutional accounts, roles (Director, Staff, Accounting), and access permissions.
          </p>
        </div>

        <Button
          variant="primary"
          onClick={() => setShowAddModal(true)}
        >
          <UserPlus className="w-4 h-4 mr-2" />
          Add New User
        </Button>
      </div>

      {/* Users Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <SkeletonTableRows count={5} />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-[#F1F8F1] text-xs font-semibold text-[#1F2A24] uppercase border-b border-[#D6DDD8]">
                  <tr>
                    <th className="py-3.5 px-4">User</th>
                    <th className="py-3.5 px-4">Email</th>
                    <th className="py-3.5 px-4">Role</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4">Created Date</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#D6DDD8]">
                  {users.map((u) => (
                    <tr
                      key={u.id}
                      className="hover:bg-[#F6F8F6] transition-colors"
                    >
                      <td className="py-3.5 px-4 font-semibold text-[#1F2A24]">
                        {u.name}
                      </td>
                      <td className="py-3.5 px-4 text-[#55645B]">
                        {u.email}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-semibold bg-[#DCEFDD] text-[#123F17]">
                          <Shield className="w-3 h-3 inline" />
                          {u.role}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        {u.active ? (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#1B5E20]">
                            <Check className="w-3.5 h-3.5" />
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#B3261E]">
                            <X className="w-3.5 h-3.5" />
                            Disabled
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-[#55645B]">
                        {new Date(u.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {u.id !== user.id && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs"
                            onClick={() => handleToggleActive(u.id, u.active)}
                          >
                            {u.active ? "Deactivate" : "Activate"}
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add User Modal with Apple Spring Motion */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Create New System User"
        maxWidth="md"
      >
        {formError && (
          <div className="p-3 mb-3 rounded-lg bg-[#FDE8E7] text-xs text-[#B3261E] font-medium">
            {formError}
          </div>
        )}

        <form onSubmit={handleCreateUser} className="space-y-3.5">
          <div className="space-y-1">
            <Label htmlFor="u-name" required>
              Full Name
            </Label>
            <Input
              id="u-name"
              placeholder="e.g. Maria Santos"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="u-email" required>
              MinSU Institutional Email
            </Label>
            <Input
              id="u-email"
              type="email"
              placeholder="msantos@minsu.edu.ph"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="u-role" required>
              System Role
            </Label>
            <select
              id="u-role"
              value={newRole}
              onChange={(e) => setNewRole(e.target.value)}
              className="w-full h-10 rounded-lg border border-[#D6DDD8] bg-white px-3 text-sm focus-visible:outline-none"
            >
              <option value="STAFF">Staff (Annexes 1-10)</option>
              <option value="ACCOUNTING">Accounting (Annexes 6-9)</option>
              <option value="DIRECTOR">Campus Director</option>
              <option value="SYSTEM_ADMIN">System Administrator</option>
            </select>
          </div>

          <div className="space-y-1">
            <Label htmlFor="u-password" required>
              Initial Password
            </Label>
            <Input
              id="u-password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
          </div>

          <div className="pt-3 border-t border-[#D6DDD8] flex justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowAddModal(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={isSubmitting}
            >
              Create User Account
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
