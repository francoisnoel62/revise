// ABOUTME: Cookie preference banner.
// ABOUTME: Displays a dismissible banner and persists an acceptance choice in a browser cookie.

"use client";

import { useState, useEffect } from "react";
import { Cookie } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export type CookieConsentVariant = "default" | "small" | "minimal";

interface CookieConsentProps {
  variant?: CookieConsentVariant;
  mode?: boolean;
  onAcceptCallback?: () => void;
  onDeclineCallback?: () => void;
}

export function CookieConsent({
  variant = "default",
  mode = false,
  onAcceptCallback,
  onDeclineCallback,
}: CookieConsentProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [hide, setHide] = useState(true);

  const accept = () => {
    setIsOpen(false);
    document.cookie =
      "cookieConsent=true; expires=Fri, 31 Dec 9999 23:59:59 GMT; path=/";
    setTimeout(() => {
      setHide(true);
    }, 700);
    onAcceptCallback?.();
  };

  const decline = () => {
    setIsOpen(false);
    setTimeout(() => {
      setHide(true);
    }, 700);
    onDeclineCallback?.();
  };

  useEffect(() => {
    const checkCookieConsent = () => {
      const cookies = document.cookie.split("; ");
      const consentCookie = cookies.find((cookie) =>
        cookie.startsWith("cookieConsent=")
      );
      if (!consentCookie && !mode) {
        setHide(false);
        setTimeout(() => {
          setIsOpen(true);
        }, 100);
      }
    };

    checkCookieConsent();
  }, [mode]);

  if (hide) {
    return null;
  }

  if (variant === "minimal") {
    return (
      <div
        className={cn(
          "fixed bottom-0 left-0 right-0 z-[200] w-full duration-700 sm:bottom-4 sm:left-4 sm:max-w-md",
          isOpen
            ? "translate-y-0 opacity-100 transition-[opacity,transform]"
            : "translate-y-8 opacity-0 transition-[opacity,transform]"
        )}
      >
        <div className="m-3 rounded-md border border-border bg-background shadow-lg dark:bg-card">
          <div className="flex items-center justify-between p-3">
            <div className="flex items-center gap-3">
              <Cookie className="h-5 w-5" />
              <p className="text-sm font-medium">
                Nous utilisons des cookies pour améliorer votre expérience.
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={decline}
                variant="outline"
                size="sm"
                className="h-8 px-3"
              >
                Refuser
              </Button>
              <Button onClick={accept} size="sm" className="h-8 px-3">
                Accepter
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (variant === "small") {
    return (
      <div
        className={cn(
          "fixed bottom-0 left-0 right-0 z-[200] w-full duration-700 sm:bottom-4 sm:left-4 sm:max-w-md",
          isOpen
            ? "translate-y-0 opacity-100 transition-[opacity,transform]"
            : "translate-y-8 opacity-0 transition-[opacity,transform]"
        )}
      >
        <div className="m-3 rounded-md border border-border bg-background shadow-lg dark:bg-card">
          <div className="p-4">
            <div className="flex items-center gap-2">
              <Cookie className="h-5 w-5" />
              <h3 className="text-base font-semibold">Cookies</h3>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              Nous utilisons des cookies nécessaires à la connexion et à vos préférences
              d&apos;interface.
            </p>
            <div className="mt-4 flex gap-2">
              <Button
                onClick={decline}
                variant="outline"
                size="sm"
                className="flex-1"
              >
                Refuser
              </Button>
              <Button onClick={accept} size="sm" className="flex-1">
                Accepter
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Default variant
  return (
    <div
      className={cn(
        "fixed bottom-0 left-0 right-0 z-[200] w-full duration-700 sm:bottom-4 sm:left-4 sm:max-w-md",
        isOpen
          ? "translate-y-0 opacity-100 transition-[opacity,transform]"
          : "translate-y-8 opacity-0 transition-[opacity,transform]"
      )}
    >
      <div className="m-3 rounded-lg border border-border bg-background shadow-lg dark:bg-card">
        <div className="p-6">
          <div className="flex items-center gap-3">
            <Cookie className="h-6 w-6" />
            <h3 className="text-lg font-semibold">Nous utilisons des cookies</h3>
          </div>
          <p className="mt-3 text-sm text-muted-foreground">
            Ce site utilise des cookies nécessaires à la connexion et à vos préférences
            d&apos;interface. Revise n&apos;intègre pas de cookie publicitaire ni d&apos;outil
            d&apos;analyse d&apos;audience tiers dans l&apos;application.
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            <a
              href="/politique-cookies"
              className="text-primary underline underline-offset-4 hover:text-primary/80"
            >
              En savoir plus
            </a>
          </p>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <Button
              onClick={decline}
              variant="outline"
              className="w-full sm:w-auto"
            >
              Refuser
            </Button>
            <Button onClick={accept} className="w-full sm:w-auto">
              Mémoriser ce choix
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
