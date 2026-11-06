"use client";

import React, { useEffect, useState } from "react";
import { useSession } from "@/hooks/use-session";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserPlus, Users, Shield, Check, X, ArrowLeft, KeyRound, Search, SearchX, RotateCcw } from "lucide-react";
import Link from "next/link";
import { Modal } from "@/components/ui/modal";
import { SkeletonTableRows } from "@/components/ui/skeleton";
import { useTable } from "@/hooks/use-table";
import { SortableTh } from "@/components/ui/sortable-header";
import { PaginationBar } from "@/components/ui/pagination-bar";

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

  // Admin Reset Password modal
  const [resetUser, setResetUser] = useState<any | null>(null);
  const [resetPassword, setResetPassword] = useState("");
  const [resetError, setResetError] = useState<string | null>(null);
  const [isResetting, setIsResetting] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);

  // Table Search, Sort, and Pagination Hook
  const {
    searchQuery,
    setSearchQuery,
    sortKey,
    sortDirection,
    onSort,
    page,
    setPage,
    pageSize,
    setPageSize,
    totalPages,
    totalItems,
    startIndex,
    endIndex,
    paginatedItems: paginatedUsers,
  } = useTable({
    data: users,
    initialPageSize: 10,
    initialSortKey: "createdAt",
    initialSortDirection: "desc",
    searchFields: [
      (u) => u.name,
      (u) => u.email,
      (u) => u.role,
      (u) => (u.active ? "Active" : "Disabled"),
    ],
  });

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

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetUser) return;
    setResetError(null);
    setIsResetting(true);

    try {
      const res = await fetch("/api/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: resetUser.id, password: resetPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        setResetError(data.error || "Failed to reset password.");
        setIsResetting(false);
        return;
      }
      setResetSuccess(true);
      setTimeout(() => {
        setResetUser(null);
        setResetPassword("");
        setResetSuccess(false);
      }, 1500);
    } catch {
      setResetError("A network error occurred. Please try again.");
    } finally {
      setIsResetting(false);
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

      {/* Search & Filter Toolbar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3 top-3 text-[#55645B]" />
              <input
                type="text"
                placeholder="Search users by name, email, role, or status..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-10 pl-9 pr-4 w-full rounded-xl border border-[#D6DDD8] bg-white text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1B5E20] focus-visible:border-[#1B5E20] transition"
              />
            </div>
            {searchQuery && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSearchQuery("")}
                className="text-xs h-9 text-[#B3261E] self-start sm:self-auto"
              >
                <RotateCcw className="w-3 h-3 mr-1.5" />
                Reset Search
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <SkeletonTableRows count={5} />
          ) : users.length === 0 ? (
            <div className="py-16 text-center">
              <div className="w-12 h-12 rounded-full bg-[#F1F8F1] text-[#1B5E20] flex items-center justify-center mx-auto mb-3">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="text-base font-semibold text-[#1F2A24]">
                No System Users Registered
              </h3>
              <p className="text-xs text-[#55645B] max-w-sm mx-auto mt-1 mb-4">
                Click &ldquo;Add New User&rdquo; to provision your first staff, accounting, or administrative account.
              </p>
            </div>
          ) : paginatedUsers.length === 0 ? (
            <div className="py-14 text-center px-4">
              <div className="w-12 h-12 rounded-full bg-neutral-100 flex items-center justify-center text-[#55645B] mx-auto mb-3">
                <SearchX className="w-6 h-6" />
              </div>
              <h3 className="text-base font-semibold text-[#1F2A24]">
                No users found matching &ldquo;{searchQuery}&rdquo;
              </h3>
              <p className="text-xs text-[#55645B] max-w-sm mx-auto mt-1 mb-4">
                Check for typos or reset your search term to see all accounts.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSearchQuery("")}
                className="text-xs"
              >
                <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
                Clear Search
              </Button>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm min-w-[880px]">
                  <thead className="bg-[#F1F8F1] text-xs font-semibold text-[#1F2A24] uppercase border-b border-[#D6DDD8] sticky top-0 z-10">
                    <tr>
                      <SortableTh
                        label="User"
                        sortKey="name"
                        currentSortKey={sortKey}
                        currentDirection={sortDirection}
                        onSort={onSort}
                        minWidth="200px"
                      />
                      <SortableTh
                        label="Email"
                        sortKey="email"
                        currentSortKey={sortKey}
                        currentDirection={sortDirection}
                        onSort={onSort}
                        minWidth="220px"
                      />
                      <SortableTh
                        label="Role"
                        sortKey="role"
                        currentSortKey={sortKey}
                        currentDirection={sortDirection}
                        onSort={onSort}
                        minWidth="140px"
                      />
                      <SortableTh
                        label="Status"
                        sortKey="active"
                        currentSortKey={sortKey}
                        currentDirection={sortDirection}
                        onSort={onSort}
                        minWidth="120px"
                      />
                      <SortableTh
                        label="Created Date"
                        sortKey="createdAt"
                        currentSortKey={sortKey}
                        currentDirection={sortDirection}
                        onSort={onSort}
                        minWidth="140px"
                      />
                      <th className="py-3.5 px-4 text-right uppercase tracking-wider text-xs font-semibold text-[#1F2A24] min-w-[180px]">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#D6DDD8]">
                    {paginatedUsers.map((u) => (
                      <tr
                        key={u.id}
                        className="hover:bg-[#F6F8F6] transition-colors"
                      >
                        <td className="py-3.5 px-4 font-semibold text-[#1F2A24] break-words">
                          {u.name}
                        </td>
                        <td className="py-3.5 px-4 text-[#55645B] break-words">
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
                        <td className="py-3.5 px-4 text-xs text-[#55645B] tabular-nums whitespace-nowrap">
                          {new Date(u.createdAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 text-xs flex items-center gap-1 text-[#1B5E20] hover:bg-[#F1F8F1] apple-press"
                              onClick={() => {
                                setResetUser(u);
                                setResetPassword("");
                                setResetError(null);
                                setResetSuccess(false);
                              }}
                            >
                              <KeyRound className="w-3 h-3 text-[#1B5E20]" />
                              <span>Reset Password</span>
                            </Button>
                            {u.id !== user.id && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-8 text-xs apple-press"
                                onClick={() => handleToggleActive(u.id, u.active)}
                              >
                                {u.active ? "Deactivate" : "Activate"}
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination Controls */}
              <PaginationBar
                page={page}
                pageSize={pageSize}
                totalItems={totalItems}
                totalPages={totalPages}
                startIndex={startIndex}
                endIndex={endIndex}
                onPageChange={setPage}
                onPageSizeChange={setPageSize}
                itemLabel="users"
              />
            </>
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

      {/* Admin Reset Password Modal */}
      <Modal
        isOpen={!!resetUser}
        onClose={() => {
          setResetUser(null);
          setResetPassword("");
          setResetError(null);
          setResetSuccess(false);
        }}
        title={`Reset Password for ${resetUser?.name || ""}`}
        maxWidth="md"
      >
        {resetError && (
          <div className="p-3 mb-3 rounded-lg bg-[#FDE8E7] text-xs text-[#B3261E] font-medium">
            {resetError}
          </div>
        )}

        {resetSuccess ? (
          <div className="py-6 text-center space-y-2">
            <div className="w-12 h-12 rounded-full bg-[#DCEFDD] text-[#1B5E20] flex items-center justify-center mx-auto shadow-xs">
              <Check className="w-6 h-6" />
            </div>
            <p className="text-sm font-bold text-[#1B5E20]">Password Reset Successfully!</p>
            <p className="text-xs text-[#55645B]">
              The user can now sign in using their new credentials.
            </p>
          </div>
        ) : (
          <form onSubmit={handleResetPassword} className="space-y-3.5">
            <div className="p-2.5 bg-[#F6F8F6] rounded-xl border border-[#D6DDD8] text-xs space-y-1">
              <p className="text-[#1F2A24]">
                Target Account: <strong>{resetUser?.email}</strong>
              </p>
              <p className="text-[#55645B] text-[11px]">
                Enter a new password (min. 8 characters, letters & numbers). As per university security policy, only System Administrators can reset passwords.
              </p>
            </div>

            <div className="space-y-1">
              <Label htmlFor="reset-pass" required>
                New Password
              </Label>
              <Input
                id="reset-pass"
                type="text"
                placeholder="e.g. MinSU@2026"
                value={resetPassword}
                onChange={(e) => setResetPassword(e.target.value)}
                required
                autoComplete="new-password"
              />
            </div>

            <div className="pt-3 border-t border-[#D6DDD8] flex justify-end gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setResetUser(null)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                isLoading={isResetting}
                disabled={resetPassword.length < 8}
              >
                Update Password
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
