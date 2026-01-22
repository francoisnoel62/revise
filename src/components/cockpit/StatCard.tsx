// ABOUTME: Reusable stat card displaying a metric with label and optional icon
// ABOUTME: Used in the cockpit Overview page for word count, chapter count, etc.

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon?: LucideIcon;
  isLoading?: boolean;
  href?: string;
}

export function StatCard({
  title,
  value,
  description,
  icon: Icon,
  isLoading = false,
  href,
}: StatCardProps) {
  if (isLoading) {
    return (
      <Card className="h-full">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-4" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-8 w-20 mb-1" />
          <Skeleton className="h-3 w-32" />
        </CardContent>
      </Card>
    );
  }

  const cardContent = (
    <>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
      </CardContent>
    </>
  );

  if (href) {
    return (
      <Link href={href} className="block h-full">
        <Card className="h-full hover:bg-accent/50 transition-colors cursor-pointer">
          {cardContent}
        </Card>
      </Link>
    );
  }

  return <Card className="h-full">{cardContent}</Card>;
}
