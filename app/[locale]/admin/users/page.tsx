'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import { useAuthStore } from '@/lib/store/authStore';
import { userService } from '@/lib/services/user.service';
import { User } from '@/lib/types/user.types';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { useConfirm } from '@/components/ui/ConfirmDialog';
import { User as UserIcon, Shield, UserCheck, Mail, Calendar } from 'lucide-react';
import Image from 'next/image';

export default function AdminUsersPage() {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuthStore();
  const toast = useToast();
  const { confirm } = useConfirm();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);

  useEffect(() => {
    // Wait for auth to finish loading before checking
    if (authLoading) return;

    if (!isAuthenticated) {
      router.push(`/${locale}/login`);
      return;
    }

    // CRITICAL: Redirect agents to their own dashboard
    if (user?.role === 'agent') {
      router.push(`/${locale}/agent`);
      return;
    }

    if (user?.role !== 'admin') {
      router.push(`/${locale}`);
      return;
    }

    const fetchUsers = async () => {
      try {
        setIsLoading(true);
        const fetchedUsers = await userService.fetchAllUsers();
        setUsers(fetchedUsers);
      } catch (error) {
        console.error('Error fetching users:', error);
        toast.error('Failed to load users');
      } finally {
        setIsLoading(false);
      }
    };

    fetchUsers();
  }, [user, isAuthenticated, authLoading, router, locale, toast]);

  const handleRoleChange = async (userId: string, newRole: 'user' | 'agent' | 'admin') => {
    // Prevent admins from changing their own role
    if (userId === user?.uid) {
      toast.error('You cannot change your own role');
      return;
    }

    const targetUser = users.find(u => u.uid === userId);
    const currentRole = targetUser?.role || 'user';
    
    if (currentRole === newRole) {
      return; // No change needed
    }

    const confirmed = await confirm({
      title: t('admin.changeRole'),
      message: t('admin.changeRoleConfirm', { 
        name: targetUser?.displayName || targetUser?.email || 'User',
        currentRole: t(`admin.role.${currentRole}`),
        newRole: t(`admin.role.${newRole}`)
      }),
      confirmText: t('common.save'),
      type: 'warning',
    });

    if (!confirmed) return;

    try {
      setUpdatingUserId(userId);
      await userService.updateUserRole(userId, newRole);
      
      // Update local state
      setUsers(users.map(u => 
        u.uid === userId ? { ...u, role: newRole } : u
      ));
      
      toast.success(t('admin.roleUpdated'));
    } catch (error: any) {
      console.error('Error updating user role:', error);
      toast.error(error.message || 'Failed to update user role');
    } finally {
      setUpdatingUserId(null);
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'agent':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <Shield className="w-4 h-4" />;
      case 'agent':
        return <UserCheck className="w-4 h-4" />;
      default:
        return <UserIcon className="w-4 h-4" />;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary mx-auto mb-4"></div>
          <p className="text-brand-gray">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-soft py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-brand-slate mb-2">{t('admin.manageUsers')}</h1>
          <p className="text-brand-gray">{t('admin.manageUsersDescription')}</p>
        </div>

        {/* Users List */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-brand-primary text-white">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold">{t('admin.user')}</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">{t('admin.email')}</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">{t('admin.role')}</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">{t('admin.joined')}</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">{t('admin.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-brand-gray">
                      {t('admin.noUsers')}
                    </td>
                  </tr>
                ) : (
                  users.map((userItem) => (
                    <tr key={userItem.uid} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {userItem.profileImageUrl ? (
                            <Image
                              src={userItem.profileImageUrl}
                              alt={userItem.displayName}
                              width={40}
                              height={40}
                              className="rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-brand-primary-soft flex items-center justify-center">
                              <UserIcon className="w-5 h-5 text-brand-primary" />
                            </div>
                          )}
                          <div>
                            <p className="font-semibold text-brand-slate">{userItem.displayName || t('admin.noName')}</p>
                            {userItem.company && (
                              <p className="text-sm text-brand-gray">{userItem.company}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-brand-gray">
                          <Mail className="w-4 h-4" />
                          <span>{userItem.email}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold border ${getRoleBadgeColor(userItem.role)}`}>
                          {getRoleIcon(userItem.role)}
                          {t(`admin.role.${userItem.role}`)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-brand-gray text-sm">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          {userItem.createdAt instanceof Date
                            ? userItem.createdAt.toLocaleDateString()
                            : new Date(userItem.createdAt).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <select
                            value={userItem.role}
                            onChange={(e) => handleRoleChange(userItem.uid, e.target.value as 'user' | 'agent' | 'admin')}
                            disabled={updatingUserId === userItem.uid || userItem.uid === user?.uid}
                            className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <option value="user">{t('admin.role.user')}</option>
                            <option value="agent">{t('admin.role.agent')}</option>
                            <option value="admin">{t('admin.role.admin')}</option>
                          </select>
                          {updatingUserId === userItem.uid && (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-brand-primary"></div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

