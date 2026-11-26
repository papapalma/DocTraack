"use client";

import React, { useEffect, useState } from "react";
import {
  Bell,
  BellRing,
  Radio,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Sparkles,
} from "lucide-react";
import { motion } from "motion/react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  NotificationPermissionState,
  displayBrowserNotification,
  getBrowserNotificationPermission,
  requestBrowserNotificationPermission,
} from "@/lib/client-notifications";

export function NotificationSettingsPanel() {
  const [notifyAnnouncements, setNotifyAnnouncements] = useState<boolean>(true);
  const [notifyPush, setNotifyPush] = useState<boolean>(false);
  const [pushPermission, setPushPermission] =
    useState<NotificationPermissionState>("default");
  const [testPushSent, setTestPushSent] = useState<boolean>(false);
  const [isSavingPrefs, setIsSavingPrefs] = useState<boolean>(false);
  const [prefsSuccess, setPrefsSuccess] = useState<boolean>(false);

  useEffect(() => {
    let active = true;
    async function loadPreferences() {
      try {
        const res = await fetch("/api/user/preferences");
        if (res.ok && active) {
          const data = (await res.json()) as {
            notifyAnnouncements?: boolean;
            notifyPush?: boolean;
          };
          setNotifyAnnouncements(data.notifyAnnouncements ?? true);
          setNotifyPush(data.notifyPush ?? false);
        }
      } catch (e) {
        console.error("Error loading user preferences:", e);
      }
      if (active) {
        setPushPermission(getBrowserNotificationPermission());
      }
    }
    void loadPreferences();
    return () => {
      active = false;
    };
  }, []);

  const handleSavePreferences = async (ann: boolean, push: boolean) => {
    try {
      setIsSavingPrefs(true);
      const res = await fetch("/api/user/preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notifyAnnouncements: ann, notifyPush: push }),
      });
      if (res.ok) {
        setPrefsSuccess(true);
        window.setTimeout(() => setPrefsSuccess(false), 3000);
      }
    } catch (e) {
      console.error("Failed saving preferences:", e);
    } finally {
      setIsSavingPrefs(false);
    }
  };

  const handleToggleAnnouncements = () => {
    const nextVal = !notifyAnnouncements;
    setNotifyAnnouncements(nextVal);
    void handleSavePreferences(nextVal, notifyPush);
  };

  const handleEnablePush = async () => {
    const perm = await requestBrowserNotificationPermission();
    setPushPermission(perm);
    if (perm === "granted") {
      setNotifyPush(true);
      await handleSavePreferences(notifyAnnouncements, true);
      displayBrowserNotification("MinSU DocTrack Notifications Enabled!", {
        body: "You will now receive desktop and device alerts for TDP workflow updates and announcements.",
      });
      setTestPushSent(true);
      window.setTimeout(() => setTestPushSent(false), 3000);
    } else {
      setNotifyPush(false);
      await handleSavePreferences(notifyAnnouncements, false);
    }
  };

  const handleTogglePush = () => {
    if (pushPermission !== "granted") {
      void handleEnablePush();
      return;
    }
    const nextVal = !notifyPush;
    setNotifyPush(nextVal);
    void handleSavePreferences(notifyAnnouncements, nextVal);
  };

  const handleSendTestPush = () => {
    const success = displayBrowserNotification("MinSU DocTrack Test Alert", {
      body: "Desktop and PWA notifications are configured and active on this device.",
    });
    if (success) {
      setTestPushSent(true);
      window.setTimeout(() => setTestPushSent(false), 3000);
    }
  };

  return (
    <Card className="border-[#D6DDD8] bg-white shadow-xs overflow-hidden">
      <CardHeader className="border-b border-[#D6DDD8]/60 pb-4 bg-gradient-to-r from-[#F1F8F1] to-white">
        <div className="flex items-center justify-between gap-3">
          <div>
            <CardTitle className="text-base font-heading font-bold text-[#1B5E20] flex items-center gap-2">
              <BellRing className="w-5 h-5 text-[#B88A00]" />
              <span>Workflow & Announcement Alert Preferences</span>
            </CardTitle>
            <CardDescription className="text-xs text-[#55645B] mt-0.5">
              Control how you receive TDP Annex review updates, return notices, and campus announcements.
            </CardDescription>
          </div>

          {prefsSuccess && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#DCEFDD] text-[#123F17]">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#1B5E20]" />
              Preferences Saved
            </span>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-6 space-y-6">
        {/* Setting 1: In-App Alerts */}
        <div className="flex items-start justify-between gap-4 p-4 rounded-xl border border-[#D6DDD8] bg-[#F6F8F6]/60 hover:bg-[#F6F8F6] transition-colors">
          <div className="space-y-1 flex-1">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#DCEFDD] text-[#1B5E20] flex items-center justify-center shrink-0">
                <Bell className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-[#1F2A24]">
                In-App Workflow & Announcement Alerts
              </h3>
            </div>
            <p className="text-xs text-[#55645B] pl-10 leading-relaxed">
              Receive unread badges inside MinSU DocTrack when Annexes are submitted, approved, returned with remarks, or when campus notices are published.
            </p>
          </div>

          <button
            type="button"
            onClick={handleToggleAnnouncements}
            disabled={isSavingPrefs}
            aria-label="Toggle in-app announcements"
            className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#1B5E20] focus:ring-offset-2 ${
              notifyAnnouncements ? "bg-[#1B5E20]" : "bg-neutral-300"
            }`}
          >
            <motion.span
              layout
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
              className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-md ring-0 ${
                notifyAnnouncements ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </button>
        </div>

        {/* Setting 2: Browser / PWA Desktop Push Alerts */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 p-4 rounded-xl border border-[#D6DDD8] bg-[#F6F8F6]/60 hover:bg-[#F6F8F6] transition-colors">
          <div className="space-y-1.5 flex-1">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#FFF1C2] text-[#B88A00] flex items-center justify-center shrink-0">
                <Radio className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-[#1F2A24]">
                Desktop & Installed PWA Push Alerts
              </h3>
            </div>
            <p className="text-xs text-[#55645B] pl-10 leading-relaxed">
              Display native OS pop-up notifications from your browser or installed MinSU DocTrack app even while working in other windows.
            </p>

            <div className="pl-10 flex flex-wrap items-center gap-2 pt-1">
              <span className="text-[11px] font-semibold text-[#55645B]">Status:</span>
              {pushPermission === "granted" && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#DCEFDD] text-[#123F17] border border-[#1B5E20]/30">
                  <CheckCircle2 className="w-3 h-3 text-[#1B5E20]" />
                  Browser Permission Granted
                </span>
              )}
              {pushPermission === "denied" && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-700 border border-red-200">
                  <AlertTriangle className="w-3 h-3 text-red-600" />
                  Permission Blocked in Browser Settings
                </span>
              )}
              {pushPermission === "default" && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#FFF1C2] text-[#B88A00] border border-[#F2B705]/40">
                  <Clock className="w-3 h-3" />
                  Permission Not Yet Requested
                </span>
              )}
              {pushPermission === "unsupported" && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-neutral-100 text-neutral-600">
                  Not Supported on this Device
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-col items-end gap-2 shrink-0 pl-10 sm:pl-0">
            {pushPermission === "granted" ? (
              <div className="flex items-center gap-3">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleSendTestPush}
                  className="text-xs h-8 border-[#D6DDD8] text-[#1F2A24] apple-press"
                >
                  <Sparkles className="w-3.5 h-3.5 mr-1 text-[#F2B705]" />
                  Send Test Alert
                </Button>

                <button
                  type="button"
                  onClick={handleTogglePush}
                  disabled={isSavingPrefs}
                  aria-label="Toggle browser push alerts"
                  className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#1B5E20] focus:ring-offset-2 ${
                    notifyPush ? "bg-[#1B5E20]" : "bg-neutral-300"
                  }`}
                >
                  <motion.span
                    layout
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-md ring-0 ${
                      notifyPush ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>
            ) : pushPermission === "unsupported" ? (
              <span className="text-xs text-neutral-400">Unavailable</span>
            ) : (
              <Button
                type="button"
                size="sm"
                onClick={handleEnablePush}
                className="bg-[#1B5E20] hover:bg-[#164D1C] text-white text-xs h-8 px-3 rounded-xl apple-press"
              >
                <Radio className="w-3.5 h-3.5 mr-1" />
                Enable Browser Alerts
              </Button>
            )}
          </div>
        </div>

        {testPushSent && (
          <div className="p-3 rounded-xl bg-[#DCEFDD] border border-[#1B5E20]/30 text-xs text-[#123F17] flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#1B5E20] shrink-0" />
            <span>Test alert dispatched! Look for the notification pop-up on your screen.</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
