import React from 'react';
import * as SelectPrimitive from '@radix-ui/react-select';
import { CheckIcon, ChevronDownIcon, ChevronUpIcon } from '@radix-ui/react-icons';
import classes from '@styles/Select.module.css';

interface SelectItemProps {
  value: string;
  children: React.ReactNode;
  className?: string;
}

interface SelectGroupProps {
  label: string;
  children: React.ReactNode;
}

interface SelectProps {
  children: React.ReactNode[];
}

export function SelectGroup({ children, label }: SelectGroupProps) {
  return (
    <SelectPrimitive.Group>
      <SelectPrimitive.Label className={classes.label}>{label}</SelectPrimitive.Label>
      {children}
    </SelectPrimitive.Group>
  );
}

const Select = ({ children }: SelectProps) => (
  <SelectPrimitive.Root>
    <SelectPrimitive.Trigger className="SelectTrigger" aria-label="Food">
      <SelectPrimitive.Value placeholder="Select a fruit…" />
      <SelectPrimitive.Icon className="SelectIcon">
        <ChevronDownIcon />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
    <SelectPrimitive.Portal>
      <SelectPrimitive.Content className="SelectContent">
        <SelectPrimitive.ScrollUpButton className="SelectScrollButton">
          <ChevronUpIcon />
        </SelectPrimitive.ScrollUpButton>
        <SelectPrimitive.Viewport className="SelectViewport">
          <SelectGroup label={'Categories'}>{children}</SelectGroup>

          {/* <SelectPrimitive.Separator className="SelectSeparator" /> */}
        </SelectPrimitive.Viewport>
        <SelectPrimitive.ScrollDownButton className="SelectScrollButton">
          <ChevronDownIcon />
        </SelectPrimitive.ScrollDownButton>
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  </SelectPrimitive.Root>
);

export const SelectItem = React.forwardRef<HTMLDivElement, SelectItemProps>(
  ({ children, className, ...props }, forwardedRef) => {
    return (
      <SelectPrimitive.Item {...props} ref={forwardedRef}>
        <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
        <SelectPrimitive.ItemIndicator className="SelectItemIndicator">
          <CheckIcon />
        </SelectPrimitive.ItemIndicator>
      </SelectPrimitive.Item>
    );
  },
);

SelectItem.displayName = 'SelectItem';
export default Select;
