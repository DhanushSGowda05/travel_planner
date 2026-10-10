import * as React from "react";
import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils";

const TabsContext = React.createContext(null);

export function Tabs({ defaultValue, value: controlledValue, onValueChange, children, className, ...props }) {
  const [internalValue, setInternalValue] = React.useState(defaultValue);
  const value = controlledValue !== undefined ? controlledValue : internalValue;

  const setValue = (newValue) => {
    setInternalValue(newValue);
    onValueChange?.(newValue);
  };

  return (
    <TabsContext.Provider value={{ value, setValue }}>
      <div className={cn("w-full", className)} {...props}>
        {children}
      </div>
    </TabsContext.Provider>
  );
}

export function TabsList({ className, children, ...props }) {
  return (
    <div
      className={cn(
        "inline-flex h-10 items-center justify-center rounded-md bg-slate-100 p-1 text-slate-500",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

const tabsTriggerStyles = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium " +
  "transition-all disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-white " +
  "data-[state=active]:text-slate-900 data-[state=active]:shadow",
  {
    variants: {},
    defaultVariants: {},
  }
);

export function TabsTrigger({ value, className, children, ...props }) {
  const { value: activeValue, setValue } = React.useContext(TabsContext);
  const isActive = activeValue === value;

  return (
    <button
      role="tab"
      data-state={isActive ? "active" : "inactive"}
      className={cn(tabsTriggerStyles(), className)}
      onClick={() => setValue(value)}
      {...props}
    >
      {children}
    </button>
  );
}

export function TabsContent({ value, className, children, ...props }) {
  const { value: activeValue } = React.useContext(TabsContext);

  if (value !== activeValue) return null;

  return (
    <div
      role="tabpanel"
      className={cn("mt-4", className)}
      {...props}
    >
      {children}
    </div>
  );
}
