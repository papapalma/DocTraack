"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "@/hooks/use-session";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Bell, CheckCheck, Clock, ArrowRight } from "lucide-react";

export default function NotificationsPage() {
  const { user } = useSession();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const fetchNotifications = async () => {
    try {
      const res = await fetch("/api/notifications");
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkAllRead = async () => {
    try {
      const res = await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markAllRead: true }),
      });
      if (res.ok) {
        await fetchNotifications();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleMarkOne = async (id: string) => {
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
    } catch (e) {
      console.error(e);
    }
  };

  if (!user) return null;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-xl border border-[#D6DDD8] shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-heading font-bold text-[#1B5E20]">
              Notifications Center
            </h1>
            {unreadCount > 0 && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#FFF1C2] text-[#B88A00]">
                {unreadCount} Unread
              </span>
            )}
          </div>
          <p className="text-sm text-[#55645B] mt-1">
            Track status updates, submissions, endorsements, and return comments.
          </p>
        </div>

        {unreadCount > 0 && (
          <Button variant="outline" size="sm" onClick={handleMarkAllRead}>
            <CheckCheck className="w-4 h-4 mr-1.5" />
            Mark All as Read
          </Button>
        )}
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="divide-y divide-[#D6DDD8]/60 p-4 space-y-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-start gap-3 py-3">
                  <Skeleton className="w-3 h-3 rounded-full mt-1 shrink-0" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-1/3" />
                    <Skeleton className="h-3 w-3/4" />
                    <Skeleton className="h-2.5 w-24" />
                  </div>
                  <Skeleton className="h-8 w-16 rounded-xl shrink-0" />
                </div>
              ))}
            </div>
          ) : notifications.length === 0 ? (
            <div className="py-16 text-center">
              <div className="w-12 h-12 rounded-full bg-[#F1F8F1] text-[#1B5E20] flex items-center justify-center mx-auto mb-3">
                <Bell className="w-6 h-6" />
              </div>
              <h3 className="text-base font-semibold text-[#1F2A24]">
                All Caught Up!
              </h3>
              <p className="text-xs text-[#55645B] max-w-sm mx-auto mt-1">
                You have no notifications at this time. New updates on your submitted annexes will show up here.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-[#D6DDD8]">
              {notifications.map((n) => (
                <div
                  key={n.id}
                  className={`p-4 flex items-start justify-between gap-4 transition-colors duration-200 ${
                    !n.read ? "bg-[#FFF1C2]/30" : "hover:bg-[#F6F8F6]"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span
                      className={`w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 transition-all duration-200 ease-out ${
                        !n.read ? "bg-[#F2B705] scale-100 opacity-100" : "bg-transparent scale-0 opacity-0"
                      }`}
                    />
                    <div>
                      <h4 className="text-sm font-semibold text-[#1F2A24]">
                        {n.title}
                      </h4>
                      <p className="text-xs text-[#55645B] mt-0.5 leading-relaxed">
                        {n.message}
                      </p>
                      <span className="text-[10px] text-[#55645B] mt-1 block">
                        {new Date(n.createdAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  </div>

                  {n.link && (
                    <Link
                      href={n.link}
                      onClick={() => handleMarkOne(n.id)}
                      className="shrink-0"
                    >
                      <Button variant="ghost" size="sm" className="h-8 text-xs text-[#1B5E20]">
                        View
                        <ArrowRight className="w-3.5 h-3.5 ml-1" />
                      </Button>
                    </Link>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
