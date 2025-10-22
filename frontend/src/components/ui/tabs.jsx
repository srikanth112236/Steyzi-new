import React, { createContext, useContext, useState } from 'react';

const TabsContext = createContext();

const Tabs = ({ defaultValue, value, onValueChange, children, className = '' }) => {
  const [internalValue, setInternalValue] = useState(defaultValue);

  const currentValue = value !== undefined ? value : internalValue;
  const handleValueChange = onValueChange || setInternalValue;

  return (
    <TabsContext.Provider value={{ value: currentValue, onValueChange: handleValueChange }}>
      <div className={className}>
        {children}
      </div>
    </TabsContext.Provider>
  );
};

const TabsList = ({ className = '', children }) => {
  return (
    <div className={`inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground ${className}`}>
      {children}
    </div>
  );
};

const TabsTrigger = ({ value, className = '', children, disabled = false }) => {
  const { value: currentValue, onValueChange } = useContext(TabsContext);

  return (
    <button
      className={`inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${
        currentValue === value
          ? 'bg-background text-foreground shadow-sm'
          : 'hover:bg-muted hover:text-foreground'
      } ${className}`}
      onClick={() => !disabled && onValueChange(value)}
      disabled={disabled}
    >
      {children}
    </button>
  );
};

const TabsContent = ({ value, className = '', children }) => {
  const { value: currentValue } = useContext(TabsContext);

  if (currentValue !== value) return null;

  return (
    <div className={`mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${className}`}>
      {children}
    </div>
  );
};

export { Tabs, TabsList, TabsTrigger, TabsContent };
