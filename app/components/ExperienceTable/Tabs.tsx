"use client";

import * as React from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";

import { cn } from "@/lib/utils";

const Tabs = TabsPrimitive.Root;

const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(
      "relative z-10 flex w-fit items-center justify-start gap-1 rounded-t-xl rounded-b-none border border-border border-b-0 bg-background px-1.5 py-1 -mb-px after:content-[''] after:absolute after:-left-px after:top-full after:h-3 after:w-px after:bg-border before:content-[''] before:absolute before:left-0 before:top-full before:h-3.5 before:w-15 before:bg-background",
      className,
    )}
    {...props}
  />
));
TabsList.displayName = TabsPrimitive.List.displayName;

const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      `relative inline-flex h-9 items-center justify-center whitespace-nowrap rounded-md px-3 md:px-4 text-sm md:text-base font-medium transition duration-200 ease-out
       focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 
       bg-transparent text-foreground opacity-90 hover:opacity-100 
       data-[state=active]:text-foreground data-[state=active]:after:content-[''] data-[state=active]:after:absolute data-[state=active]:after:left-1 data-[state=active]:after:right-1 data-[state=active]:after:-bottom-px data-[state=active]:after:h-px
       data-[state=active]:after:bg-primary`,
      className,
    )}
    {...props}
  />
));
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName;

const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      "mt-0 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
      className,
    )}
    {...props}
  />
));
TabsContent.displayName = TabsPrimitive.Content.displayName;

export { Tabs, TabsList, TabsTrigger, TabsContent };
